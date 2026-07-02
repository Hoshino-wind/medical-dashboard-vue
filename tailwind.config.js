/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Inter", "PingFang SC", "Microsoft YaHei", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 26px rgba(52, 211, 255, 0.32)",
      },
    },
  },
  plugins: [],
};
