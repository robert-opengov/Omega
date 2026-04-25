'use client';

import { useState, useTransition, type CSSProperties } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Plus,
  Save,
  Trash2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Button, Input, Label, Switch, Text, Select, Badge } from '@/components/ui/atoms';
import { TagInput } from '@/components/ui/molecules';
import { updateAppNavigationAction } from '@/app/actions/apps';
import type { AppNavigation, AppNavItem, AppNavItemType } from '@/lib/core/ports/app.repository';

const ICON_NAME_OPTIONS = [
  '',
  'Activity',
  'AppWindow',
  'BarChart',
  'Boxes',
  'Calendar',
  'CheckSquare',
  'Database',
  'FileText',
  'Folder',
  'GitBranch',
  'Globe',
  'Home',
  'Inbox',
  'LayoutDashboard',
  'Layers',
  'Map',
  'Package',
  'Settings',
  'Star',
  'Table',
  'Users',
  'Workflow',
] as const;

function uid(): string {
  return `nav_${Math.random().toString(36).slice(2, 10)}`;
}

interface NavigationEditorProps {
  appId: string;
  initialNavigation: AppNavigation;
  roleNames: string[];
}

export function NavigationEditor({ appId, initialNavigation, roleNames }: NavigationEditorProps) {
  const [items, setItems] = useState<AppNavItem[]>(initialNavigation.sidebar.items ?? []);
  const [enabled, setEnabled] = useState<boolean>(initialNavigation.sidebar.enabled ?? true);
  const [collapsible, setCollapsible] = useState<boolean>(initialNavigation.sidebar.collapsible ?? true);
  const [title, setTitle] = useState<string>(initialNavigation.sidebar.title ?? '');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSaving, startSave] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setItems(arrayMove(items, oldIndex, newIndex));
  };

  const addItem = (type: AppNavItemType) => {
    const next: AppNavItem = {
      id: uid(),
      label: type === 'divider' ? '—' : 'New item',
      type,
    };
    if (type === 'group') next.children = [];
    setItems((prev) => [...prev, next]);
    setExpandedId(next.id);
  };

  const updateItem = (id: string, patch: Partial<AppNavItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const onSave = () => {
    setError(null);
    setSuccess(false);
    startSave(async () => {
      const navigation: AppNavigation = {
        sidebar: {
          enabled,
          collapsible,
          ...(title ? { title } : {}),
          items,
        },
      };
      const res = await updateAppNavigationAction(appId, navigation);
      if (!res.success) {
        setError(res.error);
        return;
      }
      setSuccess(true);
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="nav-enabled">Sidebar enabled</Label>
          <div className="flex items-center gap-2 h-9">
            <Switch id="nav-enabled" checked={enabled} onCheckedChange={setEnabled} />
            <Text size="sm" color="muted">{enabled ? 'Visible' : 'Hidden'}</Text>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nav-collapsible">Collapsible</Label>
          <div className="flex items-center gap-2 h-9">
            <Switch id="nav-collapsible" checked={collapsible} onCheckedChange={setCollapsible} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nav-title">Sidebar title</Label>
          <Input
            id="nav-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="App name"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Text weight="medium" size="sm">Items ({items.length})</Text>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" onClick={() => addItem('page')}>
              <Plus className="h-4 w-4 mr-1" /> Page
            </Button>
            <Button size="sm" variant="outline" onClick={() => addItem('link')}>
              <Plus className="h-4 w-4 mr-1" /> Link
            </Button>
            <Button size="sm" variant="outline" onClick={() => addItem('group')}>
              <Plus className="h-4 w-4 mr-1" /> Group
            </Button>
            <Button size="sm" variant="outline" onClick={() => addItem('divider')}>
              <Plus className="h-4 w-4 mr-1" /> Divider
            </Button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-border rounded-lg">
            <Text size="sm" color="muted">
              No items yet. Add a page, link, group, or divider to get started.
            </Text>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2">
                {items.map((item) => (
                  <SortableNavRow
                    key={item.id}
                    item={item}
                    expanded={expandedId === item.id}
                    onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    onChange={(patch) => updateItem(item.id, patch)}
                    onRemove={() => removeItem(item.id)}
                    roleNames={roleNames}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        {error && <Text size="sm" className="text-danger-text">{error}</Text>}
        {success && <Text size="sm" className="text-success-text">Navigation saved.</Text>}
        <Button variant="primary" onClick={onSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-1.5" />
          {isSaving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </div>
  );
}

interface SortableNavRowProps {
  item: AppNavItem;
  expanded: boolean;
  onToggleExpand: () => void;
  onChange: (patch: Partial<AppNavItem>) => void;
  onRemove: () => void;
  roleNames: string[];
}

function SortableNavRow({ item, expanded, onToggleExpand, onChange, onRemove, roleNames }: SortableNavRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className="border border-border rounded-md bg-card">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          {...attributes}
          {...listeners}
          aria-label="Drag handle"
          className="cursor-grab text-muted-foreground hover:text-foreground p-1"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <Badge variant="default" size="sm" className="capitalize">
          {item.type}
        </Badge>
        <Text size="sm" weight="medium" className="flex-1 truncate">
          {item.label}
        </Text>
        {item.visibleTo && item.visibleTo.length > 0 ? (
          <Eye className="h-4 w-4 text-muted-foreground" aria-label="Restricted visibility" />
        ) : (
          <EyeOff className="h-4 w-4 text-muted-foreground/40" aria-label="Visible to all" />
        )}
        <button
          onClick={onToggleExpand}
          aria-label={expanded ? 'Collapse' : 'Expand'}
          className="p-1 text-muted-foreground hover:text-foreground"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <button
          onClick={onRemove}
          aria-label="Remove item"
          className="p-1 text-danger-text hover:bg-danger-light rounded"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {expanded && item.type !== 'divider' && (
        <div className="px-3 pb-3 pt-1 border-t border-border space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Label</Label>
              <Input value={item.label} onChange={(e) => onChange({ label: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={item.type}
                onChange={(e) => onChange({ type: e.target.value as AppNavItemType })}
              >
                <option value="page">Page</option>
                <option value="link">Link</option>
                <option value="group">Group</option>
                <option value="divider">Divider</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Icon</Label>
              <Select
                value={item.icon ?? ''}
                onChange={(e) => onChange({ icon: e.target.value || undefined })}
              >
                {ICON_NAME_OPTIONS.map((name) => (
                  <option key={name || 'none'} value={name}>
                    {name || '— None —'}
                  </option>
                ))}
              </Select>
            </div>
            {item.type === 'page' && (
              <div className="space-y-1.5">
                <Label>Page key</Label>
                <Input
                  value={item.pageKey ?? ''}
                  onChange={(e) => onChange({ pageKey: e.target.value })}
                  placeholder="my_page"
                />
              </div>
            )}
            {item.type === 'link' && (
              <div className="space-y-1.5">
                <Label>Href</Label>
                <Input
                  value={item.href ?? ''}
                  onChange={(e) => onChange({ href: e.target.value })}
                  placeholder="https://example.com or /apps/..."
                />
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Visible to roles</Label>
            <TagInput
              tags={item.visibleTo ?? []}
              onTagsChange={(tags) => onChange({ visibleTo: tags.length === 0 ? undefined : tags })}
              placeholder={
                roleNames.length > 0
                  ? `Add a role name (e.g. ${roleNames[0]})`
                  : 'Add a role name'
              }
            />
            <Text size="xs" color="muted">
              Empty means visible to all roles.
              {roleNames.length > 0 && ` Known roles: ${roleNames.join(', ')}.`}
            </Text>
          </div>
        </div>
      )}
    </li>
  );
}
