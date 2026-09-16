import { Timer as TimerIcon, Clock, Coffee, Target } from 'lucide-react'
import type { Goal, StudySession } from '../types'
import { formatMinutes, todayISO } from '../lib/utils'

const DAILY_POMODORO_GOAL = 8

export function StatCards({ sessions, goals }: { sessions: StudySession[]; goals: Goal[] }) {
  const today = todayISO()
  const todaysSessions = sessions.filter((s) => s.completedAt.slice(0, 10) === today)
  const pomodorosToday = todaysSessions.filter((s) => s.type === 'focus').length
  const focusMinutes = todaysSessions.filter((s) => s.type === 'focus').reduce((a, s) => a + s.durationMinutes, 0)
  const breakMinutes = todaysSessions.filter((s) => s.type !== 'focus').reduce((a, s) => a + s.durationMinutes, 0)
  const activeGoal = goals.find((g) => !g.completed)

  const cards = [
    {
      icon: TimerIcon,
      label: 'Pomodoros Today',
      value: (
        <span>
          {pomodorosToday} <span className="text-base text-muted">/ {DAILY_POMODORO_GOAL}</span>
        </span>
      ),
      bar: Math.min(1, pomodorosToday / DAILY_POMODORO_GOAL),
    },
    { icon: Clock, label: 'Focus Time', value: formatMinutes(focusMinutes) },
    { icon: Coffee, label: 'Break Time', value: formatMinutes(breakMinutes) },
    {
      icon: Target,
      label: 'Current Goal',
      value: activeGoal ? activeGoal.title : 'No goal set',
      small: true,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="p-card rounded-2xl border border-border bg-surface p-4">
          <div className="mb-2 flex items-center gap-2 text-xs text-muted">
            <c.icon size={14} />
            {c.label}
          </div>
          <div className={c.small ? 'truncate text-sm font-semibold' : 'text-xl font-bold'}>{c.value}</div>
          {c.bar !== undefined && (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface2">
              <div className="h-full rounded-full bg-accent" style={{ width: `${c.bar * 100}%` }} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
