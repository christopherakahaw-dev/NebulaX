/**
 * Accessible dropdown menu: a trigger button plus an anchored listbox panel.
 *
 * Keyboard: Enter/Space opens, Up/Down/Home/End move between options,
 * Enter picks, Escape closes and returns focus to the trigger. Clicking
 * outside closes it too.
 *
 * Option rows are 56px tall and can preview their own effect (see
 * `previewScale`), which is what the text-size menu uses.
 */

function optionRow(id, item) {
  const previewStyle = item.previewScale ? ` style="font-size: calc(1.0625rem * ${item.previewScale})"` : '';
  return `
    <button type="button" role="option" id="${id}-opt-${item.value}" data-value="${item.value}"
            aria-selected="${item.selected ? 'true' : 'false'}" tabindex="-1"
            class="w-full min-h-[56px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors ${
              item.selected ? 'bg-emerald-50 border-2 border-emerald-600/40' : 'bg-white border-2 border-transparent hover:bg-slate-100'
            }">
      <span data-check class="material-symbols-outlined text-2xl text-emerald-700 shrink-0 ${item.selected ? '' : 'invisible'}">check_circle</span>
      <span class="flex-1 min-w-0">
        <span class="block font-headline font-extrabold text-slate-900 leading-tight"${previewStyle}>${item.label}</span>
        ${item.hint ? `<span class="block text-sm font-medium text-slate-600 leading-snug">${item.hint}</span>` : ''}
      </span>
    </button>`;
}

/**
 * @param {object} opts
 * @param {string} opts.id            unique id for this dropdown
 * @param {string} opts.label         accessible name for the trigger and panel
 * @param {string} opts.triggerClass  classes for the trigger button
 * @param {string} opts.triggerHtml   inner HTML of the trigger
 * @param {Array<{value,label,hint?,selected?,previewScale?}>} opts.items
 */
export function renderDropdown({ id, label, triggerClass, triggerHtml, items }) {
  return `
  <div class="relative" data-dropdown="${id}">
    <button type="button" id="${id}-trigger" class="${triggerClass}"
            aria-haspopup="listbox" aria-expanded="false" aria-controls="${id}-panel" aria-label="${label}">
      ${triggerHtml}
    </button>
    <div id="${id}-panel" role="listbox" aria-label="${label}" tabindex="-1"
         class="hidden absolute right-0 top-full mt-2 w-[17rem] max-w-[85vw] bg-white border-2 border-slate-200 rounded-2xl shadow-xl p-2 space-y-1 z-50">
      ${items.map((item) => optionRow(id, item)).join('')}
    </div>
  </div>`;
}

/**
 * Wires a rendered dropdown. Returns a cleanup function.
 * @param {HTMLElement} root
 * @param {string} id
 * @param {{onSelect: (value: string) => void}} handlers
 */
export function mountDropdown(root, id, { onSelect }) {
  const wrap = root.querySelector(`[data-dropdown="${id}"]`);
  if (!wrap) return () => {};

  const trigger = wrap.querySelector(`#${id}-trigger`);
  const panel = wrap.querySelector(`#${id}-panel`);
  const options = () => Array.from(panel.querySelectorAll('[role="option"]'));

  const isOpen = () => !panel.classList.contains('hidden');

  function open() {
    panel.classList.remove('hidden');
    trigger.setAttribute('aria-expanded', 'true');
    document.addEventListener('pointerdown', onOutside, true);
    (options().find((o) => o.getAttribute('aria-selected') === 'true') || options()[0])?.focus();
  }

  function close({ refocus = false } = {}) {
    if (!isOpen()) return;
    panel.classList.add('hidden');
    trigger.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', onOutside, true);
    if (refocus) trigger.focus();
  }

  function onOutside(e) {
    if (!wrap.contains(e.target)) close();
  }

  function onTriggerClick(e) {
    e.preventDefault();
    isOpen() ? close({ refocus: true }) : open();
  }

  function onPanelClick(e) {
    const opt = e.target.closest('[role="option"]');
    if (!opt) return;
    onSelect(opt.dataset.value);
    close({ refocus: true });
  }

  function onKeyDown(e) {
    if (!isOpen()) {
      if (e.target === trigger && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        open();
      }
      return;
    }

    const opts = options();
    const i = opts.indexOf(document.activeElement);

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        close({ refocus: true });
        break;
      case 'ArrowDown':
        e.preventDefault();
        opts[Math.min(opts.length - 1, i + 1)]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        i <= 0 ? trigger.focus() : opts[i - 1].focus();
        break;
      case 'Home':
        e.preventDefault();
        opts[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        opts[opts.length - 1]?.focus();
        break;
      case 'Tab':
        close();
        break;
    }
  }

  trigger.addEventListener('click', onTriggerClick);
  panel.addEventListener('click', onPanelClick);
  wrap.addEventListener('keydown', onKeyDown);

  return () => {
    trigger.removeEventListener('click', onTriggerClick);
    panel.removeEventListener('click', onPanelClick);
    wrap.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('pointerdown', onOutside, true);
  };
}

/** Syncs the checked state of an already-rendered dropdown. */
export function syncDropdown(root, id, selectedValue) {
  const panel = root.querySelector(`#${id}-panel`);
  if (!panel) return;
  panel.querySelectorAll('[role="option"]').forEach((opt) => {
    const selected = opt.dataset.value === selectedValue;
    opt.setAttribute('aria-selected', String(selected));
    opt.className = `w-full min-h-[56px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors ${
      selected ? 'bg-emerald-50 border-2 border-emerald-600/40' : 'bg-white border-2 border-transparent hover:bg-slate-100'
    }`;
    opt.querySelector('[data-check]')?.classList.toggle('invisible', !selected);
  });
}
