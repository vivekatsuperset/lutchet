/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        navy:   { DEFAULT: "#0a0e1a", medium: "#0f1629", light: "#1a2240" },
        amber:  { DEFAULT: "#c8a44a", light: "#e0c06a", dim: "#8a6e30"   },
        ivory:  { DEFAULT: "#e8e4d9", dim: "#b0a890"                      },
        steel:  { DEFAULT: "#4a90e2"                                       },
      },
      fontFamily: {
        serif: ["'EB Garamond'", "Georgia", "serif"],
        sans:  ["'Instrument Sans'", "system-ui", "sans-serif"],
        mono:  ["'JetBrains Mono'", "'Fira Code'", "monospace"],
      },
    },
  },
  plugins: [],
};
