import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Search, Play } from 'lucide-react'
import type { Goal, Priority, Task } from '../types'
import { uid } from '../lib/storage'
import { classNames } from '../lib/utils'
import { TaskModal } from './TaskModal'
import { ConfirmDialog } from './ConfirmDialog'
import { useToast } from './Toast'

const PRIORITY_COLOR: Record<Priority, string> = {
  low: 'text-muted',
  medium: 'text-yellow-400',
  high: 'text-red-400',
}

export function StudyPlan({
  tasks,
  setTasks,
  goals,
  onStartTask,
  onSubjectAutoAdd,
  title = "Today's Study Plan",
  scope = 'today',
  view = 'all',
}: {
  tasks: Task[]
  setTasks: (fn: (prev: Task[]) => Task[]) => void
  goals: Goal[]
  onStartTask?: (task: Task) => void
  onSubjectAutoAdd?: (name: string) => void
  title?: string
  scope?: 'today' | 'all'
  view?: 'today' | 'upcoming' | 'completed' | 'all'
}) {
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [sort, setSort] = useState<'time' | 'priority'>('time')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [toDelete, setToDelete] = useState<Task | null>(null)

  useEffect(() => {
    const open = () => { setEditing(null); setModalOpen(true) }
    window.addEventListener('studia:add-task', open)
    return () => window.removeEventListener('studia:add-task', open)
  }, [])

  const today = new Date().toISOString().slice(0, 10)

  const visible = useMemo(() => {
    let list = tasks.filter((t) => {
      if (scope === 'today' && !(t.dueDate === today || !t.dueDate)) return false
      if (view === 'today' && !(t.dueDate === today || !t.dueDate)) return false
      if (view === 'upcoming' && !(t.dueDate && t.dueDate > today)) return false
      if (view === 'completed' && !t.completed) return false
      return true
    })
    if (query.trim()) list = list.filter((t) => t.title.toLowerCase().includes(query.toLowerCase()) || t.subject.toLowerCase().includes(query.toLowerCase()))
    if (filter === 'active') list = list.filter((t) => !t.completed)
    if (filter === 'completed') list = list.filter((t) => t.completed)
    list = [...list].sort((a, b) => {
      if (sort === 'priority') {
        const order = { high: 0, medium: 1, low: 2 }
        return order[a.priority] - order[b.priority]
      }
      return (a.scheduledTime ?? '99:99').localeCompare(b.scheduledTime ?? '99:99')
    })
    return list
  }, [tasks, query, filter, sort, scope, view, today])

  function saveTask(data: {
    title: string
    subject: string
    description: string
    estimatedMinutes: number
    priority: Priority
    dueDate: string
    scheduledTime: string
    goalId: string
  }) {
    if (data.subject.trim()) onSubjectAutoAdd?.(data.subject)
    if (editing) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editing.id
            ? {
                ...t,
                ...data,
                dueDate: data.dueDate || null,
                scheduledTime: data.scheduledTime || null,
                goalId: data.goalId || null,
              }
            : t
        )
      )
      toast('Task updated')
    } else {
      const newTask: Task = {
        id: uid(),
        ...data,
        dueDate: data.dueDate || today,
        scheduledTime: data.scheduledTime || null,
        goalId: data.goalId || null,
        completed: false,
        createdAt: new Date().toISOString(),
      }
      setTasks((prev) => [...prev, newTask])
      toast('Task added')
    }
    setModalOpen(false)
    setEditing(null)
  }

  return (
    <div className="p-card rounded-2xl border border-border bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">{title}</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="pointer-events-none absolute left-2.5 top-2.5 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="focus-ring w-32 rounded-lg border border-border bg-surface2 py-1.5 pl-7 pr-2 text-xs"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="focus-ring rounded-lg border border-border bg-surface2 px-2 py-1.5 text-xs"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="focus-ring rounded-lg border border-border bg-surface2 px-2 py-1.5 text-xs"
          >
            <option value="time">By time</option>
            <option value="priority">By priority</option>
          </select>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted">No tasks yet. Add one to build your study plan.</div>
      ) : (
        <ul className="space-y-1">
          {visible.map((t) => (
            <li
              key={t.id}
              className="group flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-surface2"
            >
              <button
                onClick={() => setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, completed: !x.completed } : x)))}
                className={classNames(
                  'focus-ring flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
                  t.completed ? 'border-accent bg-accent' : 'border-border'
                )}
              >
                {t.completed && <span className="text-[10px] text-black">&#10003;</span>}
              </button>
              <div className="min-w-0 flex-1">
                <div className={classNames('truncate text-sm', t.completed && 'text-muted line-through')}>
                  {t.subject ? `${t.subject} - ${t.title}` : t.title}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted">
                  {t.scheduledTime && <span>{t.scheduledTime}</span>}
                  <span className={PRIORITY_COLOR[t.priority]}>{t.priority}</span>
                </div>
              </div>
              <div className="hidden items-center gap-1 group-hover:flex">
                {onStartTask && !t.completed && (
                  <button onClick={() => onStartTask(t)} title="Start pomodoro" className="focus-ring rounded-lg p-1.5 text-muted hover:text-accent">
                    <Play size={14} />
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditing(t)
                    setModalOpen(true)
                  }}
                  title="Edit"
                  className="focus-ring rounded-lg p-1.5 text-muted hover:text-white"
                >
                  <Pencil size={14} />
                </button>
                <button onClick={() => setToDelete(t)} title="Delete" className="focus-ring rounded-lg p-1.5 text-muted hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => {
          setEditing(null)
          setModalOpen(true)
        }}
        className="focus-ring mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2.5 text-sm text-muted hover:border-accent hover:text-accent"
      >
        <Plus size={15} /> Add task
      </button>

      <TaskModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={saveTask} editing={editing} goals={goals} />
      <ConfirmDialog
        open={!!toDelete}
        title="Delete task"
        message={`Delete "${toDelete?.title}"? This can't be undone.`}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          setTasks((prev) => prev.filter((t) => t.id !== toDelete!.id))
          toast('Task deleted', 'info')
          setToDelete(null)
        }}
      />
    </div>
  )
}
