import { useAuth } from './auth'
import { useSyncedTable, useSyncedValue } from './sync'
import { supabase } from './supabaseClient'
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_PLANNER_SETTINGS,
  DEFAULT_SETTINGS,
  DEFAULT_STUDY_SETTINGS,
} from '../types'
import type {
  DailyGoal,
  Exam,
  Goal,
  NotificationSettings,
  Note,
  PlannedSession,
  PlannerSettings,
  Settings,
  StudyPlan2,
  StudySession,
  StudySettings,
  StudyTemplate,
  Subject,
  Task,
} from '../types'

type Row = Record<string, unknown>

function useUserId() {
  return useAuth().user?.id ?? null
}

export function useTasks() {
  const userId = useUserId()
  return useSyncedTable<Task>(
    'tasks',
    userId,
    (t, uid) => ({
      id: t.id,
      user_id: uid,
      title: t.title,
      subject: t.subject,
      description: t.description,
      estimated_minutes: t.estimatedMinutes,
      priority: t.priority,
      due_date: t.dueDate,
      scheduled_time: t.scheduledTime,
      completed: t.completed,
      goal_id: t.goalId,
      created_at: t.createdAt,
    }),
    (r: Row) => ({
      id: r.id as string,
      title: r.title as string,
      subject: r.subject as string,
      description: r.description as string,
      estimatedMinutes: r.estimated_minutes as number,
      priority: r.priority as Task['priority'],
      dueDate: (r.due_date as string) ?? null,
      scheduledTime: r.scheduled_time ? (r.scheduled_time as string).slice(0, 5) : null,
      completed: r.completed as boolean,
      goalId: (r.goal_id as string) ?? null,
      createdAt: r.created_at as string,
    })
  )
}

export function useSessions() {
  const userId = useUserId()
  return useSyncedTable<StudySession>(
    'sessions',
    userId,
    (s, uid) => ({
      id: s.id,
      user_id: uid,
      type: s.type,
      task_id: s.taskId,
      subject: s.subject,
      subject_id: s.subjectId ?? null,
      duration_minutes: s.durationMinutes,
      started_at: s.startedAt,
      completed_at: s.completedAt,
    }),
    (r: Row) => ({
      id: r.id as string,
      type: r.type as StudySession['type'],
      taskId: (r.task_id as string) ?? null,
      subject: r.subject as string,
      subjectId: (r.subject_id as string) ?? null,
      durationMinutes: r.duration_minutes as number,
      startedAt: r.started_at as string,
      completedAt: r.completed_at as string,
    })
  )
}

export function useGoals() {
  const userId = useUserId()
  return useSyncedTable<Goal>(
    'goals',
    userId,
    (g, uid) => ({
      id: g.id,
      user_id: uid,
      title: g.title,
      target_date: g.targetDate,
      target_hours: g.targetHours,
      completed: g.completed,
      created_at: g.createdAt,
    }),
    (r: Row) => ({
      id: r.id as string,
      title: r.title as string,
      targetDate: (r.target_date as string) ?? null,
      targetHours: Number(r.target_hours),
      completed: r.completed as boolean,
      createdAt: r.created_at as string,
    })
  )
}

export function useSubjects() {
  const userId = useUserId()
  return useSyncedTable<Subject>(
    'subjects',
    userId,
    (s, uid) => ({ id: s.id, user_id: uid, name: s.name, color: s.color, icon: s.icon, created_at: s.createdAt }),
    (r: Row) => ({
      id: r.id as string,
      name: r.name as string,
      color: r.color as string,
      icon: r.icon as string,
      createdAt: r.created_at as string,
    })
  )
}

export function useExams() {
  const userId = useUserId()
  return useSyncedTable<Exam>(
    'exams',
    userId,
    (e, uid) => ({
      id: e.id,
      user_id: uid,
      name: e.name,
      date: e.date,
      subject_id: e.subjectId,
      description: e.description ?? null,
      created_at: e.createdAt,
    }),
    (r: Row) => ({
      id: r.id as string,
      name: r.name as string,
      date: r.date as string,
      subjectId: (r.subject_id as string) ?? null,
      description: (r.description as string) ?? undefined,
      createdAt: r.created_at as string,
    })
  )
}

export function usePlannedSessions() {
  const userId = useUserId()
  return useSyncedTable<PlannedSession>(
    'planned_sessions',
    userId,
    (p, uid) => ({
      id: p.id,
      user_id: uid,
      date: p.date,
      time: p.time,
      duration_minutes: p.durationMinutes,
      subject_id: p.subjectId,
      task_id: p.taskId,
      completed: p.completed,
    }),
    (r: Row) => ({
      id: r.id as string,
      date: r.date as string,
      time: (r.time as string).slice(0, 5),
      durationMinutes: r.duration_minutes as number,
      subjectId: (r.subject_id as string) ?? null,
      taskId: (r.task_id as string) ?? null,
      completed: r.completed as boolean,
    })
  )
}

