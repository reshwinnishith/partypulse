/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'monospace'],
      },
      colors: {
        void: '#080810',
        ink: '#0f0f1a',
        surface: '#13131f',
        card: '#1a1a2e',
        border: '#252540',
        muted: '#3a3a5c',
        ghost: '#6b6b9a',
        soft: '#9898c0',
        text: '#e8e8f0',
        bright: '#ffffff',
        neon: '#7c3aed',
        glow: '#a855f7',
        ember: '#f97316',
        spark: '#fbbf24',
        mint: '#10b981',
        rose: '#f43f5e',
      },
    },
  },
  plugins: [],
}
