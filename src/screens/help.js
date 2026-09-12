/** "Help" screen -- contacts, urgent assistance and the demo reset. */

import { helpContacts, family, trip, user } from '../data.js';
import { actions } from '../state.js';
import { header, nav, card, companionBodyClass } from './shared.js';
import { toast } from '../ui/toast.js';
import { openModal } from '../ui/modal.js';

const TONES = {
  primary: 'bg-emerald-800 hover:bg-emerald-900 text-white border-emerald-900',
  slate: 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300',
  error: 'bg-red-700 hover:bg-red-800 text-white border-red-800'
};

function contactRow(c, i) {
  const cls = `w-full min-h-[64px] rounded-xl font-headline font-extrabold text-lg flex items-center gap-3.5 px-5 py-3.5 border-2 transition-colors shadow-xs ${TONES[c.tone]}`;
  const inner = `
    <span class="material-symbols-outlined text-2xl shrink-0">${c.icon}</span>
    <span class="flex-1 text-left leading-tight">${c.label}
      <span class="block text-sm font-medium opacity-80">${c.detail}</span>
    </span>
    <span class="material-symbols-outlined text-2xl shrink-0">chevron_right</span>`;
  return c.href
    ? `<a href="${c.href}" class="${cls}">${inner}</a>`
    : `<button type="button" data-action="contact" data-index="${i}" class="${cls}">${inner}</button>`;
}

function render() {
  return `
${header({ eyebrow: 'Support', title: 'Help & Assistance' })}

<main class="flex-1 max-w-3xl w-full mx-auto px-4 py-4 space-y-4">
  <div class="bg-red-50 border-2 border-red-300 rounded-2xl p-4 sm:p-5 shadow-sm">
    <div class="flex items-start gap-4">
      <div class="w-12 h-12 rounded-2xl bg-red-100 text-red-800 border border-red-300 flex items-center justify-center shrink-0 mt-0.5"><span class="material-symbols-outlined text-2xl">sos</span></div>
      <div class="space-y-3 flex-1">
        <div class="space-y-1">
          <h2 class="text-lg sm:text-xl font-extrabold text-red-900 font-headline leading-tight">Need help right now?</h2>
          <p class="text-slate-800 text-base sm:text-lg leading-relaxed font-medium">One tap alerts ${family.name} and the transit marshal with your exact location.</p>
        </div>
        <button data-action="sos" class="w-full min-h-[64px] bg-red-700 hover:bg-red-800 active:scale-[0.99] text-white rounded-2xl font-headline font-extrabold text-xl flex items-center justify-center gap-3 transition-all shadow-md">
          <span class="material-symbols-outlined text-3xl">emergency</span><span>Send Urgent Help Request</span>
        </button>
      </div>
    </div>
  </div>

  ${card(
    `<h2 class="text-sm font-extrabold text-slate-800 font-headline uppercase tracking-wider">Who You Can Reach</h2>
     <div class="space-y-3">${helpContacts.map(contactRow).join('')}</div>`
  )}

  ${card(
    `<h2 class="text-sm font-extrabold text-slate-800 font-headline uppercase tracking-wider">Today’s Journey Details</h2>
     <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
       ${[
         ['Passenger', user.fullName],
         ['Mobility', user.mobility],
         ['Route', `${trip.service} • ${trip.berth}`],
         ['Destination', trip.destination],
         ['Target arrival', trip.arrivalTime],
         ['Emergency contact', `${family.name} • ${family.phoneDisplay}`]
       ]
         .map(
           ([k, v]) => `<div class="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <div><dt class="text-xs font-bold text-slate-500 block">${k}</dt><dd class="text-base font-extrabold text-slate-900">${v}</dd></div>
            </div>`
         )
         .join('')}
     </dl>`
  )}

  ${card(
    `<h2 class="text-sm font-extrabold text-slate-800 font-headline uppercase tracking-wider">Prototype Controls</h2>
     <p class="text-slate-700 text-base sm:text-lg leading-relaxed">This is a demo. Reset puts the journey back to "not yet departed" and clears the family message feed.</p>
     <button data-action="reset" class="w-full min-h-[56px] bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-headline font-extrabold text-lg flex items-center justify-center gap-3 border-2 border-slate-300 transition-colors">
       <span class="material-symbols-outlined text-2xl text-emerald-800">restart_alt</span><span>Reset Demo Journey</span>
     </button>`
  )}
</main>

${nav('help')}`;
}

function mount(root) {
  const onClick = (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;

    switch (el.dataset.action) {
      case 'sos':
        openModal({
          title: 'Send urgent help request?',
          tone: 'error',
          body: `<p>${family.name} and the transit marshal will be alerted with your location at ${trip.originStop}.</p>`,
          actions: [
            {
              label: 'Yes, send it now',
              icon: 'sos',
              onClick: () => {
                actions.notifyFamily('help');
                toast(`Help requested. ${family.name} and the marshal have been alerted.`, { tone: 'error', duration: 6000 });
              }
            },
            { label: 'Call 995 instead', icon: 'local_hospital', href: 'tel:995', variant: 'ghost' },
            { label: 'Cancel', icon: 'close', variant: 'ghost' }
          ]
        });
        break;

      case 'contact':
        openModal({
          title: 'Call the Transit Marshal?',
          body: `<p>The marshal at ${trip.originStop} can meet you at ${trip.berth}.</p><p class="text-slate-600 text-base">Counter line • +65 6555 0156</p>`,
          actions: [
            { label: 'Call now', icon: 'call', href: 'tel:+6565550156' },
            { label: 'Not now', icon: 'close', variant: 'ghost' }
          ]
        });
        break;

      case 'reset':
        actions.resetJourney();
        toast('Demo reset. The journey is back at the start.', { tone: 'info' });
        break;
    }
  };

  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}

export default {
  id: 'help',
  theme: 'companion',
  title: 'Help - Transit Companion',
  bodyClass: companionBodyClass,
  render,
  mount
};
