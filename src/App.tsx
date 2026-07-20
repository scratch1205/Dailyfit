import { Routes, Route, Navigate } from 'react-router-dom'
import ClosetPage from './pages/ClosetPage'
import OutfitBuilderPage from './pages/OutfitBuilderPage'
import CalendarPage from './pages/CalendarPage'
import BottomNav from './components/BottomNav'
import Toast from './components/Toast'

/**
 * App 根组件
 * - 定义路由
 * - 渲染底部导航
 * - 全局 Toast 容器
 */
export default function App() {
  return (
    <div className="flex flex-col min-h-dvh bg-cream">
      {/* 主内容区（底部留出导航栏高度） */}
      <main className="flex-1 pb-20 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/closet" replace />} />
          <Route path="/closet" element={<ClosetPage />} />
          <Route path="/builder" element={<OutfitBuilderPage />} />
          <Route path="/builder/:date" element={<OutfitBuilderPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="*" element={<Navigate to="/closet" replace />} />
        </Routes>
      </main>

      {/* 底部固定导航 */}
      <BottomNav />

      {/* 全局 Toast */}
      <Toast />
    </div>
  )
}