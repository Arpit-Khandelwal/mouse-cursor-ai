import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface TooltipProps {
  x: number
  y: number
  instruction: string
  element: string
}

function Tooltip({ x, y, instruction, element }: TooltipProps): JSX.Element {
  const position = useMemo(() => {
    const tooltipWidth = 280
    const tooltipHeight = 80
    const padding = 20
    const offsetFromCursor = 50

    let tooltipX = x + offsetFromCursor
    let tooltipY = y + offsetFromCursor

    if (tooltipX + tooltipWidth > window.innerWidth - padding) {
      tooltipX = x - tooltipWidth - offsetFromCursor
    }

    if (tooltipY + tooltipHeight > window.innerHeight - padding) {
      tooltipY = y - tooltipHeight - offsetFromCursor
    }

    if (tooltipX < padding) {
      tooltipX = padding
    }

    if (tooltipY < padding) {
      tooltipY = padding
    }

    return { x: tooltipX, y: tooltipY }
  }, [x, y])

  return (
    <motion.div
      className="fixed z-[99997] pointer-events-none"
      initial={{ opacity: 0, scale: 0.9, x: position.x, y: position.y }}
      animate={{
        opacity: 1,
        scale: 1,
        x: position.x,
        y: position.y
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
        delay: 0.1
      }}
    >
      <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-xl border border-gray-700/50 max-w-[280px]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-ghost-primary animate-pulse" />
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
            {element}
          </span>
        </div>
        <p className="text-white text-sm leading-relaxed">{instruction}</p>
      </div>
    </motion.div>
  )
}

export default Tooltip
