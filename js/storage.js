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
// Throws if the browser won't let us save (the app shows a message).
export function saveRiff(notes) {
  const now = new Date();
  const riff = {
    id: String(now.getTime()),
    label: now.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
    createdAt: now.toISOString(),
    // Keep just what's needed to draw the tab again later (see spec.md > Data Model).
    notes: notes.map(({ midi, name, string, fret, t }) => ({ midi, name, string, fret, t })),
  };
  localStorage.setItem(RIFFS_KEY, JSON.stringify([riff, ...loadRiffs()]));
  return riff;
}
