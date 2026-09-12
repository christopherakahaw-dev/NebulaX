/**
 * Single source of truth for the prototype.
 *
 * Screens never mutate this object directly -- they call the exported actions,
 * then re-render from `getState()`. Preferences and journey progress survive a
 * reload via localStorage.
 */

import { config, trip, steps, notificationTemplates, family } from './data.js';

/**
 * Text-size steps. The exported design is already large type, so "large" is 1x
 * and stays the default -- the app opens rendering exactly as designed.
 * "Standard" is below the design scale for anyone who finds it too big.
 */
export const TEXT_SIZES = [
  { id: 'standard', label: 'Standard', scale: 0.875, hint: 'Smaller than designed' },
  { id: 'large', label: 'Large', scale: 1, hint: 'Recommended' },
  { id: 'xlarge', label: 'Extra Large', scale: 1.15, hint: '15% larger' },
  { id: 'largest', label: 'Largest', scale: 1.3, hint: '30% larger' }
];

/** Journey phases in order. `planned` is before the user confirms departure. */
export const PHASES = ['planned', 'walking', 'boarding', 'riding', 'arrived'];

const defaultState = {
  prefs: {
    textSize: 'large',
    language: 'en',
    audioOn: true,
    highContrast: false
  },
  journey: {
    phase: 'planned',
    /** Minutes until Bus 56 reaches Berth 04. */
    busEtaMin: trip.busEtaMin,
    /** Minutes left on board once riding. */
    rideLeftMin: trip.rideMin,
    /** 0..1 progress along the walking leg, used to move the map beacon. */
    walkProgress: 0.45,
    departedAt: null
  },
  familySync: true,
  speaking: false,
  notifications: []
};

let state = load();
const listeners = new Set();

function load() {
  const base = structuredClone(defaultState);
  try {
    const saved = JSON.parse(localStorage.getItem(config.storageKey) || 'null');
    if (!saved) return base;
    return {
      ...base,
      prefs: { ...base.prefs, ...(saved.prefs || {}) },
      journey: { ...base.journey, ...(saved.journey || {}) },
      familySync: saved.familySync ?? base.familySync,
      notifications: Array.isArray(saved.notifications) ? saved.notifications : []
    };
  } catch {
    return base;
  }
}

function persist() {
  try {
    localStorage.setItem(
      config.storageKey,
      JSON.stringify({
        prefs: state.prefs,
        journey: state.journey,
        familySync: state.familySync,
        notifications: state.notifications
      })
    );
  } catch {
    /* private mode: preferences just won't stick */
  }
}

export function getState() {
  return state;
}

/** Shallow-merges a patch, persists, and notifies subscribers. */
function update(patch) {
  state = { ...state, ...patch };
  persist();
  listeners.forEach((fn) => fn(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/* --------------------------------------------------------------------------
   Derived helpers
   -------------------------------------------------------------------------- */

/** Index into `steps` for the leg the user is on right now. */
export function currentStepIndex() {
  const { phase } = state.journey;
  if (phase === 'boarding') return 1;
  if (phase === 'riding' || phase === 'arrived') return 2;
  return 0;
}

export function currentStep() {
  return steps[currentStepIndex()];
}

/** Human label for the bus arrival badge. */
export function busEtaLabel() {
  const { phase, busEtaMin } = state.journey;
  if (phase === 'riding') return 'On board now';
  if (phase === 'arrived') return 'Journey complete';
  if (busEtaMin <= 0) return 'At Berth 04 now';
  if (busEtaMin === 1) return 'Arriving in 1 min';
  return `Arriving in ${busEtaMin} mins`;
}

export function textScale() {
  return (TEXT_SIZES.find((t) => t.id === state.prefs.textSize) || TEXT_SIZES[0]).scale;
}

export function textSizeLabel() {
  return (TEXT_SIZES.find((t) => t.id === state.prefs.textSize) || TEXT_SIZES[0]).label;
}

/* --------------------------------------------------------------------------
   Actions
   -------------------------------------------------------------------------- */

export const actions = {
  setTextSize(id) {
    const size = TEXT_SIZES.find((t) => t.id === id);
    if (!size) return null;
    update({ prefs: { ...state.prefs, textSize: size.id } });
    return size;
  },

  setLanguage(language) {
    update({ prefs: { ...state.prefs, language } });
  },

  toggleLanguage() {
    const language = state.prefs.language === 'en' ? 'zh' : 'en';
    update({ prefs: { ...state.prefs, language } });
    return language;
  },

  setAudio(audioOn) {
    update({ prefs: { ...state.prefs, audioOn } });
  },

  toggleAudio() {
    const audioOn = !state.prefs.audioOn;
    update({ prefs: { ...state.prefs, audioOn } });
    return audioOn;
  },

  toggleHighContrast() {
    const highContrast = !state.prefs.highContrast;
    update({ prefs: { ...state.prefs, highContrast } });
    return highContrast;
  },

  setSpeaking(speaking) {
    update({ speaking });
  },

  toggleFamilySync() {
    update({ familySync: !state.familySync });
    return state.familySync;
  },

  /** Logs a message to the family feed. `type` keys into notificationTemplates. */
  notifyFamily(type) {
    const message = notificationTemplates[type] || notificationTemplates.location;
    const entry = {
      id: `${type}-${Date.now()}`,
      type,
      to: family.name,
      channel: family.channels,
      message,
      at: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    };
    update({ notifications: [entry, ...state.notifications].slice(0, 12) });
    return entry;
  },

  /** "Confirm Departure & Notify Darren" -- starts the live journey. */
  confirmDeparture() {
    if (state.journey.phase !== 'planned') return false;
    update({
      journey: { ...state.journey, phase: 'walking', departedAt: Date.now() }
    });
    actions.notifyFamily('departure');
    return true;
  },

  /** Moves the journey to the next phase and notifies family at the milestones. */
  advancePhase() {
    const i = PHASES.indexOf(state.journey.phase);
    if (i < 0 || i === PHASES.length - 1) return state.journey.phase;
    const phase = PHASES[i + 1];
    update({ journey: { ...state.journey, phase } });
    if (phase === 'riding') actions.notifyFamily('boarding');
    if (phase === 'arrived') actions.notifyFamily('arrival');
    return phase;
  },

  /** One simulated minute of the journey clock. */
  tickMinute() {
    const j = state.journey;
    if (j.phase === 'planned' || j.phase === 'arrived') return;

    if (j.phase === 'walking') {
      const busEtaMin = Math.max(0, j.busEtaMin - 1);
      const walkProgress = Math.min(1, j.walkProgress + 0.25);
      update({ journey: { ...j, busEtaMin, walkProgress } });
      if (busEtaMin === 0) actions.advancePhase();
      return;
    }

    if (j.phase === 'boarding') {
      // Boarding takes one simulated minute, then the bus pulls away.
      actions.advancePhase();
      return;
    }

    if (j.phase === 'riding') {
      const rideLeftMin = Math.max(0, j.rideLeftMin - 1);
      update({ journey: { ...j, rideLeftMin } });
      if (rideLeftMin === 0) actions.advancePhase();
    }
  },

  /** Puts the demo back to its opening state. */
  resetJourney() {
    update({
      journey: structuredClone(defaultState.journey),
      notifications: [],
      familySync: true
    });
  }
};

let clockId = null;

/** Starts the simulated journey clock (idempotent). */
export function startClock() {
  if (clockId) return;
  clockId = setInterval(() => actions.tickMinute(), config.demoMinuteMs);
}

export function stopClock() {
  clearInterval(clockId);
  clockId = null;
}
