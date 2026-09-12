/**
 * Screen 1 -- "Transit Companion" home / route overview.
 * Markup is the Stitch export; only data bindings, ids and data-action hooks
 * were added. Nothing about the layout, colours, spacing or type was changed.
 */

import { user, family, trip, steps, advisory, preTripChecks, notificationTemplates } from '../data.js';
import { getState, actions, currentStepIndex, busEtaLabel, textSizeLabel } from '../state.js';
import { toggleSpeak, isSpeaking, stop as stopSpeech } from '../speech.js';
import { toast } from '../ui/toast.js';
import { openModal } from '../ui/modal.js';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Which step card carries the emerald highlight. Before boarding this is the
 * bus step (as delivered in the export, because it holds the live arrival
 * time); afterwards it follows the leg the passenger is actually on.
 */
function highlightIndex(state) {
  const phase = state.journey.phase;
  return phase === 'planned' || phase === 'walking' ? 1 : currentStepIndex();
}

const statTone = {
  emerald: 'bg-emerald-100 text-emerald-800',
  sky: 'bg-sky-100 text-sky-700',
  amber: 'bg-amber-100 text-amber-800'
};

function statCard(stat) {
  return `
    <div class="bg-slate-50 border-2 border-slate-200 rounded-xl p-3.5 text-center flex flex-col items-center justify-center">
      <div class="w-9 h-9 rounded-full ${statTone[stat.tone]} flex items-center justify-center mb-1">
        <span class="material-symbols-outlined text-xl">${stat.icon}</span>
      </div>
      <span class="text-xs font-bold text-slate-600 uppercase block">${stat.label}</span>
      <span class="text-lg sm:text-xl font-extrabold text-slate-900 font-headline">${stat.value}</span>
    </div>`;
}

/** Plain (non-highlighted) step card -- steps 1 and 3 in the export. */
function plainStep(step) {
  return `
    <div class="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 sm:p-5 flex items-start gap-4 cursor-pointer"
         role="button" tabindex="0" data-route="/map" data-step="${step.id}"
         aria-label="Step ${step.number}: ${step.title}. Open the map guide.">
      <div class="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-base font-extrabold font-headline shrink-0 mt-0.5 shadow-sm">${step.number}</div>
      <div class="flex-1 space-y-1.5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="font-extrabold text-slate-900 text-lg sm:text-xl font-headline">${step.title}</h3>
          <span class="${
            step.number === 1
              ? 'text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300'
              : 'text-xs sm:text-sm font-bold text-slate-600 bg-slate-200 px-2.5 py-1 rounded-full'
          }">${step.badge}</span>
        </div>
        <p class="text-slate-700 text-base sm:text-lg leading-relaxed font-normal">${step.body}</p>
      </div>
    </div>`;
}

/** Highlighted step card -- emerald treatment from the export. */
function highlightedStep(step, state) {
  return `
    <div class="bg-emerald-50/70 border-2 border-emerald-600/40 rounded-xl p-4 sm:p-5 flex items-start gap-4 relative shadow-xs cursor-pointer"
         role="button" tabindex="0" data-route="/map" data-step="${step.id}"
         aria-label="Step ${step.number}: ${step.title}. Open the map guide.">
      <div class="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center text-base font-extrabold font-headline shrink-0 mt-0.5 shadow-sm">${step.number}</div>
      <div class="flex-1 space-y-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <h3 class="font-extrabold text-slate-900 text-lg sm:text-xl font-headline">${step.title}</h3>
            <span class="bg-emerald-700 text-white text-xs sm:text-sm font-extrabold px-2.5 py-1 rounded-md">${step.badge}</span>
          </div>
          <span id="bus-eta-badge" class="text-xs sm:text-sm font-extrabold text-emerald-900 bg-emerald-200 px-3 py-1 rounded-full">${busEtaLabel()}</span>
        </div>
        <p class="text-slate-800 text-base sm:text-lg leading-relaxed font-normal">${step.body}</p>
        ${
          step.confirmation
            ? `<div class="inline-flex items-center gap-2 text-sm font-bold text-emerald-900 bg-white px-3 py-2 rounded-lg border border-emerald-300 shadow-xs">
                 <span class="material-symbols-outlined text-lg text-emerald-700">check_circle</span>${step.confirmation}
               </div>`
            : ''
        }
      </div>
    </div>`;
}

