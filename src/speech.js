/**
 * Spoken guidance via the Web Speech API.
 * Falls back to an on-screen toast when the browser has no speech synthesis
 * (or the user has muted audio), so the interaction is never a dead end.
 */

import { speechScripts } from './data.js';
import { getState, actions } from './state.js';
import { toast } from './ui/toast.js';

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

export function isSupported() {
  return Boolean(synth);
}

export function isSpeaking() {
  return Boolean(synth && (synth.speaking || synth.pending));
}

/** Picks a voice matching the requested BCP-47 language, if the browser has one. */
function pickVoice(lang) {
  if (!synth) return null;
  const voices = synth.getVoices() || [];
  const base = lang.split('-')[0];
  return voices.find((v) => v.lang === lang) || voices.find((v) => v.lang?.startsWith(base)) || null;
}

/** Resolves the script text for a phase key ('overview' | journey phase). */
export function scriptFor(key) {
  const { language } = getState().prefs;
  const pack = speechScripts[language] || speechScripts.en;
  return { text: pack[key] || pack.overview, lang: pack.lang };
}

export function stop() {
  if (synth) synth.cancel();
  actions.setSpeaking(false);
}

/**
 * Speaks a phase script. Returns true if audio actually started.
 * @param {string} key - 'overview', 'walk', 'boarding', 'riding' or 'arrived'
 */
export function speak(key, { onEnd } = {}) {
  const { text, lang } = scriptFor(key);

  if (!getState().prefs.audioOn) {
    toast('Audio guide is muted. Tap “Audio On” to hear spoken directions.', { tone: 'warn' });
    return false;
  }

  if (!isSupported()) {
    toast(text, { tone: 'info', duration: 7000 });
    return false;
  }

  synth.cancel();

  // Long scripts are split on sentence boundaries; some browsers truncate
  // utterances over ~200 characters.
  const chunks = text.match(/[^.。!?！？]+[.。!?！？]*/g) || [text];
  actions.setSpeaking(true);

  chunks.forEach((chunk, i) => {
    const u = new SpeechSynthesisUtterance(chunk.trim());
    u.lang = lang;
    u.rate = 0.92; // unhurried pace
    u.pitch = 1;
    const voice = pickVoice(lang);
    if (voice) u.voice = voice;
    if (i === chunks.length - 1) {
      u.onend = () => {
        actions.setSpeaking(false);
        onEnd?.();
      };
      u.onerror = () => actions.setSpeaking(false);
    }
    synth.speak(u);
  });

  return true;
}

/** Speaks, or stops if already speaking. Returns the new speaking state. */
export function toggleSpeak(key, opts) {
  if (isSpeaking()) {
    stop();
    return false;
  }
  return speak(key, opts);
}

// Voice lists load asynchronously in Chrome; warm them up.
if (synth) synth.addEventListener?.('voiceschanged', () => pickVoice('en-SG'));
