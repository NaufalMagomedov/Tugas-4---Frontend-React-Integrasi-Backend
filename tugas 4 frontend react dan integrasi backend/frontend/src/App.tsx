import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout.tsx'
import { ProtectedRoute } from './components/ProtectedRoute.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { ToastProvider } from './context/ToastContext.tsx'
import { AdminDashboardPage } from './pages/AdminDashboardPage.tsx'
import { AdminStallPage } from './pages/AdminStallPage.tsx'
import { ForbiddenPage } from './pages/ForbiddenPage.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { NotFoundPage } from './pages/NotFoundPage.tsx'
import { OwnerDashboardPage } from './pages/OwnerDashboardPage.tsx'
import { ProfilePage } from './pages/ProfilePage.tsx'
import { RegisterPage } from './pages/RegisterPage.tsx'
import { StallDetailPage } from './pages/StallDetailPage.tsx'
import StallListDemo from './pages/StallListDemo.tsx'

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="stalls/:id" element={<StallDetailPage />} />
              <Route path="forbidden" element={<ForbiddenPage />} />
              <Route path="demo" element={<StallListDemo />} />

              {/* Guard di frontend hanya untuk UX; backend tetap memeriksa sesi dan role. */}
              <Route element={<ProtectedRoute />}>
                <Route path="profile" element={<ProfilePage />} />
              </Route>
              <Route element={<ProtectedRoute roles={['owner']} />}>
                <Route path="owner" element={<OwnerDashboardPage />} />
              </Route>
              <Route element={<ProtectedRoute roles={['admin']} />}>
                <Route path="admin" element={<AdminDashboardPage />} />
                <Route path="admin/stalls/:id" element={<AdminStallPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App