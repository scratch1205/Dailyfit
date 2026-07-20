import { NavLink } from 'react-router-dom'
import { Shirt, Palette, CalendarDays, User } from 'lucide-react'

const tabs = [
  { to: '/closet', label: '衣橱', icon: Shirt },
  { to: '/builder', label: '搭配', icon: Palette },
  { to: '/calendar', label: '日历', icon: CalendarDays },
  { to: '/profile', label: '我的', icon: User },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-warm-200 safe-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto h-16">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-w-tap min-h-tap gap-0.5 rounded-lg pressable transition-colors ${
                isActive ? 'text-clay-600' : 'text-warm-400 hover:text-warm-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
