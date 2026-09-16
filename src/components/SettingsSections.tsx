import type { ChangeEvent, ReactNode } from 'react'
import { Download, Upload, User } from 'lucide-react'
import type { NotificationSettings, Page, PlannerSettings, Settings, StudySettings, StudySession, StudyTemplate, Subject, Task } from '../types'
import { exportAllData, importAllData } from '../lib/storage'
import { SubjectsPage } from './FeatureViews'
import { TemplatesManager } from './TemplatesManager'

export function SettingGroup({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="rounded-2xl border border-border bg-surface p-card"><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm text-muted">{description}</p><div className="mt-4 divide-y divide-border">{children}</div></section>
}

export function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <span className="min-w-0"><span className="block">{label}</span>{hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}</span>
      <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-surface2 border border-border'}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${checked ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  )
}

export function NumberSetting({ label, hint, value, onChange, suffix = 'minutes', min = 1, max = 720, step = 1 }: { label: string; hint?: string; value: number; onChange: (v: number) => void; suffix?: string; min?: number; max?: number; step?: number }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <span className="min-w-0"><span className="block">{label}</span>{hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}</span>
      <span className="flex shrink-0 items-center gap-2">
        <button onClick={() => onChange(Math.max(min, value - step))} aria-label={`Decrease ${label}`} className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted hover:text-white">−</button>
        <input type="number" min={min} max={max} value={value} onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value))))} className="focus-ring w-16 rounded-lg border border-border bg-surface2 px-2 py-1.5 text-right" />
        <button onClick={() => onChange(Math.min(max, value + step))} aria-label={`Increase ${label}`} className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted hover:text-white">+</button>
        <span className="w-14 text-xs text-muted">{suffix}</span>
      </span>
    </div>
  )
}

