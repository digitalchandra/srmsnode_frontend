
import { Navigate, Outlet } from 'react-router-dom'

export default function SuperAdminProtectedRoute() {
  const token = sessionStorage.getItem('superAdminAccessToken')

  if (!token) {
    return <Navigate to="/super-admin/login" replace />
  }

  return <Outlet />
}
