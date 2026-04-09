'use client';

import { useForm, DefaultValues, FieldValues, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ZodFormProps<T extends FieldValues> {
  /** Zod schema used for validation. */
  schema: z.ZodType<T>;
  defaultValues?: DefaultValues<T>;
  onSubmit: SubmitHandler<T>;
  /** Render-prop that receives React Hook Form methods. */
  children: (methods: ReturnType<typeof useForm<T>>) => ReactNode;
  className?: string;
}

/**
 * A wrapper that connects a Zod schema to React Hook Form, providing
 * type-safe validation and automatic form state management.
 *
 * @example
 * const schema = z.object({ name: z.string().min(1, 'Required') });
 *
 * <ZodForm schema={schema} onSubmit={(data) => console.log(data)}>
 *   {({ register, formState: { errors } }) => (
 *     <FormField label="Name" {...register('name')} error={errors.name?.message as string} />
 *   )}
 * </ZodForm>
 */
export function ZodForm<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  className,
}: ZodFormProps<T>) {
  const methods = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <form onSubmit={methods.handleSubmit(onSubmit)} className={cn('space-y-4', className)}>
      {children(methods)}
    </form>
  );
}
