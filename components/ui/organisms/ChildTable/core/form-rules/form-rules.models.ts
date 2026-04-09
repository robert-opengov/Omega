export interface FormRule {
  IsFormRuleActive: boolean;
  Name: string;
  FormConditionGroups: FormConditionGroup[];
  FormRuleConditions: FormRuleAction[];
}

export interface FormConditionGroup {
  ConditionType: string;
  FormGroups: FormRuleGroup[];
}

export interface FormRuleGroup {
  ConditionType: string;
  FormConditions: FormCondition[];
}

export interface FormCondition {
  FieldKey: string;
  FormFieldKey?: string;
  QueryCondition: string;
  Value: string;
  ConditionGroupType?: string;
}

export interface FormRuleAction {
  Action: string;
  Type: string;
  Value: string;
  FieldKey: string;
  IsTrue: boolean;
  PreventSave?: boolean;
  DisplayMessage?: boolean;
}

export interface FieldState {
  hidden?: boolean;
  readonly?: boolean;
  required?: boolean;
  newValue?: unknown;
  messages?: string[];
  preventSave?: boolean;
}

export type FieldStateMap = Record<string, FieldState>;

export interface RuleEvalContext {
  currentUserEmail?: string;
}
