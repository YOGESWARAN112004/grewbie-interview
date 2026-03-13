import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const INTERVIEW_DURATION = 15 * 60 // 900 seconds

interface Message {
    role: 'user' | 'assistant'
    content: string
    timestamp: number
}

interface InterviewStore {
    status: 'idle' | 'connecting' | 'active' | 'ended' | 'error'
    transcript: Message[]
    callId: string | null
    elapsed: number
    timeRemaining: number
    cameraReady: boolean
    screenReady: boolean
    errorMessage: string | null

    // Actions
    setStatus: (s: InterviewStore['status']) => void
    addMessage: (msg: Message) => void
    setCallId: (id: string) => void
    tick: () => void
    setCameraReady: (v: boolean) => void
    setScreenReady: (v: boolean) => void
    setError: (msg: string) => void
    reset: () => void
}

export const useInterviewStore = create<InterviewStore>()(
    persist(
        (set, get) => ({
            status: 'idle',
            transcript: [],
            callId: null,
            elapsed: 0,
            timeRemaining: INTERVIEW_DURATION,
            cameraReady: false,
            screenReady: false,
            errorMessage: null,

            setStatus: (status) => set({ status }),

            addMessage: (msg) =>
                set((s) => ({ transcript: [...s.transcript, msg] })),

            setCallId: (callId) => set({ callId }),

            tick: () =>
                set((s) => {
                    const elapsed = s.elapsed + 1
                    const timeRemaining = Math.max(INTERVIEW_DURATION - elapsed, 0)
                    return { elapsed, timeRemaining }
                }),

            setCameraReady: (cameraReady) => set({ cameraReady }),
            setScreenReady: (screenReady) => set({ screenReady }),
            setError: (errorMessage) => set({ errorMessage, status: 'error' }),

            reset: () =>
                set({
                    status: 'idle',
                    transcript: [],
                    callId: null,
                    elapsed: 0,
                    timeRemaining: INTERVIEW_DURATION,
                    cameraReady: false,
                    screenReady: false,
                    errorMessage: null,
                }),
        }),
        {
            name: 'interview-storage',
            // Only save timeline, transcript, and callId. Media flags must be re-requested on reload.
            partialize: (state) => ({
                status: state.status === 'connecting' || state.status === 'active' ? 'idle' : state.status, // Force reconnect on reload
                transcript: state.transcript,
                callId: state.callId,
                elapsed: state.elapsed,
                timeRemaining: state.timeRemaining,
            }),
        }
    )
)
