'use client';

import { useState } from 'react';
import { Mail, Search, Bold, Italic, Underline, Plus, Trash2, Settings, ChevronRight, Tag, ClipboardEdit, BarChart3, FileSearch, Shield } from 'lucide-react';
import { ShowcaseLayout } from '../_components/ShowcaseLayout';
import {
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  RadioGroup,
  Switch,
  Slider,
  Label,
  Heading,
  Text,
  Code,
  Kbd,
  Spinner,
  Skeleton,
  Progress,
  Tooltip,
  Avatar,
  IconButton,
  Separator,
  Toggle,
  Badge,
  Chip,
  ButtonGroup,
  UILink,
  NumberInput,
  AccountNumberInput,
  SelectionCard,
  ProcessingStep,
} from '@/components/ui/atoms';
import { ComponentDemo, Section } from '../_components/ComponentDemo';

export default function AtomsPage() {
  return (
    <ShowcaseLayout>
      <div className="space-y-12">

      <Section title="Typography" count={4}>
        <HeadingDemo />
        <TextDemo />
        <CodeDemo />
        <KbdDemo />
      </Section>

      <Section title="Form Inputs" count={10}>
        <ButtonDemo />
        <InputDemo />
        <TextareaDemo />
        <SelectDemo />
        <CheckboxDemo />
        <RadioGroupDemo />
        <SwitchDemo />
        <SliderDemo />
        <ToggleDemo />
        <LabelDemo />
      </Section>

      <Section title="Feedback" count={6}>
        <BadgeDemo />
        <ChipDemo />
        <SpinnerDemo />
        <SkeletonDemo />
        <ProgressDemo />
        <TooltipDemo />
      </Section>

      <Section title="Specialized Inputs" count={1}>
        <AccountNumberInputDemo />
      </Section>

      <Section title="Wizard Primitives" count={2}>
        <SelectionCardDemo />
        <ProcessingStepDemo />
      </Section>

      <Section title="Layout & Misc" count={6}>
        <AvatarDemo />
        <IconButtonDemo />
        <ButtonGroupDemo />
        <LinkDemo />
        <NumberInputDemo />
        <SeparatorDemo />
      </Section>
      </div>
    </ShowcaseLayout>
  );
}

/* ---------- Typography ---------- */

function HeadingDemo() {
  return (
    <ComponentDemo
      name="Heading"
      description="Semantic headings h1–h6 with auto-sized typography and color variants."
      props={`interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  color?: 'foreground' | 'muted' | 'primary' | 'destructive' | 'inherit';
}`}
    >
      <div className="space-y-6">
        <div className="space-y-3">
          <Text size="sm" weight="medium" color="muted" className="mb-1">Levels</Text>
          <Heading as="h1">Heading h1</Heading>
          <Heading as="h2">Heading h2</Heading>
          <Heading as="h3">Heading h3</Heading>
          <Heading as="h4">Heading h4</Heading>
          <Heading as="h5">Heading h5</Heading>
          <Heading as="h6">Heading h6</Heading>
        </div>
        <div className="space-y-2">
          <Text size="sm" weight="medium" color="muted" className="mb-1">Colors</Text>
          <Heading as="h3" color="foreground">color=&quot;foreground&quot;</Heading>
          <Heading as="h3" color="primary">color=&quot;primary&quot;</Heading>
          <Heading as="h3" color="muted">color=&quot;muted&quot;</Heading>
          <Heading as="h3" color="destructive">color=&quot;destructive&quot;</Heading>
        </div>
      </div>
    </ComponentDemo>
  );
}

