/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#fff7f7",
          100: "#ffecec",
          200: "#ffd6d6",
          300: "#ffb3b3",
          400: "#ff8080",
          500: "#E04F4F", // brand primary (derived from #3B2F2F vibe but warmer for UI)
          600: "#c33e3e",
          700: "#9f3434",
          800: "#822f2f",
          900: "#6d2b2b"
        }
      },
      boxShadow: {
        soft: "0 8px 24px rgba(0,0,0,0.08)",
      },
      borderRadius: {
        xl2: "1rem"
      }
    },
  },
  plugins: [],
}
