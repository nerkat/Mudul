/** @type {import('tailwindcss').Config} */
export default {
  // Include workspace packages so class names in shared components are picked up.
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx,mdx,html,css}',
    '../../packages/**/*.{js,jsx,ts,tsx,mdx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg:      'rgb(var(--bg) / <alpha-value>)',
        fg:      'rgb(var(--fg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        border:  'rgb(var(--border) / <alpha-value>)',
        accent:  'rgb(var(--accent) / <alpha-value>)',
        muted:   'rgb(var(--muted) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        danger:  'rgb(var(--danger) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
      },
      borderRadius: {
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
      },
      spacing: {
        1: 'var(--space-1)', 2: 'var(--space-2)', 3: 'var(--space-3)',
        4: 'var(--space-4)', 6: 'var(--space-6)', 8: 'var(--space-8)',
      }
    }
  }
};
