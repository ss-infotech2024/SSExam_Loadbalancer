/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        // Company lavender — used for primary actions, active nav and focus, not for surfaces at large
        brand: {
          50:  "#f6f4fe",
          100: "#eeeafd",
          200: "#ddd6fb",
          300: "#c4b7f6",
          400: "#a792ef",
          500: "#8b6fe6",
          600: "#7553d6",
          700: "#6342bb",
          800: "#523799",
          900: "#45307c",
          950: "#2b1c52",
        },
        canvas: "#f7f7fb",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)",
        pop:  "0 12px 32px -8px rgba(16, 24, 40, 0.18), 0 4px 8px -4px rgba(16, 24, 40, 0.08)",
      },
      keyframes: {
        "fade-in":  { from: { opacity: 0 }, to: { opacity: 1 } },
        "scale-in": { from: { opacity: 0, transform: "translateY(8px) scale(.98)" }, to: { opacity: 1, transform: "none" } },
        "slide-in-right": { from: { opacity: 0, transform: "translateX(16px)" }, to: { opacity: 1, transform: "none" } },
        "slide-in-left":  { from: { transform: "translateX(-100%)" }, to: { transform: "none" } },
        "slide-down": { from: { opacity: 0, transform: "translate(-50%, -12px)" }, to: { opacity: 1, transform: "translate(-50%, 0)" } },
      },
      animation: {
        "fade-in":  "fade-in .15s ease-out",
        "scale-in": "scale-in .18s ease-out",
        "slide-in-right": "slide-in-right .2s ease-out",
        "slide-in-left":  "slide-in-left .22s ease-out",
        "slide-down": "slide-down .25s ease-out",
      },
    },
  },
  plugins: [],
};
