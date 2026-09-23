/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './App.tsx',
    './index.tsx',
    './constants.tsx',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--canvas)',
        surface: 'var(--surface)',
        surface2: 'var(--surface-2)',
        elevated: 'var(--elevated)',
        ink: 'var(--ink)',
        inksoft: 'var(--ink-soft)',
        inkmuted: 'var(--ink-muted)',
        line: 'var(--line)',
        linesoft: 'var(--line-soft)',
        brand: 'var(--brand)',
        brandsoft: 'var(--brand-soft)',
        accent: 'var(--accent)',
        accentfg: 'var(--accent-fg)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
