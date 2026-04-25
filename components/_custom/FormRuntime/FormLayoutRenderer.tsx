'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/atoms';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/molecules/Tabs';
import {
  evaluateExpression,
  evaluateFormRules,
  type RuleEvaluationResult,
} from '@/lib/form-rules';
import type {
  FormLayoutItem,
  FormLayoutSection,
  FormDisplayMode,
  GabForm,
} from '@/lib/core/ports/form.repository';
import { FormRulesProvider, type ItemRuleState } from './FormRulesContext';
import type { RuntimeField } from './types';
import { FieldItem } from './_renderers/FieldItem';
import { HeaderItem } from './_renderers/HeaderItem';
import { DividerItem } from './_renderers/DividerItem';
import { TextItem } from './_renderers/TextItem';
import { ButtonItem } from './_renderers/ButtonItem';
import { ButtonGroupItem } from './_renderers/ButtonGroupItem';
import { ChildGridItem } from './_renderers/ChildGridItem';
import { ChildSectionItem } from './_renderers/ChildSectionItem';
import { WidgetItem } from './_renderers/WidgetItem';

export interface FormLayoutRendererProps {
  form: GabForm;
  fields: RuntimeField[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  errors?: Record<string, string>;
  readOnly?: boolean;
  onSubmit?: (values: Record<string, unknown>) => void;
}

interface ComputedState {
  rulesResult: RuleEvaluationResult;
  itemStateById: Map<string, ItemRuleState>;
  fieldKeyByItemId: Map<string, string>;
  visibleSections: FormLayoutSection[];
}

function getMode(form: GabForm): FormDisplayMode {
  if (form.layout.displayMode) return form.layout.displayMode;
  const sectionMode = form.layout.sections.find((section) => section.displayMode)?.displayMode;
  return sectionMode ?? 'stacked';
}

export function FormLayoutRenderer({
  form,
  fields,
  values,
  onChange,
  errors = {},
  readOnly = false,
  onSubmit,
}: Readonly<FormLayoutRendererProps>) {
  const [wizardIndex, setWizardIndex] = useState(0);

  const fieldById = useMemo(
    () => new Map(fields.map((field) => [field.id, field] as const)),
    [fields],
  );

  const computed = useMemo<ComputedState>(() => {
    const rules = form.layout.rules ?? [];
    const rulesResult = evaluateFormRules(rules as any, values);
    const itemStateById = new Map<string, ItemRuleState>();
    const fieldKeyByItemId = new Map<string, string>();

    const evalBool = (expression: string | undefined): boolean | undefined => {
      if (!expression) return undefined;
      try {
        return Boolean(evaluateExpression(expression, values));
      } catch {
        return undefined;
      }
    };

    const visibleSections = form.layout.sections.filter((section) => {
      const visibleItems = section.items.filter((item) => {
        const field = item.type === 'field' ? fieldById.get(item.fieldId) : undefined;
        const fieldKey = field?.key ?? (item.type === 'field' ? item.fieldId : undefined);
        if (fieldKey) {
          fieldKeyByItemId.set(item.id, fieldKey);
        }

        const inlineVisible = evalBool(item.visibleIf);
        const inlineRequired = evalBool(item.requiredIf);
        const inlineReadOnly = evalBool(item.readOnlyIf);

        const state: ItemRuleState = {
          visible: inlineVisible ?? rulesResult.visibility.get(item.id) ?? true,
          required:
            inlineRequired ??
            rulesResult.required.get(item.id) ??
            (item.type === 'field' ? Boolean(item.required || field?.required) : false),
          readOnly: readOnly || inlineReadOnly || rulesResult.readOnly.get(item.id) || false,
          error: rulesResult.errors.get(item.id) || errors[item.id],
        };
        itemStateById.set(item.id, state);
        return state.visible;
      });
      return visibleItems.length > 0;
    });

    return { rulesResult, itemStateById, fieldKeyByItemId, visibleSections };
  }, [errors, fieldById, form.layout.rules, form.layout.sections, readOnly, values]);

  useEffect(() => {
    for (const [itemId, nextValue] of computed.rulesResult.values.entries()) {
      const fieldKey = computed.fieldKeyByItemId.get(itemId);
      if (!fieldKey) continue;
      if (Object.is(values[fieldKey], nextValue)) continue;
      onChange(fieldKey, nextValue);
    }
  }, [computed.fieldKeyByItemId, computed.rulesResult.values, onChange, values]);

  const mode = getMode(form);
  const visibleSections = computed.visibleSections;
  const safeWizardIndex = Math.min(Math.max(wizardIndex, 0), Math.max(visibleSections.length - 1, 0));
  const currentWizardSection = visibleSections[safeWizardIndex];

  const renderItem = (item: FormLayoutItem) => {
    const state = computed.itemStateById.get(item.id) ?? {
      visible: true,
      required: false,
      readOnly,
    };
    if (!state.visible) return null;

    switch (item.type) {
      case 'field': {
        const field = fieldById.get(item.fieldId);
        const key = field?.key ?? item.fieldId;
        return (
          <FieldItem
            item={item}
            field={field}
            value={values[key]}
            error={state.error ?? errors[key]}
            required={state.required}
            readOnly={state.readOnly}
            onChange={onChange}
          />
        );
      }
      case 'header':
        return <HeaderItem item={item} />;
      case 'divider':
        return <DividerItem item={item} />;
      case 'text':
        return <TextItem item={item} />;
      case 'button':
        return <ButtonItem item={item} readOnly={state.readOnly} />;
      case 'button-group':
        return <ButtonGroupItem item={item} readOnly={state.readOnly} />;
      case 'child-grid':
        return <ChildGridItem item={item} />;
      case 'child-section':
        return <ChildSectionItem item={item} />;
      case 'widget':
        return <WidgetItem item={item} />;
      default:
        return null;
    }
  };

  const renderSection = (section: FormLayoutSection) => (
    <div key={section.id} className="space-y-4">
      {section.title ? <h2 className="text-base font-semibold text-foreground">{section.title}</h2> : null}
      {section.description ? <p className="text-sm text-muted-foreground">{section.description}</p> : null}
      <div className="space-y-4">
        {section.items.map((item) => (
          <div key={item.id}>{renderItem(item)}</div>
        ))}
      </div>
    </div>
  );

  const content = (() => {
    if (mode === 'tabs' && visibleSections.length > 0) {
      const defaultTab = visibleSections[0]?.id ?? 'tab-0';
      return (
        <Tabs defaultValue={defaultTab}>
          <TabsList>
            {visibleSections.map((section) => (
              <TabsTrigger key={section.id} value={section.id}>
                {section.title ?? 'Untitled'}
              </TabsTrigger>
            ))}
          </TabsList>
          {visibleSections.map((section) => (
            <TabsContent key={section.id} value={section.id}>
              {renderSection(section)}
            </TabsContent>
          ))}
        </Tabs>
      );
    }

    if (mode === 'wizard' && currentWizardSection) {
      const isFirst = safeWizardIndex === 0;
      const isLast = safeWizardIndex === visibleSections.length - 1;
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Step {safeWizardIndex + 1} of {visibleSections.length}
            </span>
            <span>{currentWizardSection.title ?? 'Section'}</span>
          </div>
          {renderSection(currentWizardSection)}
          {!readOnly ? (
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                disabled={isFirst}
                onClick={() => setWizardIndex((prev) => Math.max(prev - 1, 0))}
              >
                Back
              </Button>
              {isLast ? (
                <Button type="button" onClick={() => onSubmit?.(values)}>
                  Submit
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() =>
                    setWizardIndex((prev) => Math.min(prev + 1, visibleSections.length - 1))
                  }
                >
                  Next
                </Button>
              )}
            </div>
          ) : null}
        </div>
      );
    }

    return <div className="space-y-8">{visibleSections.map((section) => renderSection(section))}</div>;
  })();

  return (
    <FormRulesProvider
      value={{
        getItemState: (itemId) =>
          computed.itemStateById.get(itemId) ?? { visible: true, required: false, readOnly },
      }}
    >
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit?.(values);
        }}
      >
        {content}
        {!readOnly && mode !== 'wizard' ? (
          <div className="flex justify-end">
            <Button type="submit">Submit</Button>
          </div>
        ) : null}
      </form>
    </FormRulesProvider>
  );
}
