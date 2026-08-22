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
            light: "#E7F3EC",
          },
          red: {
            DEFAULT: "#BE1E2D",
            dark: "#8F1621",
          },
          gold: {
            DEFAULT: "#C8A951",
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
      },
    },
  },
  plugins: [],
};
