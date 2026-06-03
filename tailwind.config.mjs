/** @type {import('tailwindcss').Config} */
export default {
  // Scoped to the storefront source only. The Sanity Studio route brings its
  // own styling, so Tailwind's preflight is kept out of /studio via
  // `applyBaseStyles: false` in astro.config.mjs.
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md}'],
  theme: {
    extend: {
      colors: {
        // Warm Japandi neutrals — never pure black, gently desaturated.
        paper: '#F4F1EA',
        oat: '#ECE7DB',
        sand: '#E2DBCB',
        ink: '#2A2723',
        stone: '#6F6A5F',
        clay: '#A6694C',
      },
      fontFamily: {
        // Distinctive pairing: a soft optical serif + a quiet geometric sans.
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Jost', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest: '0.3em',
      },
      maxWidth: {
        prose: '68ch',
      },
      transitionTimingFunction: {
        japandi: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
