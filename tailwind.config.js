/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontSize: {
        // Fluid type scale: scales smoothly from 360px phones to large laptops
        'display-xl': ['clamp(2.5rem, 1.6rem + 4.5vw, 4.5rem)', { lineHeight: '1.05' }],
        'display-lg': ['clamp(2rem, 1.4rem + 2.6vw, 3.25rem)', { lineHeight: '1.1' }],
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: {
          50: '#fdfbf7',
          100: '#faf6ee',
          200: '#f3ece0',
          300: '#e8dccb',
          400: '#d6c4a8',
        },
        taupe: {
          100: '#ece4da',
          200: '#dccfbf',
          300: '#c7b5a0',
          400: '#a8937b',
          500: '#8c7560',
          600: '#6f5c49',
        },
        espresso: {
          500: '#5a4236',
          600: '#46322a',
          700: '#35251e',
          800: '#261a15',
          900: '#1a110d',
        },
        bronze: {
          300: '#d9b48a',
          400: '#c79a64',
          500: '#b07d45',
          600: '#946333',
          700: '#7a4f27',
        },
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(32px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.35s ease-out both',
        'scale-in': 'scale-in 0.25s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-up': 'slide-up 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};
