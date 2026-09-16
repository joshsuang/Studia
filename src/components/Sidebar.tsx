import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Home,
  Clock,
  Calendar,
  BarChart3,
  FileText,
  Settings as SettingsIcon,
  Sun,
  Moon,
  GraduationCap,
} from 'lucide-react'
import type { Page } from '../types'
import { classNames } from '../lib/utils'

const NAV: { id: Page; label: string; icon: typeof Home }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'tasks', label: 'Tasks', icon: Clock },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'analytics', label: 'Statistics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

function visibleNav(showNotes: boolean) {
  return NAV.filter((item) => showNotes || item.id !== 'notes')
}

export function Sidebar({
  page,
  onNavigate,
  isDark,
  onToggleTheme,
  showNotes = true,
}: {
  page: Page
  onNavigate: (p: Page) => void
  isDark: boolean
  onToggleTheme: () => void
  showNotes?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const expandTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function cancelExpansion() {
    if (expandTimer.current) {
      clearTimeout(expandTimer.current)
      expandTimer.current = null
    }
  }

  function handleMouseEnter() {
    cancelExpansion()
    expandTimer.current = setTimeout(() => setExpanded(true), 600)
  }

  function handleMouseLeave() {
    cancelExpansion()
    setExpanded(false)
  }

  function handleNavigate(next: Page) {
    cancelExpansion()
    setExpanded(false)
    onNavigate(next)
  }

  return (
    <motion.aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      animate={{ width: expanded ? 240 : 76 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="relative z-20 hidden shrink-0 flex-col overflow-hidden border-r border-border bg-surface md:flex"
    >
      <div className={classNames('flex items-center py-5 transition-[padding,gap] duration-200', expanded ? 'gap-3 px-5' : 'justify-center px-3')}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
          <GraduationCap size={18} />
        </div>
        <motion.span
          animate={{ opacity: expanded ? 1 : 0, width: expanded ? 'auto' : 0 }}
          transition={{ duration: 0.15 }}
          className="overflow-hidden whitespace-nowrap text-lg font-semibold"
        >
          Studia
        </motion.span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {visibleNav(showNotes).map((item) => {
          const Icon = item.icon
          const active = page === item.id
          return (
            <button
              key={item.id}
              title={expanded ? undefined : item.label}
              onClick={() => handleNavigate(item.id)}
              className={classNames(
                'focus-ring flex items-center rounded-xl px-3 py-2.5 text-sm transition-[gap,justify-content] duration-200',
                expanded ? 'gap-3' : 'justify-center',
                active ? 'bg-accent/15 text-accent' : 'text-muted hover:bg-surface2 hover:text-white'
              )}
            >
              <Icon size={19} className="shrink-0" />
              <motion.span
                animate={{ opacity: expanded ? 1 : 0, width: expanded ? 'auto' : 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden whitespace-nowrap"
              >
                {item.label}
              </motion.span>
            </button>
          )
        })}
      </nav>

      <div className="border-t border-border px-3 py-4">
        <button
          title={expanded ? undefined : 'Toggle theme'}
          onClick={onToggleTheme}
          className={classNames(
            'focus-ring flex w-full items-center rounded-xl px-3 py-2.5 text-sm text-muted transition-[gap,justify-content] duration-200 hover:bg-surface2 hover:text-white',
            expanded ? 'gap-3' : 'justify-center'
          )}
        >
          {isDark ? <Moon size={19} className="shrink-0" /> : <Sun size={19} className="shrink-0" />}
          <motion.span
            animate={{ opacity: expanded ? 1 : 0, width: expanded ? 'auto' : 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden whitespace-nowrap"
          >
            {isDark ? 'Dark mode' : 'Light mode'}
          </motion.span>
        </button>
      </div>
    </motion.aside>
  )
}

export function MobileNav({ page, onNavigate, showNotes = true }: { page: Page; onNavigate: (p: Page) => void; showNotes?: boolean }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-start gap-1 overflow-x-auto border-t border-border bg-surface px-1 py-2 md:hidden">
      {visibleNav(showNotes).map((item) => {
        const Icon = item.icon
        const active = page === item.id
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={classNames(
              'focus-ring flex min-w-[64px] flex-1 flex-col items-center gap-0.5 rounded-lg py-1 text-[10px]',
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
