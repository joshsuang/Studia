import type { PlanSession, PlanSessionType, PlannerSettings, StudyPlan2, StudyTemplate } from '../types'
import { uid } from './storage'
import { todayISO } from './utils'

const DAY_MS = 86400000

export function addDays(dateISO: string, days: number) {
  const date = new Date(`${dateISO}T12:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export function daysUntil(dateISO: string) {
  return Math.max(0, Math.round((new Date(`${dateISO}T12:00:00`).getTime() - new Date(`${todayISO()}T12:00:00`).getTime()) / DAY_MS))
}

function isWeekend(dateISO: string) {
  const day = new Date(`${dateISO}T12:00:00`).getDay()
  return day === 0 || day === 6
}

/** Deterministic list of study-eligible days between tomorrow and the exam (inclusive of exam-1). */
export function availableDays(examDate: string, settings: PlannerSettings): string[] {
  const today = todayISO()
  const days: string[] = []
  // Today counts only if there is still room for it chronologically.
  let cursor = today
  let guard = 0
  while (cursor < examDate && guard < 365) {
    const weekend = isWeekend(cursor)
    const isToday = cursor === today
    const schoolDay = new Date(`${cursor}T12:00:00`).getDay() >= 1 && new Date(`${cursor}T12:00:00`).getDay() <= 5
    const allowed = (weekend ? settings.includeWeekends : settings.includeSchoolDays) || (settings.includeWeekends && settings.includeSchoolDays)
    if ((allowed || (!weekend && schoolDay) || (weekend && !schoolDay)) && !(isToday && !allowed)) {
      if (!isToday || allowed) days.push(cursor)
    }
    cursor = addDays(cursor, 1)
    guard++
  }
  return days
}

const DIFFICULTY_WEIGHT: Record<StudyPlan2['difficulty'], number> = { easy: 0.9, medium: 1, hard: 1.15 }

export interface GenerateInput {
  name: string
  subjectId: string | null
  examDate: string
  topics: string[]
  difficulty: StudyPlan2['difficulty']
  totalMinutes: number
  settings: PlannerSettings
  template: StudyTemplate | undefined
}

export interface GenerateResult {
  plan: StudyPlan2
  shortfallMinutes: number
  availableMinutes: number
}

/**
 * Deterministic scheduler: spreads learning sessions across available days,
 * front-loads harder work, reserves the final days for revision and a mock exam.
 */
export function generatePlan(input: GenerateInput): GenerateResult {
  const { name, subjectId, examDate, topics, difficulty, totalMinutes, settings } = input
  void input.template
  const days = availableDays(examDate, settings)
  const minSession = settings.minSessionMinutes

  const availableMinutes = days.length * settings.dailyMaxMinutes
  const reviewReserve = settings.includeReviewSessions
    ? Math.min(Math.round(totalMinutes * 0.25), settings.dailyMaxMinutes * Math.min(2, days.length))
    : 0
  const learningMinutes = Math.max(0, totalMinutes - reviewReserve)

  const sessions: PlanSession[] = []
  // Capacity per day, reserving room on the last days for review.
  const capacity = new Map<string, number>(days.map((day) => [day, settings.dailyMaxMinutes]))
  const learningDays = reviewReserve > 0 && days.length >= 4 ? days.slice(0, days.length - 2) : days
  const reviewDays = reviewReserve > 0 && days.length >= 4 ? days.slice(days.length - 2) : []

  let remaining = learningMinutes
  let topicIndex = 0
  let dayIndex = 0
  let guard = 0

  const topicQueue: { topic: string; minutes: number }[] = []
  const perTopic = topics.length ? Math.max(minSession, Math.round(learningMinutes / topics.length)) : learningMinutes
  topics.forEach((topic) => topicQueue.push({ topic, minutes: Math.min(perTopic, learningMinutes) }))
  if (!topics.length) topicQueue.push({ topic: 'Focused study', minutes: learningMinutes })

  // Weight harder difficulty into earlier days by processing queue front-first.
  const weight = DIFFICULTY_WEIGHT[difficulty]
  const scaled: { topic: string; minutes: number }[] = []
  topicQueue.forEach((entry, index) => {
    scaled.push({ topic: entry.topic, minutes: Math.max(minSession, Math.round(entry.minutes * (index < topicQueue.length / 2 ? weight : 1))) })
  })

  while (remaining > 0 && dayIndex < learningDays.length && guard < 500) {
    guard++
    const day = learningDays[dayIndex]
    let room = capacity.get(day) ?? settings.dailyMaxMinutes
    while (remaining > 0 && room >= minSession && topicIndex < scaled.length) {
      const item = scaled[topicIndex]
      const duration = Math.min(item.minutes, room, settings.preferredSessionMinutes * 2)
      if (duration < minSession) break
      sessions.push({
        id: uid(),
        planId: '',
        date: day,
        time: defaultSlot(dayIndex, settings),
        topic: item.topic,
        type: pickType(topicIndex, topics.length),
        durationMinutes: duration,
        completed: false,
      })
      remaining -= duration
      item.minutes -= duration
      room -= duration
      capacity.set(day, room)
      if (item.minutes < minSession) topicIndex++
    }
    dayIndex++
  }
  // Any unplaced learning time becomes shortfall.
  const shortfallMinutes = Math.max(0, remaining) + unplacedReview(reviewDays, reviewReserve, capacity, settings, sessions, name)

  const ordered = sessions.sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
  return {
    plan: {
      id: uid(),
      name,
      subjectId,
      examDate,
      topics,
      difficulty,
      totalMinutes,
      createdAt: new Date().toISOString(),
      sessions: ordered,
      shortfallMinutes,
    },
    shortfallMinutes,
    availableMinutes,
  }
}

function unplacedReview(
  reviewDays: string[],
  reserve: number,
  capacity: Map<string, number>,
  settings: PlannerSettings,
  sessions: PlanSession[],
  planName: string
) {
  if (reserve <= 0 || !reviewDays.length) return 0
  let left = reserve
  const pieces: PlanSessionType[] = ['revision', 'mock-exam']
  reviewDays.forEach((day, index) => {
    let room = capacity.get(day) ?? settings.dailyMaxMinutes
    if (index === reviewDays.length - 1 && room >= 30) {
      sessions.push({ id: uid(), planId: '', date: day, time: defaultSlot(index + 1, settings), topic: `Practice test · ${planName}`, type: 'mock-exam', durationMinutes: Math.min(60, room), completed: false })
      room -= Math.min(60, room)
      left -= Math.min(60, reserve)
      capacity.set(day, room)
      return
    }
    if (room >= settings.minSessionMinutes) {
      const duration = Math.min(room, Math.ceil(left / reviewDays.length))
      sessions.push({ id: uid(), planId: '', date: day, time: defaultSlot(index + 1, settings), topic: `Full revision · ${planName}`, type: pieces[index % pieces.length], durationMinutes: duration, completed: false })
      left -= duration
      capacity.set(day, room - duration)
    }
  })
  return Math.max(0, left)
}

function pickType(index: number, total: number): PlanSessionType {
  if (total >= 4 && index === total - 1) return 'practice'
  return index % 4 === 3 ? 'flashcards' : 'learning'
}

function defaultSlot(dayIndex: number, settings: PlannerSettings) {
  const start = Math.min(21, Math.max(6, settings.preferredStartHour + (dayIndex % 2)))
  return `${String(start).padStart(2, '0')}:00`
}

export function planProgress(plan: StudyPlan2) {
  const total = plan.sessions.reduce((sum, session) => sum + session.durationMinutes, 0)
  const done = plan.sessions.filter((session) => session.completed).reduce((sum, session) => sum + session.durationMinutes, 0)
  const percent = total ? Math.min(100, Math.round((done / total) * 100)) : 0
  return { totalMinutes: total, doneMinutes: done, remainingMinutes: total - done, percent }
}

export interface RescheduleResult {
  sessions: PlanSession[]
  movedCount: number
  movedMinutes: number
  daysUsed: number
}

/** Move missed (past, incomplete) sessions onto the next days with capacity, capped at the daily max. */
export function rescheduleMissed(plan: StudyPlan2, settings: PlannerSettings): RescheduleResult {
  const today = todayISO()
  const missed = plan.sessions.filter((session) => !session.completed && session.date < today)
  if (!missed.length) return { sessions: plan.sessions, movedCount: 0, movedMinutes: 0, daysUsed: 0 }

  const missedMinutes = missed.reduce((sum, session) => sum + session.durationMinutes, 0)
  const upcoming = plan.sessions.filter((session) => !session.completed && session.date >= today)
  const completed = plan.sessions.filter((session) => session.completed)

  // Current load per future day (exam day excluded).
  const examDate = plan.examDate
  const load = new Map<string, number>()
  upcoming.forEach((session) => {
    if (session.date < examDate) load.set(session.date, (load.get(session.date) ?? 0) + session.durationMinutes)
  })

  let cursor = today
  let movedMinutes = 0
  const moved: PlanSession[] = []
  let guard = 0
  const missedQueue = [...missed]

  while (missedQueue.length && guard < 365) {
    guard++
    if (cursor >= examDate) break
    const used = load.get(cursor) ?? 0
    const room = settings.dailyMaxMinutes - used
    if (room >= settings.minSessionMinutes) {
      const next = missedQueue[0]
      const duration = Math.min(next.durationMinutes, room, settings.preferredSessionMinutes * 2)
      moved.push({ ...next, id: uid(), date: cursor, time: defaultSlot(moved.length, settings) })
      missedQueue.shift()
      movedMinutes += duration
      load.set(cursor, used + duration)
      if (movedMinutes >= missedMinutes) break
    }
    cursor = addDays(cursor, 1)
  }
  // Anything that could not be placed stays on its original date (visible as overdue).
  const kept = missedQueue.map((session) => session)
  const daysUsed = new Set(moved.map((session) => session.date)).size
  return { sessions: [...completed, ...moved, ...upcoming, ...kept].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)), movedCount: moved.length, movedMinutes, daysUsed }
}
