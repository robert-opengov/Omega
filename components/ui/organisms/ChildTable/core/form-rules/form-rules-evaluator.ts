/**
 * Standalone form-rules evaluator for the child table.
 * Mirrors the evaluation logic from the Angular production codebase
 * but uses dayjs instead of moment for date comparisons.
 */
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import type {
  FormRule,
  FormConditionGroup,
  FormCondition,
  FormRuleAction,
  FieldState,
  FieldStateMap,
  RuleEvalContext,
} from './form-rules.models';

dayjs.extend(isBetween);

/**
 * Evaluate all active form rules against one row of data.
 *
 * @param rules - The FormRule[] fetched from /api/Form/getFormRules
 * @param rowData - The row's current data keyed by columnKey (tbl123_field)
 * @param colKeyToFieldKey - Maps columnKey -> fieldKey for value lookups
 * @param fieldKeyToColKey - Maps fieldKey -> columnKey (used for result output)
 * @param ctx - Optional context (current user email, etc.)
 */
export function evaluateRules(
  rules: FormRule[],
  rowData: Record<string, unknown>,
  colKeyToFieldKey: Record<string, string>,
  fieldKeyToColKey: Record<string, string>,
  ctx: RuleEvalContext = {},
): FieldStateMap {
  const result: FieldStateMap = {};

  const getOrCreate = (fieldKey: string): FieldState => {
    if (!result[fieldKey]) result[fieldKey] = {};
    return result[fieldKey];
  };

  const getFieldValue = (fieldKey: string): unknown => {
    const colKey = fieldKeyToColKey[fieldKey];
    if (colKey != null) return rowData[colKey] ?? '';
    return '';
  };

  for (const rule of rules) {
    if (!rule.IsFormRuleActive) continue;

    const conditionGroupResults = evaluateConditionGroups(
      rule.FormConditionGroups,
      getFieldValue,
      ctx,
    );

    if (conditionGroupResults.length === 0) continue;

    const ruleMatches = applyThenCondition(conditionGroupResults);

    for (const action of rule.FormRuleConditions) {
      const targetFieldKey = action.FieldKey || action.Value;
      const state = getOrCreate(targetFieldKey);

      if (ruleMatches) {
        applyAction(state, action);
      } else {
        removeAction(state, action);
      }
    }
  }

  return result;
}

function evaluateConditionGroups(
  groups: FormConditionGroup[],
  getFieldValue: (fieldKey: string) => unknown,
  ctx: RuleEvalContext,
): Array<{ conditionType: string; formConditions: boolean[] }> {
  return groups.map((cg) => {
    const groupResults = cg.FormGroups.map((fg) =>
      conditionsCheck(fg.ConditionType, fg.FormConditions, getFieldValue, ctx),
    );
    return { conditionType: cg.ConditionType, formConditions: groupResults };
  });
}

function conditionsCheck(
  conditionType: string,
  conditions: FormCondition[],
  getFieldValue: (fieldKey: string) => unknown,
  ctx: RuleEvalContext,
): boolean {
  if (!conditionType || !conditions.length) return false;

  const results: boolean[] = [];
  for (const cond of conditions) {
    const fieldValue = getFieldValue(cond.FieldKey);
    results.push(
      compareValues(fieldValue, cond.QueryCondition, cond.Value, getFieldValue, ctx),
    );
  }

  return conditionType === 'all'
    ? results.every(Boolean)
    : results.some(Boolean);
}

