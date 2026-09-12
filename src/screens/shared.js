/**
 * Pieces shared by the screens the bottom navigation implies but the Stitch
 * export did not include (Lifts / Step-Free, Family, Help).
 *
 * They deliberately reuse screen 1's visual language -- same white cards,
 * 2px slate borders, emerald accents, rounded-2xl corners and type scale --
 * so nothing here introduces a new design.
 */

export const companionBodyClass =
  'bg-surface text-on-surface min-h-screen flex flex-col antialiased selection:bg-emerald-100 selection:text-primary pb-28';

/** Sticky header with a back action, matching screen 1's header chrome. */
export function header({ eyebrow, title, action = '' }) {
  return `
<header class="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
  <div class="max-w-3xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-3">
    <div class="flex items-center gap-3.5">
      <button data-route="/route" aria-label="Back to route" class="w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 flex items-center justify-center border-2 border-slate-300 shrink-0 transition-colors">
        <span class="material-symbols-outlined text-2xl text-emerald-800">arrow_back</span>
      </button>
      <div>
        <div class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800"><span class="w-2 h-2 rounded-full bg-emerald-600"></span>${eyebrow}</div>
        <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 font-headline leading-tight">${title}</h1>
      </div>
    </div>
    <div class="flex items-center gap-2">${action}</div>
  </div>
</header>`;
}

const NAV_ITEMS = [
  { id: 'route', route: '/route', icon: 'alt_route', label: 'Route' },
  { id: 'lifts', route: '/lifts', icon: 'elevator', label: 'Lifts' },
  { id: 'family', route: '/family', icon: 'family_restroom', label: 'Family' },
  { id: 'help', route: '/help', icon: 'help_outline', label: 'Help' }
];

/** Screen 1's bottom navigation, with the active tab highlighted. */
export function nav(activeId) {
  return `
<nav class="fixed bottom-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg">
  <div class="max-w-3xl mx-auto flex items-center justify-around py-2.5 px-3">
    ${NAV_ITEMS.map((item) => {
      const active = item.id === activeId;
      return `<a class="flex flex-col items-center justify-center px-3 py-1 flex-1 transition-colors ${
        active ? 'text-emerald-800 font-extrabold' : 'text-slate-600 hover:text-slate-900 font-bold'
      }" href="#${item.route}"${active ? ' aria-current="page"' : ''}>
        <span class="material-symbols-outlined text-2xl">${item.icon}</span>
        <span class="text-xs sm:text-sm font-headline mt-0.5">${item.label}</span>
      </a>`;
    }).join('')}
  </div>
</nav>`;
}

/** White card wrapper used across the supporting screens. */
export function card(inner, extra = '') {
  return `<section class="bg-white border-2 border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 ${extra}">${inner}</section>`;
}
