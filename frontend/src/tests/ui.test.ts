import { describe, it, expect, beforeEach } from 'vitest'
import { useUiStore } from '../stores/ui'

describe('ui store', () => {
    beforeEach(() => {
        useUiStore.setState({ globalLoading: false })
    })

    it('has initial state', () => {
        expect(useUiStore.getState().globalLoading).toBe(false)
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
})
