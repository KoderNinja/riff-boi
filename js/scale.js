// scale.js — works out which key and scale a riff sounds like, like "E minor pentatonic".

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Each scale as semitones above its root. `relative` is the scale with the same notes that
// starts somewhere else (C major has the same notes as A minor): [its name, semitones up].
const SCALES = [
  { name: 'minor pentatonic', steps: [0, 3, 5, 7, 10], relative: ['major pentatonic', 3] },
  { name: 'major pentatonic', steps: [0, 2, 4, 7, 9], relative: ['minor pentatonic', 9] },
  { name: 'blues', steps: [0, 3, 5, 6, 7, 10] },
  { name: 'minor', steps: [0, 2, 3, 5, 7, 8, 10], relative: ['major', 3] },
  { name: 'major', steps: [0, 2, 4, 5, 7, 9, 11], relative: ['minor', 9] },
  { name: 'harmonic minor', steps: [0, 2, 3, 5, 7, 8, 11] },
  { name: 'Phrygian', steps: [0, 1, 3, 5, 7, 8, 10] },
];

const FEWEST_NOTES = 4;    // different notes needed to tell (3 fit too many scales)
const MOST_OUTSIDE = 0.25; // more than a quarter of the notes outside the best scale: no clear key

// The scale that fits the riff's notes best, or null if it can't tell. Returns
// { name: 'A# minor pentatonic', sameAs: 'C# major pentatonic' or null, outside: notes outside it }.
// Best = the fewest notes outside it; then the root that sounds like home (the first note counts
// most, then the lowest, then the last); then the smaller scale (a pentatonic says more than a
// 7-note scale that also fits).
export function findScale(notes) {
  const classes = notes.map((note) => note.midi % 12);
  if (new Set(classes).size < FEWEST_NOTES) return null;
  const lowest = Math.min(...notes.map((note) => note.midi)) % 12;
  const rootScore = (root) => (root === classes[0] ? 4 : 0) + (root === lowest ? 2 : 0) + (root === classes.at(-1) ? 1 : 0);
  let best = null;
  for (const scale of SCALES) {
    for (let root = 0; root < 12; root++) {
      const inScale = new Set(scale.steps.map((step) => (root + step) % 12));
      const outside = classes.filter((c) => !inScale.has(c)).length;
      const rank = [outside, -rootScore(root), scale.steps.length];
      if (!best || better(rank, best.rank)) best = { rank, scale, root, outside };
    }
  }
  if (best.outside > classes.length * MOST_OUTSIDE) return null;
  const { scale, root, outside } = best;
  const sameAs = scale.relative ? `${NOTE_NAMES[(root + scale.relative[1]) % 12]} ${scale.relative[0]}` : null;
  return { name: `${NOTE_NAMES[root]} ${scale.name}`, sameAs, outside };
}

// Is rank `a` better (smaller) than rank `b`? The first number decides; on a tie, the next.
function better(a, b) {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i];
  return false;
}
