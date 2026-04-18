/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#f7f8fb",
        panel: "#ffffff",
        border: "#d9deea",
        ink: "#142033",
        muted: "#5d6b82",
        input: "#0f766e",
        module: "#2563eb",
        functional: "#ca8a04"
      },
      boxShadow: {
        panel: "0 16px 40px rgba(15, 23, 42, 0.08)",
        node: "0 8px 18px rgba(15, 23, 42, 0.08)",
        selected: "0 0 0 2px rgba(37, 99, 235, 0.16), 0 14px 28px rgba(37, 99, 235, 0.18)"
      },
      borderRadius: {
        xl2: "18px"
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
