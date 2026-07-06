/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js}"],
  theme: {
    screens: {
      sm: "40rem",
      md: "48rem",
      lg: "64rem",
      xl: "80rem",
      "2xl": "96rem",
    },
    extend: {
      fontFamily: {
        display: ["Inter", "PingFang SC", "Microsoft YaHei", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 1.625rem rgba(52, 211, 255, 0.32)",
      },
    },
  },
  plugins: [],
};
