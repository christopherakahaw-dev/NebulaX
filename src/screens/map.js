/**
 * Screen 2 -- "Step-Free Map Guide".
 * Markup is the Stitch export. The SVG map is now interactive: the viewBox
 * pans/zooms, and the "you are here" beacon rides the real route paths using
 * getPointAtLength(), driven by journey progress in the store.
 */

import { user, family, trip, steps } from '../data.js';
import { getState, actions, currentStepIndex, busEtaLabel } from '../state.js';
import { toggleSpeak, stop as stopSpeech, isSpeaking } from '../speech.js';
import { toast } from '../ui/toast.js';
import { openModal } from '../ui/modal.js';

/** Default map framing, and the presets the "Me" / "Bus 56" buttons jump to. */
const HOME_VIEW = { x: 0, y: 0, w: 1000, h: 620 };

/** Journey phase -> key in data.js speechScripts. */
const SCRIPT_FOR_PHASE = { planned: 'walk', walking: 'walk', boarding: 'boarding', riding: 'riding', arrived: 'arrived' };
const MIN_W = 260;
const MAX_W = 1400;

let view = { ...HOME_VIEW };
let animId = null;

function stepChecks(step) {
  const tone = {
    primary: {
      wrap: 'flex items-center gap-2.5 bg-surface-container-low/60 p-3 rounded-xl border border-outline-variant/60',
      icon: 'material-symbols-outlined text-primary text-[24px] material-symbols-filled',
      title: 'font-label-sm text-label-sm font-bold text-on-surface'
    },
    secondary: {
      wrap: 'flex items-center gap-2.5 bg-secondary-fixed/50 p-3 rounded-xl border border-secondary-container/40',
      icon: 'material-symbols-outlined text-secondary text-[24px] material-symbols-filled',
      title: 'font-label-sm text-label-sm font-bold text-on-secondary-fixed'
    }
  };
  return step.checks
    .map((c) => {
      const t = tone[c.tone] || tone.primary;
      return `
      <div class="${t.wrap}">
        <span class="${t.icon}">${c.icon}</span>
        <div class="flex flex-col">
          <span class="${t.title}">${c.title}</span>
          <span class="text-xs text-on-surface-variant">${c.note}</span>
        </div>
      </div>`;
    })
    .join('');
}

function phaseLabel(state) {
  return { planned: 'Not Departed', walking: 'On-Schedule', boarding: 'Boarding Now', riding: 'On Board', arrived: 'Arrived' }[
    state.journey.phase
  ];
}

