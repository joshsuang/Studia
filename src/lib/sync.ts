import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabaseClient'

/**
 * Generic Supabase-backed replacement for useStored<T[]> from storage.ts.
 * Same [value, setValue] shape as useStored so callers don't change.
 * Keeps a local mirror in React state, fetches once, subscribes to
 * realtime changes for this user, and diffs functional updates into
 * insert/update/delete calls against the table.
 */
export function useSyncedTable<T extends { id: string }>(
  table: string,
  userId: string | null,
  toDb: (item: T, userId: string) => Record<string, unknown>,
  fromDb: (row: Record<string, unknown>) => T
) {
  const [items, setItems] = useState<T[]>([])
  const itemsRef = useRef(items)
  itemsRef.current = items
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!userId) {
      setItems([])
      setLoaded(false)
      return
    }
    let cancelled = false
    setLoaded(false)
    supabase
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error(`Failed to load ${table}:`, error.message)
          setItems([])
        } else {
          setItems((data ?? []).map(fromDb))
        }
        setLoaded(true)
      })

    const channel = supabase
      .channel(`${table}:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id: string }).id
            setItems((prev) => prev.filter((i) => i.id !== oldId))
          } else {
            const next = fromDb(payload.new as Record<string, unknown>)
            setItems((prev) => (prev.some((i) => i.id === next.id) ? prev.map((i) => (i.id === next.id ? next : i)) : [...prev, next]))
          }
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [table, userId])

  function setValue(next: T[] | ((prev: T[]) => T[])) {
    const prev = itemsRef.current
    const resolved = typeof next === 'function' ? (next as (prev: T[]) => T[])(prev) : next
    setItems(resolved)
    if (!userId) return

    const prevIds = new Set(prev.map((i) => i.id))
    const nextIds = new Set(resolved.map((i) => i.id))
    const removed = prev.filter((i) => !nextIds.has(i.id)).map((i) => i.id)
    const upserts = resolved.filter((i) => !prevIds.has(i.id) || JSON.stringify(i) !== JSON.stringify(prev.find((p) => p.id === i.id)))

    if (removed.length) {
      supabase
        .from(table)
        .delete()
        .in('id', removed)
        .then(({ error }) => error && console.error(`Delete failed on ${table}:`, error.message))
    }
    if (upserts.length) {
      supabase
        .from(table)
        .upsert(upserts.map((i) => toDb(i, userId)))
        .then(({ error }) => error && console.error(`Save failed on ${table}:`, error.message))
    }
  }

  return [items, setValue, loaded] as const
}

/**
 * Generic Supabase-backed replacement for useStored<T> (a single value,
 * not an array) from storage.ts, for settings-shaped state. Backed by
 * one row per (user_id, key) in the user_kv table.
 */
export function useSyncedValue<T>(key: string, fallback: T, userId: string | null) {
  const [value, setValueState] = useState<T>(fallback)
  const valueRef = useRef(value)
  valueRef.current = value

  useEffect(() => {
    if (!userId) {
      setValueState(fallback)
      return
    }
    let cancelled = false
    supabase
      .from('user_kv')
      .select('value')
      .eq('user_id', userId)
      .eq('key', key)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) console.error(`Failed to load ${key}:`, error.message)
        setValueState((data?.value as T) ?? fallback)
      })

    const channel = supabase
      .channel(`user_kv:${userId}:${key}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_kv', filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as { key: string; value: T } | undefined
          if (row?.key === key) setValueState(row.value)
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, userId])

  function setValue(next: T | ((prev: T) => T)) {
    const resolved = typeof next === 'function' ? (next as (prev: T) => T)(valueRef.current) : next
    setValueState(resolved)
    if (!userId) return
    supabase
      .from('user_kv')
      .upsert({ user_id: userId, key, value: resolved, updated_at: new Date().toISOString() })
      .then(({ error }) => error && console.error(`Save failed on ${key}:`, error.message))
  }

  return [value, setValue] as const
}
