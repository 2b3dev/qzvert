import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isInitialized: boolean

  // Actions
  initialize: () => Promise<void>
  hydrateAuth: (user: User | null, session: Session | null) => void
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isInitialized: false,

  initialize: async () => {
    // Skip if already initialized (hydrated from SSR)
    if (get().isInitialized) {
      // Just set up the auth listener
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null
        })
      })
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      set({
        session,
        user: session?.user ?? null,
        isLoading: false,
        isInitialized: true
      })

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null
        })
      })
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ isLoading: false, isInitialized: true })
    }
  },

  // Hydrate auth state from SSR (called before React renders)
  hydrateAuth: (user, session) => {
    set({
      user,
      session,
      isLoading: false,
      isInitialized: true
    })
  },

  signInWithEmail: async (email, password) => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
      set({ user: data.user, session: data.session })
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    } finally {
      set({ isLoading: false })
    }
  },

  signUpWithEmail: async (email, password) => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })
      if (error) throw error
      set({ user: data.user, session: data.session })
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    } finally {
      set({ isLoading: false })
    }
  },

  signInWithGoogle: async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      })
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },

  signOut: async () => {
    set({ isLoading: true })
    try {
      await supabase.auth.signOut()
      set({ user: null, session: null })
    } finally {
      set({ isLoading: false })
    }
  },

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session })
}))
