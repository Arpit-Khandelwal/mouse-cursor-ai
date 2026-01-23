import { useEffect } from 'react'
import { useAppStore } from './store/useAppStore'
import InputModal from './components/InputModal'
import GhostCursor from './components/GhostCursor'
import HighlightRing from './components/HighlightRing'
import Tooltip from './components/Tooltip'
import StepControls from './components/StepControls'

function App(): JSX.Element {
  const { isModalOpen, steps, currentStepIndex, openModal, reset } = useAppStore()

  const currentStep = steps[currentStepIndex]
  const hasSteps = steps.length > 0

  useEffect(() => {
    const unsubscribeModal = window.api.onShowInputModal(() => {
      window.api.setClickthrough(false)
      openModal()
    })

    const unsubscribeReset = window.api.onResetState(() => {
      reset()
    })

    return () => {
      unsubscribeModal()
      unsubscribeReset()
    }
  }, [openModal, reset])

  useEffect(() => {
    if (!isModalOpen && !hasSteps) {
      window.api.setClickthrough(true)
    } else {
      window.api.setClickthrough(false)
    }
  }, [isModalOpen, hasSteps])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        reset()
        window.api.setClickthrough(true)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [reset])

  useEffect(() => {
    if (currentStep) {
      console.log('[Ghost] Target:', { x: currentStep.x, y: currentStep.y, element: currentStep.element })
    }
  }, [currentStep])

  return (
    <div className="relative w-full h-full">
      {isModalOpen && <InputModal />}

      {hasSteps && currentStep && (
        <>
          <GhostCursor x={currentStep.x} y={currentStep.y} />
          <HighlightRing x={currentStep.x} y={currentStep.y} />
          <Tooltip
            x={currentStep.x}
            y={currentStep.y}
            instruction={currentStep.instruction}
            element={currentStep.element}
          />
          <StepControls />
        </>
      )}
    </div>
  )
}

export default App
