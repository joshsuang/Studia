export type Priority = 'low' | 'medium' | 'high'
export type SessionType = 'focus' | 'short-break' | 'long-break'
export type TimerMode = 'focus' | 'short-break' | 'long-break'
export type Page = 'dashboard' | 'sessions' | 'calendar' | 'analytics' | 'goals' | 'settings'

export interface Task {
  id: string
  title: string
  subject: string
  description: string
  estimatedMinutes: number
  priority: Priority
  dueDate: string | null // ISO date
  scheduledTime: string | null // "HH:MM"
  completed: boolean
  goalId: string | null
  createdAt: string
}

export interface StudySession {
  id: string
  type: SessionType
  taskId: string | null
  subject: string
  durationMinutes: number
  startedAt: string
  completedAt: string
}

export interface Goal {
  id: string
  title: string
  targetDate: string | null
  targetHours: number
  completed: boolean
  createdAt: string
}

export interface CalendarEvent {
  id: string
  title: string
  date: string // ISO date
  time: string | null
  type: 'task' | 'session'
  taskId: string | null
}

export interface Settings {
  focusDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  longBreakInterval: number
  autoStartBreaks: boolean
  autoStartFocus: boolean
  soundEnabled: boolean
  soundChoice: 'chime' | 'bell' | 'digital'
  notificationsEnabled: boolean
  theme: 'dark' | 'light' | 'system'
  accentColor: string // "16 185 129"
  layout: 'comfortable' | 'compact'
  startPage: Page
  timeFormat: '12' | '24'
  weekStart: 'mon' | 'sun'
}

export interface TimerState {
  mode: TimerMode
  isRunning: boolean
  endTimestamp: number | null // ms epoch, when running
  remainingSeconds: number // authoritative when paused
  cycleCount: number // completed focus sessions since last long break
}

export const DEFAULT_SETTINGS: Settings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: true,
  autoStartFocus: false,
  soundEnabled: true,
  soundChoice: 'chime',
  notificationsEnabled: true,
  theme: 'dark',
  accentColor: '16 185 129',
  layout: 'comfortable',
  startPage: 'dashboard',
  timeFormat: '24',
  weekStart: 'mon',
}

export const DEFAULT_TIMER_STATE: TimerState = {
  mode: 'focus',
  isRunning: false,
  endTimestamp: null,
  remainingSeconds: DEFAULT_SETTINGS.focusDuration * 60,
  cycleCount: 0,
}