export function useNotes() {
  const userId = useUserId()
  return useSyncedTable<Note>(
    'notes',
    userId,
    (n, uid) => ({
      id: n.id,
      user_id: uid,
      title: n.title,
      body: n.body,
      subject_id: n.subjectId,
      created_at: n.createdAt,
      updated_at: n.updatedAt,
    }),
    (r: Row) => ({
      id: r.id as string,
      title: r.title as string,
      body: r.body as string,
      subjectId: (r.subject_id as string) ?? null,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    })
  )
}

export function useTemplates() {
  const userId = useUserId()
  return useSyncedTable<StudyTemplate>(
    'templates',
    userId,
    (t, uid) => ({
      id: t.id,
      user_id: uid,
      name: t.name,
      description: t.description,
      focus_minutes: t.focusMinutes,
      short_break_minutes: t.shortBreakMinutes,
      long_break_minutes: t.longBreakMinutes,
      sessions: t.sessions,
      subject_id: t.subjectId ?? null,
      icon: t.icon,
      color: t.color,
      is_default: t.isDefault,
    }),
    (r: Row) => ({
      id: r.id as string,
      name: r.name as string,
      description: r.description as string,
      focusMinutes: r.focus_minutes as number,
      shortBreakMinutes: r.short_break_minutes as number,
      longBreakMinutes: r.long_break_minutes as number,
      sessions: r.sessions as number,
      subjectId: (r.subject_id as string) ?? null,
      icon: r.icon as string,
      color: r.color as string,
      isDefault: r.is_default as boolean,
    })
  )
}

export function useStudyPlans() {
  const userId = useUserId()
  return useSyncedTable<StudyPlan2>(
    'study_plans',
    userId,
    (p, uid) => ({
      id: p.id,
      user_id: uid,
      name: p.name,
      subject_id: p.subjectId,
      exam_date: p.examDate,
      topics: p.topics,
      difficulty: p.difficulty,
      total_minutes: p.totalMinutes,
      shortfall_minutes: p.shortfallMinutes,
      sessions: p.sessions,
      created_at: p.createdAt,
    }),
    (r: Row) => ({
      id: r.id as string,
      name: r.name as string,
      subjectId: (r.subject_id as string) ?? null,
      examDate: r.exam_date as string,
      topics: r.topics as string[],
      difficulty: r.difficulty as StudyPlan2['difficulty'],
      totalMinutes: r.total_minutes as number,
      shortfallMinutes: r.shortfall_minutes as number,
      sessions: r.sessions as StudyPlan2['sessions'],
      createdAt: r.created_at as string,
    })
  )
}

export function useSettings() {
  const userId = useUserId()
  return useSyncedValue<Settings>('settings', DEFAULT_SETTINGS, userId)
}
export function usePlannerSettings() {
  const userId = useUserId()
  return useSyncedValue<PlannerSettings>('planner_settings', DEFAULT_PLANNER_SETTINGS, userId)
}
export function useNotificationSettings() {
  const userId = useUserId()
  return useSyncedValue<NotificationSettings>('notification_settings', DEFAULT_NOTIFICATION_SETTINGS, userId)
}
export function useStudySettings() {
  const userId = useUserId()
  return useSyncedValue<StudySettings>('study_settings', DEFAULT_STUDY_SETTINGS, userId)
}
export function useDailyGoal() {
  const userId = useUserId()
  return useSyncedValue<DailyGoal>('daily_goal', { minutes: 120, updatedAt: new Date().toISOString() }, userId)
}
export function useWeeklyGoal() {
  const userId = useUserId()
  return useSyncedValue<number>('weekly_goal', 600, userId)
}
export function useActiveTemplateId() {
  const userId = useUserId()
  return useSyncedValue<string>('active_template_id', '', userId)
}

/** Deletes every row this user owns across all synced tables. Used by "reset all data". */
export async function resetCloudData(userId: string) {
  const tables = ['tasks', 'sessions', 'goals', 'subjects', 'exams', 'planned_sessions', 'notes', 'templates', 'study_plans']
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId)
    if (error) console.error(`Reset failed on ${table}:`, error.message)
  }
  const { error } = await supabase.from('user_kv').delete().eq('user_id', userId)
  if (error) console.error('Reset failed on user_kv:', error.message)
}
