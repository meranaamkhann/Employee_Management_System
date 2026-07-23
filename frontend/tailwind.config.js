/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0B0C10',
          900: '#14161C',
          800: '#1C1F27',
          700: '#272B36',
          600: '#3A3F4D',
        },
        paper: {
          50: '#FFFFFF',
          100: '#F6F7F6',
          200: '#ECEDEC',
          300: '#DBDDDC',
        },
        brass: {
          400: '#E4BB5E',
          500: '#C9A227',
          600: '#A6841D',
        },
        slate: {
          450: '#5B7B9A',
        },
        signal: {
          green: '#3FAE7A',
          amber: '#D99A3D',
          rose: '#C9614F',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      spacing: {
        18: '4.5rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,12,16,0.06), 0 8px 24px -8px rgba(11,12,16,0.12)',
        'card-dark': '0 1px 2px rgba(0,0,0,0.3), 0 8px 32px -8px rgba(0,0,0,0.5)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}
