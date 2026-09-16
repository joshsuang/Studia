import { useEffect, useRef, useState } from 'react'
import { useStored } from './storage'
import type { Settings, SessionType, TimerMode, TimerState } from '../types'
import { DEFAULT_TIMER_STATE } from '../types'

function durationFor(mode: TimerMode, s: Settings) {
  if (mode === 'focus') return s.focusDuration * 60
  if (mode === 'short-break') return s.shortBreakDuration * 60
  return s.longBreakDuration * 60
}

function nextMode(mode: TimerMode, cycleCount: number, s: Settings): TimerMode {
  if (mode !== 'focus') return 'focus'
  return (cycleCount + 1) % s.longBreakInterval === 0 ? 'long-break' : 'short-break'
}

const CHIME_FREQS: Record<Settings['soundChoice'], number[]> = {
  chime: [880, 1320],
  bell: [660, 990, 1320],
  digital: [440, 440],
}

function playSound(choice: Settings['soundChoice']) {
  try {
    const ctx = new AudioContext()
    const freqs = CHIME_FREQS[choice]
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = f
      osc.connect(gain)
      gain.connect(ctx.destination)
      const start = ctx.currentTime + i * 0.15
      gain.gain.setValueAtTime(0.15, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3)
      osc.start(start)
      osc.stop(start + 0.3)
    })
  } catch {
    // audio unavailable, ignore
  }
}

export function useTimer(
  settings: Settings,
  onSessionComplete: (type: SessionType, minutes: number, completedNaturally: boolean) => void
) {
  const [state, setState] = useStored<TimerState>('timer', DEFAULT_TIMER_STATE)
  const [display, setDisplay] = useState(() =>
    state.isRunning && state.endTimestamp
      ? Math.max(0, Math.round((state.endTimestamp - Date.now()) / 1000))
      : state.remainingSeconds
  )
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    if (!state.isRunning || !state.endTimestamp) {
      setDisplay(state.remainingSeconds)
      return
    }
    const tick = () => {
      const remain = Math.max(0, Math.round((stateRef.current.endTimestamp! - Date.now()) / 1000))
      setDisplay(remain)
      if (remain <= 0) finish(true)
    }
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isRunning, state.endTimestamp])

  function finish(natural: boolean) {
    const cur = stateRef.current
    const minutes = durationFor(cur.mode, settings) / 60
    const type: SessionType = cur.mode
    if (natural) onSessionComplete(type, minutes, true)
    if (natural && settings.soundEnabled) playSound(settings.soundChoice)
    if (natural && settings.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Studia', {
        body: type === 'focus' ? 'Focus session complete. Time for a break.' : 'Break over. Ready to focus?',
      })
    }
    const newCycle = cur.mode === 'focus' ? cur.cycleCount + 1 : cur.cycleCount
    const nxt = nextMode(cur.mode, cur.cycleCount, settings)
    const shouldAutoStart = nxt === 'focus' ? settings.autoStartFocus : settings.autoStartBreaks
    const dur = durationFor(nxt, settings)
    setState({
      mode: nxt,
      cycleCount: newCycle,
      isRunning: shouldAutoStart,
      endTimestamp: shouldAutoStart ? Date.now() + dur * 1000 : null,
      remainingSeconds: dur,
    })
  }

  function start() {
    if (state.isRunning) return
    if ('Notification' in window && Notification.permission === 'default' && settings.notificationsEnabled) {
      Notification.requestPermission()
    }
    setState({ ...state, isRunning: true, endTimestamp: Date.now() + display * 1000 })
  }

  function pause() {
    if (!state.isRunning) return
    setState({ ...state, isRunning: false, endTimestamp: null, remainingSeconds: display })
  }

  function reset() {
    const dur = durationFor(state.mode, settings)
    setState({ ...state, isRunning: false, endTimestamp: null, remainingSeconds: dur })
  }

  function skip() {
    finish(false)
  }

  function switchMode(mode: TimerMode) {
    const dur = durationFor(mode, settings)
    setState({ ...state, mode, isRunning: false, endTimestamp: null, remainingSeconds: dur })
  }

  const total = durationFor(state.mode, settings)
  return {
    mode: state.mode,
    isRunning: state.isRunning,
    remaining: display,
    total,
    progress: 1 - display / total,
    start,
    pause,
    reset,
    skip,
    switchMode,
  }
}