function render(state) {
  const step = steps[currentStepIndex()];
  const next = steps[currentStepIndex() + 1];

  return `
<!-- ================= TOP APP BAR ================= -->
<header class="bg-surface dark:bg-inverse-surface border-b border-outline-variant dark:border-outline shadow-sm docked full-width top-0 sticky z-40">
  <div class="flex justify-between items-center w-full px-margin-mobile min-h-[56px] py-2 max-w-5xl mx-auto">
    <button data-route="/route" aria-label="Go back" class="flex items-center gap-2 text-primary dark:text-inverse-primary hover:bg-surface-container dark:hover:bg-surface-container-high rounded-xl px-3 py-2 min-h-[48px] active:scale-95 transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-primary" type="button">
      <span class="material-symbols-outlined text-[28px]">arrow_back</span>
      <span class="font-label-lg text-label-lg hidden sm:inline">Back to Route</span>
    </button>

    <div class="flex flex-col items-center text-center px-2">
      <h1 class="font-headline-sm text-headline-sm font-bold text-primary dark:text-inverse-primary leading-tight">Route to ${trip.destination}</h1>
      <div class="flex items-center gap-1.5 text-surface-tint">
        <span class="material-symbols-outlined text-[16px] text-secondary">accessible</span>
        <span class="font-label-sm text-label-sm text-on-surface-variant font-semibold">Step-Free Confirmed • ${user.fullName}</span>
      </div>
    </div>

    <button data-action="toggle-audio" aria-label="Audio readout assistance" class="flex items-center gap-1.5 bg-primary-fixed text-on-primary-fixed hover:bg-surface-container dark:hover:bg-surface-container-high rounded-xl px-3 py-2 min-h-[48px] active:scale-95 transition-transform duration-150 shadow-sm border border-outline-variant" id="audioToggleBtn" type="button">
      <span class="material-symbols-outlined text-[24px]">volume_up</span>
      <span class="font-label-md text-label-md">Audio On</span>
    </button>
  </div>

  <!-- Quick Senior Comfort Utility Strip -->
  <div class="bg-surface-container-low px-margin-mobile py-2 border-t border-outline-variant/40">
    <div class="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1.5 bg-surface-container-lowest px-3 py-1.5 rounded-full border border-outline-variant text-primary font-label-sm text-label-sm shadow-xs">
          <span class="material-symbols-outlined text-[18px] text-primary">roofing</span>100% Sheltered Walkways
        </span>
        <span class="inline-flex items-center gap-1.5 bg-secondary-fixed px-3 py-1.5 rounded-full text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
          <span class="material-symbols-outlined text-[18px] text-secondary">speed</span>Gentle 1:12 Ramps
        </span>
      </div>

      <div class="flex items-center gap-3">
        <button data-action="toggle-contrast" id="contrastBtn" class="flex items-center gap-1.5 text-primary hover:text-surface-tint font-label-sm text-label-sm py-1 px-2 rounded-lg bg-surface-container-lowest border border-outline-variant min-h-[40px]" type="button">
          <span class="material-symbols-outlined text-[18px]">contrast</span><span>High Contrast</span>
        </button>
        <button data-action="toggle-language" id="langBtn" class="flex items-center gap-1.5 text-primary hover:text-surface-tint font-label-sm text-label-sm py-1 px-2 rounded-lg bg-surface-container-lowest border border-outline-variant min-h-[40px]" type="button">
          <span class="material-symbols-outlined text-[18px]">translate</span><span>中文语音</span>
        </button>
      </div>
    </div>
  </div>
</header>

<!-- ================= MAIN CONTENT CANVAS ================= -->
<main class="flex-1 w-full max-w-5xl mx-auto px-margin-mobile sm:px-margin-tablet py-space-sm pb-36 flex flex-col gap-space-md">
  <p id="map-live" class="sr-only" aria-live="polite"></p>

  <!-- Active Transit Banner -->
  <div class="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
    <div class="flex items-center gap-3">
      <div class="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary flex-shrink-0 shadow-inner">
        <span class="material-symbols-outlined text-[28px] material-symbols-filled">accessible_forward</span>
      </div>
      <div>
        <div class="flex items-center gap-2">
          <span class="font-headline-sm text-headline-sm font-bold text-primary">${trip.originDetail} → Bishan Care</span>
          <span id="phase-pill" class="bg-primary-fixed text-on-primary-fixed text-label-sm font-label-sm px-2.5 py-0.5 rounded-full font-bold">${phaseLabel(state)}</span>
        </div>
        <p class="font-body-md text-body-md text-on-surface-variant">Planned route avoids broken lift at Bishan MRT Stn. Boarding assistance pre-alerted.</p>
      </div>
    </div>
    <div class="flex items-center gap-2 self-stretch md:self-auto justify-end">
      <button data-action="call-marshal" class="flex items-center justify-center gap-2 bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md px-4 py-2.5 rounded-lg border border-outline-variant min-h-[48px] active:scale-95 transition-transform" type="button">
        <span class="material-symbols-outlined text-[20px]">call</span>Call Transit Marshal
      </button>
    </div>
  </div>

  <!-- Interactive Accessible Vector Transit Map Container -->
  <div class="relative w-full rounded-2xl bg-surface-container-lowest border-2 border-outline-variant/80 shadow-md overflow-hidden min-h-[480px] flex flex-col">
    <div class="absolute top-4 left-4 z-20 flex flex-col gap-2">
      <div class="inline-flex items-center gap-2 bg-surface-container-lowest/95 backdrop-blur-md px-4 py-2 rounded-xl border border-outline-variant shadow-md text-primary font-label-md text-label-md">
        <span class="material-symbols-outlined text-surface-tint text-[22px]">beach_access</span>
        <span class="font-bold">100% Covered Walkway</span>
        <span class="text-on-surface-variant font-normal">• No Rain Exposure</span>
      </div>
    </div>

    <!-- Floating Map Utility Action Controls -->
    <div class="absolute top-4 right-4 z-20 flex flex-col gap-2.5">
      <button data-action="zoom-in" aria-label="Zoom In" class="w-14 h-14 bg-surface-container-lowest text-primary rounded-2xl border-2 border-outline-variant shadow-md flex items-center justify-center hover:bg-surface-container active:scale-95 transition-transform" type="button">
        <span class="material-symbols-outlined text-[30px] font-bold">add</span>
      </button>
      <button data-action="zoom-out" aria-label="Zoom Out" class="w-14 h-14 bg-surface-container-lowest text-primary rounded-2xl border-2 border-outline-variant shadow-md flex items-center justify-center hover:bg-surface-container active:scale-95 transition-transform" type="button">
        <span class="material-symbols-outlined text-[30px] font-bold">remove</span>
      </button>
      <button data-action="focus-me" aria-label="Recenter on my wheelchair location" class="h-14 px-4 bg-primary text-on-primary rounded-2xl border border-primary-container shadow-md flex items-center justify-center gap-2 hover:bg-primary-container active:scale-95 transition-transform" type="button">
        <span class="material-symbols-outlined text-[26px]">my_location</span>
        <span class="font-label-sm text-label-sm font-bold">Me</span>
      </button>
      <button data-action="focus-bus" aria-label="Locate active bus 56" class="h-14 px-4 bg-secondary text-on-secondary rounded-2xl shadow-md flex items-center justify-center gap-2 hover:bg-secondary-container active:scale-95 transition-transform" type="button">
        <span class="material-symbols-outlined text-[26px]">directions_bus</span>
        <span class="font-label-sm text-label-sm font-bold">Bus 56</span>
      </button>
    </div>

    <!-- Simplified High-Legibility Accessible Map Graphic Canvas (SVG) -->
    <div class="w-full h-[520px] bg-[#f2f6f3] relative overflow-hidden flex items-center justify-center select-none" style="background-image: radial-gradient(#d3ded7 1.5px, transparent 1.5px); background-size: 28px 28px;">
      <svg id="map-svg" class="w-full h-full object-cover" viewBox="0 0 1000 620" role="img" aria-label="Step-free route map from Blk 142 Toa Payoh to Bishan Care Centre">
        <defs>
          <linearGradient id="routeGradient" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stop-color="#153328"></stop>
            <stop offset="50%" stop-color="#2c4a3e"></stop>
            <stop offset="100%" stop-color="#466558"></stop>
          </linearGradient>
          <pattern height="12" id="shelterStripes" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse" width="12">
            <line opacity="0.6" stroke="#ffffff" stroke-width="4" x1="0" x2="0" y1="0" y2="12"></line>
          </pattern>
        </defs>

        <!-- Simplified Neighborhood Background Roads & Blocks -->
        <rect fill="#e2e8e3" height="48" rx="10" width="460" x="20" y="320"></rect>
        <text fill="#727974" font-family="Plus Jakarta Sans" font-size="14" font-weight="600" x="50" y="350">Lorong 1 Toa Payoh (Vehicular)</text>

        <rect fill="#e2e8e3" height="520" rx="16" width="80" x="360" y="40"></rect>
        <text fill="#727974" font-family="Plus Jakarta Sans" font-size="15" font-weight="600" transform="rotate(90, 408, 280)" x="408" y="280">Toa Payoh Central Express Link</text>

        <rect fill="#ffffff" height="140" rx="14" stroke="#c1c8c3" stroke-width="2" width="160" x="60" y="80"></rect>
        <text fill="#153328" font-family="Plus Jakarta Sans" font-size="16" font-weight="700" x="75" y="115">Toa Payoh Blk 142</text>
        <text fill="#414845" font-family="Inter" font-size="13" x="75" y="140">Flat Courtyard &amp; Void Deck</text>

        <rect fill="#ffffff" height="130" rx="16" stroke="#c1c8c3" stroke-width="2" width="220" x="180" y="430"></rect>
        <text fill="#153328" font-family="Plus Jakarta Sans" font-size="16" font-weight="700" x="200" y="465">Toa Payoh Bus Hub</text>
        <text fill="#414845" font-family="Inter" font-size="13" x="200" y="490">Berth 04 • Wheelchair Low-Floor</text>

        <rect fill="#fdeded" height="130" rx="16" stroke="#fca5a5" stroke-dasharray="6 4" stroke-width="2" width="180" x="580" y="110"></rect>
        <text fill="#ba1a1a" font-family="Plus Jakarta Sans" font-size="15" font-weight="700" x="600" y="145">Bishan MRT Station</text>
        <text fill="#93000a" font-family="Inter" font-size="13" x="600" y="170">⚠️ Lift 3 Under Repair</text>
        <text fill="#727974" font-family="Inter" font-size="12" x="600" y="192">Direct bypass engaged</text>

        <rect fill="#ffffff" height="150" rx="16" stroke="#153328" stroke-width="3" width="210" x="740" y="340"></rect>
        <text fill="#153328" font-family="Plus Jakarta Sans" font-size="17" font-weight="800" x="760" y="380">Bishan Care Centre</text>
        <text fill="#414845" font-family="Inter" font-size="13" x="760" y="405">Level 1 Community Clinic</text>
        <text fill="#2c4a3e" font-family="Plus Jakarta Sans" font-size="13" font-weight="700" x="760" y="430">✓ Step-Free Ramp at Doorway</text>

        <!-- THE 100% COVERED ACCESSIBLE PATHWAY -->
        <path d="M 140 220 L 140 280 Q 140 300 160 300 L 260 300 Q 280 300 280 320 L 280 430" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></path>
        <path id="bus-path" d="M 330 495 C 490 530, 560 420, 640 400 S 700 420, 740 420" fill="none" stroke="#fe932c" stroke-dasharray="14 10" stroke-linecap="round" stroke-width="10"></path>
        <path id="walk-path" d="M 140 220 L 140 280 Q 140 300 160 300 L 260 300 Q 280 300 280 320 L 280 430" fill="none" stroke="#2c4a3e" stroke-linecap="round" stroke-linejoin="round" stroke-width="10"></path>
        <path d="M 140 220 L 140 280 Q 140 300 160 300 L 260 300 Q 280 300 280 320 L 280 430" fill="none" stroke="url(#shelterStripes)" stroke-linecap="round" stroke-linejoin="round" stroke-width="8"></path>

        <circle cx="140" cy="250" fill="#ffffff" r="4"></circle>
        <circle cx="170" cy="300" fill="#ffffff" r="4"></circle>
        <circle cx="215" cy="300" fill="#ffffff" r="4"></circle>
        <circle cx="280" cy="355" fill="#ffffff" r="4"></circle>
        <circle cx="280" cy="395" fill="#ffffff" r="4"></circle>

        <!-- Marker 1: Starting Point -->
        <g transform="translate(140, 210)">
          <circle cx="0" cy="0" fill="#153328" r="16"></circle>
          <circle cx="0" cy="0" fill="#c8eada" r="8"></circle>
          <rect fill="#153328" filter="drop-shadow(0 3px 6px rgba(0,0,0,0.15))" height="34" rx="17" width="160" x="-80" y="-55"></rect>
          <text fill="#ffffff" font-family="Plus Jakarta Sans" font-size="13" font-weight="700" text-anchor="middle" x="0" y="-33">Start: ${user.homeMapLabel}</text>
        </g>

        <!-- Live position beacon (moved by src/screens/map.js) -->
        <g id="beacon" transform="translate(210, 300)">
          <circle class="beacon-pulse" cx="0" cy="0" fill="#2c4a3e" opacity="0.25" r="24"></circle>
          <circle cx="0" cy="0" fill="#153328" r="14" stroke="#ffffff" stroke-width="3"></circle>
          <circle cx="0" cy="0" fill="#fe932c" r="5"></circle>
          <rect fill="#ffffff" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.12))" height="30" rx="15" stroke="#153328" stroke-width="2" width="110" x="-55" y="-48"></rect>
          <text fill="#153328" font-family="Plus Jakarta Sans" font-size="12" font-weight="700" text-anchor="middle" x="0" y="-28">You are here</text>
        </g>

        <!-- Marker 2: Bus 56 Berth 04 -->
        <g transform="translate(280, 440)">
          <circle cx="0" cy="0" fill="#904d00" r="18" stroke="#ffffff" stroke-width="3"></circle>
          <path d="M -6 -6 L 6 -6 L 6 6 L -6 6 Z" fill="#ffffff"></path>
          <g transform="translate(30, -35)">
            <rect fill="#ffffff" filter="drop-shadow(0 3px 8px rgba(0,0,0,0.15))" height="52" rx="12" stroke="#fe932c" stroke-width="2" width="190" x="0" y="0"></rect>
            <text fill="#904d00" font-family="Plus Jakarta Sans" font-size="14" font-weight="800" x="14" y="24">${trip.service} • ${trip.berth}</text>
            <text id="map-bus-eta" fill="#153328" font-family="Inter" font-size="12" font-weight="600" x="14" y="42">Arriving in ${state.journey.busEtaMin}m (Ramp Ready)</text>
          </g>
        </g>

        <!-- Caution Sign at Bishan MRT Lift -->
        <g transform="translate(670, 160)">
          <polygon fill="#ba1a1a" points="0,-18 16,14 -16,14"></polygon>
          <text fill="#ffffff" font-family="Plus Jakarta Sans" font-size="14" font-weight="900" text-anchor="middle" x="0" y="10">!</text>
          <g transform="translate(25, -20)">
            <rect fill="#ffdad6" height="42" rx="10" stroke="#ba1a1a" stroke-width="1.5" width="160" x="0" y="0"></rect>
            <text fill="#93000a" font-family="Plus Jakarta Sans" font-size="12" font-weight="700" x="12" y="20">Lift 3 Out of Service</text>
            <text fill="#414845" font-family="Inter" font-size="11" x="12" y="34">Rerouted via Bus 56 direct</text>
          </g>
        </g>

        <!-- Marker 3: Destination -->
        <g transform="translate(840, 420)">
          <circle cx="0" cy="0" fill="#153328" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.2))" r="20" stroke="#ffffff" stroke-width="4"></circle>
          <circle cx="0" cy="0" fill="#ffffff" r="8"></circle>
          <g transform="translate(24, -36)">
            <rect fill="#153328" height="40" rx="8" width="120" x="0" y="0"></rect>
            <text fill="#ffffff" font-family="Plus Jakarta Sans" font-size="13" font-weight="700" x="14" y="24">End: Care Centre</text>
          </g>
        </g>
      </svg>

      <div class="absolute bottom-4 left-4 bg-surface-container-lowest/90 px-3 py-2 rounded-xl border border-outline-variant text-xs text-on-surface-variant flex items-center gap-2 shadow-xs font-label-sm">
        <span class="material-symbols-outlined text-[18px] text-primary">navigation</span>
        <span id="map-heading">Heading South to ${trip.berth}</span>
      </div>
    </div>
  </div>

  <!-- ================= DOCKED REASSURING GUIDANCE CARD ================= -->
  <section class="bg-surface-container-lowest rounded-2xl p-space-md border border-outline-variant shadow-md flex flex-col gap-4">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-outline-variant pb-3">
      <div class="flex items-center gap-3">
        <div id="step-number" class="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-headline-sm font-bold text-headline-sm flex-shrink-0">${step.number}</div>
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-surface-tint">CURRENT INSTRUCTION</span>
          <h2 id="step-title" class="font-headline-sm text-headline-sm font-bold text-primary">${step.mapTitle}</h2>
        </div>
      </div>
      <div class="inline-flex items-center gap-2 bg-surface-container-low px-3.5 py-1.5 rounded-full border border-outline-variant">
        <span id="step-icon" class="material-symbols-outlined text-[20px] text-primary">${step.mapIcon}</span>
        <span id="step-meta" class="font-label-md text-label-md font-bold text-primary">${step.mapMeta}</span>
        <span id="step-meta-note" class="text-on-surface-variant text-sm font-body-md">${step.mapMetaNote}</span>
      </div>
    </div>

    <div id="step-checks" class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">${stepChecks(step)}</div>

    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
      <button data-action="play-step" id="playStepBtn" class="flex-1 flex items-center justify-center gap-3 bg-primary-container text-on-primary hover:bg-primary font-headline-sm text-headline-sm font-bold py-4 px-6 rounded-xl min-h-[56px] shadow-md active:scale-95 transition-all" type="button">
        <span class="material-symbols-outlined text-[28px]">volume_up</span><span>Play Next Step Audio</span>
      </button>
      <button data-action="share-location" class="flex items-center justify-center gap-2.5 bg-surface-container-lowest hover:bg-surface-container text-primary font-label-lg text-label-lg font-bold py-4 px-6 rounded-xl border-2 border-primary-container min-h-[56px] active:scale-95 transition-all" type="button">
        <span class="material-symbols-outlined text-[24px] text-primary">share_location</span><span>Share Location with ${family.name} (${family.relation})</span>
      </button>
      <button data-action="sos" class="flex items-center justify-center gap-2 bg-surface-container-high text-primary hover:bg-surface-dim font-label-md text-label-md font-bold px-4 py-4 rounded-xl border border-outline-variant min-h-[56px] active:scale-95 transition-all" title="Help on the route" type="button">
        <span class="material-symbols-outlined text-[24px] text-error">sos</span><span class="sm:hidden">Urgent Help</span>
      </button>
    </div>

    <div class="bg-surface-bright p-3.5 rounded-xl border border-outline-variant/60 flex items-center justify-between text-on-surface-variant">
      <div class="flex items-center gap-2">
        <span id="next-label" class="font-label-md text-label-md font-semibold text-primary">${next ? `Coming Next (Step ${next.number}):` : 'Final Step:'}</span>
        <span id="next-body" class="text-sm font-body-md text-on-surface">${
          next ? next.body.replace(/<[^>]+>/g, '') : 'Follow the covered corridor into the Level 1 lobby.'
        }</span>
      </div>
      <button data-action="all-steps" class="text-primary font-label-sm text-label-sm font-bold underline hover:text-surface-tint min-h-[44px] flex items-center" type="button">View All 3 Steps</button>
    </div>
  </section>
</main>

<!-- ================= BOTTOM NAVIGATION BAR ================= -->
<nav class="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-margin-mobile py-space-xs bg-surface-container-lowest dark:bg-inverse-surface border-t border-outline-variant dark:border-outline shadow-md">
  <a aria-current="page" class="flex flex-col items-center justify-center bg-primary-container text-on-primary dark:bg-inverse-primary dark:text-on-primary-fixed rounded-xl px-4 py-2 min-h-[56px] transition-transform duration-150 active:scale-95" href="#/map">
    <span class="material-symbols-outlined text-[26px] material-symbols-filled">explore</span>
    <span class="font-label-md text-label-md font-bold text-on-primary mt-0.5">Map Guide</span>
  </a>
  <a class="flex flex-col items-center justify-center text-on-surface-variant dark:text-surface-variant hover:bg-surface-container dark:hover:bg-surface-container-high rounded-xl px-4 py-2 min-h-[56px] transition-transform duration-150 active:scale-95" href="#/step-free">
    <span class="material-symbols-outlined text-[26px]">accessible</span>
    <span class="font-label-md text-label-md mt-0.5">Step-Free</span>
  </a>
  <a class="flex flex-col items-center justify-center text-on-surface-variant dark:text-surface-variant hover:bg-surface-container dark:hover:bg-surface-container-high rounded-xl px-4 py-2 min-h-[56px] transition-transform duration-150 active:scale-95" href="#/family">
    <span class="material-symbols-outlined text-[26px]">contact_phone</span>
    <span class="font-label-md text-label-md mt-0.5">Family Alert</span>
  </a>
  <a class="flex flex-col items-center justify-center text-on-surface-variant dark:text-surface-variant hover:bg-surface-container dark:hover:bg-surface-container-high rounded-xl px-4 py-2 min-h-[56px] transition-transform duration-150 active:scale-95" href="#/help">
    <span class="material-symbols-outlined text-[26px]">sos</span>
    <span class="font-label-md text-label-md mt-0.5">Help</span>
  </a>
</nav>`;
}

