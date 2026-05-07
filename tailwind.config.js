/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        glacier: '0 24px 80px rgba(7, 17, 31, 0.45)',
        'glacier-soft': '0 10px 40px rgba(6, 182, 212, 0.16)',
      },
      backgroundImage: {
        aurora: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
      },
      colors: {
        glacier: '#07111f',
        'midnight-ice': '#0b1120',
        frost: '#112240',
        cyan: '#06b6d4',
        aurora: '#7c3aed',
        ice: '#f8fafc',
        mist: '#94a3b8',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -14px, 0)' },
        },
        glow: {
          '0%, 100%': { opacity: '0.45', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.08)' },
        },
        gridMove: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '80px 80px' },
        },
      },
      animation: {
        drift: 'drift 8s ease-in-out infinite',
        glow: 'glow 6s ease-in-out infinite',
        gridMove: 'gridMove 18s linear infinite',
      },
    },
  },
  plugins: [],
};
