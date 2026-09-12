# Senior Transit Companion — interactive prototype

A working prototype built from the Stitch design export for **Mdm Lily Koh**, a wheelchair
user travelling from Blk 142 Toa Payoh to Bishan Care Centre.

The two exported screens are reproduced exactly — same layout, colours, spacing and
typography — and everything on them now does something.

## Run it

The app uses ES modules, so it needs to be served over HTTP (opening `index.html`
straight from disk will not work).

```bash
npm start                  # http://localhost:8000
# or
python3 -m http.server 8000
```

No build step and no dependencies: edit a file, refresh the browser.

## Screens

| Route | Screen | Source |
| --- | --- | --- |
| `#/route` | Transit Companion home — route overview, voice guide, family sync | Stitch export 1 |
| `#/map` | Step-free map guide — interactive SVG map, current instruction | Stitch export 2 |
| `#/lifts`, `#/step-free` | Lift & ramp status | implied by the bottom nav |
| `#/family` | Family alert feed | implied by the bottom nav |
| `#/help` | Help, contacts, urgent assistance | implied by the bottom nav |

The two exported screens are byte-for-byte the delivered design plus data bindings.
The other three were needed to make the bottom navigation functional; they reuse screen 1's
visual language (white cards, 2px slate borders, emerald accents) rather than introducing
anything new.

## What is interactive

**Route screen**
- `Text: Large` cycles Large → Extra Large → Largest and rescales the whole app (persisted).
- `Play Spoken Guide` reads the route aloud via the Web Speech API; tap again to stop.
- The `English / 中文` label switches the spoken language.
- Each step card opens the map guide (click, or Enter/Space when focused).
- `Arriving in 4 mins` counts down live.
- `Confirm Departure & Notify Darren` starts the journey, sends the family message and
  then becomes a "send location update" button.
- `Live Sync Active` pauses/resumes family notifications; the pre-trip tile follows it.

**Map guide**
- `+` / `−` / `Me` / `Bus 56` pan and zoom the SVG map (animated viewBox).
- The "You are here" beacon rides the real route paths as the journey progresses.
- `Audio On`, `High Contrast` and `中文语音` toggle and persist.
- `Play Next Step Audio` speaks the current leg; the guidance card, step number, checks and
  "Coming Next" all follow the journey.
- `Call Transit Marshal`, `SOS` and `View All 3 Steps` open dialogs.
- `Share Location with Darren` posts to the family feed.

**Journey simulation** — once departure is confirmed, a clock advances the trip:
walking → boarding → riding → arrived, with toasts and (if audio is on) spoken
announcements. One simulated minute is 10 real seconds; change `config.demoMinuteMs`
in `src/data.js`. `Help → Reset Demo Journey` puts it back to the start.

## Project layout

```
index.html            page shell, fonts, Tailwind CDN
styles/app.css        global styles, per-screen tokens, text-size + contrast plumbing
src/
  theme.js            Tailwind design tokens from the export (loaded before the app)
  data.js             ALL mock data — trip, steps, contacts, messages, voice scripts
  state.js            store, journey phases, actions, simulated clock
  router.js           hash router
  speech.js           Web Speech API wrapper (EN / 中文)
  app.js              bootstrap: routes, preferences, milestone announcements
  ui/                 toast + modal
  screens/
    route.js          Stitch export 1
    map.js            Stitch export 2
    lifts.js
    family.js
    help.js
    shared.js         header / bottom nav / card used by the three extra screens
```

## Editing notes

- **Content** lives in `src/data.js`. Changing a step title, bus number, phone number or
  spoken script needs no other edit.
- **Design tokens** live in `src/theme.js`. The two exports disagreed on a few tokens
  (`surface`, `background` and the `rounded-*` scale), so those read from CSS variables that
  `styles/app.css` re-points per screen via `body[data-screen-theme]`. Every other token is
  shared. This is why class names never had to be rewritten.
- **A screen** is `{ id, theme, bodyClass, title, render(state), mount(root)?, update(state, root)? }`.
  `render` returns HTML, `mount` wires listeners once and returns a cleanup function, and
  `update` patches live values when the store changes — so a countdown tick never steals
  focus or resets scroll.
- **Text size** scales the root font size, so the map screen's exported pixel type scale was
  converted to the equivalent `rem` values in `src/theme.js`. At the default size the
  rendering is identical to the export.
- The export's `shadow-xs` class is a Tailwind v4 utility; `styles/app.css` defines it so the
  v3 CDN build matches the intended design.

## Known limits

- Spoken guidance depends on the browser's speech synthesis and on a Chinese voice being
  installed for 中文. Where it is unavailable the script is shown as a toast instead.
- All data is mocked and local. "Sending" a message writes to the in-app feed and
  `localStorage`; nothing leaves the browser. `Call` links are real `tel:` links.
- The Tailwind CDN build is used, matching the export. For production you would swap it for a
  compiled stylesheet using the same `src/theme.js` tokens.
