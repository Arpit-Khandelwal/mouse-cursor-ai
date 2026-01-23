import { motion } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'

function StepControls(): JSX.Element {
  const { steps, currentStepIndex, nextStep, previousStep, reset, summary } = useAppStore()

  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === steps.length - 1

  const handleDone = (): void => {
    reset()
    window.api.setClickthrough(true)
  }

  return (
    <motion.div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[99996]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700/50 px-6 py-4">
        <div className="flex items-center gap-6">
          <div className="text-center min-w-[120px]">
            <p className="text-white font-medium">
              Step {currentStepIndex + 1} of {steps.length}
            </p>
            {summary && <p className="text-gray-400 text-xs mt-1 truncate max-w-[200px]">{summary}</p>}
          </div>

          <div className="h-8 w-px bg-gray-700" />

          <div className="flex items-center gap-2">
            <button
              onClick={previousStep}
              disabled={isFirstStep}
              className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {isLastStep ? (
              <button
                onClick={handleDone}
                className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-all"
              >
                Done
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:from-blue-600 hover:to-purple-700 transition-all flex items-center gap-2"
              >
                Next
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 6L15 12L9 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>

          <div className="h-8 w-px bg-gray-700" />

          <button
            onClick={handleDone}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
            title="Close (Esc)"
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
      </div>
    </motion.div>
  )
}

export default StepControls
