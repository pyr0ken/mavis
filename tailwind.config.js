/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        island: {
          dark: "#0b0f19",
          base: "#000000",
          card: "rgba(14, 16, 24, 0.94)",
          border: "rgba(255, 255, 255, 0.12)"
        }
      },
      animation: {
        'spin-slow': 'spin 6s linear infinite',
      }
    },
  },
  plugins: [],
}
