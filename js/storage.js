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

// Settings: the tempo (BPM) and whether the tab shows rhythm. Remembered between visits.
const SETTINGS_KEY = 'riffboi.settings';
export const DEFAULT_SETTINGS = { bpm: 120, rhythm: true };

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
// `timing` is { bpm, endTime, rhythm }: the tempo it was played at, when you tapped Stop
// (seconds), and whether rhythm was on, so its tab can be drawn the same way later.
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
    rhythm: timing.rhythm,
  };
  localStorage.setItem(RIFFS_KEY, JSON.stringify([riff, ...loadRiffs()]));
  return riff;
}

// How to draw a saved riff's tab: at the tempo it was played (riffs from before tempo
// existed use `bpm`, today's tempo), and with rhythm on or off the way it was recorded,
// so the Rhythm switch only changes new riffs. Riffs from before that was saved had rhythm on.
export function riffTiming(riff, bpm) {
  return { bpm: riff.bpm ?? bpm, endTime: riff.endTime ?? null, timing: riff.rhythm ?? true };
}

// 0.873456 → 0.87, so saved riffs stay small. Text (like the hint) stays as it is.
function roundNumbers(object) {
  return Object.fromEntries(Object.entries(object).map(([key, value]) =>
    [key, typeof value === 'number' ? Math.round(value * 100) / 100 : value]));
}
