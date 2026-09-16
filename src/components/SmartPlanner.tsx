import { useMemo, useState } from 'react'
import { CalendarClock, Check, ChevronDown, ChevronUp, Clock3, Play, Plus, RefreshCcw, Trash2, TriangleAlert, X } from 'lucide-react'
import type { PlanSessionType, PlannerSettings, StudyPlan2, StudyTemplate, Subject, Task } from '../types'
import { generatePlan, planProgress, rescheduleMissed, daysUntil } from '../lib/planner'
import { todayISO } from '../lib/utils'
import { classNames } from '../lib/utils'
import { formatMinutes } from '../lib/utils'

const TYPE_LABEL: Record<PlanSessionType, string> = {
  learning: 'Learning',
  practice: 'Practice',
  revision: 'Revision',
  flashcards: 'Flashcards',
  'mock-exam': 'Mock exam',
}

interface CreateDraft {
  name: string
  subjectId: string
  examDate: string
  topicCount: number
  difficulty: StudyPlan2['difficulty']
  totalMinutes: number
}

function CreatePlanForm({ subjects, settings, template, onCreate, onShortfall }: { subjects: Subject[]; settings: PlannerSettings; template: StudyTemplate | undefined; onCreate: (plan: StudyPlan2) => void; onShortfall: (message: string) => void }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<CreateDraft>({ name: '', subjectId: '', examDate: '', topicCount: 6, difficulty: 'medium', totalMinutes: 600 })

  const submit = () => {
    if (!draft.name.trim() || !draft.examDate) return
    const topics = Array.from({ length: Math.max(0, draft.topicCount) }, (_, i) => `Chapter ${i + 1}`)
    const { plan, shortfallMinutes, availableMinutes } = generatePlan({ name: draft.name.trim(), subjectId: draft.subjectId || null, examDate: draft.examDate, topics, difficulty: draft.difficulty, totalMinutes: draft.totalMinutes, settings, template })
    onCreate(plan)
    if (shortfallMinutes > 0) {
      onShortfall(`Your schedule has ${formatMinutes(draft.totalMinutes)} of required study, but only ${formatMinutes(availableMinutes)} are available before the exam — ${formatMinutes(shortfallMinutes)} couldn’t be scheduled. Consider increasing your daily study limit or reducing the workload.`)
    }
    setDraft({ name: '', subjectId: '', examDate: '', topicCount: 6, difficulty: 'medium', totalMinutes: 600 })
    setOpen(false)
  }

  if (!open) return <button onClick={() => setOpen(true)} className="focus-ring flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-black"><Plus size={16} /> Create study plan</button>
  return (
    <div className="w-full rounded-2xl border border-border bg-surface p-card">
      <h3 className="font-semibold">New study plan</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-muted sm:col-span-2">Subject / plan name
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Biology — Cell biology" className="focus-ring mt-1 w-full rounded-lg border border-border bg-surface2 px-3 py-2 text-sm text-white" />
        </label>
        <label className="text-xs text-muted">Subject (optional)
          <select value={draft.subjectId} onChange={(e) => setDraft({ ...draft, subjectId: e.target.value })} className="focus-ring mt-1 w-full rounded-lg border border-border bg-surface2 px-3 py-2 text-sm text-white"><option value="">None</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        </label>
        <label className="text-xs text-muted">Exam date
          <input type="date" value={draft.examDate} min={todayISO()} onChange={(e) => setDraft({ ...draft, examDate: e.target.value })} className="focus-ring mt-1 w-full rounded-lg border border-border bg-surface2 px-3 py-2 text-sm text-white" />
        </label>
        <label className="text-xs text-muted">Topics / chapters
          <input type="number" min={0} max={40} value={draft.topicCount} onChange={(e) => setDraft({ ...draft, topicCount: Number(e.target.value) })} className="focus-ring mt-1 w-full rounded-lg border border-border bg-surface2 px-3 py-2 text-sm text-white" />
        </label>
        <label className="text-xs text-muted">Difficulty
          <select value={draft.difficulty} onChange={(e) => setDraft({ ...draft, difficulty: e.target.value as StudyPlan2['difficulty'] })} className="focus-ring mt-1 w-full rounded-lg border border-border bg-surface2 px-3 py-2 text-sm capitalize text-white"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>
        </label>
        <label className="text-xs text-muted">Estimated total study time (min)
          <input type="number" min={30} step={30} value={draft.totalMinutes} onChange={(e) => setDraft({ ...draft, totalMinutes: Number(e.target.value) })} className="focus-ring mt-1 w-full rounded-lg border border-border bg-surface2 px-3 py-2 text-sm text-white" />
        </label>
        <p className="self-end text-xs text-muted sm:col-span-2">The planner spreads sessions across available days up to the exam, reserving the last days for revision and a practice test, and never schedules more than your daily maximum ({formatMinutes(settings.dailyMaxMinutes)}/day).</p>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={() => setOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-muted">Cancel</button>
        <button onClick={submit} disabled={!draft.name.trim() || !draft.examDate} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black disabled:opacity-40">Generate schedule</button>
      </div>
    </div>
  )
}

function PlanCard({ plan, subject, onOpen }: { plan: StudyPlan2; subject: Subject | undefined; onOpen: () => void }) {
  const progress = planProgress(plan)
  const days = daysUntil(plan.examDate)
  return (
    <div className="rounded-2xl border border-border bg-surface p-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{plan.name}</h3>
          <p className="mt-0.5 text-sm text-muted">Exam {plan.examDate} · {days} days remaining{subject ? ` · ${subject.name}` : ''}</p>
        </div>
        <span className="rounded-lg bg-accent/15 px-2.5 py-1 text-xs text-accent">{progress.percent}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface2"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress.percent}%` }} /></div>
      <p className="mt-2 text-xs text-muted">{formatMinutes(progress.doneMinutes)} / {formatMinutes(progress.totalMinutes)} studied · {formatMinutes(progress.remainingMinutes)} left</p>
      {plan.shortfallMinutes > 0 && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-400"><TriangleAlert size={13} className="mt-0.5 shrink-0" /> {formatMinutes(plan.shortfallMinutes)} couldn’t be scheduled — raise your daily limit or trim the workload.</p>
      )}
      <button onClick={onOpen} className="focus-ring mt-3 w-full rounded-xl border border-border py-2 text-sm text-muted hover:bg-surface2 hover:text-white">View plan</button>
    </div>
  )
}

