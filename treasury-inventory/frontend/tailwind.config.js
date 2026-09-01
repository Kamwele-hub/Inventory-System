/**
 * Design tokens inspired by Kenya's national colours as they appear across
 * the National Treasury's public branding (flag black/red/green/white, and
 * the gold used in the coat of arms). Exact hex values were not pixel-
 * sampled from treasury.go.ke's live stylesheet (not directly accessible
 * from this environment) -- swap `treasury.green` / `treasury.red` /
 * `treasury.gold` below for the official brand hex codes if/when you have
 * the Treasury's style guide.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        treasury: {
          green: {
            DEFAULT: "#0A6C3B",
            dark: "#064D29",
            darker: "#043319",
            light: "#E7F3EC",
            50: "#F0F9F4",
          },
          red: {
            DEFAULT: "#BE1E2D",
            dark: "#8F1621",
            light: "#FDECEE",
          },
          gold: {
            DEFAULT: "#C8A951",
            dark: "#A8892F",
            light: "#F7EFD9",
          },
          ink: "#14171A",
          slate: "#4B5563",
        },
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(20, 23, 26, 0.06), 0 1px 3px 0 rgba(20, 23, 26, 0.08)",
        "card-hover": "0 4px 10px 0 rgba(20, 23, 26, 0.08), 0 2px 4px 0 rgba(20, 23, 26, 0.06)",
        panel: "0 8px 24px -4px rgba(20, 23, 26, 0.12), 0 2px 8px -2px rgba(20, 23, 26, 0.08)",
      },
      backgroundImage: {
        "treasury-gradient": "linear-gradient(135deg, #0A6C3B 0%, #064D29 100%)",
        "treasury-sidebar": "linear-gradient(180deg, #14171A 0%, #0B0D0F 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.25s ease-out",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        slideUp: {
          "0%": { opacity: 0, transform: "translateY(6px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};