import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { BarChart3, CalendarDays, Check, Clock3, Command, Edit3, Flame, Menu, Play, Plus, Search, Settings2, Target, Trash2, X } from 'lucide-react'
import type { DailyGoal, Exam, Goal, NotificationSettings, Page, PlannedSession, PlannerSettings, Settings, StudyPlan2, StudySession, StudySettings, StudyTemplate, Subject, Task } from './types'
import { DEFAULT_NOTIFICATION_SETTINGS, DEFAULT_PLANNER_SETTINGS, DEFAULT_SETTINGS, DEFAULT_STUDY_SETTINGS } from './types'
import { useStored, resetAllData, uid } from './lib/storage'
import { formatDate, formatMinutes, formatTimeOfDay, todayISO } from './lib/utils'
import { useTimer } from './lib/useTimer'
import { Sidebar, MobileNav } from './components/Sidebar'
import { Timer } from './components/Timer'
import { StatCards } from './components/StatCards'
import { StudyPlan } from './components/StudyPlan'
import { ToastProvider, useToast } from './components/Toast'
import { CalendarPage, FocusMode, NotesPage, StatisticsPage, TasksPage } from './components/FeatureViews'
import { SettingsSections } from './components/SettingsSections'
import { SmartPlanner } from './components/SmartPlanner'
import { defaultTemplateOrDefault } from './components/TemplatesManager'
import type { Note } from './types'

const DEFAULT_GOAL: DailyGoal = { minutes: 120, updatedAt: new Date().toISOString() }
const COLORS = ['16 185 129', '56 189 248', '167 139 250', '251 146 60']

function DEFAULT_TEMPLATES_SEED(): StudyTemplate[] {
  return [
    { id: 'tpl-exam-prep', name: 'Exam Prep', description: 'Long focus blocks with generous breaks for intensive exam preparation.', focusMinutes: 50, shortBreakMinutes: 10, longBreakMinutes: 20, sessions: 3, icon: 'book', color: '16 185 129', isDefault: true },
    { id: 'tpl-homework', name: 'Homework', description: 'The classic Pomodoro rhythm for assignments and problem sets.', focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, sessions: 2, icon: 'pencil', color: '56 189 248', isDefault: false },
    { id: 'tpl-quick-revision', name: 'Quick Revision', description: 'Short, sharp review sessions when time is tight.', focusMinutes: 20, shortBreakMinutes: 5, longBreakMinutes: 15, sessions: 2, icon: 'zap', color: '251 146 60', isDefault: false },
    { id: 'tpl-deep-study', name: 'Deep Study', description: 'Extended deep-work sessions for difficult material.', focusMinutes: 60, shortBreakMinutes: 10, longBreakMinutes: 20, sessions: 3, icon: 'brain', color: '167 139 250', isDefault: false },
    { id: 'tpl-flashcards', name: 'Flashcard Review', description: 'Pomodoro-length rounds tuned for active recall practice.', focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, sessions: 2, icon: 'layers', color: '244 114 182', isDefault: false },
  ]
}

