'use client';

import { useState, useCallback } from 'react';

type ValidationRule<T> = (value: unknown, values: T) => string | undefined;
type ValidationSchema<T> = Partial<Record<keyof T, ValidationRule<T>[]>>;

interface UseFormValidationReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  handleChange: (field: keyof T, value: unknown) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: (onSubmit: (values: T) => void | Promise<void>) => (e?: Event) => void;
  setFieldValue: (field: keyof T, value: unknown) => void;
  setFieldError: (field: keyof T, error: string) => void;
  isValid: boolean;
  reset: () => void;
}

export function useFormValidation<T extends Record<string, unknown>>(
  initialValues: T,
  schema?: ValidationSchema<T>
): UseFormValidationReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const validate = useCallback(
    (field: keyof T, val: unknown, allValues: T): string | undefined => {
      const rules = schema?.[field];
      if (!rules) return undefined;
      for (const rule of rules) {
        const error = rule(val, allValues);
        if (error) return error;
      }
      return undefined;
    },
    [schema]
  );

  const validateAll = useCallback(
    (vals: T): Partial<Record<keyof T, string>> => {
      const errs: Partial<Record<keyof T, string>> = {};
      if (!schema) return errs;
      for (const field of Object.keys(schema) as (keyof T)[]) {
        const error = validate(field, vals[field], vals);
        if (error) errs[field] = error;
      }
      return errs;
    },
    [schema, validate]
  );

  const handleChange = useCallback(
    (field: keyof T, value: unknown) => {
      setValues((prev) => {
        const next = { ...prev, [field]: value };
        if (touched[field]) {
          const error = validate(field, value, next);
          setErrors((prev) => ({ ...prev, [field]: error }));
        }
        return next;
      });
    },
    [touched, validate]
  );

  const handleBlur = useCallback(
    (field: keyof T) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const error = validate(field, values[field], values);
      setErrors((prev) => ({ ...prev, [field]: error }));
    },
    [values, validate]
  );

  const handleSubmit = useCallback(
    (onSubmit: (values: T) => void | Promise<void>) => {
      return (e?: Event) => {
        e?.preventDefault();
        const allTouched: Partial<Record<keyof T, boolean>> = {};
        for (const key of Object.keys(values) as (keyof T)[]) {
          allTouched[key] = true;
        }
        setTouched(allTouched);
        const errs = validateAll(values);
        setErrors(errs);
        if (Object.values(errs).every((e) => !e)) {
          onSubmit(values);
        }
      };
    },
    [values, validateAll]
  );

  const setFieldValue = useCallback((field: keyof T, value: unknown) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  const isValid = Object.values(errors).every((e) => !e);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return { values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, setFieldError, isValid, reset };
}

// Common validation rules
export const required = (message = 'This field is required') => (value: unknown) =>
  !value || (typeof value === 'string' && !value.trim()) ? message : undefined;

export const minLength = (min: number, message?: string) => (value: unknown) =>
  typeof value === 'string' && value.length < min ? (message || `Must be at least ${min} characters`) : undefined;

export const maxLength = (max: number, message?: string) => (value: unknown) =>
  typeof value === 'string' && value.length > max ? (message || `Must be at most ${max} characters`) : undefined;

export const email = (message = 'Invalid email address') => (value: unknown) =>
  typeof value === 'string' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? message : undefined;

export const pattern = (regex: RegExp, message = 'Invalid format') => (value: unknown) =>
  typeof value === 'string' && value && !regex.test(value) ? message : undefined;
