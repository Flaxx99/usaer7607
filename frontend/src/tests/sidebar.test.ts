import { describe, it, expect, beforeEach } from 'vitest'
import { useSidebarStore } from '../stores/sidebar'

describe('sidebar store', () => {
    beforeEach(() => {
        useSidebarStore.setState({ collapsed: false, mobileOpen: false })
    })

    it('has initial state', () => {
        const state = useSidebarStore.getState()
        expect(state.collapsed).toBe(false)
        expect(state.mobileOpen).toBe(false)
    })

    it('toggle flips collapsed to true', () => {
        useSidebarStore.getState().toggle()
        expect(useSidebarStore.getState().collapsed).toBe(true)
    })

    it('toggle flips collapsed back to false', () => {
        // Start from true
        useSidebarStore.setState({ collapsed: true })
        useSidebarStore.getState().toggle()
        expect(useSidebarStore.getState().collapsed).toBe(false)
    })

    it('setMobileOpen sets mobileOpen to true', () => {
        useSidebarStore.getState().setMobileOpen(true)
        expect(useSidebarStore.getState().mobileOpen).toBe(true)
    })

    it('setMobileOpen sets mobileOpen to false', () => {
        // Start from true
        useSidebarStore.setState({ mobileOpen: true })
        useSidebarStore.getState().setMobileOpen(false)
        expect(useSidebarStore.getState().mobileOpen).toBe(false)
    })
})