function AppContent() {
  const [settings, setSettings] = useStored<Settings>('settings', DEFAULT_SETTINGS)
  const [tasks, setTasks] = useStored<Task[]>('tasks', [])
  const [sessions, setSessions] = useStored<StudySession[]>('sessions', [])
  const [goals, setGoals] = useStored<Goal[]>('goals', [])
  const [subjects, setSubjects] = useStored<Subject[]>('subjects', [])
  const [dailyGoal, setDailyGoal] = useStored<DailyGoal>('daily-goal', DEFAULT_GOAL)
  const [exams, setExams] = useStored<Exam[]>('exams', [])
  const [planned, setPlanned] = useStored<PlannedSession[]>('planned-sessions', [])
  const [notes, setNotes] = useStored<Note[]>('notes', [])
  const [weeklyGoal, setWeeklyGoal] = useStored<number>('weekly-goal', 600)
  const [templates, setTemplates] = useStored<StudyTemplate[]>('templates', [])
  const [plans, setPlans] = useStored<StudyPlan2[]>('study-plans', [])
  const [plannerSettings, setPlannerSettings] = useStored<PlannerSettings>('planner-settings', DEFAULT_PLANNER_SETTINGS)
  const [notificationSettings, setNotificationSettings] = useStored<NotificationSettings>('notification-settings', DEFAULT_NOTIFICATION_SETTINGS)
  const [studySettings, setStudySettings] = useStored<StudySettings>('study-settings', DEFAULT_STUDY_SETTINGS)
  const [activeTemplateId, setActiveTemplateId] = useStored<string>('active-template', '')
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [page, setPage] = useState<Page>(settings.startPage)
  const [subjectId, setSubjectId] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [palette, setPalette] = useState(false)
  const toast = useToast()
  const currentSubject = subjects.find((s) => s.id === subjectId)

  // Ensure a default template exists on first run.
  useEffect(() => { if (!templates.length) setTemplates((prev) => (prev.length ? prev : DEFAULT_TEMPLATES_SEED())) }, [templates.length, setTemplates])
  const defaultTemplate = defaultTemplateOrDefault(templates)
  const activeTemplate = templates.find((t) => t.id === activeTemplateId) ?? defaultTemplate
  // Effective timer settings: active template durations override the base settings.
  const effectiveSettings: Settings = activeTemplate ? { ...settings, focusDuration: activeTemplate.focusMinutes, shortBreakDuration: activeTemplate.shortBreakMinutes, longBreakDuration: activeTemplate.longBreakMinutes || settings.longBreakDuration } : settings

  useEffect(() => { document.documentElement.style.setProperty('--accent', settings.accentColor) }, [settings.accentColor])
  const timer = useTimer(effectiveSettings, (type, minutes) => {
    const name = type === 'focus' ? currentSubject?.name || 'General focus' : type === 'short-break' ? 'Short break' : 'Long break'
    setSessions((previous) => [...previous, { id: uid(), type, taskId: type === 'focus' ? activeTask?.id || null : null, subject: name, subjectId: type === 'focus' ? subjectId || null : null, durationMinutes: minutes, startedAt: new Date(Date.now() - minutes * 60000).toISOString(), completedAt: new Date().toISOString() }])
    if (type === 'focus') {
      if (notificationSettings.timerNotifications) toast(`${name} session complete`)
      if (activeTemplate && !templates.some((t) => t.id === activeTemplateId)) setActiveTemplateId('')
    } else if (notificationSettings.breakNotifications) toast('Break complete')
  })

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const typing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setPalette(true); return }
      if (typing) return
      if (event.key === ' ') { event.preventDefault(); timer.isRunning ? timer.pause() : timer.start() }
      if (event.key.toLowerCase() === 'r') timer.reset()
      if (event.key.toLowerCase() === 's') timer.skip()
      if (event.key.toLowerCase() === 't') setPage('dashboard')
      if (event.key.toLowerCase() === 'n') { setPage('dashboard'); window.setTimeout(() => window.dispatchEvent(new CustomEvent('studia:add-task')), 0) }
      if (event.key === 'Escape') setPalette(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [timer])

  const navigate = (next: Page) => { setPage(next); setMobileOpen(false); setPalette(false) }
  const autoAddSubject = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setSubjects((list) => list.some((subject) => subject.name.toLowerCase() === trimmed.toLowerCase()) ? list : [...list, { id: uid(), name: trimmed, color: COLORS[list.length % COLORS.length], icon: 'book', createdAt: new Date().toISOString() }])
  }
  const addSubject = () => { const name = window.prompt('New subject name'); if (!name?.trim()) return; const next = { id: uid(), name: name.trim(), color: COLORS[subjects.length % COLORS.length], icon: 'book', createdAt: new Date().toISOString() }; setSubjects((list) => [...list, next]); setSubjectId(next.id) }
  const startPlannedSession = (session: { topic: string; durationMinutes: number; type: string }, plan: StudyPlan2) => {
    if (plan.subjectId) setSubjectId(plan.subjectId)
    setActiveTask(null)
    setPage('dashboard')
    // Defer until the dashboard timer is mounted and effective settings are applied.
    window.setTimeout(() => { timer.switchMode('focus'); timer.startFreshFocus() }, 60)
    toast(`Plan session started · ${session.topic}`)
  }
  const toggleTheme = () => setSettings((current) => ({ ...current, theme: current.theme === 'dark' ? 'light' : 'dark' }))
  const themeClass = settings.theme === 'light' ? 'light' : 'dark'
  void setWeeklyGoal
  return <div className={`${themeClass} ${settings.layout} min-h-screen bg-bg text-white`}>
    <div className="flex min-h-screen"><Sidebar page={page} onNavigate={navigate} isDark={themeClass === 'dark'} onToggleTheme={toggleTheme} showNotes={settings.showNotesTab} />
      <main className="min-w-0 flex-1 pb-20 md:pb-0"><header className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6 lg:px-10"><div className="flex items-center gap-3"><button onClick={() => setMobileOpen(true)} className="focus-ring rounded-lg p-2 text-muted hover:bg-surface2 md:hidden" aria-label="Open navigation"><Menu size={20} /></button><div><p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">Studia</p><h1 className="mt-0.5 text-lg font-semibold sm:text-xl">{pageTitle(page)}</h1></div></div><button onClick={() => setPalette(true)} className="focus-ring hidden items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:bg-surface2 sm:flex"><Command size={14} /> Search <kbd className="rounded bg-surface2 px-1.5 py-0.5">⌘K</kbd></button><div className="hidden items-center gap-2 text-sm text-muted lg:flex"><CalendarDays size={16} /> {formatDate(new Date())}</div></header>
        {mobileOpen && <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setMobileOpen(false)}><div className="h-full w-72 border-r border-border bg-surface p-4" onClick={(e) => e.stopPropagation()}><div className="mb-6 flex items-center justify-between"><span className="text-lg font-semibold">Studia</span><button onClick={() => setMobileOpen(false)} className="text-muted"><X size={20} /></button></div><MobileDrawer page={page} navigate={navigate} showNotes={settings.showNotesTab} /></div></div>}
        <div className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-10">{page === 'dashboard' && <Dashboard timer={timer} tasks={tasks} setTasks={setTasks} goals={goals} sessions={sessions} subjects={subjects} subjectId={subjectId} setSubjectId={setSubjectId} addSubject={addSubject} dailyGoal={dailyGoal} setDailyGoal={setDailyGoal} exams={exams} planned={planned} navigate={navigate} openFocus={() => setPage('focus')} activeTemplate={activeTemplate} templates={templates} onTemplateChange={(id) => { setActiveTemplateId(id); timer.reset() }} plans={plans} onStartPlanSession={startPlannedSession} />}{page === 'tasks' && <TasksPage tasks={tasks} setTasks={setTasks} goals={goals} onStartTask={(task) => { setActiveTask(task); setPage('focus'); timer.startFreshFocus() }} onSubjectAutoAdd={autoAddSubject} />}{page === 'sessions' && <Sessions sessions={sessions} />}{page === 'planner' && <SmartPlanner plans={plans} setPlans={setPlans} subjects={subjects} tasks={tasks} settings={plannerSettings} template={activeTemplate} onStartSession={startPlannedSession} />}{page === 'calendar' && <><CalendarPage tasks={tasks} sessions={sessions} exams={exams} planned={planned} subjects={subjects} /><div className="mt-5"><Planner tasks={tasks} subjects={subjects} exams={exams} setExams={setExams} planned={planned} setPlanned={setPlanned} /></div></>}{page === 'notes' && <NotesPage notes={notes} setNotes={setNotes} subjects={subjects} />}{page === 'analytics' && <StatisticsPage sessions={sessions} tasks={tasks} subjects={subjects} dailyGoal={dailyGoal.minutes} weeklyGoal={weeklyGoal} />}{page === 'goals' && <Goals goals={goals} setGoals={setGoals} />}{page === 'settings' && <SettingsSections settings={settings} setSettings={setSettings} study={studySettings} setStudy={setStudySettings} plannerSettings={plannerSettings} setPlannerSettings={setPlannerSettings} notifications={notificationSettings} setNotifications={setNotificationSettings} templates={templates} setTemplates={setTemplates} subjects={subjects} setSubjects={setSubjects} sessions={sessions} tasks={tasks} onReset={() => { resetAllData(); window.location.reload() }} />}</div></main></div><MobileNav page={page} onNavigate={navigate} showNotes={settings.showNotesTab} />{palette && <CommandPalette timer={timer} navigate={navigate} close={() => setPalette(false)} addSubject={addSubject} />}{page === 'focus' && <FocusMode timer={timer} task={activeTask} tasks={tasks} subject={currentSubject?.name || activeTask?.subject || ''} todayMinutes={sessions.filter((session) => session.type === 'focus' && session.completedAt.slice(0, 10) === todayISO()).reduce((sum, session) => sum + session.durationMinutes, 0)} dailyGoal={dailyGoal.minutes} onTaskChange={(task) => { setActiveTask(task); const matching = task && subjects.find((item) => item.name === task.subject); if (matching) setSubjectId(matching.id) }} onExit={() => setPage('dashboard')} />}</div>
}

