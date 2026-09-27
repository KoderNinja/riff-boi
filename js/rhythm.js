// rhythm.js — turns when each note started (seconds) into beats and note values,
// using the tempo you set (BPM = beats per minute; one beat = a quarter note).

export const GRID = 0.25;          // the smallest step: a sixteenth note (a quarter of a beat)

// Time signatures you can pick. The tempo always counts quarter notes (♩ = 120), like tab
// sites do, so a bar of 7/8 is 3½ beats long.
export const METERS = ['2/4', '3/4', '4/4', '5/4', '6/8', '7/8', '9/8', '12/8'];

// "7/8" → { top: 7, bottom: 8, barBeats: 3.5, groups: [1, 1, 1.5] }. `groups` says how the
// eighths and sixteenths in a bar are joined by beams, in beats: one beat each in 2/4 to 5/4,
// threes in 6/8, 9/8 and 12/8 (1-2-3, 1-2-3), and 2+2+3 in 7/8. Anything unknown is 4/4.
export function meterOf(text) {
  if (!METERS.includes(text)) text = '4/4';
  const [top, bottom] = text.split('/').map(Number);
  let groups;
  if (bottom === 4) groups = Array(top).fill(1);
  else if (top % 3 === 0) groups = Array(top / 3).fill(1.5);
  else groups = [...Array((top - 3) / 2).fill(1), 1.5]; // 7/8: two eighths, two eighths, three
  return { top, bottom, barBeats: (top * 4) / bottom, groups };
}

// Which bar a beat is in (0 = the first bar).
export function barOf(beat, meter) {
  return Math.floor(beat / meter.barBeats + 1e-9);
}

// Which beam group a beat is in, counting from the start of the riff.
export function groupOf(beat, meter) {
  const bar = barOf(beat, meter);
  let into = beat - bar * meter.barBeats; // beats into the bar
  let group = 0;
  while (group < meter.groups.length - 1 && into >= meter.groups[group] - 1e-9) {
    into -= meter.groups[group];
    group++;
  }
  return bar * meter.groups.length + group;
}

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

// --- Reading the rhythm: which note values did you play? ---
//
// Real playing is never exactly on the beat, and the tempo drifts a little. So instead of
// snapping each note to the nearest sixteenth on its own, Riff Boi tries every way the riff
// could be written and keeps the most likely one (this is called the Viterbi algorithm). It
// weighs up three things:
// - timing: how far each gap between two notes is from the note value it's written as,
// - drift: the beat may speed up or slow down a little, but only gradually,
// - simple beats: each note is read in a "mode": quarters (every note on a beat), eighths (on a
//   beat or halfway) or sixteenths. Finer modes cost a little per note and switching costs more,
//   so a riff of quarter notes doesn't get one stray sixteenth just because a note was late.
const TEMPO_STEP = 0.01;     // one step of drift = 2^0.01, about 0.7% faster or slower
const DRIFT_STEPS = 12;      // the beat may drift up to 12 steps (about 9%) away from the tempo
const TIMING = 0.08;         // beats: how far off a gap typically is from its note value
const TIMING_LONG = 0.05;    // ...plus this share of the note value (long notes are less exact)
const SPEED_CHANGE = 0.3;    // the cost of the beat changing speed by one step between two notes
const AWAY = 0.02;           // the cost of starting away from the tempo, per step squared
const MODE_COST = [0, 0.25, 0.5]; // the cost per note of each mode: quarters, eighths, sixteenths
const PLACE_COST = [         // the cost of each place in the beat, in each mode (Infinity = can't)
  [0, Infinity, Infinity, Infinity], // quarters: on the beat
  [0, Infinity, 0.1, Infinity],      // eighths: on the beat or halfway (the "and")
  [0, 0.3, 0.1, 0.3],                // sixteenths: anywhere (the "e" and the "a" cost more)
];
const SWITCH = 3;            // the cost of switching modes
const EXACT = 0.03;          // beats: notes this close to the sixteenths are exact (a tab written by hand)

