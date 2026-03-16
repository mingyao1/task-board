import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Background surfaces
        surface: {
          base: '#0F0F10',
          card: '#18181B',
          elevated: '#1C1C1F',
        },
        // Border shades
        border: {
          subtle: '#27272A',
          hover: '#3F3F46',
        },
        // Text shades
        content: {
          primary: '#FAFAFA',
          secondary: '#A1A1AA',
          muted: '#71717A',
        },
        // Accent
        accent: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
        },
        // Status colors
        status: {
          todo: '#A1A1AA',
          in_progress: '#3B82F6',
          in_review: '#F59E0B',
          done: '#10B981',
        },
        // Priority colors
        priority: {
          high: '#EF4444',
          normal: '#F59E0B',
          low: '#6B7280',
        },
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
      },
      minWidth: {
        '70': '280px',
      },
      width: {
        '60': '240px',
        '120': '480px',
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
