// storage.js — saves and loads riffs in localStorage (the browser's notebook for this site).

const RIFFS_KEY = 'riffboi.riffs';

// All saved riffs, newest first. Returns an empty list if nothing is saved yet,
// the saved data can't be read, or the browser blocks storage (e.g. some private windows).
export function loadRiffs() {
  try {
    const riffs = JSON.parse(localStorage.getItem(RIFFS_KEY));
    return Array.isArray(riffs) ? riffs : [];
  } catch {
    return [];
  }
}

// Settings: the tempo (BPM), whether Riff Boi works the tempo out by itself (Auto), the time
// signature, and whether the tab shows rhythm. Remembered between visits.
const SETTINGS_KEY = 'riffboi.settings';
export const DEFAULT_SETTINGS = { bpm: 120, autoTempo: false, meter: '4/4', rhythm: true };

export function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Saving settings isn't vital (e.g. a private window): they just won't be remembered.
  }
}

// The audio input you picked (its device id), or '' for the default input.
const INPUT_KEY = 'riffboi.inputDeviceId';

export function loadInputId() {
  try {
    return localStorage.getItem(INPUT_KEY) || '';
  } catch {
    return '';
  }
}

export function saveInputId(deviceId) {
  try {
    if (deviceId) localStorage.setItem(INPUT_KEY, deviceId);
    else localStorage.removeItem(INPUT_KEY);
  } catch {
    // Not vital either: the picker just won't be remembered.
  }
}

// Save a new riff at the top of the list and return it.
// `confidence` is how sure Riff Boi was about it (see confidence.js), or null.
// `timing` is { bpm, endTime, meter, autoTempo }: the tempo it was played at, when its last
// note ended (seconds), its time signature, and whether Riff Boi worked the tempo out by
// itself, so its note values can be drawn again later.
// Throws if the browser won't let us save (the app shows a message).
export function saveRiff(notes, confidence = null, timing = {}) {
  const now = new Date();
  const riff = {
    id: String(now.getTime()),
    label: now.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
    createdAt: now.toISOString(),
    // Keep just what's needed to draw the tab again later (see spec.md > Data Model).
    // Bend details are only there for bent notes (the rest are left out when saved).
    notes: notes.map(({ midi, name, string, fret, t, bend, release, prebend }) => ({ midi, name, string, fret, t, bend, release, prebend })),
    confidence: confidence && roundNumbers(confidence),
    bpm: timing.bpm,
    endTime: timing.endTime === undefined ? undefined : Math.round(timing.endTime * 100) / 100,
    meter: timing.meter,
    autoTempo: timing.autoTempo || undefined, // only saved when it's true
  };
  localStorage.setItem(RIFFS_KEY, JSON.stringify([riff, ...loadRiffs()]));
  return riff;
}

// Change a saved riff (like typing a new tempo for it) and return the changed riff, or null
// if it's not there any more. Throws if the browser won't let us save.
export function updateRiff(id, changes) {
  const riffs = loadRiffs();
  const riff = riffs.find((r) => r.id === id);
  if (!riff) return null;
  Object.assign(riff, changes);
  localStorage.setItem(RIFFS_KEY, JSON.stringify(riffs));
  return riff;
}

// 0.873456 → 0.87, so saved riffs stay small. Text (like the hint) stays as it is.
function roundNumbers(object) {
  return Object.fromEntries(Object.entries(object).map(([key, value]) =>
    [key, typeof value === 'number' ? Math.round(value * 100) / 100 : value]));
}