// x: when each note starts, in beats from the first note. `timing` is how far off a gap
// typically is (in beats). Returns the most likely length of each gap in sixteenths (`steps`),
// how fast the beat was going at each note compared to the tempo (`speeds`), and how unlikely
// that reading is (`cost`, lower = more likely).
function readRhythm(x, driftSteps = DRIFT_STEPS, timing = TIMING) {
  const speeds = Array.from({ length: 2 * driftSteps + 1 }, (_, k) => 2 ** ((k - driftSteps) * TEMPO_STEP));
  const S = speeds.length;
  const count = 3 * S * 4;
  const state = (mode, k, place) => (mode * S + k) * 4 + place; // place = sixteenths into the beat (0-3)
  let cost = new Float64Array(count).fill(Infinity);
  for (let mode = 0; mode < 3; mode++) {
    for (let k = 0; k < S; k++) cost[state(mode, k, 0)] = AWAY * (k - driftSteps) ** 2 + MODE_COST[mode];
  }
  const trail = []; // for each gap: the state each state came from, and the gap's length
  for (let i = 1; i < x.length; i++) {
    const next = new Float64Array(count).fill(Infinity);
    const from = new Int32Array(count);
    const length = new Int32Array(count);
    for (let k = 0; k < S; k++) {
      const gap = (x[i] - x[i - 1]) * speeds[k]; // in beats, at the speed the beat is going
      const nearest = Math.max(1, Math.round(gap / GRID));
      for (let steps = Math.max(1, nearest - 1); steps <= nearest + 1; steps++) {
        const spread = Math.hypot(timing, TIMING_LONG * steps * GRID);
        const off = ((gap - steps * GRID) / spread) ** 2 / 2;
        for (let change = -2; change <= 2; change++) {
          const before = k - change;
          if (before < 0 || before >= S) continue;
          for (let mode0 = 0; mode0 < 3; mode0++) {
            for (let place0 = 0; place0 < 4; place0++) {
              const was = state(mode0, before, place0);
              if (cost[was] === Infinity) continue;
              const place = (place0 + steps) % 4;
              const soFar = cost[was] + off + SPEED_CHANGE * change * change;
              for (let mode = 0; mode < 3; mode++) {
                const c = soFar + MODE_COST[mode] + PLACE_COST[mode][place] + (mode === mode0 ? 0 : SWITCH);
                const now = state(mode, k, place);
                if (c < next[now]) {
                  next[now] = c;
                  from[now] = was;
                  length[now] = steps;
                }
              }
            }
          }
        }
      }
    }
    cost = next;
    trail.push({ from, length });
  }
  // The cheapest ending, then back along the trail to the start.
  let end = 0;
  for (let s = 1; s < count; s++) if (cost[s] < cost[end]) end = s;
  const speedAt = (s) => speeds[Math.floor(s / 4) % S];
  const steps = [];
  const speedList = [speedAt(end)];
  for (let i = trail.length - 1, s = end; i >= 0; i--) {
    steps.unshift(trail[i].length[s]);
    s = trail[i].from[s];
    speedList.unshift(speedAt(s));
  }
  return { steps, speeds: speedList, cost: cost[end] };
}

// notes: the riff's notes in order, each with `t` (seconds since New Riff).
// endTime: when the riff ended (seconds), for the last note's length (null = a quarter note).
// Returns one { beat, value } per note: `beat` is where it starts (the first note is beat 0),
// `value` is its note value. A note lasts until the next one starts; any leftover time
// that no note value fits is just space (like a short rest). The rhythm only depends on the
// notes' times in beats, so a riff sped up or slowed down with its tempo keeps its note values.
export function rhythmOf(notes, bpm, endTime = null) {
  if (notes.length === 0) return [];
  const x = notes.map((note) => ((note.t - notes[0].t) * bpm) / 60);
  const snap = (beats) => Math.round(beats / GRID) * GRID;
  // Already right on the sixteenths (like a tab written by hand)? Then that's the rhythm.
  let starts = x.map(snap);
  let speed = 1;
  if (!x.every((beat, i) => Math.abs(beat - starts[i]) < EXACT && (i === 0 || starts[i] > starts[i - 1]))) {
    const reading = readRhythm(x);
    let beat = 0;
    starts = [0, ...reading.steps.map((steps) => (beat += steps * GRID))];
    speed = reading.speeds[reading.speeds.length - 1];
  }
  // The last note lasts until the end (at the speed the beat was going then): at least a sixteenth.
  const last = starts[starts.length - 1];
  const end = endTime === null ? last + 1 : last + Math.max(GRID, snap(((endTime - notes[notes.length - 1].t) * bpm * speed) / 60));
  return starts.map((beat, i) => ({ beat, value: valueFor((i + 1 < starts.length ? starts[i + 1] : end) - beat) }));
}

