/**
 * All mock data for the prototype lives here.
 * Edit these objects to change copy, timings, contacts or route details --
 * no screen hard-codes trip content.
 */

export const config = {
  /** How long one "simulated minute" lasts in real time. 10s keeps a demo watchable. */
  demoMinuteMs: 10000,
  /** Storage key for preferences + journey progress. */
  storageKey: 'transit-companion.v1'
};

export const user = {
  initials: 'LK',
  firstName: 'Lily',
  formalName: 'Mdm Koh',
  fullName: 'Mdm Lily Koh',
  home: 'Blk 142 Toa Payoh',
  homeMapLabel: 'Blk 142 Home',
  mobility: 'Motorised wheelchair',
  wheelchairBattery: 92
};

export const family = {
  name: 'Darren',
  relation: 'Son',
  phone: '+6591234567',
  phoneDisplay: '+65 9123 4567',
  channels: 'SMS & Telegram'
};

export const trip = {
  origin: 'Toa Payoh',
  originDetail: 'Blk 142 Toa Payoh',
  originStop: 'Toa Payoh Bus Interchange',
  destination: 'Bishan Care Centre',
  destinationShort: 'Bishan Community Centre',
  title: 'Toa Payoh → Bishan Care Centre',
  arrivalLabel: 'Around 2:40 PM',
  arrivalTime: '2:40 PM',
  service: 'Bus 56',
  berth: 'Berth 04',
  /** Minutes until Bus 56 reaches Berth 04 when the app opens. */
  busEtaMin: 4,
  /** Minutes spent on the bus once boarded. */
  rideMin: 18,
  stops: 7,
  stats: [
    { icon: 'stairs', label: 'Stairs', value: '0 Steps', tone: 'emerald' },
    { icon: 'umbrella', label: 'Shelter', value: '100% Covered', tone: 'sky' },
    { icon: 'schedule', label: 'Pacing', value: '+15m Buffer', tone: 'amber' }
  ]
};

/**
 * The three legs of the journey. `phase` is the journey state in which the step
 * is the current one (see src/state.js).
 */
export const steps = [
  {
    id: 'walk',
    number: 1,
    phase: 'walking',
    title: 'Roll to Toa Payoh Bus Interchange',
    badge: 'Gentle Flat Ramp',
    body: 'Exit Blk 142 lobby and follow the covered flat walkway to <strong class="text-slate-900">Berth 04</strong>. Wide path with zero curbs or steps.',
    mapTitle: 'Head to Berth 04 via Covered Ramp',
    mapMeta: '180m • 4 mins',
    mapMetaNote: '(comfortable pace)',
    mapIcon: 'directions_walk',
    durationMin: 4,
    checks: [
      { icon: 'check_circle', title: 'Zero Stairs', note: 'Smooth concrete pavement', tone: 'primary' },
      { icon: 'check_circle', title: 'Ramp Slope: 1:12', note: 'Easy manual wheelchair roll', tone: 'primary' },
      { icon: 'airline_seat_recline_normal', title: 'Rest Benches Ahead', note: '2 sheltered stops along path', tone: 'secondary' }
    ]
  },
  {
    id: 'board',
    number: 2,
    phase: 'boarding',
    title: 'Board Bus 56',
    badge: 'Berth 04',
    body: 'Low-floor wheelchair accessible bus. The motorized ramp will automatically deploy for your wheelchair.',
    confirmation: 'Wheelchair ramp request confirmed with Captain',
    mapTitle: 'Board Bus 56 at Berth 04',
    mapMeta: 'Berth 04 • ramp ready',
    mapMetaNote: '(captain alerted)',
    mapIcon: 'directions_bus',
    checks: [
      { icon: 'check_circle', title: 'Low-Floor Bus', note: 'Motorised ramp deploys for you', tone: 'primary' },
      { icon: 'check_circle', title: 'Captain Alerted', note: 'Ramp request already confirmed', tone: 'primary' },
      { icon: 'airline_seat_recline_normal', title: 'Priority Bay', note: 'Wheelchair bay kept free', tone: 'secondary' }
    ]
  },
  {
    id: 'alight',
    number: 3,
    phase: 'riding',
    title: 'Alight at Bishan Community Centre',
    badge: '7 stops (18 mins)',
    body: 'The curb height matches the bus door evenly. Direct covered corridor leads straight inside the care centre lobby.',
    mapTitle: 'Alight at Bishan Community Centre',
    mapMeta: '7 stops • 18 mins',
    mapMetaNote: '(stay seated)',
    mapIcon: 'accessible_forward',
    durationMin: 18,
    checks: [
      { icon: 'check_circle', title: 'Level Curb', note: 'Door height matches kerb', tone: 'primary' },
      { icon: 'check_circle', title: 'Covered Corridor', note: 'Straight into the lobby', tone: 'primary' },
      { icon: 'airline_seat_recline_normal', title: 'Seats at Lobby', note: 'Rest point inside entrance', tone: 'secondary' }
    ]
  }
];

/** Service advisory that explains why the route avoids Bishan MRT. */
export const advisory = {
  icon: 'elevator',
  title: 'Bishan MRT Lift 3 is Under Maintenance',
  tag: 'Route Safely Adjusted',
  body:
    'Don’t worry Lily! We automatically selected <strong class="text-amber-950 font-extrabold">Bus 56</strong> ' +
    'so you avoid all stairs and escalators. Your ride is smooth and ramp-accessible.'
};

