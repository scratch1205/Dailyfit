import { useEffect } from 'react'
import { CheckCircle2, XCircle, Info } from 'lucide-react'
import { useDailyFitStore } from '../store/dailyfit-store'

/**
 * 全局 Toast 提示
 * - 从 Zustand store 读取 toast 状态
 * - 3 秒后自动消失
 */
export default function Toast() {
  const toast = useDailyFitStore((s) => s.toast)
  const clearToast = useDailyFitStore((s) => s.clearToast)

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(clearToast, 3000)
      return () => clearTimeout(timer)
    }
  }, [toast, clearToast])

  if (!toast) return null

  const icons = {
    success: <CheckCircle2 size={18} className="text-green-500" />,
    error: <XCircle size={18} className="text-red-500" />,
    info: <Info size={18} className="text-blue-500" />,
  }

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[999] animate-bounce-in">
      <div
        className={`flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium ${bgColors[toast.type]}`}
      >
        {icons[toast.type]}
        <span>{toast.message}</span>
      </div>
    </div>
  )
}