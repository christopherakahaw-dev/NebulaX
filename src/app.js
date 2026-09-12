/**
 * Bootstrap: wires screens to routes, applies stored preferences and starts
 * the simulated journey clock.
 */

import { register, start } from './router.js';
import { getState, subscribe, textScale, startClock } from './state.js';
import { speak } from './speech.js';
import { toast } from './ui/toast.js';
import { trip, family } from './data.js';

import routeScreen from './screens/route.js';
import mapScreen from './screens/map.js';
import liftsScreen from './screens/lifts.js';
import familyScreen from './screens/family.js';
import helpScreen from './screens/help.js';

register('/route', routeScreen);
register('/map', mapScreen);
register('/lifts', liftsScreen);
register('/step-free', liftsScreen); // the map screen's nav label for the same screen
register('/family', familyScreen);
register('/help', helpScreen);

/** Text-size preference drives the root font size (see styles/app.css). */
function applyTextScale() {
  document.documentElement.style.setProperty('--ui-scale', String(textScale()));
}
applyTextScale();
subscribe(applyTextScale);

/** Cards marked role="button" should respond to Enter/Space like real buttons. */
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const el = e.target.closest?.('[role="button"][data-route]');
  if (!el) return;
  e.preventDefault();
  el.click();
});

/** Announce journey milestones once, wherever the user happens to be. */
let lastPhase = getState().journey.phase;
subscribe((state) => {
  const phase = state.journey.phase;
  if (phase === lastPhase) return;
  lastPhase = phase;

  const messages = {
    boarding: `${trip.service} has arrived at ${trip.berth}. The ramp is deploying for you.`,
    riding: `You are on board. ${trip.stops} stops to ${trip.destinationShort}.`,
    arrived: `You have arrived at ${trip.destination}. ${family.name} has been told.`
  };

  if (messages[phase]) {
    toast(messages[phase], { tone: phase === 'arrived' ? 'success' : 'info', duration: 6000 });
    if (state.prefs.audioOn) speak(phase);
  }
});

startClock();
start();

window.__TRANSIT_COMPANION_BOOTED__ = true;
