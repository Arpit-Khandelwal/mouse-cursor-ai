import {
  app,
  BrowserWindow,
  ipcMain,
  desktopCapturer,
  screen,
  globalShortcut,
  Tray,
  Menu,
  nativeImage
} from 'electron'
import { join } from 'path'
import { existsSync, readFileSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { GuidanceResponse } from '../shared/types'

const log = {
  info: (...args: unknown[]) => console.log('[INFO]', new Date().toISOString(), ...args),
  error: (...args: unknown[]) => console.error('[ERROR]', new Date().toISOString(), ...args),
  debug: (...args: unknown[]) => console.log('[DEBUG]', new Date().toISOString(), ...args),
  warn: (...args: unknown[]) => console.warn('[WARN]', new Date().toISOString(), ...args)
}

function loadEnv(): void {
  const envPaths = [
    join(__dirname, '../../.env'),
    join(app.getAppPath(), '.env'),
    join(process.cwd(), '.env')
  ]

  for (const envPath of envPaths) {
    if (existsSync(envPath)) {
      log.info('Loading .env from:', envPath)
      const content = readFileSync(envPath, 'utf-8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=')
          const value = valueParts.join('=')
          if (key && value) {
            process.env[key.trim()] = value.trim()
          }
        }
      }
      break
    }
  }
}

loadEnv()

let overlayWindow: BrowserWindow | null = null
let tray: Tray | null = null
let screenDimensions = { width: 1920, height: 1080 }

const LLM_API_KEY = process.env.LLM_API_KEY || ''
const LLM_BASE_URL = process.env.LLM_BASE_URL || 'https://api.anthropic.com'
const LLM_MODEL = process.env.LLM_MODEL || 'claude-sonnet-4-20250514'

log.info('='.repeat(50))
log.info('Mouse Cursor AI Starting')
log.info('  URL:', LLM_BASE_URL)
log.info('  Model:', LLM_MODEL)
log.info('  API Key:', LLM_API_KEY ? `${LLM_API_KEY.substring(0, 15)}...` : 'NOT SET')
log.info('='.repeat(50))

function getSystemPrompt(width: number, height: number): string {
  const platform = process.platform === 'darwin' ? 'macOS' : process.platform === 'win32' ? 'Windows' : 'Linux'
  return `You help users navigate their ${platform} computer screen. The screenshot is ${width}x${height} pixels.

RESPOND WITH ONLY VALID JSON in this format:
{
  "steps": [
    {
      "x": <pixel X from left edge, 0-${width}>,
      "y": <pixel Y from top edge, 0-${height}>,
      "action": "click",
      "element": "<what to click>",
      "instruction": "<what to do>"
    }
  ],
  "summary": "<what this accomplishes>"
}

Be precise with coordinates - aim for CENTER of clickable elements.
The coordinate system: (0,0) is top-left, (${width},${height}) is bottom-right.`
}

