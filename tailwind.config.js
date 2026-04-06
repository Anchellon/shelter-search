/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#276ce5",
          dark: "#0856ad",
          light: "#b3d4fc",
          verylight: "#f1f5fa",
          faint: "#f5f8ff",
        },
        grey: {
          1: "#f9f9f9",
          2: "#f3f5f7",
          3: "#e0e0e0",
          4: "#cecece",
          5: "#888888",
          6: "#666666",
          9: "#242c2e",
        },
        success: {
          bg: "#e8f5e9",
          text: "#2e7d32",
          border: "#81c784",
        },
        danger: {
          bg: "#fde8e8",
          text: "#c62828",
          border: "#ef9a9a",
        },
        warning: {
          bg: "#fff3e0",
          text: "#e65100",
          border: "#ffcc80",
        },
        green: {
          progress: "#01c270",
        },
      },
      borderRadius: {
        sm: "3px",
        DEFAULT: "6px",
        md: "8px",
      },
      boxShadow: {
        card: "0px 2px 4px rgba(0,0,0,0.08)",
        modal: "0px 4px 16px rgba(0,0,0,0.12)",
      },
      fontFamily: {
        sans: ["Open Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
