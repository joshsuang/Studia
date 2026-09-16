import { useEffect, useState } from 'react'

const PREFIX = 'studia:'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function save<T>(key: string, value: T) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // storage full or unavailable, ignore
  }
}

/**
 * localStorage-backed state. Persists on every change and syncs across tabs.
 */
export function useStored<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => load(key, fallback))

  useEffect(() => {
    save(key, value)
  }, [key, value])

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === PREFIX + key && e.newValue) {
        setValue(JSON.parse(e.newValue))
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key])

  return [value, setValue] as const
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function exportAllData() {
  const keys = ['tasks', 'sessions', 'goals', 'events', 'settings', 'timer', 'subjects', 'daily-goal', 'exams', 'planned-sessions']
  const data: Record<string, unknown> = {}
  for (const k of keys) data[k] = load(k, null)
  return JSON.stringify(data, null, 2)
}

export function importAllData(json: string) {
  const data = JSON.parse(json)
  for (const k of Object.keys(data)) {
    save(k, data[k])
  }
}

export function resetAllData() {
  const keys = ['tasks', 'sessions', 'goals', 'events', 'settings', 'timer', 'subjects', 'daily-goal', 'exams', 'planned-sessions']
  for (const k of keys) localStorage.removeItem(PREFIX + k)
}