function TextDemo() {
  return (
    <ComponentDemo
      name="Text"
      description="Versatile text component with size, weight, and color variants."
      props={`interface TextProps extends Omit<HTMLAttributes<HTMLElement>, 'color'>, VariantProps<typeof textVariants> {
  as?: ElementType;
}
// size: 'xs' | 'sm' | 'base' | 'lg' | 'xl'
// weight: 'normal' | 'medium' | 'semibold' | 'bold'
// color: 'foreground' | 'muted' | 'primary' | 'destructive' | 'inherit'`}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <Text size="sm" weight="medium" color="muted" className="mb-1">Sizes</Text>
          {(['xs', 'sm', 'base', 'lg', 'xl'] as const).map((size) => (
            <Text key={size} size={size}>Text size=&quot;{size}&quot;</Text>
          ))}
        </div>
        <Separator />
        <div className="space-y-2">
          <Text size="sm" weight="medium" color="muted" className="mb-1">Weights</Text>
          {(['normal', 'medium', 'semibold', 'bold'] as const).map((weight) => (
            <Text key={weight} weight={weight}>Text weight=&quot;{weight}&quot;</Text>
          ))}
        </div>
        <Separator />
        <div className="space-y-2">
          <Text size="sm" weight="medium" color="muted" className="mb-1">Colors</Text>
          {(['foreground', 'muted', 'primary', 'destructive', 'inherit'] as const).map((c) => (
            <Text key={c} color={c}>Text color=&quot;{c}&quot;</Text>
          ))}
        </div>
      </div>
    </ComponentDemo>
  );
}

function CodeDemo() {
  return (
    <ComponentDemo
      name="Code"
      description="Inline code snippet with monospace styling."
      props={`function Code(props: HTMLAttributes<HTMLElement>)`}
    >
      <Text>
        Use <Code>npm install</Code> to install dependencies, or run <Code>npx create-next-app</Code>.
      </Text>
    </ComponentDemo>
  );
}

function KbdDemo() {
  return (
    <ComponentDemo
      name="Kbd"
      description="Keyboard shortcut indicator."
      props={`function Kbd(props: HTMLAttributes<HTMLElement>)`}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <Kbd>⌘</Kbd> + <Kbd>K</Kbd>
        <span className="text-muted-foreground mx-4">|</span>
        <Kbd>Ctrl</Kbd> + <Kbd>Shift</Kbd> + <Kbd>P</Kbd>
        <span className="text-muted-foreground mx-4">|</span>
        <Kbd>Esc</Kbd>
      </div>
    </ComponentDemo>
  );
}

/* ---------- Form Inputs ---------- */

function ButtonDemo() {
  const [loading, setLoading] = useState(false);

  return (
    <ComponentDemo
      name="Button"
      description="Accessible button with 6 variants, 4 sizes, loading state, and icon support."
      props={`interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean;
  icon?: ElementType;
  iconRight?: ElementType;
  fullWidth?: boolean;
  asChild?: boolean;
}
// variant: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'link'
// size: 'sm' | 'md' | 'lg' | 'icon'`}
    >
      <div className="space-y-6">
        <div>
          <Text size="sm" weight="medium" color="muted" className="mb-3">Variants</Text>
          <div className="flex flex-wrap gap-3">
            {(['primary', 'secondary', 'outline', 'danger', 'ghost', 'link'] as const).map((v) => (
              <Button key={v} variant={v}>{v}</Button>
            ))}
          </div>
        </div>
        <div>
          <Text size="sm" weight="medium" color="muted" className="mb-3">Sizes</Text>
          <div className="flex items-center gap-3">
            {(['sm', 'md', 'lg'] as const).map((s) => (
              <Button key={s} size={s}>Size {s}</Button>
            ))}
            <Button size="icon"><Plus className="h-4 w-4" /></Button>
          </div>
        </div>
        <div>
          <Text size="sm" weight="medium" color="muted" className="mb-3">With Icons & Loading</Text>
          <div className="flex items-center gap-3">
            <Button icon={Mail}>With Icon</Button>
            <Button iconRight={ChevronRight} variant="outline">Icon Right</Button>
            <Button
              loading={loading}
              onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 2000); }}
            >
              Click to Load
            </Button>
          </div>
        </div>
        <div>
          <Text size="sm" weight="medium" color="muted" className="mb-3">Full Width & Disabled</Text>
          <div className="space-y-2 max-w-sm">
            <Button fullWidth>Full Width</Button>
            <Button disabled>Disabled</Button>
          </div>
        </div>
      </div>
    </ComponentDemo>
  );
}

