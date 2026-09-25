// tools/check.mjs — quick checks that Riff Boi's note and tab logic still work.
// Usage: node tools/check.mjs
// Uses made-up readings (no guitar needed). Run it after changing notes.js or tab.js.

import { readNote, createNoteTracker, cleanUpRiff } from '../js/notes.js';
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
  ['a fifth-above harmonic heard an octave low is ignored', [...pick(41), ...ring(48, 2, 0.2), ...ring(60, 5, 0.2), ...ring(41, 10, 0.2)], 'F2'],
  ['a PICKED octave + fifth jump still counts', [...pick(40), ...ring(40, 5, 0.05), ...pick(59)], 'E2 B3'],
  ['heard an octave too high at first, then fixed', [...pick(62).slice(0, 6), ...ring(50, 10, 0.2)], 'D3'],
  ['volume pulsing (amp/room) is not a new pick',
    [...pick(49), ...Array.from({ length: 60 }, (_, i) => [hz(49), 0.95, 0.02 + 0.015 * Math.sin((i / 10) * 2 * Math.PI)])], 'C#3'],
];
for (const [label, readings, expected] of cases) {
  const got = notesFrom(readings);
  check(label, got === expected, got || '(no notes)');
}

// --- Clean-up over the whole riff ---
const riffOf = (list) => list.map(([name, midi, peak]) => ({ name, midi, peak }));
const names = (notes) => notes.map((n) => n.name).join(' ');
const cleanCases = [
  ['a quiet ghost note before the riff is dropped', riffOf([['A#3', 58, 0.02], ['C4', 60, 0.1], ['C#4', 61, 0.11], ['D4', 62, 0.09]]), 'C4 C#4 D4'],
  ['quieter but real notes (legato, 60%) are kept', riffOf([['A2', 45, 0.1], ['C3', 48, 0.06], ['D3', 50, 0.1], ['C3', 48, 0.06]]), 'A2 C3 D3 C3'],
  ['with only 2 notes nothing is dropped', riffOf([['A#3', 58, 0.02], ['C4', 60, 0.1]]), 'A#3 C4'],
  ['octave glitch in a walk is fixed (F#3 G4 G#3)', riffOf([['F#3', 54, 0.1], ['G4', 67, 0.1], ['G#3', 56, 0.1]]), 'F#3 G3 G#3'],
  ['a real octave riff is left alone (A2 A3 A2)', riffOf([['A2', 45, 0.1], ['A3', 57, 0.1], ['A2', 45, 0.1]]), 'A2 A3 A2'],
  ['a real jump up to a high note is left alone', riffOf([['E2', 40, 0.1], ['E4', 64, 0.1], ['D4', 62, 0.1]]), 'E2 E4 D4'],
];
for (const [label, notes, expected] of cleanCases) {
  const got = names(cleanUpRiff(notes));
  check(label, got === expected, got);
}

// --- String and fret ---
const riff = [42, 42, 49, 42, 50].map((midi) => ({ midi }));
placeNotes(riff);
const spots = riff.map((n) => 'EADGBe'[6 - n.string] + n.fret).join(' ');
check('Crazy Train opening lands on E2 E2 A4 E2 A5', spots === 'E2 E2 A4 E2 A5', spots);
// Common patterns must still land where guitarists play them.
const LABEL = 'EADGBe';
const patterns = [
  ['walking up the low E string fret by fret (learner recording)', [41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52], 'E1 E2 E3 E4 E5 E6 E7 E8 E9 E10 E11 E12'],
  ['walking up the low E string, then back down it', [41, 42, 43, 44, 45, 46, 47, 48, 47, 46, 45, 44], 'E1 E2 E3 E4 E5 E6 E7 E8 E7 E6 E5 E4'],
  ['1-2-3-4 finger exercise across strings', [41, 42, 43, 44, 46, 47, 48, 49], 'E1 E2 E3 E4 A1 A2 A3 A4'],
  ['A minor pentatonic box at the 5th fret', [45, 48, 50, 52, 55, 57, 60, 62, 64, 67, 69, 72], 'E5 E8 A5 A7 D5 D7 G5 G7 B5 B8 e5 e8'],
  ['open-position riff', [40, 40, 43, 40, 45, 47], 'E0 E0 E3 E0 A0 A2'],
];
for (const [label, midis, expected] of patterns) {
  const notes = midis.map((midi) => ({ midi }));
  placeNotes(notes);
  const got = notes.map((n) => LABEL[6 - n.string] + n.fret).join(' ');
  check(label, got === expected, got);
}

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
