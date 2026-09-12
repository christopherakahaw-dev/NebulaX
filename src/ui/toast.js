/** Large, high-contrast confirmation toasts sized for the same audience as the screens. */

const TONES = {
  success: 'bg-emerald-800 text-white border-emerald-900',
  info: 'bg-slate-900 text-white border-slate-900',
  warn: 'bg-amber-100 text-amber-950 border-amber-300',
  error: 'bg-red-700 text-white border-red-800'
};

const ICONS = {
  success: 'check_circle',
  info: 'info',
  warn: 'warning',
  error: 'sos'
};

export function toast(message, { tone = 'success', duration = 4200 } = {}) {
  const root = document.getElementById('toast-root');
  if (!root) return;

  const el = document.createElement('div');
  el.className =
    'toast-enter pointer-events-auto w-full max-w-md flex items-start gap-3 px-5 py-4 rounded-2xl border-2 shadow-lg ' +
    (TONES[tone] || TONES.success);
  el.setAttribute('role', tone === 'error' ? 'alert' : 'status');
  el.innerHTML = `
    <span class="material-symbols-outlined text-2xl shrink-0">${ICONS[tone] || ICONS.info}</span>
    <p class="text-base sm:text-lg font-bold leading-snug">${message}</p>
  `;

  root.appendChild(el);

  const remove = () => {
    el.classList.add('toast-leave');
    setTimeout(() => el.remove(), 220);
  };
  el.addEventListener('click', remove);
  setTimeout(remove, duration);
}
