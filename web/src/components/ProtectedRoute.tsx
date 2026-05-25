import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '@/hooks/useAuth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, checkAuth } = useAuth()
  const [checking, setChecking] = useState(true)
  const location = useLocation()

  useEffect(() => {
    checkAuth()
    setChecking(false)
  }, [checkAuth])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.mustChangePassword && location.pathname !== '/settings') {
    return <Navigate to="/settings?forceChange=true" replace />
  }

  return <>{children}</>
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, checkAuth } = useAuth()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    checkAuth()
    setChecking(false)
  }, [checkAuth])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/crm" replace />
  }

  return <>{children}</>
}
