import { motion } from 'framer-motion'

interface HighlightRingProps {
  x: number
  y: number
}

function HighlightRing({ x, y }: HighlightRingProps): JSX.Element {
  return (
    <motion.div
      className="fixed pointer-events-none z-[99997]"
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{
        x: x - 40,
        y: y - 40,
        opacity: 1,
        scale: 1
      }}
      transition={{
        type: 'spring',
        stiffness: 120,
        damping: 20
      }}
    >
      <motion.div
        className="w-20 h-20 rounded-full border-4 border-blue-400"
        style={{
          boxShadow: '0 0 20px rgba(100, 150, 255, 0.6), inset 0 0 20px rgba(100, 150, 255, 0.2)'
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.9, 0.5, 0.9]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />

      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border-2 border-blue-300/40"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.5, 0.1, 0.5]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.3
        }}
      />

      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full border border-blue-200/20"
        animate={{
          scale: [1, 1.6, 1],
          opacity: [0.3, 0, 0.3]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5
        }}
      />
    </motion.div>
  )
}

export default HighlightRing