function render(state) {
  const hi = highlightIndex(state);

  return `
<!-- TOP HEADER / SENIOR WARM GREETING BAR -->
<header class="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
  <div class="max-w-3xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-3">
    <div class="flex items-center gap-3.5">
      <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-950 flex items-center justify-center border-2 border-emerald-300 font-headline font-extrabold text-xl shrink-0 shadow-sm">${user.initials}</div>
      <div>
        <div class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800"><span class="w-2 h-2 rounded-full bg-emerald-600"></span>SG Transit Companion</div>
        <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 font-headline leading-tight">${greeting()}, ${user.formalName}</h1>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <button data-action="text-size" aria-label="Toggle larger readable text size" class="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-full text-sm font-bold border-2 border-slate-300 transition-colors shadow-xs shrink-0">
        <span class="material-symbols-outlined text-xl text-emerald-800">text_fields</span>
        <span>Text: <span id="text-size-label">${textSizeLabel()}</span></span>
      </button>
    </div>
  </div>
</header>

<!-- MAIN SCROLLABLE CONTENT FOR SENIOR PASSENGER -->
<main class="flex-1 max-w-3xl w-full mx-auto px-4 py-4 space-y-4">
  <p id="route-live" class="sr-only" aria-live="polite"></p>

  <!-- 1-TAP ACCESSIBLE VOICE GUIDE BAR -->
  <section aria-label="Voice Guide" class="bg-emerald-50 border-2 border-emerald-600/40 rounded-2xl p-4 sm:p-5 shadow-sm">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-start sm:items-center gap-3.5">
        <div class="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-sm"><span class="material-symbols-outlined text-2xl">volume_up</span></div>
        <div>
          <div class="flex items-center gap-2 mb-0.5">
            <span class="text-xs font-extrabold uppercase tracking-wide text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">Audio Voice Guide</span>
            <button data-action="toggle-language" class="text-xs font-bold text-slate-600 underline decoration-dotted underline-offset-2" aria-label="Switch spoken guide language">
              <span id="lang-label">${state.prefs.language === 'zh' ? '中文' : 'English'}</span> / <span class="opacity-60">${state.prefs.language === 'zh' ? 'English' : '中文'}</span>
            </button>
          </div>
          <p class="text-slate-900 font-bold text-base sm:text-lg leading-snug">Listen to step-by-step spoken route directions</p>
        </div>
      </div>
      <button id="voice-guide-btn" data-action="play-guide" class="w-full sm:w-auto h-12 px-6 bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99] text-white rounded-xl font-headline font-bold text-base shadow-sm flex items-center justify-center gap-2 transition-all shrink-0">
        <span class="material-symbols-outlined text-xl">play_arrow</span><span>Play Spoken Guide</span>
      </button>
    </div>
  </section>

  <!-- REASSURING ACCESSIBILITY ADVISORY: BISHAN MRT LIFT 3 REPLACEMENT -->
  <div class="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-sm" role="alert">
    <div class="flex items-start gap-4">
      <div class="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center shrink-0 mt-0.5"><span class="material-symbols-outlined text-2xl font-bold">${advisory.icon}</span></div>
      <div class="space-y-1.5 flex-1">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 class="text-lg sm:text-xl font-extrabold text-amber-950 font-headline leading-tight">${advisory.title}</h2>
          <span class="bg-amber-200 text-amber-950 text-xs sm:text-sm font-extrabold px-3 py-1 rounded-full border border-amber-300">${advisory.tag}</span>
        </div>
        <p class="text-slate-800 text-base sm:text-lg leading-relaxed font-medium">${advisory.body}</p>
      </div>
    </div>
  </div>

  <!-- MAIN ROUTE CARD -->
  <section id="route" class="bg-white border-2 border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
    <div class="pb-4 border-b border-slate-200">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
        <span class="inline-flex items-center gap-1.5 text-emerald-900 text-xs sm:text-sm font-extrabold tracking-wide uppercase bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-300"><span class="material-symbols-outlined text-base text-emerald-700">check_circle</span>100% Step-Free Guaranteed</span>
        <div class="text-left sm:text-right">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wide block">Target Arrival</span>
          <span class="text-lg sm:text-xl font-extrabold text-emerald-800 font-headline">${trip.arrivalLabel}</span>
        </div>
      </div>
      <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 font-headline leading-tight">${trip.title}</h2>
    </div>

    <!-- Peace of Mind Stat Badges -->
    <div class="grid grid-cols-3 gap-3">${trip.stats.map(statCard).join('')}</div>

    <!-- 3 Step Direction Cards -->
    <div id="step-list" class="space-y-4 pt-1" data-highlight="${hi}">
      ${steps.map((s, i) => (i === hi ? highlightedStep(s, state) : plainStep(s))).join('')}
    </div>
  </section>

  <!-- FAMILY REASSURANCE & ONE-TAP NOTIFICATION -->
  <section id="sync" aria-label="Family Sync" class="bg-white border-2 border-emerald-700/30 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3.5">
        <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200"><span class="material-symbols-outlined text-2xl">family_restroom</span></div>
        <div>
          <span class="text-xs font-extrabold text-emerald-800 uppercase tracking-wide block">Family Peace-of-Mind</span>
          <h2 class="text-xl font-extrabold text-slate-900 font-headline">Connected to ${family.name} (${family.relation})</h2>
        </div>
      </div>
      <button data-action="toggle-sync" id="sync-pill" class="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-900 bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-300">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-600"></span><span id="sync-pill-label">Live Sync Active</span>
      </button>
    </div>

    <p class="text-slate-700 text-base sm:text-lg leading-relaxed font-normal">You don’t have to type anything ${user.firstName}. When you tap the large button below, ${family.name} instantly receives your journey status:</p>

    <!-- SMS preview card -->
    <div class="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 sm:p-5 text-slate-800 relative">
      <div class="flex items-center gap-2 text-xs font-extrabold text-slate-600 uppercase tracking-wide mb-1.5"><span class="material-symbols-outlined text-base text-emerald-700">sms</span>Automatic ${family.channels} Notification to ${family.name}</div>
      <p id="sms-preview" class="italic text-base sm:text-lg text-slate-900 leading-relaxed font-medium bg-white p-3.5 rounded-lg border border-slate-200">${notificationTemplates.departure}</p>
    </div>

    <!-- GIANT SENIOR ACCESSIBLE ACTION BUTTONS -->
    <div class="space-y-3 pt-2">
      <button id="departure-btn" data-action="confirm-departure" class="w-full min-h-[64px] bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99] text-white py-4 px-6 rounded-2xl flex flex-col items-center justify-center transition-all shadow-md">
        <span class="text-xl sm:text-2xl font-extrabold font-headline flex items-center justify-center gap-2.5">
          <span class="material-symbols-outlined text-3xl" id="departure-btn-icon">directions_walk</span><span id="departure-btn-label">Confirm Departure &amp; Notify ${family.name}</span>
        </span>
        <span class="text-sm text-emerald-100 font-medium mt-1" id="departure-btn-note">One tap sends your live safe progress directly to ${family.name}</span>
      </button>
      <a class="w-full min-h-[56px] bg-slate-100 hover:bg-slate-200 active:scale-[0.99] text-slate-900 font-headline font-extrabold py-3.5 px-5 rounded-xl flex items-center justify-center gap-3 text-lg border-2 border-slate-300 transition-colors shadow-xs" href="tel:${family.phone}">
        <span class="material-symbols-outlined text-emerald-800 text-2xl">call</span><span>Call ${family.name} Directly</span>
      </a>
    </div>
  </section>

  <!-- PRE-TRIP READINESS CHECK -->
  <div class="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
    <h3 class="text-sm font-extrabold text-slate-800 font-headline uppercase tracking-wider mb-3.5">Pre-Trip Equipment &amp; Weather Check</h3>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
      ${preTripChecks
        .map(
          (c) => `
        <div class="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <span class="material-symbols-outlined text-emerald-700 text-2xl shrink-0">${c.icon}</span>
          <div>
            <span class="text-xs font-bold text-slate-500 block">${c.label}</span>
            <span class="text-base font-extrabold ${c.valueClass}"${c.bind ? ` id="check-${c.bind}"` : ''}>${c.value}</span>
          </div>
        </div>`
        )
        .join('')}
    </div>
  </div>
</main>

<!-- BOTTOM NAVIGATION BAR -->
<nav class="fixed bottom-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg">
  <div class="max-w-3xl mx-auto flex items-center justify-around py-2.5 px-3">
    <a class="flex flex-col items-center justify-center text-emerald-800 px-3 py-1 font-extrabold flex-1" href="#/route" aria-current="page"><span class="material-symbols-outlined text-2xl">alt_route</span><span class="text-xs sm:text-sm font-headline mt-0.5">Route</span></a>
    <a class="flex flex-col items-center justify-center text-slate-600 hover:text-slate-900 px-3 py-1 font-bold flex-1 transition-colors" href="#/lifts"><span class="material-symbols-outlined text-2xl">elevator</span><span class="text-xs sm:text-sm font-headline mt-0.5">Lifts</span></a>
    <a class="flex flex-col items-center justify-center text-slate-600 hover:text-slate-900 px-3 py-1 font-bold flex-1 transition-colors" href="#/family"><span class="material-symbols-outlined text-2xl">family_restroom</span><span class="text-xs sm:text-sm font-headline mt-0.5">Family</span></a>
    <a class="flex flex-col items-center justify-center text-slate-600 hover:text-slate-900 px-3 py-1 font-bold flex-1 transition-colors" href="#/help"><span class="material-symbols-outlined text-2xl">help_outline</span><span class="text-xs sm:text-sm font-headline mt-0.5">Help</span></a>
  </div>
</nav>`;
}