function pageTitle(page: Page) { return ({ dashboard: 'Good afternoon', tasks: 'Tasks', sessions: 'Session history', calendar: 'Calendar', subjects: 'Subjects', notes: 'Notes', analytics: 'Statistics', focus: 'Focus mode', goals: 'Goals', planner: 'Smart Study Planner', settings: 'Settings' })[page] }
void FocusMode
function MobileDrawer({ page, navigate, showNotes }: { page: Page; navigate: (p: Page) => void; showNotes: boolean }) { const items: [Page, string][] = [['dashboard', 'Dashboard'], ['tasks', 'Tasks'], ['planner', 'Planner'], ['calendar', 'Calendar'], ['notes', 'Notes'], ['analytics', 'Statistics'], ['settings', 'Settings']]; return <div className="space-y-1">{items.filter(([id]) => showNotes || id !== 'notes').map(([id, label]) => <button key={id} onClick={() => navigate(id)} className={`w-full rounded-xl px-3 py-3 text-left text-sm ${page === id ? 'bg-accent/15 text-accent' : 'text-muted hover:bg-surface2'}`}>{label}</button>)}</div> }

function Dashboard({ timer, tasks, setTasks, goals, sessions, subjects, subjectId, setSubjectId, addSubject, dailyGoal, setDailyGoal, exams, planned, navigate, openFocus, activeTemplate, templates, onTemplateChange, plans, onStartPlanSession }: { timer: ReturnType<typeof useTimer>; tasks: Task[]; setTasks: (fn: (prev: Task[]) => Task[]) => void; goals: Goal[]; sessions: StudySession[]; subjects: Subject[]; subjectId: string; setSubjectId: (id: string) => void; addSubject: () => void; dailyGoal: DailyGoal; setDailyGoal: (fn: (prev: DailyGoal) => DailyGoal) => void; exams: Exam[]; planned: PlannedSession[]; navigate: (p: Page) => void; openFocus: () => void; activeTemplate: StudyTemplate | undefined; templates: StudyTemplate[]; onTemplateChange: (id: string) => void; plans: StudyPlan2[]; onStartPlanSession: (session: { topic: string; durationMinutes: number; type: string }, plan: StudyPlan2) => void }) {
  const today = todayISO(); const todayMinutes = sessions.filter((s) => s.type === 'focus' && s.completedAt.slice(0, 10) === today).reduce((n, s) => n + s.durationMinutes, 0); const nextExam = exams.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0]; const nextPlan = planned.filter((p) => p.date >= today && !p.completed).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0]
  const nextPlannerSession = plans
    .flatMap((plan) => plan.sessions.filter((s) => !s.completed && s.date >= today && s.date < plan.examDate).map((s) => ({ plan, session: s })))
    .sort((a, b) => `${a.session.date}${a.session.time}`.localeCompare(`${b.session.date}${b.session.time}`))[0]
  const upcomingPlanner = plans
    .flatMap((plan) => plan.sessions.filter((s) => !s.completed && s.date >= today && s.date < plan.examDate && !(nextPlannerSession && s.id === nextPlannerSession.session.id)).map((s) => ({ plan, session: s })))
    .sort((a, b) => `${a.session.date}${a.session.time}`.localeCompare(`${b.session.date}${b.session.time}`)).slice(0, 3)
  return <div className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm text-muted">Stay focused. You’ve got this.</p><h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Your study space</h2></div><button onClick={() => navigate('settings')} className="focus-ring flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-muted hover:text-white"><Settings2 size={16} /> Timer settings</button></div><StatCards sessions={sessions} goals={goals} /><div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]"><Timer timer={timer} subjects={subjects} subjectId={subjectId} onSubjectChange={setSubjectId} onAddSubject={addSubject} onManageSubjects={() => navigate('settings')} onOpenFocus={openFocus} activeTemplate={activeTemplate} templates={templates} onTemplateChange={onTemplateChange} /><div className="space-y-5"><GoalCard minutes={todayMinutes} goal={dailyGoal} setGoal={setDailyGoal} />{nextPlannerSession && <button onClick={() => onStartPlanSession(nextPlannerSession.session, nextPlannerSession.plan)} className="w-full rounded-2xl border border-accent/30 bg-accent/5 p-card text-left hover:bg-accent/10"><p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">Next up</p><p className="mt-1.5 font-semibold">{nextPlannerSession.session.topic}</p><p className="mt-0.5 text-sm text-muted">{plans.find((p) => p.id === nextPlannerSession.plan.id)?.subjectId ? subjects.find((s) => s.id === nextPlannerSession.plan.subjectId)?.name : nextPlannerSession.plan.name} · {nextPlannerSession.session.date === today ? 'Today' : nextPlannerSession.session.date} · {nextPlannerSession.session.time} · {nextPlannerSession.session.durationMinutes} min</p><span className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-black"><Play size={12} /> Start</span></button>}{upcomingPlanner.length > 0 && <div className="rounded-2xl border border-border bg-surface p-card"><p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Upcoming</p><div className="mt-2 space-y-1.5">{upcomingPlanner.map(({ plan, session }) => <button key={session.id} onClick={() => onStartPlanSession(session, plan)} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm text-muted hover:bg-surface2 hover:text-white"><span>{session.topic}</span><span className="text-xs">{session.date === today ? 'Today' : session.date} · {session.durationMinutes} min</span></button>)}</div></div>}<StudyPlan tasks={tasks} setTasks={setTasks} goals={goals} onStartTask={() => timer.start()} /><div className="grid gap-3 sm:grid-cols-2"><InfoCard title="Next exam" value={nextExam ? `${nextExam.name} · ${daysUntil(nextExam.date)} days` : 'No exam added'} onClick={() => navigate('calendar')} /><InfoCard title="Next planned session" value={nextPlan ? `${nextPlan.time} · ${subjectName(nextPlan.subjectId, subjects)}` : 'Nothing planned'} onClick={() => navigate('calendar')} /></div></div></div><RecentSessions sessions={sessions} navigate={navigate} /></div>
}
function GoalCard({ minutes, goal, setGoal }: { minutes: number; goal: DailyGoal; setGoal: (fn: (prev: DailyGoal) => DailyGoal) => void }) { const percent = Math.min(100, Math.round(minutes / Math.max(goal.minutes, 1) * 100)); const radius = 38; const circumference = 2 * Math.PI * radius; return <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-card"><div className="relative h-24 w-24 shrink-0"><svg className="-rotate-90" viewBox="0 0 100 100"><circle cx="50" cy="50" r={radius} fill="none" stroke="rgb(var(--surface2))" strokeWidth="8" /><circle cx="50" cy="50" r={radius} fill="none" stroke="rgb(var(--accent))" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - percent / 100)} /></svg><span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">{percent}%</span></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">Today’s study goal</p><p className="mt-1 text-sm text-muted">{formatMinutes(minutes)} / {formatMinutes(goal.minutes)}</p><select value={goal.minutes} onChange={(e) => setGoal(() => ({ minutes: Number(e.target.value), updatedAt: new Date().toISOString() }))} className="focus-ring mt-2 rounded-lg border border-border bg-surface2 px-2 py-1 text-xs"><option value="30">30 minutes</option><option value="60">1 hour</option><option value="120">2 hours</option><option value="180">3 hours</option><option value="240">4 hours</option></select></div></div> }
function InfoCard({ title, value, onClick }: { title: string; value: string; onClick: () => void }) { return <button onClick={onClick} className="rounded-2xl border border-border bg-surface p-4 text-left hover:bg-surface2"><p className="text-xs text-muted">{title}</p><p className="mt-2 truncate text-sm font-medium">{value}</p></button> }
function subjectName(id: string | null, subjects: Subject[]) { return subjects.find((s) => s.id === id)?.name || 'General focus' }
function daysUntil(date: string) { return Math.max(0, Math.ceil((new Date(`${date}T12:00:00`).getTime() - new Date(`${todayISO()}T12:00:00`).getTime()) / 86400000)) }
function RecentSessions({ sessions, navigate }: { sessions: StudySession[]; navigate: (p: Page) => void }) { return <div className="rounded-2xl border border-border bg-surface p-card"><div className="flex items-center justify-between"><h3 className="font-semibold">Recent sessions</h3><button onClick={() => navigate('sessions')} className="text-xs text-accent">View all</button></div>{sessions.length === 0 ? <Empty text="Complete a timer session and it will appear here." /> : <div className="mt-4 divide-y divide-border">{sessions.slice(-4).reverse().map((s) => <div key={s.id} className="flex items-center gap-3 py-3 text-sm"><span className={`h-2 w-2 rounded-full ${s.type === 'focus' ? 'bg-accent' : 'bg-sky-400'}`} /><span className="flex-1">{s.subject}</span><span className="text-muted">{formatMinutes(s.durationMinutes)}</span><span className="hidden text-xs text-muted sm:block">{formatTimeOfDay(s.completedAt, '24')}</span></div>)}</div>}</div> }
function Empty({ text }: { text: string }) { return <div className="py-8 text-center text-sm text-muted">{text}</div> }
function Sessions({ sessions }: { sessions: StudySession[] }) { return <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-surface p-card"><h2 className="font-semibold">Session history</h2>{sessions.length === 0 ? <Empty text="No completed sessions yet." /> : <div className="mt-4 divide-y divide-border">{[...sessions].reverse().map((s) => <div key={s.id} className="flex flex-wrap items-center gap-3 py-3 text-sm"><span className="h-2 w-2 rounded-full bg-accent" /><span className="min-w-32 flex-1 font-medium">{s.subject}</span><span>{formatMinutes(s.durationMinutes)}</span><span className="text-xs text-muted">{new Date(s.completedAt).toLocaleString()}</span></div>)}</div>}</div> }
function Analytics({ sessions, subjects }: { sessions: StudySession[]; subjects: Subject[] }) { const focus = sessions.filter((s) => s.type === 'focus'); const breakdown = subjects.map((subject) => ({ name: subject.name, minutes: focus.filter((s) => s.subjectId === subject.id).reduce((n, s) => n + s.durationMinutes, 0) })).filter((s) => s.minutes); return <div className="space-y-5"><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><MiniStat icon={<Clock3 size={16} />} label="Today" value={formatMinutes(focus.filter((s) => s.completedAt.slice(0, 10) === todayISO()).reduce((n, s) => n + s.durationMinutes, 0))} /><MiniStat icon={<BarChart3 size={16} />} label="This week" value={formatMinutes(focus.filter((s) => Date.now() - new Date(s.completedAt).getTime() < 604800000).reduce((n, s) => n + s.durationMinutes, 0))} /><MiniStat icon={<Target size={16} />} label="Sessions" value={String(focus.length)} /><MiniStat icon={<Flame size={16} />} label="Streak" value={`${streak(sessions)} days`} /></div><section className="rounded-2xl border border-border bg-surface p-card"><h2 className="font-semibold">By subject</h2>{breakdown.length ? <div className="mt-4 space-y-3">{breakdown.map((item) => <div key={item.name} className="flex items-center gap-3 text-sm"><span className="h-2 w-2 rounded-full bg-accent" /><span className="flex-1">{item.name}</span><span className="text-muted">{formatMinutes(item.minutes)}</span></div>)}</div> : <Empty text="Choose a subject before starting a timer to see your breakdown." />}</section></div> }
function streak(sessions: StudySession[]) { const dates = new Set(sessions.filter((s) => s.type === 'focus').map((s) => s.completedAt.slice(0, 10))); let count = 0; const date = new Date(); while (dates.has(date.toISOString().slice(0, 10))) { count++; date.setDate(date.getDate() - 1) } return count }
function MiniStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <div className="rounded-2xl border border-border bg-surface p-4"><div className="flex items-center gap-2 text-xs text-muted">{icon}{label}</div><div className="mt-2 text-xl font-bold">{value}</div></div> }

function Planner({ tasks, subjects, exams, setExams, planned, setPlanned }: { tasks: Task[]; subjects: Subject[]; exams: Exam[]; setExams: (fn: (p: Exam[]) => Exam[]) => void; planned: PlannedSession[]; setPlanned: (fn: (p: PlannedSession[]) => PlannedSession[]) => void }) { const [examName, setExamName] = useState(''); const [examDate, setExamDate] = useState(todayISO()); const [examSubject, setExamSubject] = useState(''); const [editingExam, setEditingExam] = useState<Exam | null>(null); const [planDate, setPlanDate] = useState(todayISO()); const [planTime, setPlanTime] = useState('16:00'); const [planSubject, setPlanSubject] = useState(''); const [planTask, setPlanTask] = useState(''); const [planDuration, setPlanDuration] = useState(25); return <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-border bg-surface p-card"><h2 className="font-semibold">Upcoming exams</h2><div className="mt-4 flex flex-wrap gap-2"><input value={examName} onChange={(e) => setExamName(e.target.value)} placeholder="Exam name" className="focus-ring min-w-0 flex-1 rounded-lg border border-border bg-surface2 px-3 py-2 text-sm" /><input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="focus-ring rounded-lg border border-border bg-surface2 px-2 py-2 text-sm" /><select value={examSubject} onChange={(e) => setExamSubject(e.target.value)} className="focus-ring rounded-lg border border-border bg-surface2 px-2 py-2 text-sm"><option value="">Subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select><button onClick={() => { if (!examName.trim()) return; if (editingExam) { setExams((items) => items.map((exam) => exam.id === editingExam.id ? { ...exam, name: examName.trim(), date: examDate, subjectId: examSubject || null } : exam)); setEditingExam(null) } else { setExams((items) => [...items, { id: uid(), name: examName.trim(), date: examDate, subjectId: examSubject || null, createdAt: new Date().toISOString() }]) } setExamName(''); setExamSubject('') }} className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-black">{editingExam ? 'Save' : <Plus size={15} />}</button>{editingExam && <button onClick={() => { setEditingExam(null); setExamName(''); setExamSubject('') }} className="rounded-lg border border-border px-3 py-2 text-sm text-muted">Cancel</button>}</div><div className="mt-4 space-y-2">{exams.filter((e) => e.date >= todayISO()).sort((a, b) => a.date.localeCompare(b.date)).map((exam) => <div key={exam.id} className="flex items-center gap-3 rounded-xl bg-surface2 p-3 text-sm"><span className="flex-1"><span className="block">{exam.name}</span><span className="text-xs text-muted">{subjectName(exam.subjectId, subjects)}</span></span><span className="text-accent">{daysUntil(exam.date)} days</span><button onClick={() => { setEditingExam(exam); setExamName(exam.name); setExamDate(exam.date); setExamSubject(exam.subjectId ?? '') }} title="Edit exam" className="text-muted hover:text-white"><Edit3 size={15} /></button><button onClick={() => setExams((p) => p.filter((e) => e.id !== exam.id))} title="Delete exam" className="text-muted hover:text-red-400"><Trash2 size={15} /></button></div>)}</div></section><section className="rounded-2xl border border-border bg-surface p-card"><h2 className="font-semibold">Planned study sessions</h2><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"><input type="date" value={planDate} onChange={(e) => setPlanDate(e.target.value)} className="focus-ring rounded-lg border border-border bg-surface2 px-2 py-2 text-xs" /><input type="time" value={planTime} onChange={(e) => setPlanTime(e.target.value)} className="focus-ring rounded-lg border border-border bg-surface2 px-2 py-2 text-xs" /><select value={planSubject} onChange={(e) => setPlanSubject(e.target.value)} className="focus-ring rounded-lg border border-border bg-surface2 px-2 py-2 text-xs"><option value="">Subject</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select><select value={planTask} onChange={(e) => setPlanTask(e.target.value)} className="focus-ring rounded-lg border border-border bg-surface2 px-2 py-2 text-xs"><option value="">Task (optional)</option>{tasks.filter((t) => !t.completed).map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select><button onClick={() => setPlanned((p) => [...p, { id: uid(), date: planDate, time: planTime, durationMinutes: planDuration, subjectId: planSubject || null, taskId: planTask || null, completed: false }])} className="rounded-lg bg-accent px-3 py-2 text-xs font-medium text-black">Add</button></div><select value={planDuration} onChange={(e) => setPlanDuration(Number(e.target.value))} className="focus-ring mt-2 rounded-lg border border-border bg-surface2 px-2 py-2 text-xs"><option value={25}>25 min</option><option value={50}>50 min</option><option value={90}>90 min</option></select><div className="mt-4 space-y-2">{[...planned].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).map((item) => <div key={item.id} className="flex items-center gap-3 rounded-xl bg-surface2 p-3 text-sm"><span>{item.date} · {item.time}</span><span className="flex-1 text-muted">{subjectName(item.subjectId, subjects)} · {item.durationMinutes} min</span><button onClick={() => setPlanned((p) => p.filter((x) => x.id !== item.id))} className="text-muted hover:text-red-400"><Trash2 size={15} /></button></div>)}</div></section></div> }

function Goals({ goals, setGoals }: { goals: Goal[]; setGoals: (fn: (prev: Goal[]) => Goal[]) => void }) { const [title, setTitle] = useState(''); const [hours, setHours] = useState(10); return <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-surface p-card"><h2 className="font-semibold">Study goals</h2><div className="mt-4 flex gap-2"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Prepare for finals" className="focus-ring min-w-0 flex-1 rounded-lg border border-border bg-surface2 px-3 py-2 text-sm" /><input type="number" min={1} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="w-20 rounded-lg border border-border bg-surface2 px-2 text-sm" /><button onClick={() => { if (title.trim()) { setGoals((p) => [...p, { id: uid(), title: title.trim(), targetDate: null, targetHours: hours, completed: false, createdAt: new Date().toISOString() }]); setTitle('') } }} className="rounded-lg bg-accent px-3 text-sm text-black"><Plus size={15} /></button></div><div className="mt-5 space-y-2">{goals.map((goal) => <div key={goal.id} className="flex items-center gap-3 rounded-xl bg-surface2 p-3 text-sm"><button onClick={() => setGoals((p) => p.map((g) => g.id === goal.id ? { ...g, completed: !g.completed } : g))} className={`h-5 w-5 rounded border ${goal.completed ? 'border-accent bg-accent' : 'border-border'}`}>{goal.completed && <Check size={13} className="text-black" />}</button><span className="flex-1">{goal.title}</span><span className="text-muted">{goal.targetHours}h</span><button onClick={() => setGoals((p) => p.filter((g) => g.id !== goal.id))} className="text-muted"><Trash2 size={15} /></button></div>)}</div></div> }


function CommandPalette({ timer, navigate, close, addSubject }: { timer: ReturnType<typeof useTimer>; navigate: (p: Page) => void; close: () => void; addSubject: () => void }) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const commands = [
    { label: timer.isRunning ? 'Pause timer' : 'Start timer', shortcut: 'Space', run: () => timer.isRunning ? timer.pause() : timer.start() },
    { label: 'Reset timer', shortcut: 'R', run: timer.reset },
    { label: 'Skip session', shortcut: 'S', run: timer.skip },
    { label: 'Add task', shortcut: 'N', run: () => { navigate('dashboard'); window.setTimeout(() => window.dispatchEvent(new CustomEvent('studia:add-task')), 0) } },
    { label: 'View dashboard', shortcut: 'T', run: () => navigate('dashboard') },
    { label: 'View session history', shortcut: '—', run: () => navigate('sessions') },
    { label: 'View statistics', shortcut: '—', run: () => navigate('analytics') },
    { label: 'Open settings', shortcut: '—', run: () => navigate('settings') },
    { label: 'Add subject', shortcut: '—', run: addSubject },
  ]
  const filteredCommands = commands.filter((command) => command.label.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => setSelectedIndex(0), [query])
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setSelectedIndex((index) => filteredCommands.length ? (index + 1) % filteredCommands.length : 0)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setSelectedIndex((index) => filteredCommands.length ? (index - 1 + filteredCommands.length) % filteredCommands.length : 0)
      } else if (event.key === 'Enter' && filteredCommands[selectedIndex]) {
        event.preventDefault()
        filteredCommands[selectedIndex].run()
        close()
      } else if (event.key === 'Escape') {
        event.preventDefault()
        close()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [close, filteredCommands, selectedIndex])

  return <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[12vh]" onClick={close}>
    <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-center gap-2 border-b border-border px-4"><Search size={17} className="text-muted" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search commands…" className="focus-ring w-full bg-transparent py-4 text-sm outline-none" /></div>
      <div className="p-2" role="listbox" aria-label="Commands">
        {filteredCommands.map((command, index) => <button key={command.label} onMouseEnter={() => setSelectedIndex(index)} onClick={() => { command.run(); close() }} role="option" aria-selected={index === selectedIndex} className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm ${index === selectedIndex ? 'bg-surface2 text-white' : 'text-muted hover:bg-surface2 hover:text-white'}`}><span>{command.label}</span><kbd className="ml-4 min-w-14 rounded-md border border-border bg-surface2 px-2 py-1 text-center text-[11px] font-medium text-muted">{command.shortcut}</kbd></button>)}
        {!filteredCommands.length && <p className="p-3 text-sm text-muted">No matching commands.</p>}
      </div>
      <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-[11px] text-muted"><span>↑↓ Navigate</span><span>Enter Select</span><span>Esc Close</span></div>
    </div>
  </div>
}
void Analytics

function App() { return <ToastProvider><AppContent /></ToastProvider> }
export default App