function SessionRow({ session, subject, onStart, onToggle, onDelete, onRescheduleOne }: { session: StudyPlan2['sessions'][number]; subject: Subject | undefined; onStart: () => void; onToggle: () => void; onDelete: () => void; onRescheduleOne: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const missed = !session.completed && session.date < todayISO()
  return (
    <div className={classNames('rounded-xl border p-3 text-sm', missed ? 'border-amber-500/30 bg-amber-500/5' : 'border-border bg-surface2')}>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={onToggle} aria-label={session.completed ? 'Mark incomplete' : 'Mark complete'} className={classNames('flex h-5 w-5 shrink-0 items-center justify-center rounded border', session.completed ? 'border-accent bg-accent' : 'border-border hover:border-accent')}>{session.completed && <Check size={13} className="text-black" />}</button>
        <span className={classNames('font-medium', session.completed && 'text-muted line-through')}>{session.topic}</span>
        <span className="rounded-md bg-accent/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-accent">{TYPE_LABEL[session.type]}</span>
        {missed && <span className="text-[10px] uppercase tracking-wider text-amber-400">missed</span>}
        <span className="ml-auto text-xs text-muted">{session.date} · {session.time} · {session.durationMinutes} min</span>
        <button onClick={() => setExpanded(!expanded)} className="text-muted hover:text-white" aria-label="Session actions">{expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button>
      </div>
      {expanded && (
        <div className="mt-2 flex flex-wrap gap-2 border-t border-border pt-2">
          <button onClick={onStart} className="flex items-center gap-1.5 rounded-lg bg-accent px-2.5 py-1.5 text-xs font-medium text-black"><Play size={12} /> Start</button>
          <button onClick={onRescheduleOne} className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted hover:text-white"><CalendarClock size={12} /> Move to next free day</button>
          <button onClick={onDelete} className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted hover:text-red-400"><Trash2 size={12} /> Delete</button>
          {subject && <span className="ml-auto self-center text-xs text-muted">{subject.name}</span>}
        </div>
      )}
    </div>
  )
}

function PlanDetail({ plan, setPlans, subjects, settings, onStart, onBack }: { plan: StudyPlan2; setPlans: (fn: (prev: StudyPlan2[]) => StudyPlan2[]) => void; subjects: Subject[]; settings: PlannerSettings; onStart: (session: StudyPlan2['sessions'][number], plan: StudyPlan2) => void; onBack: () => void }) {
  const progress = planProgress(plan)
  const subject = subjects.find((s) => s.id === plan.subjectId)
  const [rescheduleNote, setRescheduleNote] = useState('')

  const grouped = useMemo(() => {
    const map = new Map<string, StudyPlan2['sessions']>()
    plan.sessions.forEach((session) => {
      const list = map.get(session.date) ?? []
      list.push(session)
      map.set(session.date, list)
    })
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [plan.sessions])

  const update = (fn: (plan: StudyPlan2) => StudyPlan2) => setPlans((prev) => prev.map((p) => (p.id === plan.id ? fn(p) : p)))

  const rescheduleAll = () => {
    const result = rescheduleMissed(plan, settings)
    update((p) => ({ ...p, sessions: result.sessions }))
    setRescheduleNote(result.movedCount ? `You missed ${formatMinutes(result.movedMinutes)}. We've redistributed it across the next ${result.daysUsed} available study day${result.daysUsed === 1 ? '' : 's'}.` : 'Nothing to reschedule — no missed sessions.')
    window.setTimeout(() => setRescheduleNote(''), 6000)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={onBack} className="focus-ring rounded-lg border border-border px-3 py-2 text-sm text-muted hover:text-white">← All plans</button>
        <div className="flex gap-2">
          <button onClick={rescheduleAll} className="focus-ring flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted hover:text-white"><RefreshCcw size={14} /> Reschedule missed sessions</button>
          <button onClick={() => { if (window.confirm(`Delete plan “${plan.name}”?`)) { setPlans((prev) => prev.filter((p) => p.id !== plan.id)); onBack() } }} className="focus-ring flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-400"><Trash2 size={14} /> Delete plan</button>
        </div>
      </div>

      {rescheduleNote && <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">{rescheduleNote}</div>}

      <div className="rounded-2xl border border-border bg-surface p-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{plan.name}</h2>
            <p className="text-sm text-muted">Exam {plan.examDate} · {daysUntil(plan.examDate)} days remaining</p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-xs text-muted">Required</p><p className="font-semibold">{formatMinutes(progress.totalMinutes)}</p></div>
            <div><p className="text-xs text-muted">Completed</p><p className="font-semibold text-accent">{formatMinutes(progress.doneMinutes)}</p></div>
            <div><p className="text-xs text-muted">Remaining</p><p className="font-semibold">{formatMinutes(progress.remainingMinutes)}</p></div>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface2"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress.percent}%` }} /></div>
        <p className="mt-2 text-xs text-muted">{progress.percent}% complete · {plan.topics.length} topics · {plan.sessions.filter((s) => s.completed).length}/{plan.sessions.length} sessions done</p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-card">
        <h3 className="font-semibold">Schedule</h3>
        <div className="mt-4 space-y-4">
          {grouped.map(([date, sessionsForDay]) => {
            const dayMinutes = sessionsForDay.reduce((n, s) => n + s.durationMinutes, 0)
            const label = date === todayISO() ? 'Today' : date
            return (
              <div key={date}>
                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted"><Clock3 size={12} /> {label} · {formatMinutes(dayMinutes)}</div>
                <div className="space-y-2">
                  {sessionsForDay.map((session) => (
                    <SessionRow
                      key={session.id}
                      session={session}
                      subject={subject}
                      onStart={() => onStart(session, plan)}
                      onToggle={() => update((p) => ({ ...p, sessions: p.sessions.map((s) => (s.id === session.id ? { ...s, completed: !s.completed } : s)) }))}
                      onDelete={() => update((p) => ({ ...p, sessions: p.sessions.filter((s) => s.id !== session.id) }))}
                      onRescheduleOne={() => {
                        const target = plan.sessions.filter((s) => s.id !== session.id && !s.completed && s.date >= todayISO() && s.date < plan.examDate).map((s) => s.date)
                        const load = new Map<string, number>()
                        target.forEach((d) => load.set(d, (load.get(d) ?? 0) + plan.sessions.filter((s) => s.date === d && !s.completed).reduce((n, s) => n + s.durationMinutes, 0)))
                        let cursor = todayISO()
                        let placed: string | null = null
                        for (let i = 0; i < 365; i++) {
                          const used = load.get(cursor) ?? 0
                          if (cursor < plan.examDate && used + session.durationMinutes <= settings.dailyMaxMinutes) { placed = cursor; break }
                          const next = new Date(`${cursor}T12:00:00`); next.setDate(next.getDate() + 1); cursor = next.toISOString().slice(0, 10)
                        }
                        if (placed) update((p) => ({ ...p, sessions: p.sessions.map((s) => (s.id === session.id ? { ...s, date: placed!, time: s.time } : s)) }))
                        else setRescheduleNote('No free day found before the exam within your daily maximum.')
                      }}
                    />
                  ))}
                </div>
              </div>
            )
          })}
          {!plan.sessions.length && <p className="py-6 text-center text-sm text-muted">No sessions in this plan yet.</p>}
        </div>
      </div>
    </div>
  )
}

export function SmartPlanner({ plans, setPlans, subjects, tasks, settings, template, onStartSession }: { plans: StudyPlan2[]; setPlans: (fn: (prev: StudyPlan2[]) => StudyPlan2[]) => void; subjects: Subject[]; tasks: Task[]; settings: PlannerSettings; template: StudyTemplate | undefined; onStartSession: (session: { topic: string; durationMinutes: number; type: PlanSessionType }, plan: StudyPlan2) => void }) {
  const [openPlanId, setOpenPlanId] = useState<string | null>(null)
  const [shortfallNote, setShortfallNote] = useState('')
  void tasks
  const openPlan = plans.find((p) => p.id === openPlanId)
  if (openPlan) return <PlanDetail plan={openPlan} setPlans={setPlans} subjects={subjects} settings={settings} onStart={(session, plan) => onStartSession(session, plan)} onBack={() => setOpenPlanId(null)} />
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Smart Study Planner</h2>
          <p className="mt-1 text-sm text-muted">Plan your studying around your exams and deadlines.</p>
        </div>
        <CreatePlanForm subjects={subjects} settings={settings} template={template} onCreate={(plan) => setPlans((prev) => [...prev, plan])} onShortfall={setShortfallNote} />
      </div>
      {shortfallNote && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300"><TriangleAlert size={16} className="mt-0.5 shrink-0" /><span className="flex-1">{shortfallNote}</span><button onClick={() => setShortfallNote('')} aria-label="Dismiss" className="text-amber-300/70 hover:text-amber-300"><X size={15} /></button></div>
      )}
      {plans.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...plans].sort((a, b) => a.examDate.localeCompare(b.examDate)).map((plan) => (
            <PlanCard key={plan.id} plan={plan} subject={subjects.find((s) => s.id === plan.subjectId)} onOpen={() => setOpenPlanId(plan.id)} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-card py-14 text-center">
          <CalendarClock size={28} className="mx-auto text-muted" />
          <p className="mt-3 font-medium">No study plans yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">Create a plan around an exam and Studia will spread the topics over the days you have left, reserving time for revision.</p>
        </div>
      )}
    </div>
  )
}
