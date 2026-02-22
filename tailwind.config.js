/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          yellow: '#F9D85A',
          gray: '#575756',
          dark: '#333333',
          light: '#f4f4f4',
        }
      }
    }
  },
  plugins: [],
}