function compareValues(
  inputValue: unknown,
  operator: string,
  conditionValue: unknown,
  getFieldValue: (fieldKey: string) => unknown,
  ctx: RuleEvalContext,
): boolean {
  switch (operator) {
    case 'empty':
      return (
        inputValue === '' ||
        inputValue == null ||
        (Array.isArray(inputValue) && inputValue.length === 0)
      );

    case 'has value':
      if (Array.isArray(inputValue)) return inputValue.length > 0;
      return inputValue != null && inputValue !== '';

    case 'true or false': {
      const iv = inputValue || false;
      const cv = conditionValue;
      if (cv === '1' || cv === 'True' || cv === 'true' || cv === true) {
        return iv === true || iv === 1 || iv === '1' || iv === 'True' || iv === 'true';
      }
      return iv === false || iv === 0 || iv === '0' || iv === 'False' || iv === 'false' || !iv;
    }

    case 'is equal to role':
    case 'is equal to user':
    case 'is equal':
      if (Array.isArray(inputValue)) {
        const cmp = (a: string, b: string) => a.localeCompare(b);
        return (
          JSON.stringify([...inputValue].sort(cmp)) ===
          JSON.stringify(String(conditionValue).split(';').sort(cmp))
        );
      }
      return String(inputValue ?? '') === String(conditionValue ?? '');

    case 'is not equal':
      if (Array.isArray(inputValue)) {
        const cmp = (a: string, b: string) => a.localeCompare(b);
        return (
          JSON.stringify([...inputValue].sort(cmp)) !==
          JSON.stringify(String(conditionValue).split(';').sort(cmp))
        );
      }
      return String(inputValue ?? '') !== String(conditionValue ?? '');

    case 'contain':
      return String(inputValue ?? '').includes(String(conditionValue));

    case 'not contain':
      return !String(inputValue ?? '').includes(String(conditionValue));

    case 'start with':
      return String(inputValue ?? '').startsWith(String(conditionValue));

    case 'end with':
      return String(inputValue ?? '').endsWith(String(conditionValue));

    case 'greater than or equal to':
      return Number(inputValue) >= Number(conditionValue);

    case 'less than or equal to':
      return Number(inputValue) <= Number(conditionValue);

    case 'greater than':
      return Number(inputValue) > Number(conditionValue);

    case 'less than':
      return Number(inputValue) < Number(conditionValue);

    case 'between_date': {
      const [d1, d2] = String(conditionValue).split(',');
      return dayjs(String(inputValue)).isBetween(dayjs(d1), dayjs(d2));
    }

    case 'not_between_date': {
      const [d1, d2] = String(conditionValue).split(',');
      return !dayjs(String(inputValue)).isBetween(dayjs(d1), dayjs(d2));
    }

    case 'days_before_today':
      return dayjs().diff(dayjs(String(inputValue)), 'day') === Number(conditionValue);

    case 'before_date':
      return dayjs(String(inputValue)).diff(dayjs(String(conditionValue)), 'day') < 0;

    case 'on_or_before_date':
      return dayjs(String(inputValue)).diff(dayjs(String(conditionValue)), 'day') <= 0;

    case 'after_date':
      return dayjs(String(inputValue)).diff(dayjs(String(conditionValue)), 'day') > 0;

    case 'on_or_after_date':
      return dayjs(String(inputValue)).diff(dayjs(String(conditionValue)), 'day') >= 0;

    case 'currentuser':
      return ctx.currentUserEmail === inputValue || ctx.currentUserEmail === conditionValue;

    case 'equal to value in field':
      return String(getFieldValue(String(conditionValue))) === String(inputValue);

    case 'not equal to value in field':
      return String(getFieldValue(String(conditionValue))) !== String(inputValue);

    case 'greater than value in field':
      return Number(inputValue) > Number(getFieldValue(String(conditionValue)));

    case 'less than value in field':
      return Number(inputValue) < Number(getFieldValue(String(conditionValue)));

    case 'greater than or equal to value in field':
      return Number(inputValue) >= Number(getFieldValue(String(conditionValue)));

    case 'less than or equal to value in field':
      return Number(inputValue) <= Number(getFieldValue(String(conditionValue)));

    default:
      return false;
  }
}

function applyThenCondition(
  groups: Array<{ conditionType: string; formConditions: boolean[] }>,
): boolean {
  if (groups.every((g) => g.conditionType === 'all')) {
    return groups.every((g) => g.formConditions.every(Boolean));
  }

  return groups
    .map((g) =>
      g.conditionType === 'all'
        ? g.formConditions.every(Boolean)
        : g.formConditions.some(Boolean),
    )
    .every(Boolean);
}

function applyAction(state: FieldState, action: FormRuleAction): void {
  switch (action.Type) {
    case 'field':
      switch (action.Action) {
        case 'hide':
          state.hidden = true;
          break;
        case 'read_only':
          state.readonly = true;
          break;
        case 'require':
          state.required = true;
          break;
      }
      break;
    case 'message':
      if (action.DisplayMessage || action.PreventSave) {
        if (!state.messages) state.messages = [];
        if (action.Value && !state.messages.includes(action.Value)) {
          state.messages.push(action.Value);
        }
      }
      if (action.PreventSave) state.preventSave = true;
      break;
    case 'change':
      state.newValue = action.Value;
      break;
  }
}

function removeAction(state: FieldState, action: FormRuleAction): void {
  switch (action.Type) {
    case 'field':
      switch (action.Action) {
        case 'hide':
          state.hidden = false;
          break;
        case 'read_only':
          state.readonly = false;
          break;
        case 'require':
          state.required = false;
          break;
      }
      break;
    case 'message':
      if (action.PreventSave) state.preventSave = false;
      if (state.messages) {
        state.messages = state.messages.filter((m) => m !== action.Value);
      }
      break;
    case 'change':
      break;
  }
}
