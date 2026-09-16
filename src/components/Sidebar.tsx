import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Home,
  Clock,
  Calendar,
  BarChart3,
  Target,
  Settings as SettingsIcon,
  Sun,
  Moon,
  GraduationCap,
} from 'lucide-react'
import type { Page } from '../types'
import { classNames } from '../lib/utils'

const NAV: { id: Page; label: string; icon: typeof Home }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'sessions', label: 'Sessions', icon: Clock },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

export function Sidebar({
  page,
  onNavigate,
  isDark,
  onToggleTheme,
}: {
  page: Page
  onNavigate: (p: Page) => void
  isDark: boolean
  onToggleTheme: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      animate={{ width: expanded ? 240 : 76 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="relative z-20 hidden shrink-0 flex-col overflow-hidden border-r border-border bg-surface md:flex"
    >
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
          <GraduationCap size={18} />
        </div>
        <span className="whitespace-nowrap text-lg font-semibold">Studia</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV.map((item) => {
          const Icon = item.icon
          const active = page === item.id
          return (
            <button
              key={item.id}
              title={expanded ? undefined : item.label}
              onClick={() => onNavigate(item.id)}
              className={classNames(
                'focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                active ? 'bg-accent/15 text-accent' : 'text-muted hover:bg-surface2 hover:text-white'
              )}
            >
              <Icon size={19} className="shrink-0" />
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="border-t border-border px-3 py-4">
        <button
          title={expanded ? undefined : 'Toggle theme'}
          onClick={onToggleTheme}
          className="focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-surface2 hover:text-white"
        >
          {isDark ? <Moon size={19} className="shrink-0" /> : <Sun size={19} className="shrink-0" />}
          <span className="whitespace-nowrap">{isDark ? 'Dark mode' : 'Light mode'}</span>
        </button>
      </div>
    </motion.aside>
  )
}

export function MobileNav({ page, onNavigate }: { page: Page; onNavigate: (p: Page) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-border bg-surface px-1 py-2 md:hidden">
      {NAV.map((item) => {
        const Icon = item.icon
        const active = page === item.id
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={classNames(
              'focus-ring flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1 text-[10px]',
              active ? 'text-accent' : 'text-muted'
            )}
          >
            <Icon size={20} />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
