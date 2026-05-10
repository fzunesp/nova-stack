import { create } from 'zustand'
import pb from '@/lib/pocketbase'

interface AuthState {
  isAuthenticated: boolean
  user: Record<string, unknown> | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => void
}

export const useAuth = create<AuthState>((set) => ({
  isAuthenticated: pb.authStore.isValid,
  user: pb.authStore.record ? { ...pb.authStore.record } : null,

  login: async (email: string, password: string) => {
    const authData = await pb.collection('users').authWithPassword(email, password)
    set({
      isAuthenticated: true,
      user: { ...authData.record },
    })
  },

  logout: () => {
    pb.authStore.clear()
    set({ isAuthenticated: false, user: null })
  },

  checkAuth: () => {
    if (pb.authStore.isValid) {
      set({
        isAuthenticated: true,
        user: pb.authStore.record ? { ...pb.authStore.record } : null,
      })
    } else {
      set({ isAuthenticated: false, user: null })
    }
  },
}))
