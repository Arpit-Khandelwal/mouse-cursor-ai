import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'

function InputModal(): JSX.Element {
  const [question, setQuestion] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { isProcessing, error, closeModal, setProcessing, setSteps, setError, reset } =
    useAppStore()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!question.trim() || isProcessing) return

    setProcessing(true)
    setError(null)

    try {
      const screenshot = await window.api.captureScreen()
      if (!screenshot) {
        throw new Error('Failed to capture screen')
      }

      const response = await window.api.analyzeScreen(question.trim(), screenshot)

      if (response.steps.length === 0) {
        setError(response.summary || 'Could not determine how to help with that.')
        return
      }

      setSteps(response.steps, response.summary)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(message)
    }
  }

  const handleClose = (): void => {
    reset()
    window.api.setClickthrough(true)
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-center justify-center z-[100000]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
          onClick={handleClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        <motion.div
          className="relative bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700/50 p-6 w-[480px] max-w-[90vw]"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5.5 3.21V20.8L10.38 15.92H16.74L5.5 3.21Z"
                    fill="white"
                    stroke="white"
                    strokeWidth="1"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg">Mouse Cursor AI</h2>
                <p className="text-gray-400 text-sm">What do you want to do?</p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., How do I turn on dark mode?"
                className="w-full bg-gray-800/80 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                disabled={isProcessing}
              />

              {isProcessing && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <motion.div
                    className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
              )}
            </div>

            {error && (
              <motion.div
                className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-red-400 text-sm">{error}</p>
              </motion.div>
            )}

            <div className="flex items-center justify-between mt-4">
              <p className="text-gray-500 text-xs">Press Enter to submit, Esc to close</p>

              <button
                type="submit"
                disabled={!question.trim() || isProcessing}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-700 transition-all"
              >
                {isProcessing ? 'Analyzing...' : 'Show Me'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default InputModal
