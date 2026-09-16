import { useState } from 'react'
import { BookOpen, Brain, Layers, Pencil, Plus, RotateCcw, Star, Zap } from 'lucide-react'
import type { StudyTemplate } from '../types'
import { DEFAULT_TEMPLATES, TEMPLATE_COLORS, duplicateTemplate, isBuiltinTemplate, restoreDefaultTemplates } from '../lib/templates'
import { uid } from '../lib/storage'
import { classNames } from '../lib/utils'

const TEMPLATE_ICONS: Record<string, typeof Zap> = {
  book: BookOpen,
  pencil: Pencil,
  zap: Zap,
  brain: Brain,
  layers: Layers,
}

interface Draft {
  id: string | null
  name: string
  description: string
  focusMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  sessions: number
  icon: string
  color: string
}

function emptyDraft(): Draft {
  return { id: null, name: '', description: '', focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, sessions: 2, icon: 'zap', color: TEMPLATE_COLORS[0] }
}

function fromTemplate(template: StudyTemplate): Draft {
  return { id: template.id, name: template.name, description: template.description, focusMinutes: template.focusMinutes, shortBreakMinutes: template.shortBreakMinutes, longBreakMinutes: template.longBreakMinutes, sessions: template.sessions, icon: template.icon, color: template.color }
}

function EditorPreview({ draft }: { draft: Draft }) {
  const rows: { label: string; minutes: number; kind: 'focus' | 'break' | 'long' }[] = []
  for (let i = 0; i < Math.min(draft.sessions, 4); i++) {
    rows.push({ label: `Focus ${i + 1}`, minutes: draft.focusMinutes, kind: 'focus' })
    if (i < draft.sessions - 1) rows.push({ label: 'Break', minutes: draft.shortBreakMinutes, kind: 'break' })
  }
  if (draft.sessions > 1 && draft.longBreakMinutes > 0) rows.push({ label: 'Long break', minutes: draft.longBreakMinutes, kind: 'long' })
  const total = draft.sessions * draft.focusMinutes + Math.max(0, draft.sessions - 1) * draft.shortBreakMinutes
  return (
    <div className="rounded-xl border border-border bg-surface2 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">Preview</p>
      <div className="mt-3 space-y-1.5">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className={row.kind === 'focus' ? 'text-white' : 'text-muted'}>{row.minutes}:00 {row.label.toLowerCase()}</span>
            {i < rows.length - 1 && <span className="text-muted">↓</span>}
          </div>
        ))}
        {draft.sessions > 4 && <p className="text-xs text-muted">…repeats for {draft.sessions} focus sessions</p>}
      </div>
      <p className="mt-3 text-xs text-muted">{total} min total focus · {draft.sessions} sessions</p>
    </div>
  )
}

