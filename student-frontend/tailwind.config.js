/** @type {import('tailwindcss').Config} */
const brandShade = (step) => `rgb(var(--brand-${step}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((step) => [step, brandShade(step)])),
        canvas: '#f7f5f1',
      },
      fontFamily: {
        sans: ['"Figtree Variable"', 'Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgb(41 37 36 / 0.04), 0 1px 3px rgb(41 37 36 / 0.06)',
        lift: '0 4px 12px -2px rgb(41 37 36 / 0.08), 0 2px 4px -2px rgb(41 37 36 / 0.05)',
      },
      keyframes: {
        'fade-up': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
        'slide-in': { from: { transform: 'translateX(-100%)' }, to: { transform: 'none' } },
      },
      animation: {
        'fade-up': 'fade-up 320ms cubic-bezier(0.2, 0.7, 0.2, 1) both',
        'slide-in': 'slide-in 220ms cubic-bezier(0.2, 0.7, 0.2, 1) both',
      },
    },
  },
  plugins: [],
}
