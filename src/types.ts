export type Priority = 'low' | 'medium' | 'high'
export type SessionType = 'focus' | 'short-break' | 'long-break'
export type TimerMode = 'focus' | 'short-break' | 'long-break'
export type Page = 'dashboard' | 'tasks' | 'sessions' | 'calendar' | 'subjects' | 'notes' | 'analytics' | 'focus' | 'goals' | 'planner' | 'settings'

export interface Subject {
  id: string
  name: string
  color: string
  icon: string
  createdAt: string
}

export interface Note {
  id: string
  title: string
  body: string
  subjectId: string | null
  updatedAt: string
  createdAt: string
}

export interface DailyGoal {
  minutes: number
  updatedAt: string
}

export interface Exam {
  id: string
  name: string
  date: string
  subjectId: string | null
  description?: string
  createdAt: string
}

export interface PlannedSession {
  id: string
  date: string
  time: string
  durationMinutes: number
  subjectId: string | null
  taskId: string | null
  completed: boolean
}

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

export interface StudyTemplate {
  id: string
  name: string
  description: string
  focusMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  sessions: number
  subjectId?: string | null
  icon: string
  color: string
  isDefault: boolean
}

export type PlanSessionType = 'learning' | 'practice' | 'revision' | 'flashcards' | 'mock-exam'

export interface PlanSession {
  id: string
  planId: string
  date: string // ISO date
  time: string // "HH:MM"
  topic: string
  type: PlanSessionType
  durationMinutes: number
  completed: boolean
}

export interface StudyPlan2 {
  id: string
  name: string
  subjectId: string | null
  examDate: string
  topics: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  totalMinutes: number
  createdAt: string
  sessions: PlanSession[]
  shortfallMinutes: number
}

export interface PlannerSettings {
  planningStyle: 'balanced' | 'exam-focused'
  dailyMaxMinutes: number
  minSessionMinutes: number
  preferredSessionMinutes: number
  preferredStartHour: number // hour of day planner sessions default to
  includeWeekends: boolean
  includeSchoolDays: boolean
  autoReschedule: boolean
  includeReviewSessions: boolean
}

export interface NotificationSettings {
  timerNotifications: boolean
  breakNotifications: boolean
  examReminders: boolean
  taskReminders: boolean
  plannerReminders: boolean
}

export interface StudySettings {
  dailyGoalMinutes: number
  weeklyGoalMinutes: number
  defaultSessionMinutes: number
  preferredStudyDays: number[] // 0=Sun … 6=Sat
  preferredStartHour: number
  preferredEndHour: number
}

export interface StudySession {
  id: string
  type: SessionType
  taskId: string | null
  subject: string
  subjectId?: string | null
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
  soundVolume: number // 0-100
  notificationsEnabled: boolean
  theme: 'dark' | 'light' | 'system'
  accentColor: string // "16 185 129"
  layout: 'comfortable' | 'compact'
  startPage: Page
  timeFormat: '12' | '24'
  weekStart: 'mon' | 'sun'
  showNotesTab: boolean
  confirmBeforeDelete: boolean
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
  soundVolume: 70,
  notificationsEnabled: true,
  theme: 'dark',
  accentColor: '16 185 129',
  layout: 'comfortable',
  startPage: 'dashboard',
  timeFormat: '24',
  weekStart: 'mon',
  showNotesTab: true,
  confirmBeforeDelete: true,
}

export const DEFAULT_PLANNER_SETTINGS: PlannerSettings = {
  planningStyle: 'balanced',
  dailyMaxMinutes: 180,
  minSessionMinutes: 20,
  preferredSessionMinutes: 45,
  preferredStartHour: 16,
  includeWeekends: true,
  includeSchoolDays: true,
  autoReschedule: false,
  includeReviewSessions: true,
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  timerNotifications: true,
  breakNotifications: true,
  examReminders: true,
  taskReminders: false,
  plannerReminders: false,
}

export const DEFAULT_STUDY_SETTINGS: StudySettings = {
  dailyGoalMinutes: 120,
  weeklyGoalMinutes: 600,
  defaultSessionMinutes: 45,
  preferredStudyDays: [1, 2, 3, 4, 5],
  preferredStartHour: 16,
  preferredEndHour: 21,
}

export const DEFAULT_TIMER_STATE: TimerState = {
  mode: 'focus',
  isRunning: false,
  endTimestamp: null,
  remainingSeconds: DEFAULT_SETTINGS.focusDuration * 60,
  cycleCount: 0,
}
