/**
 * Minimal accessible dialog used for confirmations (SOS, calling the marshal,
 * full step list). Buttons are 56px+ to match the screens' touch targets.
 */

let lastFocused = null;

export function closeModal() {
  const root = document.getElementById('modal-root');
  if (root) root.innerHTML = '';
  document.body.style.overflow = '';
  if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
  lastFocused = null;
}

/**
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} [opts.body] - HTML string
 * @param {string} [opts.tone] - 'primary' | 'error'
 * @param {Array<{label:string, href?:string, onClick?:Function, variant?:'primary'|'ghost'}>} [opts.actions]
 */
export function openModal({ title, body = '', tone = 'primary', actions = [] }) {
  const root = document.getElementById('modal-root');
  if (!root) return;

  lastFocused = document.activeElement;
  document.body.style.overflow = 'hidden';

  const headTone =
    tone === 'error' ? 'bg-red-50 border-red-300 text-red-900' : 'bg-emerald-50 border-emerald-300 text-emerald-900';

  root.innerHTML = `
    <div class="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4 bg-slate-900/50" data-modal-backdrop>
      <div role="dialog" aria-modal="true" aria-label="${title}"
           class="w-full max-w-lg bg-white rounded-2xl border-2 border-slate-200 shadow-2xl overflow-hidden screen-enter">
        <div class="px-5 py-4 border-b-2 ${headTone}">
          <h2 class="text-xl sm:text-2xl font-extrabold font-headline leading-tight">${title}</h2>
        </div>
        <div class="px-5 py-4 text-base sm:text-lg leading-relaxed text-slate-800 space-y-3">${body}</div>
        <div class="px-5 pb-5 pt-1 flex flex-col gap-3">
          ${actions
            .map((a, i) => {
              const cls =
                a.variant === 'ghost'
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-2 border-slate-300'
                  : tone === 'error'
                    ? 'bg-red-700 hover:bg-red-800 text-white border-2 border-red-800'
                    : 'bg-emerald-800 hover:bg-emerald-900 text-white border-2 border-emerald-900';
              const inner = `<span class="material-symbols-outlined text-2xl">${a.icon || 'check'}</span><span>${a.label}</span>`;
              return a.href
                ? `<a href="${a.href}" data-modal-action="${i}" class="min-h-[56px] rounded-xl font-headline font-extrabold text-lg flex items-center justify-center gap-2.5 ${cls}">${inner}</a>`
                : `<button type="button" data-modal-action="${i}" class="min-h-[56px] rounded-xl font-headline font-extrabold text-lg flex items-center justify-center gap-2.5 ${cls}">${inner}</button>`;
            })
            .join('')}
        </div>
      </div>
    </div>
  `;

  root.querySelector('[data-modal-backdrop]').addEventListener('click', (e) => {
    if (e.target.hasAttribute('data-modal-backdrop')) closeModal();
  });

  root.querySelectorAll('[data-modal-action]').forEach((el) => {
    el.addEventListener('click', () => {
      const action = actions[Number(el.dataset.modalAction)];
      if (action?.onClick) action.onClick();
      if (!action?.keepOpen) closeModal();
    });
  });

  document.addEventListener('keydown', onKey);
  root.querySelector('[data-modal-action]')?.focus();
}

function onKey(e) {
  if (e.key === 'Escape') {
    closeModal();
    document.removeEventListener('keydown', onKey);
  }
}
