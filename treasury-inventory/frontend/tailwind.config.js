/**
 * Design tokens calibrated against an actual screenshot of treasury.go.ke.
 * Estimated visually, not pixel-sampled with a color picker -- close, but
 * fine-tune with your browser's eyedropper tool against the live site for
 * an exact match if that level of precision matters.
 *
 * Note: the `treasury.green` key name is a holdover from an earlier,
 * less-accurate palette guess -- it now holds the site's actual brown/
 * maroon accent color, not green. Renaming the key would require touching
 * every component that references `bg-treasury-green` etc., so the value
 * was updated in place instead. Purely a naming quirk, not a bug.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        treasury: {
          // Primary accent -- the warm brown/maroon used for the top bar,
          // primary buttons, and "Read More" style CTAs on the real site.
          green: {
            DEFAULT: "#6E4023",
            dark: "#4F2D18",
            darker: "#3A2011",
            light: "#F3EAE3",
            50: "#FAF6F3",
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
          // Dark navy used for the icon blocks in the services row
          // (Budget / Public Debt / Investor Relations, etc.)
          navy: {
            DEFAULT: "#16233F",
            dark: "#0D1526",
            light: "#E8EAF0",
          },
          // Standard link blue used throughout the nav and inline links
          link: "#1B5FA8",
          // Genuine Kenya flag green -- kept distinct from the brand
          // accent above (which holds brown, not green) so the small
          // flag-stripe decorative elements still render actual
          // black/red/green flag colors rather than accidentally
          // inheriting the brand accent color.
          "flag-green": "#006600",
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
        "treasury-gradient": "linear-gradient(135deg, #6E4023 0%, #4F2D18 100%)",
        "treasury-sidebar": "linear-gradient(180deg, #16233F 0%, #0D1526 100%)",
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