async function analyzeWithVision(
  question: string,
  imageBase64: string,
  width: number,
  height: number
): Promise<GuidanceResponse> {
  log.info('analyzeWithVision:', { question, imageKB: Math.round(imageBase64.length / 1024), width, height })

  if (!LLM_API_KEY) {
    throw new Error('No API key configured. Set LLM_API_KEY in .env')
  }

  const isAnthropic = LLM_BASE_URL.includes('anthropic')
  const systemPrompt = getSystemPrompt(width, height)
  const userMessage = `Screenshot is ${width}x${height} pixels. User wants to: "${question}". Return JSON with exact pixel coordinates.`

  try {
    const startTime = Date.now()
    let responseText: string

    if (isAnthropic) {
      const response = await fetch(`${LLM_BASE_URL}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': LLM_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: LLM_MODEL,
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
              { type: 'text', text: userMessage }
            ]
          }]
        })
      })

      if (!response.ok) throw new Error(`API error: ${await response.text()}`)
      const data = await response.json()
      responseText = data.content?.[0]?.text || ''
    } else {
      const response = await fetch(`${LLM_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${LLM_API_KEY}`
        },
        body: JSON.stringify({
          model: LLM_MODEL,
          max_tokens: 1024,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
                { type: 'text', text: userMessage }
              ]
            }
          ]
        })
      })

      if (!response.ok) throw new Error(`API error: ${await response.text()}`)
      const data = await response.json()
      responseText = data.choices?.[0]?.message?.content || ''
    }

    log.info('API response in', Date.now() - startTime, 'ms')
    return parseResponse(responseText)
  } catch (error) {
    log.error('analyzeWithVision failed:', error)
    throw error
  }
}

function parseResponse(text: string): GuidanceResponse {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    log.error('No JSON found in:', text.substring(0, 300))
    throw new Error('Could not parse response as JSON')
  }

  const parsed = JSON.parse(jsonMatch[0])
  log.info('Parsed:', { steps: parsed.steps?.length, summary: parsed.summary })
  return parsed
}

function createOverlayWindow(): void {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize
  screenDimensions = { width, height }
  log.info('Screen dimensions (CSS pixels):', screenDimensions)

  overlayWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    focusable: true,
    fullscreenable: false,
    show: false,
    ...(process.platform === 'darwin' && { type: 'panel', hiddenInMissionControl: true }),
    ...(process.platform === 'win32' && { type: 'toolbar' }),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  overlayWindow.setAlwaysOnTop(true, 'screen-saver')
  if (process.platform === 'darwin') {
    overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  }

  overlayWindow.on('ready-to-show', () => overlayWindow?.show())

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    overlayWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    overlayWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createTray(): void {
  const iconPath = join(__dirname, '../../resources/icon.png')
  let icon: nativeImage
  try {
    icon = nativeImage.createFromPath(iconPath)
    if (icon.isEmpty()) icon = nativeImage.createEmpty()
  } catch {
    icon = nativeImage.createEmpty()
  }
  if (process.platform === 'darwin') icon = icon.resize({ width: 16, height: 16 })

  tray = new Tray(icon)
  tray.setToolTip('Mouse Cursor AI')
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show (⌘+Shift+/)', click: () => { overlayWindow?.webContents.send('show-input-modal'); overlayWindow?.show(); overlayWindow?.focus() } },
    { type: 'separator' },
    { label: `${LLM_MODEL}`, enabled: false },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]))
  tray.on('click', () => { overlayWindow?.webContents.send('show-input-modal'); overlayWindow?.show(); overlayWindow?.focus() })
}

function registerGlobalShortcut(): void {
  const shortcut = process.platform === 'darwin' ? 'Command+Shift+/' : 'Control+Shift+/'
  globalShortcut.register(shortcut, () => {
    overlayWindow?.webContents.send('show-input-modal')
    overlayWindow?.show()
    overlayWindow?.focus()
  })
}

ipcMain.on('set-clickthrough', (_, enabled: boolean) => {
  overlayWindow?.setIgnoreMouseEvents(enabled, enabled ? { forward: true } : undefined)
})

ipcMain.handle('capture-screen', async () => {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize
  
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width, height }
  })

  if (sources.length > 0) {
    const thumbnail = sources[0].thumbnail
    const jpegBuffer = thumbnail.toJPEG(60)
    const base64 = jpegBuffer.toString('base64')
    log.info('Screenshot:', { width, height, sizeKB: Math.round(base64.length / 1024) })
    return { dataUrl: `data:image/jpeg;base64,${base64}`, width, height }
  }
  return null
})

ipcMain.handle('analyze-screen', async (_, question: string, imageData: { dataUrl: string; width: number; height: number }) => {
  const base64 = imageData.dataUrl.replace(/^data:image\/\w+;base64,/, '')
  return analyzeWithVision(question, base64, imageData.width, imageData.height)
})

ipcMain.on('hide-overlay', () => overlayWindow?.webContents.send('reset-state'))

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.mousecursor.ai')
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))
  createOverlayWindow()
  createTray()
  registerGlobalShortcut()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createOverlayWindow() })
})

app.on('will-quit', () => globalShortcut.unregisterAll())
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
