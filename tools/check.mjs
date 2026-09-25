// tools/check.mjs — quick checks that Riff Boi's note and tab logic still work.
// Usage: node tools/check.mjs
// Uses made-up readings (no guitar needed). Run it after changing notes.js or tab.js.

import { readNote, createNoteTracker } from '../js/notes.js';
import { placeNotes, positionsFor, drawTab } from '../js/tab.js';

let allOk = true;
function check(label, ok, detail = '') {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}${ok ? '' : `   got: ${detail}`}`);
  if (!ok) allOk = false;
}

// --- Frequency → note ---
for (const [freq, name] of [[110, 'A2'], [82.41, 'E2'], [329.63, 'E4'], [196, 'G3'], [1174.66, 'D6']]) {
  check(`${freq} Hz is ${name}`, readNote(freq, 0.95, 0.1)?.name === name);
}
check('46 Hz (an octave below the low E) is moved up to F#2', readNote(46.25, 0.95, 0.1)?.name === 'F#2');
check('unclear, quiet, too low and too high sounds are ignored',
  [[110, 0.5, 0.1], [110, 0.95, 0.001], [24.5, 0.95, 0.1], [1500, 0.95, 0.1]].every((r) => readNote(...r) === null));

// --- When does a new note start? ---
// Fake readings, 60 per second: [frequency, clarity, volume]
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);
const ring = (midi, n, v0 = 0.3) => Array.from({ length: n }, (_, i) => [hz(midi), 0.97, v0 * 0.97 ** i]);
const pick = (midi) => [[hz(midi), 0.95, 0.02], [hz(midi), 0.97, 0.12], ...ring(midi, 20)];
const silence = (n) => Array.from({ length: n }, () => [0, 0.1, 0.001]);
function notesFrom(readings) {
  const track = createNoteTracker();
  const notes = [];
  readings.forEach(([f, c, v], i) => {
    const result = track(f, c, v, i / 60);
    if (result?.fix) notes[notes.length - 1] = result.fix.name;
    else if (result) notes.push(result.name);
  });
  return notes.join(' ');
}
const cases = [
  ['a held note is one note', [...pick(45), ...ring(45, 60, 0.2)], 'A2'],
  ['same note after silence is two notes', [...pick(40), ...silence(5), ...pick(40)], 'E2 E2'],
  ['same note picked again while ringing is two notes', [...pick(40), ...ring(40, 5, 0.05), ...pick(40)], 'E2 E2'],
  ['unclear sound makes no notes', Array.from({ length: 60 }, () => [hz(45), 0.5, 0.2]), ''],
  ['picked riff', [...pick(45), ...ring(45, 5, 0.05), ...pick(48), ...ring(48, 5, 0.05), ...pick(50)], 'A2 C3 D3'],
  ['hammer-on (no pick) still counts', [...pick(45), ...ring(48, 8, 0.15)], 'A2 C3'],
  ['a 3-reading pitch wobble is ignored', [...pick(45), ...ring(46, 3, 0.2), ...ring(45, 15, 0.18)], 'A2'],
  ['octave harmonic while ringing is ignored', [...pick(40), ...ring(52, 20, 0.15), ...ring(40, 10, 0.1)], 'E2'],
  ['octave + fifth harmonic while ringing is ignored', [...pick(40), ...ring(59, 20, 0.15)], 'E2'],
  ['a PICKED octave + fifth jump still counts', [...pick(40), ...ring(40, 5, 0.05), ...pick(59)], 'E2 B3'],
  ['heard an octave too high at first, then fixed', [...pick(62).slice(0, 6), ...ring(50, 10, 0.2)], 'D3'],
  ['volume pulsing (amp/room) is not a new pick',
    [...pick(49), ...Array.from({ length: 60 }, (_, i) => [hz(49), 0.95, 0.02 + 0.015 * Math.sin((i / 10) * 2 * Math.PI)])], 'C#3'],
];
for (const [label, readings, expected] of cases) {
  const got = notesFrom(readings);
  check(label, got === expected, got || '(no notes)');
}

// --- String and fret ---
const riff = [42, 42, 49, 42, 50].map((midi) => ({ midi }));
placeNotes(riff);
const spots = riff.map((n) => 'EADGBe'[6 - n.string] + n.fret).join(' ');
check('Crazy Train opening lands on E2 E2 A4 E2 A5', spots === 'E2 E2 A4 E2 A5', spots);
let playable = true;
for (let midi = 40; midi <= 86; midi++) {
  const pair = [{ midi: 45 }, { midi }];
  placeNotes(pair);
  if (!positionsFor(midi).some((p) => p.string === pair[1].string && p.fret === pair[1].fret)) playable = false;
}
check('every guitar note gets a real, playable spot', playable);
const el = { textContent: '', scrollLeft: 0, scrollWidth: 0 };
drawTab(el, riff);
const lines = el.textContent.split('\n');
check('tab is six lines of equal length', lines.length === 6 && new Set(lines.map((l) => l.length)).size === 1);

console.log(allOk ? '\nALL CHECKS PASS' : '\nSOME CHECKS FAILED');
process.exit(allOk ? 0 : 1);
