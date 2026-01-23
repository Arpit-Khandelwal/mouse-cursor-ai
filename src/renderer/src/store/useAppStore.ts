import { create } from 'zustand'
import { CursorStep } from '../../../shared/types'

interface AppState {
  isModalOpen: boolean
  isProcessing: boolean
  currentStepIndex: number
  steps: CursorStep[]
  error: string | null
  summary: string | null

  openModal: () => void
  closeModal: () => void
  setProcessing: (processing: boolean) => void
  setSteps: (steps: CursorStep[], summary: string) => void
  nextStep: () => void
  previousStep: () => void
  reset: () => void
  setError: (error: string | null) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  isModalOpen: false,
  isProcessing: false,
  currentStepIndex: 0,
  steps: [],
  error: null,
  summary: null,

  openModal: () => set({ isModalOpen: true, error: null }),
  closeModal: () => set({ isModalOpen: false }),

  setProcessing: (processing) => set({ isProcessing: processing }),

  setSteps: (steps, summary) =>
    set({
      steps,
      summary,
      currentStepIndex: 0,
      isModalOpen: false,
      isProcessing: false
    }),

  nextStep: () => {
    const { currentStepIndex, steps } = get()
    if (currentStepIndex < steps.length - 1) {
      set({ currentStepIndex: currentStepIndex + 1 })
    } else {
      get().reset()
    }
  },

  previousStep: () => {
    const { currentStepIndex } = get()
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1 })
    }
  },

  reset: () =>
    set({
      isModalOpen: false,
      isProcessing: false,
      currentStepIndex: 0,
      steps: [],
      error: null,
      summary: null
    }),

  setError: (error) => set({ error, isProcessing: false })
}))
