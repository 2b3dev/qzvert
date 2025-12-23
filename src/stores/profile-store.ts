import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Profile, ProfileUpdate } from '../types/database'

interface ProfileState {
  profile: Profile | null
  isLoading: boolean
  error: string | null

  // Actions
  fetchProfile: (userId: string) => Promise<void>
  updateProfile: (userId: string, updates: ProfileUpdate) => Promise<{ error: Error | null }>
  clearProfile: () => void
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  isLoading: false,
  error: null,

  fetchProfile: async (userId: string) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      set({ profile: data as Profile })
    } catch (error) {
      console.error('Error fetching profile:', error)
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  },

  updateProfile: async (userId: string, updates: ProfileUpdate) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      set({ profile: data as Profile })
      return { error: null }
    } catch (error) {
      console.error('Error updating profile:', error)
      set({ error: (error as Error).message })
      return { error: error as Error }
    } finally {
      set({ isLoading: false })
    }
  },

  clearProfile: () => {
    set({ profile: null, error: null })
  }
}))