function mount(root) {
  root.addEventListener('click', onClick);
  return () => {
    root.removeEventListener('click', onClick);
    stopSpeech();
  };
}

function onClick(e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;

  switch (el.dataset.action) {
    case 'text-size': {
      const next = actions.cycleTextSize();
      toast(`Text size: ${next.label}`, { tone: 'info', duration: 2200 });
      break;
    }

    case 'toggle-language': {
      const lang = actions.toggleLanguage();
      toast(lang === 'zh' ? '语音指南已切换为中文' : 'Voice guide switched to English', { tone: 'info' });
      break;
    }

    case 'play-guide': {
      const started = toggleSpeak('overview');
      announce(started ? 'Playing the spoken route guide.' : 'Spoken guide stopped.');
      break;
    }

    case 'toggle-sync': {
      const on = actions.toggleFamilySync();
      toast(on ? `Live sync with ${family.name} is on.` : `Live sync paused. ${family.name} will not receive updates.`, {
        tone: on ? 'success' : 'warn'
      });
      break;
    }

    case 'confirm-departure': {
      const state = getState();
      if (!state.familySync) {
        toast(`Turn "Live Sync" back on to notify ${family.name}.`, { tone: 'warn' });
        return;
      }
      if (state.journey.phase === 'planned') {
        actions.confirmDeparture();
        openModal({
          title: `${family.name} has been notified`,
          body: `<p>${notificationTemplates.departure}</p><p class="text-slate-600 text-base">Sent by ${family.channels}. Your live progress now updates automatically.</p>`,
          actions: [
            { label: 'Open the step-free map', icon: 'explore', onClick: () => (location.hash = '/map') },
            { label: 'Stay on this screen', icon: 'close', variant: 'ghost' }
          ]
        });
        announce(`Departure confirmed. ${family.name} has been notified.`);
      } else {
        actions.notifyFamily('location');
        toast(`Location update sent to ${family.name}.`);
      }
      break;
    }
  }
}