export function TemplatesManager({ templates, setTemplates }: { templates: StudyTemplate[]; setTemplates: (fn: (prev: StudyTemplate[]) => StudyTemplate[]) => void }) {
  const [draft, setDraft] = useState<Draft | null>(null)

  const saveDraft = () => {
    if (!draft || !draft.name.trim()) return
    const cleaned: StudyTemplate = {
      id: draft.id ?? uid(),
      name: draft.name.trim(),
      description: draft.description.trim() || 'Custom study template.',
      focusMinutes: Math.max(1, draft.focusMinutes),
      shortBreakMinutes: Math.max(0, draft.shortBreakMinutes),
      longBreakMinutes: Math.max(0, draft.longBreakMinutes),
      sessions: Math.max(1, draft.sessions),
      subjectId: null,
      icon: draft.icon,
      color: draft.color,
      isDefault: false,
    }
    setTemplates((prev) => (draft.id ? prev.map((t) => (t.id === draft.id ? { ...cleaned, isDefault: t.isDefault } : t)) : [...prev, cleaned]))
    setDraft(null)
  }

  const remove = (template: StudyTemplate) => {
    if (template.isDefault && templates.filter((t) => t.isDefault).length <= 1) return
    if (!window.confirm(`Delete “${template.name}”?`)) return
    setTemplates((prev) => prev.filter((t) => t.id !== template.id))
  }

  const setAsDefault = (id: string) => setTemplates((prev) => prev.map((t) => ({ ...t, isDefault: t.id === id })))

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">Templates control the timer rhythm. The default template is used when starting a session; templates can also be picked per session.</p>
        <div className="flex gap-2">
          <button onClick={() => setDraft(emptyDraft())} className="focus-ring flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-black"><Plus size={15} /> Create template</button>
          <button onClick={() => setTemplates((prev) => restoreDefaultTemplates(prev))} title="Restore missing default templates" className="focus-ring flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted hover:text-white"><RotateCcw size={15} /> Restore defaults</button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => {
          const Icon = TEMPLATE_ICONS[template.icon] ?? Zap
          return (
            <div key={template.id} className={classNames('rounded-xl border p-4', template.isDefault ? 'border-accent/40 bg-accent/5' : 'border-border bg-surface2')}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `rgb(${template.color} / 0.15)`, color: `rgb(${template.color})` }}><Icon size={16} /></span>
                  <div>
                    <p className="flex items-center gap-1.5 font-medium">{template.name}{template.isDefault && <Star size={12} className="text-accent" fill="currentColor" />}</p>
                    <p className="text-xs text-muted">{template.focusMinutes} min focus · {template.shortBreakMinutes} min break</p>
                  </div>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 min-h-8 text-xs text-muted">{template.description}</p>
              <p className="mt-1 text-xs text-muted">{template.sessions} sessions{template.longBreakMinutes > 0 && template.sessions > 1 ? ` · ${template.longBreakMinutes} min long break` : ''}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {!template.isDefault ? (
                  <button onClick={() => setAsDefault(template.id)} className="rounded-md border border-border px-2 py-1 text-[11px] text-muted hover:text-accent">Set default</button>
                ) : (
                  <span className="rounded-md bg-accent/15 px-2 py-1 text-[11px] text-accent">Default</span>
                )}
                <button onClick={() => setDraft(fromTemplate(template))} className="rounded-md border border-border px-2 py-1 text-[11px] text-muted hover:text-white">Edit</button>
                <button onClick={() => setTemplates((prev) => [...prev, duplicateTemplate(template)])} className="rounded-md border border-border px-2 py-1 text-[11px] text-muted hover:text-white">Duplicate</button>
                <button
                  onClick={() => remove(template)}
                  disabled={template.isDefault && templates.filter((t) => t.isDefault).length <= 1}
                  title={template.isDefault && templates.filter((t) => t.isDefault).length <= 1 ? 'Choose another default first' : undefined}
                  className="rounded-md border border-border px-2 py-1 text-[11px] text-muted hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                >Delete</button>
                {isBuiltinTemplate(template.id) && <span className="ml-auto text-[10px] uppercase tracking-wider text-muted">built-in</span>}
              </div>
            </div>
          )
        })}
      </div>

      {draft && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={() => setDraft(null)}>
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-surface p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold">{draft.id ? 'Edit template' : 'Create template'}</h3>
            <div className="mt-4 space-y-3">
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Template name" className="focus-ring w-full rounded-lg border border-border bg-surface2 px-3 py-2 text-sm" />
              <input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Description (optional)" className="focus-ring w-full rounded-lg border border-border bg-surface2 px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {([
                  ['Focus (min)', 'focusMinutes'],
                  ['Short break', 'shortBreakMinutes'],
                  ['Long break', 'longBreakMinutes'],
                  ['Sessions', 'sessions'],
                ] as const).map(([label, key]) => (
                  <label key={key} className="block text-xs text-muted">
                    {label}
                    <input type="number" min={key === 'shortBreakMinutes' || key === 'longBreakMinutes' ? 0 : 1} value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: Number(e.target.value) })} className="focus-ring mt-1 w-full rounded-lg border border-border bg-surface2 px-2 py-1.5 text-sm text-white" />
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted">Icon</span>
                {Object.entries(TEMPLATE_ICONS).map(([key, Icon]) => (
                  <button key={key} onClick={() => setDraft({ ...draft, icon: key })} className={classNames('rounded-lg border p-2', draft.icon === key ? 'border-accent text-accent' : 'border-border text-muted hover:text-white')}><Icon size={15} /></button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted">Color</span>
                {TEMPLATE_COLORS.map((color) => (
                  <button key={color} onClick={() => setDraft({ ...draft, color })} aria-label={`Color ${color}`} className={classNames('h-7 w-7 rounded-full border-2', draft.color === color ? 'border-white' : 'border-transparent')} style={{ backgroundColor: `rgb(${color})` }} />
                ))}
              </div>
              <EditorPreview draft={draft} />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setDraft(null)} className="rounded-lg border border-border px-4 py-2 text-sm text-muted">Cancel</button>
              <button onClick={saveDraft} disabled={!draft.name.trim()} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black disabled:opacity-40">{draft.id ? 'Save changes' : 'Create template'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function defaultTemplateOrDefault(templates: StudyTemplate[]): StudyTemplate | undefined {
  return templates.find((t) => t.isDefault) ?? templates[0] ?? DEFAULT_TEMPLATES[0]
}
