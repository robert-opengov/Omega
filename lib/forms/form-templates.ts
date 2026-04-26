/**
 * Form templates — starter `FormLayout`s offered when the user creates a
 * new form (gated by `app.formTemplates`).
 *
 * Templates are intentionally schema-free: they reference no tableId or
 * fieldId, only headers/dividers/text/buttons. The user picks a template
 * to seed structure; the form builder then lets them attach real fields
 * once the form is created. Keeps templates portable across apps.
 *
 * Removal recipe: flip `app.formTemplates` off OR delete this file +
 * the picker block in FormsListPanel.tsx. CreateFormPayload remains
 * unchanged either way (layout is optional).
 */

import type { FormLayout } from '@/lib/core/ports/form.repository';

export interface FormTemplate {
  id: string;
  title: string;
  description: string;
  /** Short tag shown in the picker. */
  tag: 'Blank' | 'Intake' | 'Service' | 'Survey' | 'Approval';
  layout: FormLayout;
}

const TWO_BUTTON_FOOTER = {
  submitButton: {
    label: 'Submit',
    variant: 'contained' as const,
    color: 'primary' as const,
    action: { type: 'save-and-close' as const },
  },
  cancelButton: {
    label: 'Cancel',
    variant: 'outlined' as const,
    color: 'secondary' as const,
    action: { type: 'navigate' as const, url: '..' },
  },
};

/**
 * Each template seeds a useful structure but leaves field bindings empty
 * so the user can drop in their own fields in the builder.
 */
export const FORM_TEMPLATES: readonly FormTemplate[] = [
  {
    id: 'blank',
    title: 'Blank',
    description: 'Start from scratch with an empty form.',
    tag: 'Blank',
    layout: {
      sections: [{ id: 'sec-default', title: 'Section 1', columns: 1, items: [] }],
    },
  },
  {
    id: 'intake',
    title: 'Service intake',
    description: 'Three-section intake: contact, request details, attachments.',
    tag: 'Intake',
    layout: {
      sections: [
        {
          id: 'sec-contact',
          title: 'Contact information',
          columns: 2,
          items: [
            { id: 'h-contact', type: 'header', text: 'Tell us who you are.' },
          ],
        },
        {
          id: 'sec-request',
          title: 'Request details',
          columns: 1,
          items: [
            { id: 'h-request', type: 'header', text: 'What can we help with?' },
            { id: 't-request', type: 'text', text: 'Please describe the issue in your own words.' },
          ],
        },
        {
          id: 'sec-attachments',
          title: 'Attachments',
          columns: 1,
          items: [
            { id: 'h-attach', type: 'header', text: 'Add supporting documents (optional).' },
          ],
        },
      ],
      displayMode: 'wizard',
      ...TWO_BUTTON_FOOTER,
    },
  },
  {
    id: 'service-request',
    title: 'Service request',
    description: 'Single-page request with priority + description, plus a divider for staff notes.',
    tag: 'Service',
    layout: {
      sections: [
        {
          id: 'sec-applicant',
          title: 'Applicant',
          columns: 2,
          items: [
            { id: 'h-applicant', type: 'header', text: 'Applicant details' },
          ],
        },
        {
          id: 'sec-details',
          title: 'Request',
          columns: 1,
          items: [
            { id: 'h-details', type: 'header', text: 'Request details' },
            { id: 'd-staff', type: 'divider', text: 'Internal notes' },
          ],
        },
      ],
      ...TWO_BUTTON_FOOTER,
    },
  },
  {
    id: 'survey',
    title: 'Survey',
    description: 'Wizard-style survey with one question per page.',
    tag: 'Survey',
    layout: {
      sections: [
        {
          id: 'sec-q1',
          title: 'Question 1',
          columns: 1,
          items: [{ id: 'h-q1', type: 'header', text: 'Question 1' }],
        },
        {
          id: 'sec-q2',
          title: 'Question 2',
          columns: 1,
          items: [{ id: 'h-q2', type: 'header', text: 'Question 2' }],
        },
        {
          id: 'sec-q3',
          title: 'Question 3',
          columns: 1,
          items: [{ id: 'h-q3', type: 'header', text: 'Question 3' }],
        },
      ],
      displayMode: 'wizard',
      ...TWO_BUTTON_FOOTER,
    },
  },
  {
    id: 'approval',
    title: 'Approval',
    description: 'Reviewer + decision sections with Approve / Reject buttons.',
    tag: 'Approval',
    layout: {
      sections: [
        {
          id: 'sec-summary',
          title: 'Summary',
          columns: 1,
          items: [{ id: 'h-summary', type: 'header', text: 'Request summary' }],
        },
        {
          id: 'sec-decision',
          title: 'Decision',
          columns: 1,
          items: [
            { id: 'h-decision', type: 'header', text: 'Decision' },
            {
              id: 'btns-approve',
              type: 'button-group',
              buttons: [
                {
                  label: 'Approve',
                  variant: 'contained',
                  color: 'success',
                  action: { type: 'save-and-close' },
                },
                {
                  label: 'Reject',
                  variant: 'outlined',
                  color: 'error',
                  action: { type: 'save-and-close' },
                },
              ],
            },
          ],
        },
      ],
    },
  },
] as const;

export function getFormTemplate(id: string): FormTemplate | undefined {
  return FORM_TEMPLATES.find((t) => t.id === id);
}
