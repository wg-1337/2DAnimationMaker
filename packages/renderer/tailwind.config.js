/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-editor': 'var(--bg-editor)',
        'bg-panel': 'var(--bg-panel)',
        'bg-dropdown': 'var(--bg-dropdown)',
        'fg-primary': 'var(--fg-primary)',
        'fg-secondary': 'var(--fg-secondary)',
        'accent-primary': 'var(--accent-primary)',
        'border-panel': 'var(--border-panel)',
        'surface-hover': 'var(--surface-hover)',
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
      },
      spacing: {
        'xs': 'var(--spacing-xs)',
        'sm': 'var(--spacing-sm)',
        'md': 'var(--spacing-md)',
        'lg': 'var(--spacing-lg)',
        'xl': 'var(--spacing-xl)',
      },
      fontSize: {
        'xs': 'var(--font-xs)',
        'sm': 'var(--font-sm)',
        'md': 'var(--font-md)',
        'lg': 'var(--font-lg)',
        'xl': 'var(--font-xl)',
      },
    },
  },
  plugins: [],
};
