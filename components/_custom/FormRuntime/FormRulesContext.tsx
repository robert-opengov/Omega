'use client';

import { createContext, useContext } from 'react';

export interface ItemRuleState {
  visible: boolean;
  required: boolean;
  readOnly: boolean;
  error?: string;
}

export interface FormRulesState {
  getItemState: (itemId: string) => ItemRuleState;
}

const defaultState: ItemRuleState = {
  visible: true,
  required: false,
  readOnly: false,
};

const FormRulesContext = createContext<FormRulesState>({
  getItemState: () => defaultState,
});

export function FormRulesProvider({
  value,
  children,
}: Readonly<{ value: FormRulesState; children: React.ReactNode }>) {
  return <FormRulesContext.Provider value={value}>{children}</FormRulesContext.Provider>;
}

export function useFormRules(itemId: string): ItemRuleState {
  return useContext(FormRulesContext).getItemState(itemId);
}
