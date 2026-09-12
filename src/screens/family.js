/**
 * "Family" / "Family Alert" screen -- the notification feed behind the
 * one-tap buttons on the route and map screens.
 */

import { family, user, trip, notificationTemplates } from '../data.js';
import { getState, actions } from '../state.js';
import { header, nav, card, companionBodyClass } from './shared.js';
import { toast } from '../ui/toast.js';

const QUICK_MESSAGES = [
  { type: 'location', icon: 'share_location', label: 'Send my location now' },
  { type: 'boarding', icon: 'directions_bus', label: 'Tell Darren I am on the bus' },
  { type: 'arrival', icon: 'flag', label: 'Tell Darren I have arrived' }
];

function feedItem(n) {
  return `
  <li class="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 flex items-start gap-3.5">
    <span class="material-symbols-outlined text-emerald-700 text-2xl shrink-0 mt-0.5">sms</span>
    <div class="flex-1 space-y-1">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-xs font-extrabold text-slate-600 uppercase tracking-wide">To ${n.to} • ${n.channel}</span>
        <span class="text-xs font-bold text-slate-500">${n.at}</span>
      </div>
      <p class="italic text-base sm:text-lg text-slate-900 leading-relaxed font-medium">${n.message}</p>
    </div>
  </li>`;
}

function render(state) {
  return `
${header({ eyebrow: 'Family Peace-of-Mind', title: `Connected to ${family.name}` })}

<main class="flex-1 max-w-3xl w-full mx-auto px-4 py-4 space-y-4">
  ${card(
    `<div class="flex flex-wrap items-center justify-between gap-3">
       <div class="flex items-center gap-3.5">
         <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200"><span class="material-symbols-outlined text-2xl">family_restroom</span></div>
         <div>
           <span class="text-xs font-extrabold text-emerald-800 uppercase tracking-wide block">${family.relation} • ${family.phoneDisplay}</span>
           <h2 class="text-xl font-extrabold text-slate-900 font-headline">${family.name}</h2>
         </div>
       </div>
       <button data-action="toggle-sync" id="family-sync-pill" class="inline-flex items-center gap-2 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-full border"></button>
     </div>
     <p class="text-slate-700 text-base sm:text-lg leading-relaxed">${user.firstName}, ${family.name} sees every update automatically while you travel to ${trip.destination}. You never need to type.</p>
     <a class="w-full min-h-[56px] bg-slate-100 hover:bg-slate-200 active:scale-[0.99] text-slate-900 font-headline font-extrabold py-3.5 px-5 rounded-xl flex items-center justify-center gap-3 text-lg border-2 border-slate-300 transition-colors shadow-xs" href="tel:${family.phone}">
       <span class="material-symbols-outlined text-emerald-800 text-2xl">call</span><span>Call ${family.name} Directly</span>
     </a>`
  )}

  ${card(
    `<h2 class="text-sm font-extrabold text-slate-800 font-headline uppercase tracking-wider">One-Tap Updates</h2>
     <div class="space-y-3">
       ${QUICK_MESSAGES.map(
         (m) => `<button data-action="send" data-type="${m.type}" class="w-full min-h-[56px] bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99] text-white rounded-xl font-headline font-extrabold text-lg flex items-center justify-center gap-3 transition-all shadow-md">
                   <span class="material-symbols-outlined text-2xl">${m.icon}</span><span>${m.label}</span>
                 </button>`
       ).join('')}
     </div>`
  )}

  ${card(
    `<div class="flex flex-wrap items-center justify-between gap-2">
       <h2 class="text-sm font-extrabold text-slate-800 font-headline uppercase tracking-wider">Messages Sent Today</h2>
       <span id="feed-count" class="text-xs font-bold text-slate-600 bg-slate-200 px-2.5 py-1 rounded-full">${state.notifications.length} sent</span>
     </div>
     <ul id="family-feed" class="space-y-3"></ul>`
  )}
</main>

${nav('family')}`;
}

function mount(root) {
  const onClick = (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;

    if (el.dataset.action === 'toggle-sync') {
      const on = actions.toggleFamilySync();
      toast(on ? `Live sync with ${family.name} is on.` : `Live sync paused.`, { tone: on ? 'success' : 'warn' });
      return;
    }

    if (el.dataset.action === 'send') {
      if (!getState().familySync) {
        toast('Turn live sync back on to send updates.', { tone: 'warn' });
        return;
      }
      actions.notifyFamily(el.dataset.type);
      toast(`Message sent to ${family.name}.`);
    }
  };

  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}

function update(state, root) {
  const pill = root.querySelector('#family-sync-pill');
  if (pill) {
    pill.className = `inline-flex items-center gap-2 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-full border ${
      state.familySync ? 'text-emerald-900 bg-emerald-100 border-emerald-300' : 'text-slate-700 bg-slate-100 border-slate-300'
    }`;
    pill.innerHTML = `<span class="w-2.5 h-2.5 rounded-full ${
      state.familySync ? 'bg-emerald-600' : 'bg-slate-400'
    }"></span><span>${state.familySync ? 'Live Sync Active' : 'Live Sync Paused'}</span>`;
  }

  const feed = root.querySelector('#family-feed');
  if (feed) {
    feed.innerHTML = state.notifications.length
      ? state.notifications.map(feedItem).join('')
      : `<li class="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-5 text-center text-slate-600 text-base sm:text-lg">
           No messages yet. They send automatically once you confirm departure.
           <span class="block mt-2 italic text-slate-500">${notificationTemplates.departure}</span>
         </li>`;
  }

  const count = root.querySelector('#feed-count');
  if (count) count.textContent = `${state.notifications.length} sent`;
}

export default {
  id: 'family',
  theme: 'companion',
  title: 'Family Alert - Transit Companion',
  bodyClass: companionBodyClass,
  render,
  mount,
  update
};
