import { describe, it, expect, beforeEach } from 'vitest'
import { useUiStore } from '../stores/ui'
import type { ThemeMode } from '../stores/ui'

describe('ui store', () => {
    beforeEach(() => {
        useUiStore.setState({ globalLoading: false, theme: 'usaer' })
    })

    it('has initial state', () => {
        expect(useUiStore.getState().globalLoading).toBe(false)
        expect(useUiStore.getState().theme).toBe('usaer')
    })

    it('setGlobalLoading sets to true', () => {
        useUiStore.getState().setGlobalLoading(true)
        expect(useUiStore.getState().globalLoading).toBe(true)
    })

    it('setGlobalLoading sets to false', () => {
        useUiStore.setState({ globalLoading: true })
        useUiStore.getState().setGlobalLoading(false)
        expect(useUiStore.getState().globalLoading).toBe(false)
    })

    it('setTheme changes theme', () => {
        useUiStore.getState().setTheme('usaer-dark' as ThemeMode)
        expect(useUiStore.getState().theme).toBe('usaer-dark')
    })

    it('toggleTheme switches from usaer to usaer-dark', () => {
        useUiStore.setState({ theme: 'usaer' as ThemeMode })
        useUiStore.getState().toggleTheme()
        expect(useUiStore.getState().theme).toBe('usaer-dark')
    })

    it('toggleTheme switches from usaer-dark to usaer', () => {
        useUiStore.setState({ theme: 'usaer-dark' as ThemeMode })
        useUiStore.getState().toggleTheme()
        expect(useUiStore.getState().theme).toBe('usaer')
    })
})