export function SelectSetting<T extends string>({ label, hint, value, options, onChange }: { label: string; hint?: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 py-3 text-sm">
      <span className="min-w-0"><span className="block">{label}</span>{hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)} className="shrink-0 rounded-lg border border-border bg-surface2 px-2 py-1.5">{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
    </label>
  )
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function DayPicker({ label, value, onChange }: { label: string; value: number[]; onChange: (days: number[]) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <span>{label}</span>
      <span className="flex gap-1">
        {WEEKDAYS.map((day, index) => {
          const active = value.includes(index)
          return <button key={index} onClick={() => onChange(active ? value.filter((d) => d !== index) : [...value, index].sort())} aria-pressed={active} aria-label={`${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][index]} ${active ? 'on' : 'off'}`} className={`h-8 w-8 rounded-lg border text-xs ${active ? 'border-accent bg-accent/15 text-accent' : 'border-border text-muted hover:text-white'}`}>{day}</button>
        })}
      </span>
    </div>
  )
}

export interface SettingsSectionsProps {
  settings: Settings
  setSettings: (fn: (prev: Settings) => Settings) => void
  study: StudySettings
  setStudy: (fn: (prev: StudySettings) => StudySettings) => void
  plannerSettings: PlannerSettings
  setPlannerSettings: (fn: (prev: PlannerSettings) => PlannerSettings) => void
  notifications: NotificationSettings
  setNotifications: (fn: (prev: NotificationSettings) => NotificationSettings) => void
  templates: StudyTemplate[]
  setTemplates: (fn: (prev: StudyTemplate[]) => StudyTemplate[]) => void
  subjects: Subject[]
  setSubjects: (fn: (p: Subject[]) => Subject[]) => void
  sessions: StudySession[]
  tasks: Task[]
  onReset: () => void
}

export function SettingsSections({ settings, setSettings, study, setStudy, plannerSettings, setPlannerSettings, notifications, setNotifications, templates, setTemplates, subjects, setSubjects, sessions, tasks, onReset }: SettingsSectionsProps) {
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings((p) => ({ ...p, [key]: value }))

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <SettingGroup title="General" description="Personalize your workspace.">
        <SelectSetting label="Language" hint="Coming soon — Studia currently ships in English." value="en" options={[{ value: 'en', label: 'English' }]} onChange={() => undefined} />
        <SelectSetting label="Theme" value={settings.theme} options={[{ value: 'dark' as const, label: 'Dark' }, { value: 'light' as const, label: 'Light' }, { value: 'system' as const, label: 'System' }]} onChange={(v) => update('theme', v)} />
        <SelectSetting label="Layout density" value={settings.layout} options={[{ value: 'comfortable' as const, label: 'Comfortable' }, { value: 'compact' as const, label: 'Compact' }]} onChange={(v) => update('layout', v)} />
        <SelectSetting label="Start page" value={settings.startPage} options={[{ value: 'dashboard' as const, label: 'Dashboard' }, { value: 'tasks' as const, label: 'Tasks' }, { value: 'planner' as const, label: 'Smart Planner' }, { value: 'calendar' as const, label: 'Calendar' }, { value: 'notes' as const, label: 'Notes' }, { value: 'analytics' as const, label: 'Statistics' }, { value: 'settings' as const, label: 'Settings' }]} onChange={(v) => update('startPage', v)} />
        <Toggle label="Confirm before deleting data" checked={settings.confirmBeforeDelete} onChange={(v) => update('confirmBeforeDelete', v)} />
        <Toggle label="Show Notes tab" checked={settings.showNotesTab} onChange={(v) => update('showNotesTab', v)} />
      </SettingGroup>

      <SettingGroup title="Timer" description="These durations set the timer when no template overrides them. Picking a template replaces focus/break lengths for that session.">
        <SelectSetting label="Default template" hint="Used by the timer on the dashboard." value={templates.find((t) => t.isDefault)?.id ?? ''} options={templates.map((t) => ({ value: t.id, label: t.name }))} onChange={(id) => setTemplates((prev) => prev.map((t) => ({ ...t, isDefault: t.id === id })))} />
        <NumberSetting label="Focus duration" value={settings.focusDuration} onChange={(v) => update('focusDuration', v)} />
        <NumberSetting label="Short break" value={settings.shortBreakDuration} onChange={(v) => update('shortBreakDuration', v)} />
        <NumberSetting label="Long break" value={settings.longBreakDuration} onChange={(v) => update('longBreakDuration', v)} />
        <NumberSetting label="Sessions before long break" suffix="sessions" value={settings.longBreakInterval} onChange={(v) => update('longBreakInterval', v)} />
        <Toggle label="Auto-start breaks" checked={settings.autoStartBreaks} onChange={(v) => update('autoStartBreaks', v)} />
        <Toggle label="Auto-start focus sessions" checked={settings.autoStartFocus} onChange={(v) => update('autoStartFocus', v)} />
        <Toggle label="Completion sound" checked={settings.soundEnabled} onChange={(v) => update('soundEnabled', v)} />
        <SelectSetting label="Sound" value={settings.soundChoice} options={[{ value: 'chime' as const, label: 'Chime' }, { value: 'bell' as const, label: 'Bell' }, { value: 'digital' as const, label: 'Digital' }]} onChange={(v) => update('soundChoice', v)} />
        <NumberSetting label="Volume" suffix="%" min={0} max={100} value={settings.soundVolume} onChange={(v) => update('soundVolume', v)} />
        <Toggle label="Browser notifications" hint="Asks for permission the first time you start a timer." checked={settings.notificationsEnabled} onChange={(v) => update('notificationsEnabled', v)} />
      </SettingGroup>

      <SettingGroup title="Study" description="Goals and the defaults used by the planner and daily plan.">
        <NumberSetting label="Daily study goal" value={study.dailyGoalMinutes} onChange={(v) => setStudy((p) => ({ ...p, dailyGoalMinutes: v }))} />
        <NumberSetting label="Weekly study goal" suffix="minutes" value={study.weeklyGoalMinutes} onChange={(v) => setStudy((p) => ({ ...p, weeklyGoalMinutes: v }))} />
        <NumberSetting label="Default study session length" value={study.defaultSessionMinutes} onChange={(v) => setStudy((p) => ({ ...p, defaultSessionMinutes: v }))} />
        <DayPicker label="Preferred study days" value={study.preferredStudyDays} onChange={(days) => setStudy((p) => ({ ...p, preferredStudyDays: days }))} />
        <NumberSetting label="Preferred start hour" suffix=":00" min={0} max={23} value={study.preferredStartHour} onChange={(v) => setStudy((p) => ({ ...p, preferredStartHour: v }))} />
        <NumberSetting label="Preferred end hour" suffix=":00" min={1} max={24} value={study.preferredEndHour} onChange={(v) => setStudy((p) => ({ ...p, preferredEndHour: v }))} />
      </SettingGroup>

      <SettingGroup title="Study templates" description="Reusable session presets. The default template drives the dashboard timer; planners use it when launching sessions.">
        <div className="py-3"><TemplatesManager templates={templates} setTemplates={setTemplates} /></div>
      </SettingGroup>

      <SettingGroup title="Smart planner" description="How automatic study plans distribute sessions.">
        <SelectSetting label="Planning style" value={plannerSettings.planningStyle} options={[{ value: 'balanced' as const, label: 'Balanced — even daily load' }, { value: 'exam-focused' as const, label: 'Exam-focused — front-load work' }]} onChange={(v) => setPlannerSettings((p) => ({ ...p, planningStyle: v }))} />
        <NumberSetting label="Daily maximum study time" suffix="minutes" max={720} value={plannerSettings.dailyMaxMinutes} onChange={(v) => setPlannerSettings((p) => ({ ...p, dailyMaxMinutes: v }))} />
        <NumberSetting label="Minimum session length" suffix="minutes" max={120} value={plannerSettings.minSessionMinutes} onChange={(v) => setPlannerSettings((p) => ({ ...p, minSessionMinutes: v }))} />
        <NumberSetting label="Preferred session length" suffix="minutes" max={240} value={plannerSettings.preferredSessionMinutes} onChange={(v) => setPlannerSettings((p) => ({ ...p, preferredSessionMinutes: v }))} />
        <NumberSetting label="Preferred start hour" suffix=":00" min={0} max={23} value={plannerSettings.preferredStartHour} onChange={(v) => setPlannerSettings((p) => ({ ...p, preferredStartHour: v }))} />
        <Toggle label="Include weekends" checked={plannerSettings.includeWeekends} onChange={(v) => setPlannerSettings((p) => ({ ...p, includeWeekends: v }))} />
        <Toggle label="Include school days" hint="Weekdays are also study days." checked={plannerSettings.includeSchoolDays} onChange={(v) => setPlannerSettings((p) => ({ ...p, includeSchoolDays: v }))} />
        <Toggle label="Automatically reschedule missed sessions" hint="When a plan is opened, missed sessions are redistributed." checked={plannerSettings.autoReschedule} onChange={(v) => setPlannerSettings((p) => ({ ...p, autoReschedule: v }))} />
        <Toggle label="Include review sessions before exams" checked={plannerSettings.includeReviewSessions} onChange={(v) => setPlannerSettings((p) => ({ ...p, includeReviewSessions: v }))} />
      </SettingGroup>

      <SettingGroup title="Notifications" description="Each kind of reminder is controlled separately.">
        <Toggle label="Timer finished" checked={notifications.timerNotifications} onChange={(v) => setNotifications((p) => ({ ...p, timerNotifications: v }))} />
        <Toggle label="Break finished" checked={notifications.breakNotifications} onChange={(v) => setNotifications((p) => ({ ...p, breakNotifications: v }))} />
        <Toggle label="Exam reminders" hint="Exams within 7 days get a dashboard nudge." checked={notifications.examReminders} onChange={(v) => setNotifications((p) => ({ ...p, examReminders: v }))} />
        <Toggle label="Task reminders" checked={notifications.taskReminders} onChange={(v) => setNotifications((p) => ({ ...p, taskReminders: v }))} />
        <Toggle label="Planner reminders" checked={notifications.plannerReminders} onChange={(v) => setNotifications((p) => ({ ...p, plannerReminders: v }))} />
      </SettingGroup>

      <SettingGroup title="Subjects" description="Manage the subjects available to the timer, tasks and plans. New task subjects are added here automatically.">
        <div className="py-3"><SubjectsPage subjects={subjects} setSubjects={setSubjects} tasks={tasks} sessions={sessions} exams={[]} compact /></div>
      </SettingGroup>

      <SettingGroup title="Your data" description="Back up or clear local Studia data. Everything is stored in your browser.">
        <div className="flex flex-wrap gap-2 py-3">
          <button onClick={() => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([exportAllData()], { type: 'application/json' })); a.download = 'studia-backup.json'; a.click() }} className="focus-ring flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"><Download size={15} /> Export data</button>
          <label className="focus-ring flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"><Upload size={15} /> Import data<input type="file" accept="application/json" className="hidden" onChange={(e: ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { importAllData(String(reader.result)); window.location.reload() } catch { window.alert('That file is not a valid Studia backup.') } }; reader.readAsText(file) }} /></label>
          <button onClick={() => { if (window.confirm('Reset all Studia data? This cannot be undone.')) onReset() }} className="focus-ring flex items-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-400">Reset local data</button>
        </div>
      </SettingGroup>

      <SettingGroup title="Account" description="Studia runs locally for now. Accounts and cloud sync are coming later.">
        <div className="flex items-center gap-3 py-4 text-sm text-muted"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface2"><User size={18} /></span><span>Local account — no sign-in yet.<br /><span className="text-xs">Supabase sync will slot in here without changing this page.</span></span></div>
      </SettingGroup>
    </div>
  )
}

export type { Page }
