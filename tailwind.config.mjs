/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FBFBFA',
        ink:   '#1A1A1A',
        stone: '#706E6B',
        oat:   '#F1EFEA',
        clay:  '#A37B65',
        moss:  '#4A5E4A',
      },
      fontFamily: {
        serif: ['Fraunces', 'serif'],
        sans:  ['Jost', 'sans-serif'],
      },
    },
  },
};
