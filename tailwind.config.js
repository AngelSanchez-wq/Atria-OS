/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', card: 'var(--card)', ink: 'var(--ink)', muted: 'var(--muted)',
        line: 'var(--line)', accent: 'var(--accent)', 'accent-strong': 'var(--accent-strong)',
        soft: 'var(--soft)', warm: 'var(--warm)', 'warm-ink': 'var(--warm-ink)',
      },
      fontFamily: {
        display: ['Fredoka', 'Nunito', 'system-ui', 'sans-serif'],
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
