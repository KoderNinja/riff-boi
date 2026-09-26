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

// Save a new riff at the top of the list and return it.
// `confidence` is how sure Riff Boi was about it (see confidence.js), or null.
// Throws if the browser won't let us save (the app shows a message).
export function saveRiff(notes, confidence = null) {
  const now = new Date();
  const riff = {
    id: String(now.getTime()),
    label: now.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
    createdAt: now.toISOString(),
    // Keep just what's needed to draw the tab again later (see spec.md > Data Model).
    // Bend details are only there for bent notes (the rest are left out when saved).
    notes: notes.map(({ midi, name, string, fret, t, bend, release, prebend }) => ({ midi, name, string, fret, t, bend, release, prebend })),
    confidence: confidence && roundNumbers(confidence),
  };
  localStorage.setItem(RIFFS_KEY, JSON.stringify([riff, ...loadRiffs()]));
  return riff;
}

// 0.873456 → 0.87, so saved riffs stay small. Text (like the hint) stays as it is.
function roundNumbers(object) {
  return Object.fromEntries(Object.entries(object).map(([key, value]) =>
    [key, typeof value === 'number' ? Math.round(value * 100) / 100 : value]));
}
