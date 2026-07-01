import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'usaer' | 'usaer-dark'

interface UiState {
  globalLoading: boolean
  theme: ThemeMode
  setGlobalLoading: (loading: boolean) => void
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      globalLoading: false,
      theme: 'usaer',
      setGlobalLoading: (loading) => set({ globalLoading: loading }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set({ theme: get().theme === 'usaer' ? 'usaer-dark' : 'usaer' }),
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
)