/* --------------------------------------------------------------------------
   Map camera
   -------------------------------------------------------------------------- */

function applyView(svg, target, animate = true) {
  const clampedW = Math.min(MAX_W, Math.max(MIN_W, target.w));
  const scale = clampedW / target.w;
  const next = { x: target.x, y: target.y, w: clampedW, h: target.h * scale };

  cancelAnimationFrame(animId);
  if (!animate) {
    view = next;
    svg.setAttribute('viewBox', `${next.x} ${next.y} ${next.w} ${next.h}`);
    return;
  }

  const from = { ...view };
  const start = performance.now();
  const duration = 260;
  const frame = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const e = 1 - Math.pow(1 - t, 3); // ease-out cubic
    view = {
      x: from.x + (next.x - from.x) * e,
      y: from.y + (next.y - from.y) * e,
      w: from.w + (next.w - from.w) * e,
      h: from.h + (next.h - from.h) * e
    };
    svg.setAttribute('viewBox', `${view.x} ${view.y} ${view.w} ${view.h}`);
    if (t < 1) animId = requestAnimationFrame(frame);
  };
  animId = requestAnimationFrame(frame);
}

function zoomBy(svg, factor) {
  const cx = view.x + view.w / 2;
  const cy = view.y + view.h / 2;
  const w = view.w * factor;
  const h = view.h * factor;
  applyView(svg, { x: cx - w / 2, y: cy - h / 2, w, h });
}

