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

// notes: the riff's notes in order, each with `t` (seconds since New Riff).
// endTime: when the riff ended (seconds), for the last note's length (null = a quarter note).
// Returns one { beat, value } per note: `beat` is where it starts (the first note is beat 0,
// unless `origin` says where beat 0 is, in seconds, like the downbeat after a count-in),
// `value` is its note value. A note lasts until the next one starts; any leftover time
// that no note value fits is just space (like a short rest).
export function rhythmOf(notes, bpm, endTime = null, origin = null) {
  if (notes.length === 0) return [];
  const zero = origin ?? notes[0].t;
  const toBeats = (t) => ((t - zero) * bpm) / 60;
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

// --- Count-in ---

// Where the clicks go in a one-bar count-in, in beats: on each beat group of the time signature
// (every quarter in x/4, every dotted quarter in 6/8, 9/8 and 12/8, and 2+2+3 in 7/8).
export function countInClicks(meter) {
  let at = 0;
  return meterOf(meter).groups.map((group) => {
    const click = at;
    at += group;
    return click;
  });
}

// A note is confirmed about this long after it's played: the mic's own delay, plus the 3 readings
// it takes to be sure. Without a count-in that doesn't matter (every note is late by the same
// amount, and beats count from the first note). After a count-in, beats count from the downbeat,
// so it's taken off. (Measured: notes played on the beat were confirmed 60 to 100 ms late.)
export const HEARD_LATE = 0.06; // seconds

// After a count-in, beat 0 is the downbeat (t = 0). The tab starts at the bar the first note is
// in, so bars before it that were just waiting don't show. Returns where that bar starts on the
// notes' clock (seconds; notes are HEARD_LATE late, so it's that much after the bar's start).
export function countInOrigin(firstT, bpm, meter) {
  const firstBeat = Math.round((((firstT - HEARD_LATE) * bpm) / 60) / GRID) * GRID; // on the sixteenth grid, like rhythmOf
  const bar = Math.max(0, Math.floor(firstBeat / meterOf(meter).barBeats + 1e-9));
  return bar * meterOf(meter).barBeats * (60 / bpm) + HEARD_LATE;
}

// Which notes start a new bar (their index), for bar lines in text tab.
export function barStarts(notes, bpm, endTime, meter, origin = null) {
  const time = meterOf(meter);
  const beats = rhythmOf(notes, bpm, endTime, origin);
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
const PULSE_FIT = 0.15;    // a gap fits if it's within 15% of a pulse of a whole number of pulses
const OFF_NOTES = 1 / 8;   // up to 1 note in 8 may be off the beat (played early or late, or an extra note)
const MIDDLE = 0.15;       // ...but not within 15% of a pulse of right in the middle (that's a real shorter note)
const SHORTEST_PULSE = 0.06; // seconds: sixteenths at 250 BPM, faster than anyone picks
const LONG_PAUSE = 2.5;      // seconds: a gap this long is a pause, not part of the rhythm

// notes: the riff's notes in order, each with `t` (seconds). Returns the tempo in BPM, or null
// if there are fewer than 4 notes or they don't follow a steady beat.
export function detectTempo(notes) {
  const times = notes.map((note) => note.t);
  const gaps = times.slice(1).map((t, i) => t - times[i]);
  const counted = gaps.filter((gap) => gap < LONG_PAUSE).length; // long pauses don't count
  if (counted < 3) return null;
  // The pulse: the longest steady step that every gap is a whole number of. A riff of eighths
  // and quarters has an eighth-note pulse; 3+3+2 sixteenths has a sixteenth pulse.
  const allowed = Math.floor(counted * OFF_NOTES);
  let pulse = null;
  for (let step = LONG_PAUSE; step >= SHORTEST_PULSE; step /= 1.01) {
    if (offNotes(gaps, step) <= allowed) {
      pulse = step;
      break;
    }
  }
  if (!pulse) return null;
  // That step is only close. Fine-tune it with every note, 3 times over (each time the count
  // gets more exact).
  let exact = pulse;
  for (let pass = 0; pass < 3; pass++) exact = fitPulse(times, exact);
  // The pulse is a half note, a quarter, an eighth or a sixteenth: pick the one that puts the
  // tempo in the range, or as close to it as possible.
  const [low, high] = AUTO_TEMPO_RANGE;
  const outside = (bpm) => (bpm < low ? Math.log2(low / bpm) : bpm >= high ? Math.log2(bpm / high) + 1e-9 : 0);
  const tempo = [0.5, 1, 2, 4].map((pulsesPerBeat) => 60 / (exact * pulsesPerBeat))
    .reduce((best, bpm) => (outside(bpm) < outside(best) ? bpm : best));
  return Math.round(Math.min(240, Math.max(40, tempo)));
}

// How many notes are off the beat with this pulse. A gap that isn't a whole number of pulses
// must add up to one with the next gap: that's one note played early or late, or an extra
// note in between. If it doesn't, it's a real note the pulse can't explain, so the pulse is
// wrong (Infinity). A real sixteenth among eighths is like that. So is a note right in the
// middle between two pulses (like two sixteenths in a row): that's a shorter note, not a late one.
function offNotes(gaps, pulse) {
  let off = 0;
  for (let i = 0; i < gaps.length; i++) {
    if (gaps[i] >= LONG_PAUSE || fits(gaps[i], pulse)) continue;
    const part = gaps[i] / pulse - Math.floor(gaps[i] / pulse); // 0.5 = right in the middle
    if (Math.abs(part - 0.5) < MIDDLE) return Infinity;
    const next = gaps[i + 1];
    if (next === undefined || next >= LONG_PAUSE || !fits(gaps[i] + next, pulse)) return Infinity;
    off++;
    i++; // the next gap is already used up
  }
  return off;
}

// Is this gap (close to) a whole number of pulses, at least 1?
function fits(gap, pulse) {
  const pulses = gap / pulse;
  return Math.round(pulses) >= 1 && Math.abs(pulses - Math.round(pulses)) <= PULSE_FIT;
}

// Count where each note starts, in pulses (an extra note right after another counts as the
// same place), then find the straight line that best fits those places and the note times
// (least squares): its slope is the exact pulse. A long pause starts a new stretch, since
// nobody pauses for an exact number of beats.
function fitPulse(times, pulse) {
  let up = 0;
  let across = 0;
  let from = 0;
  for (let i = 1; i <= times.length; i++) {
    if (i < times.length && times[i] - times[i - 1] < LONG_PAUSE) continue;
    const stretch = times.slice(from, i); // the notes up to a pause (or the end)
    let place = 0;
    const places = stretch.map((t, j) => (j === 0 ? 0 : (place += Math.round((t - stretch[j - 1]) / pulse))));
    const meanPlace = places.reduce((sum, x) => sum + x, 0) / places.length;
    const meanTime = stretch.reduce((sum, t) => sum + t, 0) / stretch.length;
    places.forEach((x, j) => {
      up += (x - meanPlace) * (stretch[j] - meanTime);
      across += (x - meanPlace) ** 2;
    });
    from = i;
  }
  return across > 0 ? up / across : pulse;
}
