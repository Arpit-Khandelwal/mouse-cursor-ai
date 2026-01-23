import { ElectronAPI } from '@electron-toolkit/preload'
import { GuidanceResponse } from '../shared/types'

interface ScreenCapture {
  dataUrl: string
  width: number
  height: number
}

interface CustomAPI {
  captureScreen: () => Promise<ScreenCapture | null>
  analyzeScreen: (question: string, imageData: ScreenCapture) => Promise<GuidanceResponse>
  setClickthrough: (enabled: boolean) => void
  hideOverlay: () => void
  onShowInputModal: (callback: () => void) => () => void
  onResetState: (callback: () => void) => () => void
  onWindowBlur: (callback: () => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: CustomAPI
  }
}
