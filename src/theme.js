/**
 * Design tokens exported from Stitch, merged across both screens.
 *
 * The two exports shipped slightly different palettes and radius scales. Rather than
 * rewriting class names (which would change how the screens look), the handful of tokens
 * that actually conflict are read from CSS variables and re-pointed per screen in
 * styles/app.css -> [data-screen-theme="companion"] / [data-screen-theme="map"].
 *
 * Conflicting tokens: surface, background, rounded-DEFAULT/lg/xl/2xl.
 * Everything else below is identical in both exports or used by only one of them.
 *
 * Loaded as a classic script *before* the app so Tailwind's CDN build sees the config.
 */
window.tailwind = window.tailwind || {};

tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // --- per-screen (see styles/app.css) ---
        surface: 'var(--c-surface)',
        background: 'var(--c-background)',

        // --- shared ---
        primary: '#153328',
        'on-primary': '#ffffff',
        'primary-container': '#2c4a3e',
        'on-primary-container': '#98b9a9',
        'primary-fixed': '#c8eada',
        'primary-fixed-dim': '#adcebe',
        'on-primary-fixed': '#012016',
        'on-primary-fixed-variant': '#2f4d41',
        'inverse-primary': '#adcebe',

        secondary: '#904d00',
        'on-secondary': '#ffffff',
        'secondary-container': '#fe932c',
        'on-secondary-container': '#663500',
        'secondary-fixed': '#ffdcc3',
        'secondary-fixed-dim': '#ffb77d',
        'on-secondary-fixed': '#2f1500',
        'on-secondary-fixed-variant': '#6e3900',

        tertiary: '#14332a',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#2b4a40',
        'on-tertiary-container': '#97b9ab',
        'tertiary-fixed': '#c7eadc',
        'tertiary-fixed-dim': '#accec0',
        'on-tertiary-fixed': '#002118',
        'on-tertiary-fixed-variant': '#2e4d42',

        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',

        'on-background': '#111c2d',
        'on-surface': '#111c2d',
        'on-surface-variant': '#414845',
        'surface-variant': '#d8e3fb',
        'surface-tint': '#466558',
        'surface-bright': '#f9f9ff',
        'surface-dim': '#cfdaf2',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f0f3ff',
        'surface-container': '#e7eeff',
        'surface-container-high': '#dee8ff',
        'surface-container-highest': '#d8e3fb',
        'inverse-surface': '#263143',
        'inverse-on-surface': '#ecf1ff',

        outline: '#727974',
        'outline-variant': '#c1c8c3'
      },

      borderRadius: {
        DEFAULT: 'var(--r-default)',
        lg: 'var(--r-lg)',
        xl: 'var(--r-xl)',
        '2xl': 'var(--r-2xl)',
        full: '9999px'
      },

      spacing: {
        'space-xs': '0.375rem',
        'space-sm': '0.75rem',
        'space-md': '1.25rem',
        'space-lg': '1.75rem',
        'space-xl': '2.5rem',
        gutter: '1rem',
        'gutter-mobile': '0.75rem',
        'gutter-tablet': '1.25rem',
        margin: '1.5rem',
        'margin-mobile': '1rem',
        'margin-tablet': '2rem'
      },

      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        headline: ['Plus Jakarta Sans', 'sans-serif'],
        'body-md': ['Inter'],
        'body-lg': ['Inter'],
        'body-xl': ['Inter'],
        'label-sm': ['Plus Jakarta Sans'],
        'label-md': ['Plus Jakarta Sans'],
        'label-lg': ['Plus Jakarta Sans'],
        'headline-sm': ['Plus Jakarta Sans'],
        'headline-md': ['Plus Jakarta Sans'],
        'headline-lg': ['Plus Jakarta Sans'],
        'headline-lg-mobile': ['Plus Jakarta Sans'],
        'display-lg': ['Plus Jakarta Sans']
      },

      // Same values as the export, expressed in rem so they respond to the
      // in-app "Text size" control instead of staying pinned at 16px.
      fontSize: {
        'body-md': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        'body-lg': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '400' }],
        'body-xl': ['1.25rem', { lineHeight: '1.875rem', fontWeight: '400' }],
        'label-sm': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '600' }],
        'label-md': ['1rem', { lineHeight: '1.375rem', fontWeight: '600' }],
        'label-lg': ['1.125rem', { lineHeight: '1.5rem', letterSpacing: '0.01em', fontWeight: '600' }],
        'headline-sm': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'headline-md': ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],
        'headline-lg': ['2rem', { lineHeight: '2.5rem', letterSpacing: '-0.01em', fontWeight: '700' }],
        'headline-lg-mobile': ['1.625rem', { lineHeight: '2.125rem', letterSpacing: '-0.01em', fontWeight: '700' }],
        'display-lg': ['2.5rem', { lineHeight: '3rem', letterSpacing: '-0.02em', fontWeight: '700' }]
      }
    }
  }
};
