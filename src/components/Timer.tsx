import { Play, Pause, RotateCcw, SkipForward, Coffee, BedDouble, Timer as TimerIcon, Plus } from 'lucide-react'
import type { Subject, TimerMode } from '../types'
import { formatClock, classNames } from '../lib/utils'
import type { useTimer } from '../lib/useTimer'

const MODE_META: Record<TimerMode, { label: string; sub: string; icon: typeof TimerIcon }> = {
  focus: { label: 'Focus Session', sub: 'Time to focus', icon: TimerIcon },
  'short-break': { label: 'Short Break', sub: 'Relax for a bit', icon: Coffee },
  'long-break': { label: 'Long Break', sub: 'Take a longer rest', icon: BedDouble },
}

export function Timer({ timer, subjects = [], subjectId = '', onSubjectChange, onAddSubject }: { timer: ReturnType<typeof useTimer>; subjects?: Subject[]; subjectId?: string; onSubjectChange?: (id: string) => void; onAddSubject?: () => void }) {
  const r = 120
  const c = 2 * Math.PI * r
  const offset = c * (1 - timer.progress)
  const meta = MODE_META[timer.mode]

  return (
    <div className="p-card rounded-2xl border border-border bg-surface p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2"><label className="text-xs text-muted" htmlFor="timer-subject">Subject</label><select id="timer-subject" value={subjectId} onChange={(e) => onSubjectChange?.(e.target.value)} className="focus-ring min-w-0 flex-1 rounded-lg border border-border bg-surface2 px-2 py-1.5 text-xs"><option value="">General focus</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select>{onAddSubject && <button onClick={onAddSubject} title="Add subject" className="focus-ring rounded-lg border border-border p-1.5 text-muted hover:text-accent"><Plus size={14} /></button>}</div>
      <div className="mb-6 flex rounded-xl bg-surface2 p-1 text-sm">
        {(['focus', 'short-break', 'long-break'] as TimerMode[]).map((m) => {
          const Icon = MODE_META[m].icon
          return (
            <button
              key={m}
              onClick={() => timer.switchMode(m)}
              className={classNames(
                'focus-ring flex flex-1 items-center justify-center gap-2 rounded-lg py-2 transition-colors',
                timer.mode === m ? 'bg-surface text-white shadow-sm' : 'text-muted hover:text-white'
              )}
            >
              <Icon size={15} />
              {m === 'focus' ? 'Pomodoro' : m === 'short-break' ? 'Short Break' : 'Long Break'}
            </button>
          )
        })}
      </div>

      <div className="relative mx-auto flex h-[280px] w-[280px] items-center justify-center">
        <svg width="280" height="280" viewBox="0 0 280 280" className="-rotate-90">
          <circle cx="140" cy="140" r={r} fill="none" stroke="rgb(var(--surface2))" strokeWidth="14" />
          <circle
            cx="140"
            cy="140"
            r={r}
            fill="none"
            stroke="rgb(var(--accent))"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.2s linear' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-sm text-muted">{meta.label}</span>
          <span className="text-5xl font-bold tabular-nums">{formatClock(timer.remaining)}</span>
          <span className="mt-1 text-sm text-muted">{meta.sub}</span>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        {timer.isRunning ? (
          <button
            onClick={timer.pause}
            className="focus-ring flex h-14 w-40 items-center justify-center gap-2 rounded-full bg-accent font-medium text-black transition hover:brightness-110"
          >
            <Pause size={18} /> Pause
          </button>
        ) : (
          <button
            onClick={timer.start}
            className="focus-ring flex h-14 w-40 items-center justify-center gap-2 rounded-full bg-accent font-medium text-black transition hover:brightness-110"
          >
            <Play size={18} /> Start
          </button>
        )}
        <button
          onClick={timer.reset}
          title="Reset"
          className="focus-ring flex h-14 w-14 items-center justify-center rounded-full border border-border text-muted hover:bg-surface2 hover:text-white"
        >
          <RotateCcw size={18} />
        </button>
        <button
          onClick={timer.skip}
          title="Skip session"
          className="focus-ring flex h-14 w-14 items-center justify-center rounded-full border border-border text-muted hover:bg-surface2 hover:text-white"
        >
          <SkipForward size={18} />
        </button>
      </div>
    </div>
  )
}
