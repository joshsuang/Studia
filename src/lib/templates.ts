import type { StudyTemplate } from '../types'

export const DEFAULT_TEMPLATES: StudyTemplate[] = [
  {
    id: 'tpl-exam-prep',
    name: 'Exam Prep',
    description: 'Long focus blocks with generous breaks for intensive exam preparation.',
    focusMinutes: 50,
    shortBreakMinutes: 10,
    longBreakMinutes: 20,
    sessions: 3,
    icon: 'book',
    color: '16 185 129',
    isDefault: true,
  },
  {
    id: 'tpl-homework',
    name: 'Homework',
    description: 'The classic Pomodoro rhythm for assignments and problem sets.',
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    sessions: 2,
    icon: 'pencil',
    color: '56 189 248',
    isDefault: true,
  },
  {
    id: 'tpl-quick-revision',
    name: 'Quick Revision',
    description: 'Short, sharp review sessions when time is tight.',
    focusMinutes: 20,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    sessions: 2,
    icon: 'zap',
    color: '251 146 60',
    isDefault: true,
  },
  {
    id: 'tpl-deep-study',
    name: 'Deep Study',
    description: 'Extended deep-work sessions for difficult material.',
    focusMinutes: 60,
    shortBreakMinutes: 10,
    longBreakMinutes: 20,
    sessions: 3,
    icon: 'brain',
    color: '167 139 250',
    isDefault: true,
  },
  {
    id: 'tpl-flashcards',
    name: 'Flashcard Review',
    description: 'Pomodoro-length rounds tuned for active recall practice.',
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    sessions: 2,
    icon: 'layers',
    color: '244 114 182',
    isDefault: true,
  },
]

export const TEMPLATE_COLORS = ['16 185 129', '56 189 248', '167 139 250', '251 146 60', '244 114 182', '250 204 21']

export function isBuiltinTemplate(id: string) {
  return DEFAULT_TEMPLATES.some((template) => template.id === id)
}

/** Re-add any built-in template that is missing, keeping the user's custom and edited templates. */
export function restoreDefaultTemplates(current: StudyTemplate[]): StudyTemplate[] {
  const custom = current.filter((template) => !isBuiltinTemplate(template.id))
  const keptDefaults = current.filter((template) => isBuiltinTemplate(template.id))
  const missing = DEFAULT_TEMPLATES.filter((template) => !keptDefaults.some((kept) => kept.id === template.id))
  return [...keptDefaults, ...missing, ...custom]
}

export function duplicateTemplate(template: StudyTemplate): StudyTemplate {
  return {
    ...template,
    id: `tpl-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name: `${template.name} copy`,
    isDefault: false,
  }
}