function InputDemo() {
  return (
    <ComponentDemo
      name="Input"
      description="Text input with built-in error state and accessibility."
      props={`interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
        <Input placeholder="Default input" />
        <Input placeholder="Disabled" disabled />
        <Input placeholder="With error" error="This field is required" />
        <Input type="password" placeholder="Password" />
      </div>
    </ComponentDemo>
  );
}

function TextareaDemo() {
  return (
    <ComponentDemo
      name="Textarea"
      description="Multi-line text input with optional auto-grow and error state."
      props={`interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  autoGrow?: boolean;
}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
        <Textarea placeholder="Default textarea" />
        <Textarea placeholder="Auto-grow — type to expand" autoGrow />
        <Textarea placeholder="With error" error="Too short" />
        <Textarea placeholder="Disabled" disabled />
      </div>
    </ComponentDemo>
  );
}

function SelectDemo() {
  return (
    <ComponentDemo
      name="Select"
      description="Native select dropdown with error styling."
      props={`interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
        <Select>
          <option value="">Choose an option...</option>
          <option>Option A</option>
          <option>Option B</option>
          <option>Option C</option>
        </Select>
        <Select error="Selection required">
          <option value="">With error...</option>
        </Select>
        <Select disabled>
          <option>Disabled</option>
        </Select>
      </div>
    </ComponentDemo>
  );
}

function CheckboxDemo() {
  const [checked, setChecked] = useState(false);
  return (
    <ComponentDemo
      name="Checkbox"
      description="Accessible checkbox built on Radix UI primitives."
      props={`interface CheckboxProps extends Radix.CheckboxProps {
  label?: string;
}`}
    >
      <div className="flex flex-col gap-3">
        <Checkbox label="Accept terms and conditions" checked={checked} onCheckedChange={(v) => setChecked(!!v)} />
        <Checkbox label="Receive email updates" />
        <Checkbox label="Disabled option" disabled />
      </div>
    </ComponentDemo>
  );
}

function RadioGroupDemo() {
  return (
    <ComponentDemo
      name="RadioGroup"
      description="Grouped radio buttons with Radix UI."
      props={`interface RadioGroupProps extends Radix.RadioGroupProps {
  items: { value: string; label: string; disabled?: boolean }[];
}`}
    >
      <RadioGroup
        items={[
          { value: 'sm', label: 'Small' },
          { value: 'md', label: 'Medium' },
          { value: 'lg', label: 'Large' },
          { value: 'disabled', label: 'Disabled option', disabled: true },
        ]}
        defaultValue="md"
      />
    </ComponentDemo>
  );
}

function SwitchDemo() {
  const [on, setOn] = useState(true);
  return (
    <ComponentDemo
      name="Switch"
      description="Toggle switch built on Radix UI."
      props={`interface SwitchProps extends Radix.SwitchProps {
  label?: string;
}`}
    >
      <div className="flex flex-col gap-4">
        <Switch label="Dark mode" checked={on} onCheckedChange={setOn} />
        <Switch label="Notifications" />
        <Switch label="Disabled" disabled />
      </div>
    </ComponentDemo>
  );
}

function SliderDemo() {
  const [value, setValue] = useState([50]);
  return (
    <ComponentDemo
      name="Slider"
      description="Draggable range slider with Radix UI."
      props={`interface SliderProps extends Radix.SliderProps {
  label?: string;
}`}
    >
      <div className="max-w-sm space-y-4">
        <Slider label={`Volume: ${value[0]}%`} value={value} onValueChange={setValue} max={100} step={1} />
        <Slider label="Disabled" defaultValue={[30]} disabled />
      </div>
    </ComponentDemo>
  );
}

function ToggleDemo() {
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  return (
    <ComponentDemo
      name="Toggle"
      description="Pressable toggle button with variant and size options."
      props={`interface ToggleProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof toggleVariants> {
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
}
// variant: 'default' | 'outline'
// size: 'sm' | 'md' | 'lg'`}
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <Toggle pressed={bold} onPressedChange={setBold} variant="outline" size="sm">
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle pressed={italic} onPressedChange={setItalic} variant="outline" size="sm">
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle pressed={underline} onPressedChange={setUnderline} variant="outline" size="sm">
            <Underline className="h-4 w-4" />
          </Toggle>
        </div>
        <Text size="sm" color="muted">
          Active: {[bold && 'Bold', italic && 'Italic', underline && 'Underline'].filter(Boolean).join(', ') || 'None'}
        </Text>
      </div>
    </ComponentDemo>
  );
}

function LabelDemo() {
  return (
    <ComponentDemo
      name="Label"
      description="Form label with optional required asterisk."
      props={`interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}`}
    >
      <div className="flex flex-col gap-3">
        <Label>Default label</Label>
        <Label required>Required label</Label>
      </div>
    </ComponentDemo>
  );
}

/* ---------- Feedback ---------- */

function BadgeDemo() {
  return (
    <ComponentDemo
      name="Badge"
      description="Status indicator with 7 color variants and 3 sizes."
      props={`interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}
// variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'inProgress' | 'primary'
// size: 'sm' | 'md' | 'lg'`}
    >
      <div className="space-y-4">
        <div>
          <Text size="sm" weight="medium" color="muted" className="mb-3">Variants</Text>
          <div className="flex flex-wrap gap-2">
            {(['default', 'success', 'warning', 'danger', 'info', 'inProgress', 'primary'] as const).map((v) => (
              <Badge key={v} variant={v}>{v}</Badge>
            ))}
          </div>
        </div>
        <div>
          <Text size="sm" weight="medium" color="muted" className="mb-3">Sizes</Text>
          <div className="flex items-center gap-2">
            {(['sm', 'md', 'lg'] as const).map((s) => (
              <Badge key={s} size={s}>size {s}</Badge>
            ))}
          </div>
        </div>
      </div>
    </ComponentDemo>
  );
}

function SpinnerDemo() {
  return (
    <ComponentDemo
      name="Spinner"
      description="Loading indicator in 3 sizes."
      props={`interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}`}
    >
      <div className="flex items-center gap-6">
        {(['sm', 'md', 'lg'] as const).map((s) => (
          <div key={s} className="flex flex-col items-center gap-2">
            <Spinner size={s} />
            <Text size="xs" color="muted">{s}</Text>
          </div>
        ))}
      </div>
    </ComponentDemo>
  );
}

function SkeletonDemo() {
  return (
    <ComponentDemo
      name="Skeleton"
      description="Placeholder shimmer for loading states."
      props={`interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  className?: string;
  width?: string | number;
  height?: string | number;
}`}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="space-y-2 flex-1">
            <Skeleton variant="text" width="60%" height={16} />
            <Skeleton variant="text" width="40%" height={12} />
          </div>
        </div>
        <Skeleton variant="rectangular" width="100%" height={100} />
      </div>
    </ComponentDemo>
  );
}

function ProgressDemo() {
  const [value, setValue] = useState(65);
  return (
    <ComponentDemo
      name="Progress"
      description="Animated progress bar with Radix UI and size variants."
      props={`interface ProgressProps extends Radix.ProgressProps, VariantProps<typeof progressVariants> {
  showLabel?: boolean;
}
// size: 'sm' | 'md' | 'lg'`}
    >
      <div className="space-y-6 max-w-md">
        <div className="space-y-3">
          {(['sm', 'md', 'lg'] as const).map((s) => (
            <div key={s} className="space-y-1">
              <Text size="xs" color="muted">size=&quot;{s}&quot;</Text>
              <Progress value={value} size={s} showLabel={s === 'lg'} />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setValue((v) => Math.max(0, v - 10))}>-10</Button>
          <Button size="sm" variant="outline" onClick={() => setValue((v) => Math.min(100, v + 10))}>+10</Button>
          <Text size="sm" color="muted" className="self-center ml-2">{value}%</Text>
        </div>
      </div>
    </ComponentDemo>
  );
}

function TooltipDemo() {
  return (
    <ComponentDemo
      name="Tooltip"
      description="Contextual information on hover with configurable placement."
      props={`interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delayDuration?: number;
  className?: string;
}`}
    >
      <div className="flex flex-wrap gap-4">
        {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
          <Tooltip key={side} content={`Tooltip on ${side}`} side={side}>
            <Button variant="outline" size="sm">Hover ({side})</Button>
          </Tooltip>
        ))}
      </div>
    </ComponentDemo>
  );
}

/* ---------- Layout & Misc ---------- */

function AvatarDemo() {
  return (
    <ComponentDemo
      name="Avatar"
      description="User avatar with image, fallback initials, and 4 sizes."
      props={`interface AvatarProps extends VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  fallback?: string;
  className?: string;
}
// size: 'sm' | 'md' | 'lg' | 'xl'`}
    >
      <div className="flex items-end gap-4">
        {(['sm', 'md', 'lg', 'xl'] as const).map((s) => (
          <div key={s} className="flex flex-col items-center gap-2">
            <Avatar size={s} fallback="GA" alt="User" />
            <Text size="xs" color="muted">{s}</Text>
          </div>
        ))}
        <div className="flex flex-col items-center gap-2">
          <Avatar src="/brand/icon.svg" fallback="U" alt="App icon" />
          <Text size="xs" color="muted">with image</Text>
        </div>
      </div>
    </ComponentDemo>
  );
}

function IconButtonDemo() {
  return (
    <ComponentDemo
      name="IconButton"
      description="Button optimized for icon-only actions with accessible label."
      props={`interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ElementType;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'primary';
}`}
    >
      <div className="space-y-4">
        <div>
          <Text size="sm" weight="medium" color="muted" className="mb-3">Variants</Text>
          <div className="flex gap-3">
            <IconButton icon={Settings} label="Settings" variant="ghost" />
            <IconButton icon={Plus} label="Add" variant="outline" />
            <IconButton icon={Trash2} label="Delete" variant="primary" />
          </div>
        </div>
        <div>
          <Text size="sm" weight="medium" color="muted" className="mb-3">Sizes</Text>
          <div className="flex items-center gap-3">
            {(['sm', 'md', 'lg'] as const).map((s) => (
              <IconButton key={s} icon={Search} label={`Search ${s}`} size={s} variant="outline" />
            ))}
          </div>
        </div>
      </div>
    </ComponentDemo>
  );
}

function SeparatorDemo() {
  return (
    <ComponentDemo
      name="Separator"
      description="Visual divider in horizontal or vertical orientation."
      props={`interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}`}
    >
      <div className="space-y-4">
        <div>
          <Text size="sm" color="muted" className="mb-2">Horizontal</Text>
          <Separator />
        </div>
        <div>
          <Text size="sm" color="muted" className="mb-2">Vertical (40px height container)</Text>
          <div className="flex items-center gap-4 h-10">
            <span>Left</span>
            <Separator orientation="vertical" />
            <span>Right</span>
          </div>
        </div>
      </div>
    </ComponentDemo>
  );
}

/* ---------- New Parity Components ---------- */

function ChipDemo() {
  return (
    <ComponentDemo
      name="Chip"
      description="Standalone pill for categorizing, filtering, or tagging content. 4 variants, 2 sizes."
      props={`interface ChipProps extends VariantProps<typeof chipVariants> {
  label: string;
  icon?: ElementType;
  avatar?: ReactNode;
  onDelete?: () => void;
  color?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  disabled?: boolean;
}
// variant: 'default' | 'outlined' | 'minimal' | 'strong'
// size: 'sm' | 'md'`}
    >
      <div className="space-y-4">
        <div>
          <Text size="sm" weight="medium" color="muted" className="mb-3">Variants</Text>
          <div className="flex flex-wrap gap-2">
            {(['default', 'outlined', 'minimal', 'strong'] as const).map((v) => (
              <Chip key={v} variant={v} label={v} />
            ))}
          </div>
        </div>
        <div>
          <Text size="sm" weight="medium" color="muted" className="mb-3">Colors</Text>
          <div className="flex flex-wrap gap-2">
            {(['neutral', 'primary', 'success', 'warning', 'danger', 'info'] as const).map((c) => (
              <Chip key={c} color={c} label={c} />
            ))}
          </div>
        </div>
        <div>
          <Text size="sm" weight="medium" color="muted" className="mb-3">With Icon & Delete</Text>
          <div className="flex flex-wrap gap-2">
            <Chip label="Tagged" icon={Tag} onDelete={() => {}} />
            <Chip label="Primary" color="primary" variant="outlined" onDelete={() => {}} />
            <Chip label="Disabled" disabled onDelete={() => {}} />
          </div>
        </div>
      </div>
    </ComponentDemo>
  );
}

function ButtonGroupDemo() {
  return (
    <ComponentDemo
      name="ButtonGroup"
      description="Groups related buttons with shared borders."
      props={`interface ButtonGroupProps {
  orientation?: 'horizontal' | 'vertical';
  children: ReactNode;
}`}
    >
      <div className="space-y-4">
        <div>
          <Text size="sm" weight="medium" color="muted" className="mb-3">Horizontal</Text>
          <ButtonGroup>
            <Button variant="outline" size="sm">Left</Button>
            <Button variant="outline" size="sm">Center</Button>
            <Button variant="outline" size="sm">Right</Button>
          </ButtonGroup>
        </div>
        <div>
          <Text size="sm" weight="medium" color="muted" className="mb-3">Vertical</Text>
          <ButtonGroup orientation="vertical">
            <Button variant="outline" size="sm">Top</Button>
            <Button variant="outline" size="sm">Middle</Button>
            <Button variant="outline" size="sm">Bottom</Button>
          </ButtonGroup>
        </div>
        <div>
          <Text size="sm" weight="medium" color="muted" className="mb-3">Primary Variant</Text>
          <ButtonGroup>
            <Button size="sm" icon={Plus}>Action</Button>
            <Button size="sm" icon={Plus}>Action</Button>
            <Button size="sm" icon={Plus}>Action</Button>
          </ButtonGroup>
        </div>
      </div>
    </ComponentDemo>
  );
}

function LinkDemo() {
  return (
    <ComponentDemo
      name="UILink"
      description="CDS-37 link with standalone/inline types, sizes, and external support."
      props={`interface UILinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  display?: 'standalone' | 'inline';
  color?: 'primary' | 'foreground' | 'muted' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  external?: boolean;
  icon?: ElementType;
}`}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <UILink href="#">Standalone (default)</UILink>
          <UILink href="#" display="inline">Inline (underlined)</UILink>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <UILink href="#" size="sm">Small</UILink>
          <UILink href="#" size="md">Medium</UILink>
          <UILink href="#" size="lg">Large</UILink>
        </div>
        <div className="flex flex-wrap gap-4">
          {(['primary', 'foreground', 'muted', 'destructive'] as const).map((c) => (
            <UILink key={c} href="#" color={c}>{c}</UILink>
          ))}
        </div>
        <div>
          <UILink href="https://opengov.com" external>External link</UILink>
        </div>
      </div>
    </ComponentDemo>
  );
}

function NumberInputDemo() {
  const [val, setVal] = useState(5);
  return (
    <ComponentDemo
      name="NumberInput"
      description="Number field with increment/decrement stepper buttons."
      props={`interface NumberInputProps {
  value?: number;
  onChange?: (value: number) => void;
  min?: number; max?: number; step?: number;
  error?: string; disabled?: boolean;
  size?: 'sm' | 'md';
}`}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <NumberInput value={val} onChange={setVal} min={0} max={20} />
          <Text size="sm" color="muted">Value: {val}</Text>
        </div>
        <div className="flex items-center gap-4">
          <NumberInput value={3} size="sm" min={0} max={10} />
          <Text size="xs" color="muted">Small size</Text>
        </div>
        <NumberInput value={0} disabled />
      </div>
    </ComponentDemo>
  );
}

function AccountNumberInputDemo() {
  const [value, setValue] = useState('');
  return (
    <ComponentDemo
      name="AccountNumberInput"
      description="Masked numeric input for account numbers, fund codes, or structured IDs."
      props={`interface AccountNumberInputProps {
  mask: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
  placeholder?: string;
}`}
    >
      <div className="space-y-4 max-w-sm">
        <div>
          <Text size="sm" weight="medium" color="muted" className="mb-2">Fund Code (###-####-###.##)</Text>
          <AccountNumberInput mask="###-####-###.##" value={value} onChange={setValue} />
          <Text size="xs" color="muted" className="mt-1">Raw value: &quot;{value}&quot;</Text>
        </div>
        <div>
          <Text size="sm" weight="medium" color="muted" className="mb-2">Error State</Text>
          <AccountNumberInput mask="###-###" error />
        </div>
        <div>
          <Text size="sm" weight="medium" color="muted" className="mb-2">Disabled</Text>
          <AccountNumberInput mask="##-####-##" disabled />
        </div>
      </div>
    </ComponentDemo>
  );
}

/* ---------- Wizard Primitives ---------- */

function SelectionCardDemo() {
  const [role, setRole] = useState<string | null>('admin');

  const roles = [
    { id: 'admin', icon: ClipboardEdit, title: 'Grant Administrator', description: 'I manage day-to-day compliance and reporting.' },
    { id: 'finance', icon: BarChart3, title: 'Finance Director', description: 'I oversee budgets and financial compliance.' },
    { id: 'auditor', icon: FileSearch, title: 'Auditor', description: 'I review grant activity and verify transactions.' },
    { id: 'readonly', icon: Shield, title: 'View-only', description: 'I just need read access to monitor progress.' },
  ];

  return (
    <ComponentDemo
      name="SelectionCard"
      description="A selectable card primitive for option-picking UIs like role selection in onboarding wizards."
      props={`interface SelectionCardProps {
  icon?: ElementType;
  title: string;
  description?: string;
  selected?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
}`}
    >
      <div role="radiogroup" aria-label="Select your role" className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
        {roles.map((r) => (
          <SelectionCard
            key={r.id}
            icon={r.icon}
            title={r.title}
            description={r.description}
            selected={role === r.id}
            onSelect={() => setRole(r.id)}
          />
        ))}
      </div>
    </ComponentDemo>
  );
}

function ProcessingStepDemo() {
  return (
    <ComponentDemo
      name="ProcessingStep"
      description="A single line item in an async processing checklist showing completed, in-progress, or pending status."
      props={`interface ProcessingStepProps {
  status: 'completed' | 'in-progress' | 'pending';
  label: string;
}`}
    >
      <div className="flex flex-col gap-4 max-w-sm">
        <ProcessingStep status="completed" label="Confirm award details" />
        <ProcessingStep status="in-progress" label="Map budget categories" />
        <ProcessingStep status="pending" label="Check compliance conditions" />
        <ProcessingStep status="pending" label="Set reporting deadlines" />
      </div>
    </ComponentDemo>
  );
}
