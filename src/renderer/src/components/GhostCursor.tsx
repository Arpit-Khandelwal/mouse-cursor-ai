import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface GhostCursorProps {
  x: number
  y: number
}

function GhostCursor({ x, y }: GhostCursorProps): JSX.Element {
  const [trail, setTrail] = useState<{ x: number; y: number; id: number }[]>([])

  useEffect(() => {
    const newPoint = { x, y, id: Date.now() }
    setTrail((prev) => [...prev.slice(-5), newPoint])
  }, [x, y])

  return (
    <>
      {trail.map((point, index) => (
        <motion.div
          key={point.id}
          className="fixed pointer-events-none z-[99998]"
          initial={{ opacity: 0.3, scale: 0.3 }}
          animate={{
            x: point.x - 8,
            y: point.y - 8,
            opacity: 0,
            scale: 0.1
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div
            className="w-4 h-4 rounded-full"
            style={{
              background: `rgba(100, 150, 255, ${0.1 + index * 0.05})`
            }}
          />
        </motion.div>
      ))}

      <motion.div
        className="fixed pointer-events-none z-[99999]"
        initial={{ opacity: 0, scale: 0.5, x: window.innerWidth / 2, y: window.innerHeight / 2 }}
        animate={{
          x: x - 16,
          y: y - 4,
          opacity: 1,
          scale: 1
        }}
        transition={{
          type: 'spring',
          stiffness: 120,
          damping: 20,
          mass: 1
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ filter: 'drop-shadow(0 0 8px rgba(100, 150, 255, 0.8))' }}
        >
          <path
            d="M5.5 3.21V20.8L10.38 15.92H16.74L5.5 3.21Z"
            fill="rgba(80, 130, 255, 0.95)"
            stroke="white"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>

        <motion.div
          className="absolute -top-2 -left-2 w-16 h-16 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(100, 150, 255, 0.4) 0%, rgba(100, 150, 255, 0.1) 50%, transparent 70%)'
          }}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.6, 0.2, 0.6]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </motion.div>
    </>
  )
}

export default GhostCursor
