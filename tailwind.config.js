/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        abyss: '#0A0B0E',
        slate: {
          850: '#15181E',
          950: '#0c0e12',
        },
        granite: '#252B35',
        spectral: '#00F5D4',
        amber: {
          portal: '#FFB703',
        },
        crimson: {
          tension: '#EF233C',
        },
        bone: '#F4F4F6',
        ash: '#8E98A5',
      },
      fontFamily: {
        display: ['Syne', 'Space Grotesk', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'spectral-glow': '0 0 25px rgba(0, 245, 212, 0.25)',
        'portal-glow': '0 0 25px rgba(255, 183, 3, 0.3)',
        'tension-glow': '0 0 25px rgba(239, 35, 60, 0.3)',
      },
    },
  },
  plugins: [],
}

