/**
 * "Lifts" (screen 1 nav) / "Step-Free" (map screen nav).
 * Lift and ramp status for everything on and around today's route.
 */

import { facilities, trip } from '../data.js';
import { header, nav, card, companionBodyClass } from './shared.js';
import { toast } from '../ui/toast.js';

const STATUS = {
  ok: { label: 'Working', chip: 'bg-emerald-100 text-emerald-900 border-emerald-300', icon: 'check_circle', iconColor: 'text-emerald-700' },
  busy: { label: 'Queues Reported', chip: 'bg-amber-100 text-amber-950 border-amber-300', icon: 'schedule', iconColor: 'text-amber-700' },
  out: { label: 'Out of Service', chip: 'bg-red-100 text-red-900 border-red-300', icon: 'error', iconColor: 'text-red-700' }
};

function facilityRow(f, i) {
  const s = STATUS[f.status];
  return `
  <div class="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 sm:p-5 flex items-start gap-4" data-facility="${i}">
    <div class="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
      <span class="material-symbols-outlined text-2xl ${s.iconColor}">${s.icon}</span>
    </div>
    <div class="flex-1 space-y-1.5">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h3 class="font-extrabold text-slate-900 text-lg sm:text-xl font-headline">${f.station}</h3>
        <span class="text-xs sm:text-sm font-extrabold px-3 py-1 rounded-full border ${s.chip}">${s.label}</span>
      </div>
      <p class="text-slate-700 text-base sm:text-lg leading-relaxed">${f.facility}</p>
      <p class="text-slate-600 text-base leading-relaxed">${f.note}</p>
      ${
        f.onRoute
          ? '<span class="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300"><span class="material-symbols-outlined text-base">alt_route</span>On your route today</span>'
          : '<span class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-200 px-3 py-1 rounded-full">Not on your route</span>'
      }
    </div>
  </div>`;
}

function render() {
  const onRoute = facilities.filter((f) => f.onRoute).length;

  return `
${header({
  eyebrow: 'Step-Free Status',
  title: 'Lifts & Ramps',
  action: `<button data-action="refresh" class="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-full text-sm font-bold border-2 border-slate-300 transition-colors shadow-xs shrink-0">
             <span class="material-symbols-outlined text-xl text-emerald-800">refresh</span><span>Refresh</span>
           </button>`
})}

<main class="flex-1 max-w-3xl w-full mx-auto px-4 py-4 space-y-4">
  <div class="bg-emerald-50 border-2 border-emerald-600/40 rounded-2xl p-4 sm:p-5 shadow-sm flex items-start gap-4">
    <div class="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-sm"><span class="material-symbols-outlined text-2xl">accessible</span></div>
    <div class="space-y-1">
      <h2 class="text-lg sm:text-xl font-extrabold text-emerald-950 font-headline leading-tight">Your route stays 100% step-free</h2>
      <p class="text-slate-800 text-base sm:text-lg leading-relaxed font-medium">
        All ${onRoute} facilities on today’s journey to ${trip.destination} are working. The only fault nearby —
        Bishan MRT Lift 3 — is already bypassed by ${trip.service}.
      </p>
    </div>
  </div>

  ${card(
    `<h2 class="text-sm font-extrabold text-slate-800 font-headline uppercase tracking-wider">Live Facility Status</h2>
     <div class="space-y-4">${facilities.map(facilityRow).join('')}</div>`
  )}

  ${card(
    `<h2 class="text-sm font-extrabold text-slate-800 font-headline uppercase tracking-wider">Prefer a different route?</h2>
     <p class="text-slate-700 text-base sm:text-lg leading-relaxed">Your companion always picks the step-free option first. Tap below to see today’s route on the map.</p>
     <button data-route="/map" class="w-full min-h-[56px] bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99] text-white rounded-xl font-headline font-extrabold text-lg flex items-center justify-center gap-3 transition-all shadow-md">
       <span class="material-symbols-outlined text-2xl">explore</span><span>Open Step-Free Map</span>
     </button>`
  )}
</main>

${nav('lifts')}`;
}

function mount(root) {
  const onClick = (e) => {
    if (e.target.closest('[data-action="refresh"]')) {
      toast('Facility status refreshed — no new faults on your route.', { tone: 'success' });
    }
  };
  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}

export default {
  id: 'lifts',
  theme: 'companion',
  title: 'Lifts & Ramps - Transit Companion',
  bodyClass: companionBodyClass,
  render,
  mount
};
