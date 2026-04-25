// Vendored from /Users/rrome/Documents/GAB Core/packages/rules-engine/src/types.ts
//
// This module mirrors GAB Core's rules-engine "types" module verbatim so the
// expression DSL stays interchangeable between the two codebases. Keep
// changes in lock-step with the upstream package.

export type TokenType =
  | 'field_ref'
  | 'number'
  | 'string'
  | 'boolean'
  | 'null'
  | 'operator'
  | 'unary_operator'
  | 'logical'
  | 'not'
  | 'function'
  | 'lparen'
  | 'rparen'
  | 'comma'
  | 'eof';

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

export type ASTNode =
  | FieldRefNode
  | LiteralNode
  | BinaryOpNode
  | UnaryOpNode
  | LogicalNode
  | NotNode
  | FunctionCallNode;

export interface FieldRefNode {
  kind: 'field_ref';
  name: string;
}

export interface LiteralNode {
  kind: 'literal';
  value: string | number | boolean | null;
}

export interface BinaryOpNode {
  kind: 'binary_op';
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

export interface UnaryOpNode {
  kind: 'unary_op';
  operator: 'empty' | 'notempty';
  operand: ASTNode;
}

export interface LogicalNode {
  kind: 'logical';
  operator: 'and' | 'or';
  left: ASTNode;
  right: ASTNode;
}

export interface NotNode {
  kind: 'not';
  operand: ASTNode;
}

export interface FunctionCallNode {
  kind: 'function_call';
  name: string;
  args: ASTNode[];
}

export interface FormRule {
  id: string;
  type: 'visibility' | 'required' | 'readOnly' | 'setValue' | 'validation';
  targetItemId: string;
  expression: string;
  valueExpression?: string;
  errorMessage?: string;
}

export interface ValidationRule {
  type: 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'expression';
  value?: number | string;
  expression?: string;
  message: string;
}

export type ExpressionContext = Record<string, unknown>;

export interface RuleEvaluationResult {
  visibility: Map<string, boolean>;
  required: Map<string, boolean>;
  readOnly: Map<string, boolean>;
  values: Map<string, unknown>;
  errors: Map<string, string>;
}
