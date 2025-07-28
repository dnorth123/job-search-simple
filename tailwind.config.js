/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Executive-level sophisticated blues
        primary: {
          50: '#f0f7ff',
          100: '#e0f0ff',
          200: '#c7e3ff',
          300: '#a3d1ff',
          400: '#7bb8ff',
          500: '#0066cc', // Main executive blue
          600: '#0052a3', // Darker executive blue
          700: '#003d7a', // Deepest executive blue
          800: '#002d5c',
          900: '#001f3d',
        },
        // Intelligence accent colors (purple variants)
        intelligence: {
          50: '#f8f7ff',
          100: '#f0eeff',
          200: '#e6e1ff',
          300: '#d4ccff',
          400: '#b8a9ff',
          500: '#9b7cff',
          600: '#7c5af6',
          700: '#6b46c1',
          800: '#553c9a',
          900: '#4c1d95',
        },
        // Executive-grade neutral palette (warmer, more sophisticated)
        neutral: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
        // Professional status colors
        status: {
          applied: {
            50: '#f0f9ff',
            100: '#e0f2fe',
            200: '#bae6fd',
            300: '#7dd3fc',
            400: '#38bdf8',
            500: '#0ea5e9',
            600: '#0284c7',
            700: '#0369a1',
          },
          interview: {
            50: '#fef7ee',
            100: '#fdedd4',
            200: '#fbd7a8',
            300: '#f8bb71',
            400: '#f59538',
            500: '#f2750f',
            600: '#e35d0a',
            700: '#bc460c',
          },
          offer: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#22c55e',
            600: '#16a34a',
            700: '#15803d',
          },
          rejected: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444',
            600: '#dc2626',
            700: '#b91c1c',
          },
          withdrawn: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
          },
        },
        // Legacy color mappings for backward compatibility
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        accent: {
          50: '#fef7ee',
          100: '#fdedd4',
          200: '#fbd7a8',
          300: '#f8bb71',
          400: '#f59538',
          500: '#f2750f',
          600: '#e35d0a',
          700: '#bc460c',
          800: '#953812',
          900: '#783012',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ],
        display: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '12': '3rem', // 48px touch targets
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      // Premium shadow system with multiple elevation levels
      boxShadow: {
        'executive-soft': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'executive': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
        'executive-medium': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'executive-large': '0 20px 25px -5px rgba(0, 0, 0, 0.12), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'executive-xl': '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        'executive-2xl': '0 50px 100px -20px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        // Legacy shadows for backward compatibility
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'large': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 2px 10px -2px rgba(0, 0, 0, 0.05)',
      },
      // Executive transition timing functions
      transitionTimingFunction: {
        'executive': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'executive-smooth': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'executive-bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'executive-fade': 'executiveFade 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'executive-slide': 'executiveSlide 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        executiveFade: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        executiveSlide: {
          '0%': { transform: 'translateX(-4px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    function({ addUtilities }) {
      const newUtilities = {
        '.touch-target': {
          'min-height': '48px',
          'min-width': '48px',
        },
        '.form-mobile': {
          'font-size': '16px', // Prevents iOS zoom
          'line-height': '1.5',
        },
        '.form-field': {
          'margin-bottom': '1rem',
        },
        '.loading-spinner': {
          'border': '2px solid transparent',
          'border-top-color': 'currentColor',
          'border-radius': '50%',
          'animation': 'spin 1s linear infinite',
        },
        '@keyframes spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        // Executive-level utility classes
        '.executive-gradient': {
          'background': 'linear-gradient(135deg, #0066cc 0%, #0052a3 50%, #003d7a 100%)',
        },
        '.intelligence-gradient': {
          'background': 'linear-gradient(135deg, #9b7cff 0%, #7c5af6 50%, #6b46c1 100%)',
        },
        '.executive-border': {
          'border': '1px solid rgba(0, 102, 204, 0.1)',
        },
        '.executive-focus': {
          'box-shadow': '0 0 0 3px rgba(0, 102, 204, 0.1)',
        },
      };
      addUtilities(newUtilities);
    },
  ],
} 