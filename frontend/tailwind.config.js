/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Paleta corporativa
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        dark: {
          50: 'rgb(var(--miabot-dark-50) / <alpha-value>)',
          100: 'rgb(var(--miabot-dark-100) / <alpha-value>)',
          200: 'rgb(var(--miabot-dark-200) / <alpha-value>)',
          300: 'rgb(var(--miabot-dark-300) / <alpha-value>)',
          400: 'rgb(var(--miabot-dark-400) / <alpha-value>)',
          500: 'rgb(var(--miabot-dark-500) / <alpha-value>)',
          600: 'rgb(var(--miabot-dark-600) / <alpha-value>)',
          700: 'rgb(var(--miabot-dark-700) / <alpha-value>)',
          800: 'rgb(var(--miabot-dark-800) / <alpha-value>)',
          900: 'rgb(var(--miabot-dark-900) / <alpha-value>)',
          950: 'rgb(var(--miabot-dark-950) / <alpha-value>)',
        },
        accent: {
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          info: '#3b82f6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      }
    },
  },
  plugins: [],
}
