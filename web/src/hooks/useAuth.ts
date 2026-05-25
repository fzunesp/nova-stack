import { create } from 'zustand'
import pb from '@/lib/pocketbase'
import type { UserRecord } from '@/services/types'

interface AuthState {
  isAuthenticated: boolean
  user: UserRecord | null
  isAdmin: boolean
  isHr: boolean
  isHrOrAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => void
}

export const useAuth = create<AuthState>((set) => {
  const user = pb.authStore.record as unknown as UserRecord | null
  const role = user?.role ?? 'user'
  const isValid = pb.authStore.isValid && user?.isActive !== false

  return {
    isAuthenticated: isValid,
    user,
    isAdmin: role === 'admin',
    isHr: role === 'hr',
    isHrOrAdmin: role === 'admin' || role === 'hr',

    login: async (email: string, password: string) => {
      const authData = await pb.collection('users').authWithPassword(email, password)
      const r = authData.record as unknown as UserRecord
      
      if (r.isActive === false) {
        pb.authStore.clear()
        throw new Error('Your account is inactive. Please contact an administrator.')
      }

      const role = r.role ?? 'user'
      set({
        isAuthenticated: true,
        user: r,
        isAdmin: role === 'admin',
        isHr: role === 'hr',
        isHrOrAdmin: role === 'admin' || role === 'hr',
      })
    },

    logout: () => {
      pb.authStore.clear()
      set({ isAuthenticated: false, user: null, isAdmin: false, isHr: false, isHrOrAdmin: false })
    },

    checkAuth: () => {
      const r = pb.authStore.record as unknown as UserRecord | null
      if (pb.authStore.isValid && r?.isActive !== false) {
        const role = r?.role ?? 'user'
        set({
          isAuthenticated: true,
          user: r,
          isAdmin: role === 'admin',
          isHr: role === 'hr',
          isHrOrAdmin: role === 'admin' || role === 'hr',
        })
      } else {
        if (pb.authStore.isValid) pb.authStore.clear()
        set({ isAuthenticated: false, user: null, isAdmin: false, isHr: false, isHrOrAdmin: false })
      }
    },
  }
})
