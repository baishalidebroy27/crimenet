/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        saffron: '#FF9933',
        indiaGreen: '#138808',
        navyBlue: '#000080',
        neonGreen: '#00FF41',
        neonRed: '#FF0040',
        neonYellow: '#FFFF00',
        neonCyan: '#00FFFF',
        hackerBlack: '#0a0a0a',
        hackerGray: '#1a1a1a',
      },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        jetbrains: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        neon: '0 0 20px rgba(0, 255, 65, 0.8)',
        neonRed: '0 0 20px rgba(255, 0, 64, 0.8)',
        neonYellow: '0 0 20px rgba(255, 255, 0, 0.8)',
      }
    },
  },
  plugins: [],
}