function announce(message) {
  const live = document.getElementById('route-live');
  if (live) live.textContent = message;
}

/** Patches the live parts of the screen without re-rendering it. */
function update(state, root) {
  const set = (id, value) => {
    const el = root.querySelector(`#${id}`);
    if (el && el.textContent !== value) el.textContent = value;
  };

  set('text-size-label', textSizeLabel());
  set('lang-label', state.prefs.language === 'zh' ? '中文' : 'English');
  set('bus-eta-badge', busEtaLabel());

  // Voice guide button reflects whether audio is playing.
  const voiceBtn = root.querySelector('#voice-guide-btn');
  if (voiceBtn) {
    const playing = state.speaking || isSpeaking();
    voiceBtn.innerHTML = `<span class="material-symbols-outlined text-xl">${playing ? 'stop_circle' : 'play_arrow'}</span><span>${
      playing ? 'Stop Spoken Guide' : 'Play Spoken Guide'
    }</span>`;
  }

  // Family sync pill + matching pre-trip tile.
  const pill = root.querySelector('#sync-pill');
  if (pill) {
    pill.className = state.familySync
      ? 'inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-900 bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-300'
      : 'inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-300';
    pill.querySelector('span').className = `w-2.5 h-2.5 rounded-full ${state.familySync ? 'bg-emerald-600' : 'bg-slate-400'}`;
    set('sync-pill-label', state.familySync ? 'Live Sync Active' : 'Live Sync Paused');
  }
  const syncCheck = root.querySelector('#check-familySync');
  if (syncCheck) {
    syncCheck.textContent = state.familySync ? 'Active' : 'Paused';
    syncCheck.className = `text-base font-extrabold ${state.familySync ? 'text-emerald-800' : 'text-slate-500'}`;
  }

  // Latest message shown in the SMS preview.
  set('sms-preview', state.notifications[0]?.message || notificationTemplates.departure);

  // Departure button becomes a location-update button once the trip is under way.
  const departed = state.journey.phase !== 'planned';
  set('departure-btn-icon', departed ? 'share_location' : 'directions_walk');
  set('departure-btn-label', departed ? `Send Location Update to ${family.name}` : `Confirm Departure & Notify ${family.name}`);
  set(
    'departure-btn-note',
    departed
      ? `Departure confirmed — ${family.name} is following your journey`
      : `One tap sends your live safe progress directly to ${family.name}`
  );

  // Move the emerald highlight when the journey progresses past boarding.
  const list = root.querySelector('#step-list');
  const hi = highlightIndex(state);
  if (list && Number(list.dataset.highlight) !== hi) {
    list.dataset.highlight = String(hi);
    list.innerHTML = steps.map((s, i) => (i === hi ? highlightedStep(s, state) : plainStep(s))).join('');
  }
  root.querySelectorAll('[data-step]').forEach((card, i) => card.setAttribute('aria-current', i === hi ? 'step' : 'false'));
}

export default {
  id: 'route',
  theme: 'companion',
  title: 'Transit Companion - Mdm Lily Koh',
  bodyClass:
    'bg-surface text-on-surface min-h-screen flex flex-col antialiased selection:bg-emerald-100 selection:text-primary pb-28',
  render,
  mount,
  update
};