function centerOn(svg, point, width = 460) {
  const h = width * (HOME_VIEW.h / HOME_VIEW.w);
  applyView(svg, { x: point.x - width / 2, y: point.y - h / 2, w: width, h });
}

/** Where the passenger is right now, in SVG coordinates. */
function beaconPoint(root, state) {
  const { phase, walkProgress, rideLeftMin } = state.journey;
  const walk = root.querySelector('#walk-path');
  const bus = root.querySelector('#bus-path');
  if (!walk || !bus) return { x: 210, y: 300 };

  if (phase === 'riding' || phase === 'arrived') {
    const done = phase === 'arrived' ? 1 : 1 - rideLeftMin / trip.rideMin;
    return bus.getPointAtLength(bus.getTotalLength() * Math.max(0, Math.min(1, done)));
  }
  if (phase === 'boarding') return { x: 280, y: 440 };
  return walk.getPointAtLength(walk.getTotalLength() * Math.max(0, Math.min(1, walkProgress)));
}

/* --------------------------------------------------------------------------
   Behaviour
   -------------------------------------------------------------------------- */

function mount(root) {
  view = { ...HOME_VIEW };

  const onClick = (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const svg = root.querySelector('#map-svg');
    const state = getState();

    switch (el.dataset.action) {
      case 'toggle-audio': {
        const on = actions.toggleAudio();
        if (!on) stopSpeech();
        toast(on ? 'Audio guidance on.' : 'Audio guidance muted.', { tone: on ? 'success' : 'warn', duration: 2200 });
        break;
      }

      case 'toggle-contrast': {
        const on = actions.toggleHighContrast();
        toast(on ? 'High contrast on.' : 'High contrast off.', { tone: 'info', duration: 2200 });
        break;
      }

      case 'toggle-language': {
        const lang = actions.toggleLanguage();
        toast(lang === 'zh' ? '语音指南已切换为中文' : 'Voice guide switched to English', { tone: 'info' });
        break;
      }

      case 'zoom-in':
        zoomBy(svg, 0.72);
        break;

      case 'zoom-out':
        zoomBy(svg, 1.38);
        break;

      case 'focus-me':
        centerOn(svg, beaconPoint(root, state));
        announce('Map centred on your location.');
        break;

      case 'focus-bus':
        centerOn(svg, { x: 330, y: 440 }, 520);
        announce(`Map centred on ${trip.service} at ${trip.berth}.`);
        break;

      case 'call-marshal':
        openModal({
          title: 'Call the Transit Marshal?',
          body: `<p>The marshal at ${trip.originStop} can meet you at ${trip.berth} and help with the ramp.</p>
                 <p class="text-slate-600 text-base">Counter line • +65 6555 0156</p>`,
          actions: [
            { label: 'Call now', icon: 'call', href: 'tel:+6565550156' },
            { label: 'Not now', icon: 'close', variant: 'ghost' }
          ]
        });
        break;

      case 'play-step': {
        const started = toggleSpeak(SCRIPT_FOR_PHASE[state.journey.phase]);
        announce(started ? 'Playing audio for the current step.' : 'Audio stopped.');
        break;
      }

      case 'share-location':
        actions.notifyFamily('location');
        toast(`Location shared with ${family.name}.`);
        break;

      case 'sos':
        openModal({
          title: 'Do you need urgent help?',
          tone: 'error',
          body: `<p>We will alert ${family.name} and the transit marshal with your exact location at ${trip.originStop}.</p>`,
          actions: [
            {
              label: `Yes, alert ${family.name} & marshal`,
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

      case 'all-steps':
        openModal({
          title: 'All 3 steps to Bishan Care Centre',
          body: steps
            .map(
              (s) => `<div class="flex gap-3">
                  <span class="w-8 h-8 shrink-0 rounded-full bg-emerald-800 text-white flex items-center justify-center font-extrabold">${s.number}</span>
                  <div><p class="font-extrabold text-slate-900">${s.title}</p><p class="text-base text-slate-700">${s.body}</p></div>
                </div>`
            )
            .join(''),
          actions: [{ label: 'Close', icon: 'close', variant: 'ghost' }]
        });
        break;
    }
  };

  root.addEventListener('click', onClick);

  // Frame the map on the passenger once the SVG has laid out.
  requestAnimationFrame(() => {
    const svg = root.querySelector('#map-svg');
    if (svg) applyView(svg, HOME_VIEW, false);
  });

  return () => {
    root.removeEventListener('click', onClick);
    cancelAnimationFrame(animId);
    stopSpeech();
  };
}

function announce(message) {
  const live = document.getElementById('map-live');
  if (live) live.textContent = message;
}

function update(state, root) {
  const step = steps[currentStepIndex()];
  const next = steps[currentStepIndex() + 1];
  const set = (id, value) => {
    const el = root.querySelector(`#${id}`);
    if (el && el.textContent !== value) el.textContent = value;
  };

  // Audio button (the export's own toggle behaviour, now backed by the store).
  const audioBtn = root.querySelector('#audioToggleBtn');
  if (audioBtn) {
    const on = state.prefs.audioOn;
    audioBtn.className = on
      ? 'flex items-center gap-1.5 bg-primary-fixed text-on-primary-fixed hover:bg-surface-container dark:hover:bg-surface-container-high rounded-xl px-3 py-2 min-h-[48px] active:scale-95 transition-transform duration-150 shadow-sm border border-outline-variant'
      : 'flex items-center gap-1.5 bg-secondary text-on-secondary hover:bg-surface-container dark:hover:bg-surface-container-high rounded-xl px-3 py-2 min-h-[48px] active:scale-95 transition-transform duration-150 shadow-sm border border-outline-variant';
    audioBtn.innerHTML = `
      <span class="material-symbols-outlined text-[24px]">${on ? 'volume_up' : 'volume_off'}</span>
      <span class="font-label-md text-label-md">${on ? 'Audio On' : 'Audio Mute'}</span>`;
  }

  const langBtn = root.querySelector('#langBtn');
  if (langBtn) {
    langBtn.querySelector('span:last-child').textContent = state.prefs.language === 'zh' ? 'English voice' : '中文语音';
  }

  const contrastBtn = root.querySelector('#contrastBtn');
  if (contrastBtn) contrastBtn.setAttribute('aria-pressed', String(state.prefs.highContrast));

  // Guidance card follows the journey.
  set('step-number', String(step.number));
  set('step-title', step.mapTitle);
  set('step-meta', step.mapMeta);
  set('step-meta-note', step.mapMetaNote);
  set('step-icon', step.mapIcon);
  set('phase-pill', phaseLabel(state));
  const boarded = state.journey.phase === 'riding' || state.journey.phase === 'arrived';
  set('map-bus-eta', boarded ? busEtaLabel() : `${busEtaLabel()} (Ramp Ready)`);

  const checks = root.querySelector('#step-checks');
  if (checks && checks.dataset.step !== step.id) {
    checks.dataset.step = step.id;
    checks.innerHTML = stepChecks(step);
  }

  set('next-label', next ? `Coming Next (Step ${next.number}):` : 'Final Step:');
  set('next-body', next ? next.body.replace(/<[^>]+>/g, '') : 'Follow the covered corridor into the Level 1 lobby.');

  const playBtn = root.querySelector('#playStepBtn');
  if (playBtn) {
    const playing = state.speaking || isSpeaking();
    playBtn.innerHTML = `<span class="material-symbols-outlined text-[28px]">${playing ? 'stop_circle' : 'volume_up'}</span><span>${
      playing ? 'Stop Step Audio' : 'Play Next Step Audio'
    }</span>`;
  }

  set(
    'map-heading',
    { planned: `Heading South to ${trip.berth}`, walking: `Heading South to ${trip.berth}`, boarding: `At ${trip.berth}`, riding: 'Heading East to Bishan', arrived: 'Arrived at Bishan Care Centre' }[
      state.journey.phase
    ]
  );

  // Move the live beacon along the route.
  const beacon = root.querySelector('#beacon');
  if (beacon) {
    const p = beaconPoint(root, state);
    beacon.setAttribute('transform', `translate(${p.x.toFixed(1)}, ${p.y.toFixed(1)})`);
  }
}

export default {
  id: 'map',
  theme: 'map',
  title: 'Senior Transit Companion - Step-Free Map Guide',
  bodyClass:
    'bg-background text-on-surface antialiased min-h-screen flex flex-col font-body-md selection:bg-primary-fixed selection:text-on-primary-fixed',
  render,
  mount,
  update
};
