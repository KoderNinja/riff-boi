// rhythm.js — turns when each note started (seconds) into beats and note values,
// using the tempo you set (BPM = beats per minute; one beat = a quarter note).

export const GRID = 0.25;          // the smallest step: a sixteenth note (a quarter of a beat)
export const BEATS_PER_BAR = 4;    // 4/4 time

// Note values, longest first, in beats. A dot makes a note half as long again.
const VALUES = [
  { beats: 4, name: 'whole', dotted: false },
  { beats: 3, name: 'half', dotted: true },
  { beats: 2, name: 'half', dotted: false },
  { beats: 1.5, name: 'quarter', dotted: true },
  { beats: 1, name: 'quarter', dotted: false },
  { beats: 0.75, name: 'eighth', dotted: true },
  { beats: 0.5, name: 'eighth', dotted: false },
  { beats: 0.25, name: 'sixteenth', dotted: false },
];

// notes: the riff's notes in order, each with `t` (seconds since New Riff).
// endTime: when the riff ended (seconds), for the last note's length (null = a quarter note).
// Returns one { beat, value } per note: `beat` is where it starts (the first note is beat 0),
// `value` is its note value. A note lasts until the next one starts; any leftover time
// that no note value fits is just space (like a short rest).
export function rhythmOf(notes, bpm, endTime = null) {
  if (notes.length === 0) return [];
  const toBeats = (t) => ((t - notes[0].t) * bpm) / 60;
  const snap = (beats) => Math.round(beats / GRID) * GRID;
  // Snap every start to the nearest sixteenth; two notes can't share a spot.
  const starts = [];
  for (const note of notes) {
    let beat = snap(toBeats(note.t));
    if (starts.length && beat <= starts[starts.length - 1]) beat = starts[starts.length - 1] + GRID;
    starts.push(beat);
  }
  const last = starts[starts.length - 1];
  const end = endTime === null ? last + 1 : Math.max(last + GRID, snap(toBeats(endTime)));
  return starts.map((beat, i) => ({ beat, value: valueFor((i + 1 < starts.length ? starts[i + 1] : end) - beat) }));
}

// The longest note value that fits in `beats`.
export function valueFor(beats) {
  return VALUES.find((v) => v.beats <= beats + 1e-9) ?? VALUES[VALUES.length - 1];
}
