// tab.js — picks a string and fret for each note, and draws the tab.

// Standard tuning, as MIDI numbers. String 1 is the high e, string 6 is the low E,
// the same order as the lines on a tab (high e on top).
const TUNING = [64, 59, 55, 50, 45, 40];
const STRING_LABELS = ['e', 'B', 'G', 'D', 'A', 'E'];
export const MAX_FRET = 22;

// Every string/fret spot where this note can be played.
export function positionsFor(midi) {
  const spots = [];
  TUNING.forEach((openMidi, i) => {
    const fret = midi - openMidi;
    if (fret >= 0 && fret <= MAX_FRET) spots.push({ string: i + 1, fret });
  });
  return spots;
}

// The simple position rule.
// First note: the lowest fret. After that: the fret closest to the previous note's
// fret, so your hand stays put. On a tie, the lower (thicker) string.
export function choosePosition(midi, previous) {
  const spots = positionsFor(midi);
  if (spots.length === 0) return null;
  const target = previous ? previous.fret : 0;
  spots.sort((a, b) =>
    Math.abs(a.fret - target) - Math.abs(b.fret - target) || b.string - a.string
  );
  return spots[0];
}

// Draw notes as six lines of tab text inside the given element, e.g.
//   e|-------
//   A|-5-7---
// Each note gets its own column, left to right in the order played.
export function drawTab(element, notes) {
  const lines = STRING_LABELS.map((label) => label + '|-');
  for (const note of notes) {
    const fret = String(note.fret);
    for (let s = 1; s <= 6; s++) {
      lines[s - 1] += (s === note.string ? fret : '-'.repeat(fret.length)) + '-';
    }
  }
  element.textContent = lines.map((line) => line + '--').join('\n');
  element.scrollLeft = element.scrollWidth; // keep the newest notes in view
}
