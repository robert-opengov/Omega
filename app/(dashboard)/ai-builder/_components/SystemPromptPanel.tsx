'use client';

import { Textarea, Select, Slider, NumberInput, Button } from '@/components/ui/atoms';
import { FormField } from '@/components/ui/molecules';
import { RotateCcw } from 'lucide-react';

import {
  MODEL_OPTIONS,
  INFERENCE_DEFAULTS,
  DEFAULT_SYSTEM_PROMPT,
  SYSTEM_PROMPT_MAX_LENGTH,
} from '../_constants';

export interface AIBuilderSettings {
  systemPrompt: string;
  modelId: string;
  temperature: number;
  maxTokens: number;
}

interface SystemPromptPanelProps {
  settings: AIBuilderSettings;
  onChange: (settings: AIBuilderSettings) => void;
  disabled?: boolean;
}

export function SystemPromptPanel({ settings, onChange, disabled }: SystemPromptPanelProps) {
  const update = <K extends keyof AIBuilderSettings>(key: K, value: AIBuilderSettings[K]) =>
    onChange({ ...settings, [key]: value });

  const handleReset = () =>
    onChange({
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      modelId: MODEL_OPTIONS[0].value,
      temperature: INFERENCE_DEFAULTS.temperature,
      maxTokens: INFERENCE_DEFAULTS.maxTokens,
    });

  return (
    <div className="flex flex-col gap-5">
      <FormField label="System Prompt" hint={`${settings.systemPrompt.length}/${SYSTEM_PROMPT_MAX_LENGTH}`}>
        <Textarea
          id="system-prompt"
          value={settings.systemPrompt}
          onChange={(e) => update('systemPrompt', e.target.value.slice(0, SYSTEM_PROMPT_MAX_LENGTH))}
          rows={6}
          disabled={disabled}
          placeholder="Describe the AI's role and behavior..."
          className="text-sm"
        />
      </FormField>

      <FormField label="Model">
        <Select
          id="model"
          value={settings.modelId}
          onChange={(e) => update('modelId', e.target.value)}
          disabled={disabled}
        >
          {MODEL_OPTIONS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Temperature" hint="Lower = more focused, higher = more creative">
        <Slider
          value={[settings.temperature]}
          onValueChange={([v]) => update('temperature', v)}
          min={0}
          max={1}
          step={0.05}
          disabled={disabled}
        />
      </FormField>

      <FormField label="Max Tokens">
        <NumberInput
          value={settings.maxTokens}
          onChange={(v) => update('maxTokens', v)}
          min={256}
          max={8192}
          step={256}
          disabled={disabled}
        />
      </FormField>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleReset}
        disabled={disabled}
        icon={RotateCcw}
        className="self-start"
      >
        Reset to defaults
      </Button>
    </div>
  );
}
