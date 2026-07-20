import { Routes, Route, Navigate } from 'react-router-dom'
import ClosetPage from './pages/ClosetPage'
import OutfitBuilderPage from './pages/OutfitBuilderPage'
import CalendarPage from './pages/CalendarPage'
import ProfilePage from './pages/ProfilePage'
import BottomNav from './components/BottomNav'
import Toast from './components/Toast'

export default function App() {
  return (
    <div className="flex flex-col min-h-dvh bg-cream">
      <main className="flex-1 pb-20 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/closet" replace />} />
          <Route path="/closet" element={<ClosetPage />} />
          <Route path="/builder" element={<OutfitBuilderPage />} />
          <Route path="/builder/:date" element={<OutfitBuilderPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/closet" replace />} />
        </Routes>
      </main>
      <BottomNav />
      <Toast />
    </div>
  )
}
