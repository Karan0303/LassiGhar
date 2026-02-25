/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        lassi: {
          yellow: "#facc15",
          pink: "#fb7185",
          cream: "#fef3c7"
        }
      }
    }
  },
  plugins: []
};

