// share.js — puts a riff in a link, so a friend can open its tab. The riff goes in the part of
// the link after "#", which browsers never send to the website, so it isn't stored anywhere.

import { METERS } from './rhythm.js';
import { midiToName } from './notes.js';
import { TUNING } from './tab.js';

const PREFIX = '#riff=';
const MOST_NOTES = 2000; // a riff this long is already a whole song

// The link for a riff: this page, with the riff packed into the "#riff=..." part.
export function riffToLink(riff, pageUrl) {
  const data = {
    v: 1, // the link format, in case it changes later
    n: riff.name || riff.label,
    b: riff.bpm,
    e: riff.endTime,
    r: riff.rhythm === false ? 0 : 1,
    m: riff.meter,
    w: riff.written ? 1 : 0,
    s: riff.notes.map((note) => [note.midi, note.string, note.fret, Math.round(note.t * 100) / 100, note.bend || 0, note.release ? 1 : 0, note.prebend ? 1 : 0]),
  };
  return pageUrl.split('#')[0] + PREFIX + toBase64Url(JSON.stringify(data));
}

// The riff in a link's "#riff=..." part, or null if there isn't one or it can't be read.
// Anyone can make a link, so every value is checked before it's used.
export function riffFromLink(hash) {
  if (!hash.startsWith(PREFIX)) return null;
  let data;
  try {
    data = JSON.parse(fromBase64Url(hash.slice(PREFIX.length)));
  } catch {
    return null; // cut off or garbled
  }
  if (data?.v !== 1 || !Array.isArray(data.s) || data.s.length === 0 || data.s.length > MOST_NOTES) return null;
  const whole = (x, low, high) => Number.isInteger(x) && x >= low && x <= high;
  const number = (x, low, high) => typeof x === 'number' && Number.isFinite(x) && x >= low && x <= high;
  const notes = [];
  for (const item of data.s) {
    if (!Array.isArray(item)) return null;
    const [midi, string, fret, t, bend, release, prebend] = item;
    if (!whole(string, 1, 6) || !whole(fret, 0, 24) || !number(t, 0, 3600) || !whole(bend, 0, 3)) return null;
    if (midi !== TUNING[string - 1] + fret) return null; // the string and fret must give that note
    const note = { midi, name: midiToName(midi), string, fret, t };
    if (bend) Object.assign(note, { bend }, release === 1 && { release: true }, prebend === 1 && { prebend: true });
    notes.push(note);
  }
  const name = typeof data.n === 'string' && data.n.trim() ? data.n.trim().slice(0, 40) : 'Shared riff';
  return {
    id: 'shared', // not saved yet: "Save to my riffs" gives it a real one
    label: 'Shared with you', // shown under it, where a saved riff shows its date
    name,
    notes,
    confidence: null,
    bpm: number(data.b, 40, 240) ? data.b : 120,
    endTime: number(data.e, 0, 3600) ? data.e : null,
    rhythm: data.r !== 0,
    meter: METERS.includes(data.m) ? data.m : '4/4',
    written: data.w === 1 || undefined,
    shared: true,
  };
}

// Text → base64 that's safe in a link (letters, digits, - and _), and back. TextEncoder keeps
// names with accents or emoji working.
function toBase64Url(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text) {
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}
