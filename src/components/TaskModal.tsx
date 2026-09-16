import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { Goal, Priority, Task } from '../types'

const emptyForm = {
  title: '',
  subject: '',
  description: '',
  estimatedMinutes: 30,
  priority: 'medium' as Priority,
  dueDate: '',
  scheduledTime: '',
  goalId: '',
}

export function TaskModal({
  open,
  onClose,
  onSave,
  editing,
  goals,
}: {
  open: boolean
  onClose: () => void
  onSave: (data: typeof emptyForm) => void
  editing: Task | null
  goals: Goal[]
}) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title,
        subject: editing.subject,
        description: editing.description,
        estimatedMinutes: editing.estimatedMinutes,
        priority: editing.priority,
        dueDate: editing.dueDate ?? '',
        scheduledTime: editing.scheduledTime ?? '',
        goalId: editing.goalId ?? '',
      })
    } else if (open) {
      setForm(emptyForm)
    }
  }, [editing, open])

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
          className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-surface p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold">{editing ? 'Edit task' : 'Add task'}</h3>
            <button onClick={onClose} className="focus-ring text-muted hover:text-white">
              <X size={18} />
            </button>
          </div>

          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!form.title.trim()) return
              onSave(form)
            }}
          >
            <div>
              <label className="mb-1 block text-xs text-muted">Title</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="focus-ring w-full rounded-lg border border-border bg-surface2 px-3 py-2 text-sm"
                placeholder="e.g. Chapter 4 review"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-muted">Subject</label>
                <input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="focus-ring w-full rounded-lg border border-border bg-surface2 px-3 py-2 text-sm"
                  placeholder="Math"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
                  className="focus-ring w-full rounded-lg border border-border bg-surface2 px-3 py-2 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="focus-ring w-full rounded-lg border border-border bg-surface2 px-3 py-2 text-sm"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs text-muted">Est. minutes</label>
                <input
                  type="number"
                  min={5}
                  value={form.estimatedMinutes}
                  onChange={(e) => setForm({ ...form, estimatedMinutes: Number(e.target.value) })}
                  className="focus-ring w-full rounded-lg border border-border bg-surface2 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Due date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="focus-ring w-full rounded-lg border border-border bg-surface2 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Time</label>
                <input
                  type="time"
                  value={form.scheduledTime}
                  onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
                  className="focus-ring w-full rounded-lg border border-border bg-surface2 px-3 py-2 text-sm"
                />
              </div>
            </div>
            {goals.length > 0 && (
              <div>
                <label className="mb-1 block text-xs text-muted">Linked goal</label>
                <select
                  value={form.goalId}
                  onChange={(e) => setForm({ ...form, goalId: e.target.value })}
                  className="focus-ring w-full rounded-lg border border-border bg-surface2 px-3 py-2 text-sm"
                >
                  <option value="">None</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="submit"
              className="focus-ring mt-2 w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-black hover:brightness-110"
            >
              {editing ? 'Save changes' : 'Add task'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
