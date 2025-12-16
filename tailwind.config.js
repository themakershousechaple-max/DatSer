/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef5ff',
          100: '#d9e8ff',
          200: '#bcd7ff',
          300: '#8ec1ff',
          400: '#59a2ff',
          500: '#3b8bff',  // More vibrant blue
          600: '#1e6fff',  // Premium blue
          700: '#165de0',
          800: '#184bb5',
          900: '#1a408f',
        },
        // Google-style dark mode colors (true black/dark, no blue tint)
        gray: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#303030',  // Cards/surfaces in dark mode
          800: '#212121',  // Elevated surfaces in dark mode
          900: '#121212',  // Main background in dark mode (Google dark)
          950: '#0a0a0a',  // Deepest black
        }
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}