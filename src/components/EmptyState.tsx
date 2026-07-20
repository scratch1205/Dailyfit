import { type ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}

/**
 * 空状态占位组件
 * - 衣橱为空、某天无搭配时展示
 */
export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-warm-100 flex items-center justify-center mb-4 text-warm-400">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-warm-700 mb-1">{title}</h3>
      <p className="text-sm text-warm-400 mb-6 max-w-[240px]">{description}</p>
      {action}
    </div>
  )
}