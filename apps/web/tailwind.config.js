/** @type {import('tailwindcss').Config} */
import preline from 'preline/plugin';

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    // Preline components
    'node_modules/preline/dist/*.js',
  ],
  theme: {
    extend: {},
  },
  plugins: [preline],
};