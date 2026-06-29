import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0F172A',
        surface: '#1E293B',
        'surface-2': '#263548',
        border: '#334155',
        'border-glow': 'rgba(6,182,212,0.4)',
        cyan: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
          700: '#0E7490',
          800: '#155E75',
          900: '#164E63',
        },
        emerald: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        red: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        brand: {
          primary: '#06B6D4',
          secondary: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          purple: '#8B5CF6',
          indigo: '#6366F1',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #0F172A 0%, #0C1929 50%, #0D1B2A 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)',
        'cyan-gradient': 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
        'emerald-gradient': 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        'amber-gradient': 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
        'danger-gradient': 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
        'purple-gradient': 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
        'civic-gradient': 'linear-gradient(135deg, #06B6D4 0%, #10B981 50%, #8B5CF6 100%)',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(6,182,212,0.35), 0 0 40px rgba(6,182,212,0.15)',
        'glow-emerald': '0 0 20px rgba(16,185,129,0.35), 0 0 40px rgba(16,185,129,0.15)',
        'glow-amber': '0 0 20px rgba(245,158,11,0.35), 0 0 40px rgba(245,158,11,0.15)',
        'glow-red': '0 0 20px rgba(239,68,68,0.35), 0 0 40px rgba(239,68,68,0.15)',
        'glow-purple': '0 0 20px rgba(139,92,246,0.35), 0 0 40px rgba(139,92,246,0.15)',
        glass: '0 8px 32px 0 rgba(0,0,0,0.37)',
        'card-hover': '0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(6,182,212,0.1)',
        'inner-glow': 'inset 0 0 20px rgba(6,182,212,0.1)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'slide-in-right': 'slide-in-right 0.4s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'spin-slow': 'spin 8s linear infinite',
        'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
        'gradient-shift': 'gradient-shift 4s ease infinite',
        'radar-sweep': 'radar-sweep 3s linear infinite',
        'count-up': 'count-up 1s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(6,182,212,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(6,182,212,0.7), 0 0 80px rgba(6,182,212,0.3)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'radar-sweep': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'count-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      transitionDuration: {
        '400': '400ms',
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities, addComponents, theme }) {
      addUtilities({
        '.glass': {
          background: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(16px)',
          '-webkit-backdrop-filter': 'blur(16px)',
          border: '1px solid rgba(51, 65, 85, 0.6)',
        },
        '.glass-light': {
          background: 'rgba(30, 41, 59, 0.4)',
          backdropFilter: 'blur(12px)',
          '-webkit-backdrop-filter': 'blur(12px)',
          border: '1px solid rgba(51, 65, 85, 0.4)',
        },
        '.glass-dark': {
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(20px)',
          '-webkit-backdrop-filter': 'blur(20px)',
          border: '1px solid rgba(51, 65, 85, 0.5)',
        },
        '.glass-card': {
          background: 'linear-gradient(135deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.8) 100%)',
          backdropFilter: 'blur(16px)',
          '-webkit-backdrop-filter': 'blur(16px)',
          border: '1px solid rgba(51, 65, 85, 0.5)',
          boxShadow: '0 8px 32px 0 rgba(0,0,0,0.37)',
        },
        '.glass-border': {
          border: '1px solid rgba(6, 182, 212, 0.3)',
        },
        '.glow-cyan': {
          boxShadow: '0 0 20px rgba(6,182,212,0.35), 0 0 40px rgba(6,182,212,0.15)',
        },
        '.glow-emerald': {
          boxShadow: '0 0 20px rgba(16,185,129,0.35), 0 0 40px rgba(16,185,129,0.15)',
        },
        '.text-gradient-cyan': {
          background: 'linear-gradient(135deg, #06B6D4, #10B981)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          backgroundClip: 'text',
        },
        '.text-gradient-purple': {
          background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          backgroundClip: 'text',
        },
        '.text-gradient-gold': {
          background: 'linear-gradient(135deg, #F59E0B, #EF4444)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          backgroundClip: 'text',
        },
        '.scrollbar-thin': {
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(6,182,212,0.3) rgba(15,23,42,0.5)',
        },
        '.noise-bg': {
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
        },
      });
      addComponents({
        '.btn-civic': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '0.625rem 1.5rem',
          borderRadius: '0.5rem',
          fontFamily: theme('fontFamily.heading'),
          fontWeight: '600',
          fontSize: '0.875rem',
          background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
          color: 'white',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 0 20px rgba(6,182,212,0.4)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        '.card-hover': {
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(6,182,212,0.1)',
          },
        },
        '.badge-severity-critical': {
          background: 'rgba(239,68,68,0.15)',
          color: '#F87171',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '9999px',
          padding: '0.125rem 0.625rem',
          fontSize: '0.75rem',
          fontWeight: '600',
          letterSpacing: '0.05em',
        },
        '.badge-severity-high': {
          background: 'rgba(249,115,22,0.15)',
          color: '#FB923C',
          border: '1px solid rgba(249,115,22,0.3)',
          borderRadius: '9999px',
          padding: '0.125rem 0.625rem',
          fontSize: '0.75rem',
          fontWeight: '600',
          letterSpacing: '0.05em',
        },
        '.badge-severity-medium': {
          background: 'rgba(245,158,11,0.15)',
          color: '#FBBF24',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: '9999px',
          padding: '0.125rem 0.625rem',
          fontSize: '0.75rem',
          fontWeight: '600',
          letterSpacing: '0.05em',
        },
        '.badge-severity-low': {
          background: 'rgba(16,185,129,0.15)',
          color: '#34D399',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: '9999px',
          padding: '0.125rem 0.625rem',
          fontSize: '0.75rem',
          fontWeight: '600',
          letterSpacing: '0.05em',
        },
      });
    }),
  ],
};

export default config;
