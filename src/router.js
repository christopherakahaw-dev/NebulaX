/**
 * Tiny hash router.
 *
 * A screen module looks like:
 *   { id, theme, bodyClass, title, render(), mount(root)?, update(state, root)? }
 *
 * `render` returns an HTML string, `mount` wires listeners once, and `update`
 * patches the live bits (ETAs, button states) when the store changes -- so a
 * state tick never blows away focus or scroll position.
 */

import { subscribe, getState } from './state.js';

const routes = new Map();
let current = null;
let currentRoot = null;
let cleanup = null;

export function register(path, screen) {
  routes.set(path, screen);
}

export function navigate(path) {
  if (location.hash === `#${path}`) {
    render(path);
    return;
  }
  location.hash = path;
}

export function currentPath() {
  return (location.hash || '#/route').slice(1);
}

function resolve(path) {
  return routes.get(path) || routes.get('/route');
}

function render(path) {
  const screen = resolve(path);
  const app = document.getElementById('app');
  if (!screen || !app) return;

  if (cleanup) cleanup();
  cleanup = null;

  document.body.dataset.screenTheme = screen.theme || 'companion';
  document.body.className = `${screen.bodyClass || ''} screen-enter`.trim();
  applyPrefsToBody();
  if (screen.title) document.title = screen.title;

  app.innerHTML = screen.render(getState());
  currentRoot = app;
  current = screen;

  cleanup = screen.mount?.(app) || null;
  screen.update?.(getState(), app);

  window.scrollTo({ top: 0 });
  app.querySelector('h1, h2')?.setAttribute('tabindex', '-1');
}

/** Keeps body-level preference classes alive across screen swaps. */
export function applyPrefsToBody() {
  const { prefs } = getState();
  document.body.classList.toggle('high-contrast', prefs.highContrast);
}

export function start() {
  window.addEventListener('hashchange', () => render(currentPath()));

  // Any element with data-route navigates; works for <a> and <button> alike.
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-route]');
    if (!el) return;
    e.preventDefault();
    navigate(el.dataset.route);
  });

  // Live-patch the active screen whenever the store changes.
  subscribe((state) => {
    applyPrefsToBody();
    if (current && currentRoot) current.update?.(state, currentRoot);
  });

  render(currentPath());
}
