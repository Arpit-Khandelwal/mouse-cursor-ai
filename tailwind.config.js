/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/src/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        ghost: {
          primary: 'rgba(100, 150, 255, 0.8)',
          glow: 'rgba(100, 150, 255, 0.4)',
          ring: 'rgba(100, 150, 255, 0.6)'
        }
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.5s ease-in-out infinite',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.3s ease-out'
      },
      keyframes: {
        'pulse-ring': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.6' },
          '50%': { transform: 'scale(1.3)', opacity: '0.3' }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    }
  },
  plugins: []
}
