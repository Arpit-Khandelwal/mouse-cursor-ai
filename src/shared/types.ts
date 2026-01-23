export interface CursorStep {
  x: number
  y: number
  action: 'click' | 'double-click' | 'right-click' | 'hover' | 'drag'
  element: string
  instruction: string
}

export interface GuidanceResponse {
  steps: CursorStep[]
  summary: string
}

export interface AppState {
  isModalOpen: boolean
  isProcessing: boolean
  currentStepIndex: number
  steps: CursorStep[]
  error: string | null

  openModal: () => void
  closeModal: () => void
  setProcessing: (processing: boolean) => void
  setSteps: (steps: CursorStep[]) => void
  nextStep: () => void
  previousStep: () => void
  reset: () => void
  setError: (error: string | null) => void
}

export interface ScreenSource {
  id: string
  name: string
  thumbnail: string
  appIcon?: string
}
