import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { GuidanceResponse } from '../shared/types'

interface ScreenCapture {
  dataUrl: string
  width: number
  height: number
}

const api = {
  captureScreen: (): Promise<ScreenCapture | null> => ipcRenderer.invoke('capture-screen'),

  analyzeScreen: (question: string, imageData: ScreenCapture): Promise<GuidanceResponse> =>
    ipcRenderer.invoke('analyze-screen', question, imageData),

  setClickthrough: (enabled: boolean): void => {
    ipcRenderer.send('set-clickthrough', enabled)
  },

  hideOverlay: (): void => {
    ipcRenderer.send('hide-overlay')
  },

  onShowInputModal: (callback: () => void): (() => void) => {
    const handler = (): void => callback()
    ipcRenderer.on('show-input-modal', handler)
    return () => ipcRenderer.removeListener('show-input-modal', handler)
  },

  onResetState: (callback: () => void): (() => void) => {
    const handler = (): void => callback()
    ipcRenderer.on('reset-state', handler)
    return () => ipcRenderer.removeListener('reset-state', handler)
  },

  onWindowBlur: (callback: () => void): (() => void) => {
    const handler = (): void => callback()
    ipcRenderer.on('window-blur', handler)
    return () => ipcRenderer.removeListener('window-blur', handler)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error - fallback for non-isolated context
  window.electron = electronAPI
  // @ts-expect-error - fallback for non-isolated context
  window.api = api
}