// Which notes start a new bar (their index), for bar lines in text tab.
export function barStarts(notes, bpm, endTime, meter) {
  const time = meterOf(meter);
  const beats = rhythmOf(notes, bpm, endTime);
  return beats.flatMap(({ beat }, i) => (i > 0 && barOf(beat, time) > barOf(beats[i - 1].beat, time) ? [i] : []));
}

// The longest note value that fits in `beats`.
export function valueFor(beats) {
  return VALUES.find((v) => v.beats <= beats + 1e-9) ?? VALUES[VALUES.length - 1];
}

// --- Auto tempo: work out the tempo from when the notes started ---

// A riff played twice as fast is the same notes at half the tempo, and the sound can't tell
// those apart. So the guess lands in this range when it can (from 80 up to, not including,
// 160 BPM). If the real tempo is outside it, type the right one on the saved riff.
export const AUTO_TEMPO_RANGE = [80, 160];
const TEMPO_TRIES = 1.01;     // try every tempo in the range, 1% apart
const TRY_DRIFT = 4;          // while trying, the beat may drift 4 steps (about 3%)
const TIMING_SECONDS = 0.035; // how far off a gap between two notes typically is, in seconds
const FINER = 0.6;            // a faster tempo has a finer grid of sixteenths, which fits any
                              // timing a bit better; this cost per gap evens that out
const SURE_BELOW = 0.8;       // a reading that costs less than this per gap is a sure one
const MOST_NOTES = 48;        // the first 48 notes are plenty (and it stays quick)

// notes: the riff's notes in order, each with `t` (seconds). Tries every tempo in the range
// and reads the rhythm at each one (see readRhythm): the tempo with the most likely reading
// wins. Returns { bpm, sure }, or null with fewer than 2 notes. It always makes a guess;
// `sure` is false with fewer than 4 notes, or when even the best reading doesn't fit well
// (like playing freely, with no steady beat).
export function detectTempo(notes) {
  const times = notes.slice(0, MOST_NOTES).map((note) => note.t);
  if (times.length < 2) return null;
  const gaps = times.length - 1;
  const [low, high] = AUTO_TEMPO_RANGE;
  let best = null;
  for (let bpm = low; bpm < high; bpm *= TEMPO_TRIES) {
    const reading = readRhythm(times.map((t) => ((t - times[0]) * bpm) / 60), TRY_DRIFT, (TIMING_SECONDS * bpm) / 60);
    const cost = reading.cost + FINER * gaps * Math.log(bpm / low);
    if (!best || cost < best.cost) best = { bpm, cost, reading };
  }
  // The exact tempo: the straight line that best fits the notes' times against their beats
  // (least squares). Its slope is the seconds per beat.
  let beat = 0;
  const beats = [0, ...best.reading.steps.map((steps) => (beat += steps * GRID))];
  const meanBeat = beats.reduce((sum, b) => sum + b, 0) / beats.length;
  const meanTime = times.reduce((sum, t) => sum + t, 0) / times.length;
  let up = 0;
  let across = 0;
  beats.forEach((b, i) => {
    up += (b - meanBeat) * (times[i] - meanTime);
    across += (b - meanBeat) ** 2;
  });
  let bpm = across > 0 ? 60 / (up / across) : best.bpm;
  // Drifting can take it just outside the range. Twice as slow always works (eighths become
  // quarters). Half as fast turns sixteenths into 32nds, which Riff Boi doesn't write.
  while (bpm < low) bpm *= 2;
  if (bpm >= high && beats.every((b) => b % 0.5 === 0)) bpm /= 2;
  const sure = times.length >= 4 && best.reading.cost / gaps < SURE_BELOW;
  return { bpm: Math.round(Math.min(240, Math.max(40, bpm))), sure };
}
