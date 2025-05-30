import { create } from 'zustand'
import { Session } from '@supabase/supabase-js'
import { User } from '../types/auth'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setLoading: (isLoading: boolean) => void
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  session: null,
  isLoading: true,
  setUser: user => set({ user }),
  setSession: session => set({ session }),
  setLoading: isLoading => set({ isLoading }),
}))