/** Pre-trip equipment and weather tiles on the route screen. */
export const preTripChecks = [
  { icon: 'battery_charging_full', label: 'Wheelchair', value: '92% Full', valueClass: 'text-slate-900' },
  { icon: 'wb_sunny', label: 'Weather', value: 'Dry & Fair', valueClass: 'text-slate-900' },
  { icon: 'elevator', label: 'MRT Lift 3', value: 'Bypassed', valueClass: 'text-amber-700' },
  { icon: 'check_circle', label: 'Family Sync', value: 'Active', valueClass: 'text-emerald-800', bind: 'familySync' }
];

/** Lift / step-free facility status, used by the Lifts + Step-Free screen. */
export const facilities = [
  {
    station: 'Bishan MRT Station',
    facility: 'Lift 3 (Platform B → Concourse)',
    status: 'out',
    note: 'Under repair until 6 Oct. Your route bypasses this lift entirely.',
    onRoute: false
  },
  {
    station: 'Toa Payoh Bus Interchange',
    facility: 'Berth 04 boarding ramp',
    status: 'ok',
    note: 'Low-floor berth. Ramp tested this morning.',
    onRoute: true
  },
  {
    station: 'Blk 142 Toa Payoh',
    facility: 'Void deck covered walkway',
    status: 'ok',
    note: 'Sheltered end to end, 1:12 gradient, two rest benches.',
    onRoute: true
  },
  {
    station: 'Bishan Care Centre',
    facility: 'Level 1 entrance ramp',
    status: 'ok',
    note: 'Automatic doors, kerb-level approach from the bus stop.',
    onRoute: true
  },
  {
    station: 'Braddell MRT Station',
    facility: 'Lift A (Street → Concourse)',
    status: 'busy',
    note: 'Working, but queues reported at peak. Not on your route.',
    onRoute: false
  }
];

/** Help screen contacts. */
export const helpContacts = [
  { icon: 'call', label: 'Call Darren (Son)', detail: family.phoneDisplay, href: 'tel:' + family.phone, tone: 'primary' },
  { icon: 'support_agent', label: 'Transit Marshal', detail: 'Toa Payoh Interchange counter', action: 'call-marshal', tone: 'slate' },
  { icon: 'local_hospital', label: 'Bishan Care Centre', detail: 'Level 1 Community Clinic', href: 'tel:+6567771234', tone: 'slate' },
  { icon: 'sos', label: 'Emergency (995)', detail: 'Ambulance & fire', href: 'tel:995', tone: 'error' }
];

/**
 * Spoken guidance. Two languages, one entry per journey phase plus an overview.
 * Used by src/speech.js (Web Speech API).
 */
export const speechScripts = {
  en: {
    lang: 'en-SG',
    overview:
      'Good afternoon Mdm Koh. Your journey to Bishan Care Centre is completely step free. ' +
      'Step one: roll from Blk 142 along the covered walkway to Berth 04 at Toa Payoh Bus Interchange. ' +
      'Step two: board Bus 56 at Berth 04. The captain will deploy the wheelchair ramp for you. ' +
      'Step three: alight at Bishan Community Centre after 7 stops, then follow the covered corridor into the care centre. ' +
      'Expected arrival, 2:40 PM.',
    walk: 'Step one. Leave the Blk 142 lobby and follow the covered walkway to Berth 04. It is 180 metres, flat, with no kerbs and two rest benches on the way.',
    boarding: 'Step two. Bus 56 is at Berth 04. Wait beside the yellow ramp marking. The captain has confirmed your ramp request.',
    riding: 'Step three. Stay seated for 7 stops, about 18 minutes. I will tell you when to alight at Bishan Community Centre.',
    arrived: 'You have arrived at Bishan Care Centre. Follow the covered corridor straight into the Level 1 lobby. Darren has been notified.'
  },
  zh: {
    lang: 'zh-CN',
    overview:
      '许女士下午好。您前往碧山护理中心的路线全程无台阶。' +
      '第一步：从第142座沿有盖走道前往大巴窑巴士转换站4号泊位。' +
      '第二步：在4号泊位乘搭56号巴士，司机会为您放下轮椅斜坡板。' +
      '第三步：乘坐七个站后在碧山民众俱乐部下车，沿有盖走廊直接进入护理中心。预计到达时间：下午两点四十分。',
    walk: '第一步。离开第142座大堂，沿有盖走道前往4号泊位。路程180米，全程平坦，没有路缘，途中有两张休息长椅。',
    boarding: '第二步。56号巴士已抵达4号泊位。请在黄色斜坡标记旁等候，司机已确认为您放下斜坡板。',
    riding: '第三步。请安坐，共七个站，大约18分钟。到达碧山民众俱乐部时我会提醒您下车。',
    arrived: '您已抵达碧山护理中心。请沿有盖走廊直接进入一楼大堂。已通知达伦。'
  }
};

/** Message templates for the family notification feed. */
export const notificationTemplates = {
  departure:
    '“Mum has departed Blk 142 Toa Payoh. Step-free route via Bus 56. Ramp assistance confirmed. ' +
    'Expected arrival at Bishan Care Centre at 2:40 PM.”',
  boarding: '“Mum has boarded Bus 56 at Berth 04. Ramp deployed, seated safely. ETA 2:40 PM.”',
  location: '“Mum is on the covered walkway to Berth 04, Toa Payoh Interchange. On schedule.”',
  arrival: '“Mum has arrived at Bishan Care Centre and is heading into the Level 1 lobby.”',
  help: '“Mum has tapped Urgent Help on her Transit Companion. Last known location: Toa Payoh Interchange, Berth 04.”'
};
