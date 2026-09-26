// tools/check.mjs — quick checks that Riff Boi's note and tab logic still work.
// Usage: node tools/check.mjs
// Uses made-up readings (no guitar needed). Run it after changing notes.js or tab.js.

import { readFileSync } from 'node:fs';
import { readNote, createNoteTracker, cleanUpRiff, tuningOf, stillRinging, RINGING_READINGS } from '../js/notes.js';
import { placeNotes, positionsFor, drawTab, tabToken } from '../js/tab.js';
import { riffConfidence } from '../js/confidence.js';
import { rhythmOf } from '../js/rhythm.js';
import { tabSvg } from '../js/tabsvg.js';
import { openInput, listInputs } from '../js/audio.js';

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

// --- Tuner math ---
// (80 Hz is more than half a semitone below E2, so its nearest note is D#2, 49 cents sharp.)
for (const [freq, name, cents] of [[440, 'A4', 0], [446, 'A4', 23], [82.41, 'E2', 0], [81, 'E2', -30], [80, 'D#2', 49]]) {
  const t = tuningOf(freq);
  check(`tuner: ${freq} Hz is ${name} ${cents >= 0 ? '+' : ''}${cents} cents`, t.name === name && t.cents === cents, `${t.name} ${t.cents}`);
}

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
    else if (result?.bend) { if (result.bend.name) notes[notes.length - 1] = result.bend.name; } // a pre-bend moves the note down
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
  ['a picked octave riff keeps its octaves (A2 A3 A2)', [...pick(45), ...ring(45, 5, 0.05), ...pick(57), ...ring(57, 5, 0.05), ...pick(45)], 'A2 A3 A2'],
  ['a picked jump DOWN an octave soon after a note is not "fixed" away', [...pick(52).slice(0, 18), ...pick(40)], 'E3 E2'],
  ['fast repeated picking of one note keeps every note (8 picks, last one rings out)',
    [...Array.from({ length: 8 }, () => [[hz(40), 0.97, 0.05], [hz(40), 0.97, 0.15], [hz(40), 0.97, 0.3], ...ring(40, 4, 0.24)]).flat(), ...ring(40, 20, 0.2)],
    'E2 E2 E2 E2 E2 E2 E2 E2'],
  ['a new note a fifth up after a pitch break still counts', [...pick(45), ...ring(45, 20, 0.1), ...Array.from({ length: 4 }, () => [hz(45), 0.3, 0.1]), ...ring(52, 30, 0.12)], 'A2 E3'],
  ['a re-pick without a big volume jump (the pitch breaks) still counts', [...pick(45), ...Array.from({ length: 3 }, () => [hz(45), 0.3, 0.2]), ...ring(45, 20, 0.28)], 'A2 A2'],
  ['a pitch break right after a note starts is not a re-pick (slide)', [...pick(45).slice(0, 5), ...Array.from({ length: 3 }, () => [hz(45), 0.3, 0.2]), ...ring(45, 20, 0.25)], 'A2'],
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
  ['a pedal riff on the open low E is left alone (E2 F#3 E2 G3 E2)', riffOf([['E2', 40, 0.1], ['F#3', 54, 0.1], ['E2', 40, 0.1], ['G3', 55, 0.1], ['E2', 40, 0.1]]), 'E2 F#3 E2 G3 E2'],
  ['a note heard a third too low in a scale is fixed (F4 C#3 A#4 → G#4)', riffOf([['D#4', 63, 0.1], ['F4', 65, 0.1], ['C#3', 49, 0.1], ['A#4', 70, 0.1], ['C#5', 73, 0.1]]), 'D#4 F4 G#4 A#4 C#5'],
];
for (const [label, notes, expected] of cleanCases) {
  const got = names(cleanUpRiff(notes));
  check(label, got === expected, got);
}

// --- Confidence bar ---
// The same 4-note riff, played clean and then with one thing made worse each time.
// Each note: picked, rings for half a second, then a short gap before the next one.
function lick({ cents = 0, clarity = 0.97, gap = 0.001 } = {}) {
  const f = (midi) => hz(midi) * 2 ** (cents / 1200);
  return [45, 48, 50, 52].flatMap((midi) => [
    [f(midi), clarity, 0.02], [f(midi), clarity, 0.12],
    ...Array.from({ length: 30 }, (_, i) => [f(midi), clarity, 0.3 * 0.97 ** i]),
    ...Array.from({ length: 10 }, () => [0, 0.1, gap]),
  ]);
}
// Run the readings through the tracker and clean-up like the app does, then score them.
function riffFrom(readings) {
  const track = createNoteTracker();
  const notes = [];
  readings.forEach(([f, c, v], i) => {
    const result = track(f, c, v, i / 60);
    if (result?.fix) Object.assign(notes[notes.length - 1], result.fix);
    else if (result?.bend) Object.assign(notes[notes.length - 1], result.bend);
    else if (result) notes.push(result);
  });
  return cleanUpRiff(notes);
}
const confidenceOf = (readings) => riffConfidence(riffFrom(readings), readings.map((r) => r[2]));
const describe = (c) => `${Math.round(100 * c.score)}% "${c.hint}"`;
const clean = confidenceOf(lick());
check('confidence: a clean riff scores high and "Sounds clean"', clean.score > 0.9 && clean.hint === 'Sounds clean', describe(clean));
const outOfTune = confidenceOf(lick({ cents: 30 }));
check('confidence: 30 cents out of tune scores lower and suggests the tuner',
  outOfTune.score < clean.score - 0.1 && outOfTune.hint.includes('Try the tuner'), describe(outOfTune));
const noisy = confidenceOf(lick({ gap: 0.06 }));
check('confidence: loud background noise between notes scores lower and says so',
  noisy.score < clean.score - 0.1 && noisy.hint === 'Lots of background noise', describe(noisy));
const unclear = confidenceOf(lick({ clarity: 0.83 }));
check('confidence: an unclear tone (clarity just over the limit) scores lower and says so',
  unclear.score < clean.score - 0.1 && unclear.hint.startsWith('Pitch is unclear'), describe(unclear));
const allFixed = riffConfidence(riffFrom(lick()).map((n) => ({ ...n, fixed: true })), lick().map((r) => r[2]));
check('confidence: notes Riff Boi had to correct count against it (every note fixed = 30% less)',
  Math.abs(allFixed.score - clean.score * 0.7) < 0.001, describe(allFixed));
check('confidence: no notes = no score (the bar stays empty)', riffConfidence([], []) === null);

// --- Bends ---
// A bend GLIDES the pitch smoothly with no new pick; hammer-ons and slides JUMP.
// D4 (MIDI 62) lands on the B string, fret 3, so a whole-step bend is written B3b5.
const glide = (from, to, n, v = 0.2) => Array.from({ length: n }, (_, i) => [hz(from + ((to - from) * (i + 1)) / n), 0.97, v]);
const hold = (midi, n, v = 0.18) => Array.from({ length: n }, () => [hz(midi), 0.97, v]);
function tabOf(readings) {
  const notes = riffFrom(readings);
  placeNotes(notes);
  return notes.map((n) => 'EADGBe'[6 - n.string] + tabToken(n)).join(' ');
}
const bendCases = [
  ['a whole-step bend is one bent note', [...pick(62), ...glide(62, 64, 10), ...hold(64, 20)], 'B3b5'],
  ['a bend and release', [...pick(62), ...glide(62, 64, 10), ...hold(64, 12), ...glide(64, 62, 10), ...hold(62, 12)], 'B3b5r3'],
  ['a half-step bend', [...pick(62), ...glide(62, 63, 8), ...hold(63, 20)], 'B3b4'],
  ['a 1½-step bend', [...pick(62), ...glide(62, 65, 12), ...hold(65, 20)], 'B3b6'],
  ['a slow bend (0.4 s)', [...pick(62), ...glide(62, 64, 24), ...hold(64, 20)], 'B3b5'],
  ['a bend that ends a little flat (20 cents) still counts', [...pick(62), ...glide(62, 63.8, 10), ...hold(63.8, 20)], 'B3b5'],
  ['a pre-bend: picked already bent, then released', [...pick(64), ...glide(64, 62, 10), ...hold(62, 15)], 'B3pb5r3'],
  // With distortion, Pitchy often hears the octave above for a moment and the note gets fixed.
  ['a bend on a note whose octave was fixed first', [[hz(74), 0.95, 0.02], [hz(74), 0.97, 0.12], ...ring(74, 3), ...ring(62, 17), ...glide(62, 64, 10), ...hold(64, 20)], 'B3b5'],
  ['vibrato is not a bend', [...pick(62), ...Array.from({ length: 60 }, (_, i) => [hz(62 + 0.4 * Math.sin(i / 2)), 0.97, 0.2])], 'B3'],
];
for (const [label, readings, expected] of bendCases) {
  const got = tabOf(readings);
  check(`bends: ${label} (${expected})`, got === expected, got);
}
const notBends = [
  ['a hammer-on (the pitch jumps) is a new note, not a bend', [...pick(62), ...hold(64, 20)], 'D4 E4'],
  ['a quick slide through the frets is new notes, not a bend', [...pick(62), ...hold(63, 3), ...hold(64, 20)], 'D4 E4'],
  // The real readings (semitones below the A2) from Crazy Train at 9.5 s: it slid down and stopped
  // BETWEEN A2 and G#2, then G#2 came in. A bend or release always ends right on a note.
  ['a smeared note change that stops between two notes is a new note, not a pre-bend (Crazy Train at 9.5 s)',
    [...pick(45), ...[-0.303761, -0.447903, -0.711744, -0.609664, -0.759698, -0.696888, -0.660628].map((o) => [hz(45 + o), 0.97, 0.2]), ...hold(44, 20)], 'A2 G#2'],
  ['a picked note after a bend is a new note', [...pick(62), ...glide(62, 64, 10), ...hold(64, 10), ...pick(67)], 'D4 G4'],
];
for (const [label, readings, expected] of notBends) {
  const got = notesFrom(readings);
  check(`bends: ${label}`, got === expected, got || '(no notes)');
}
check('bends: tab tokens (7, 7b9, 7b9r7, 7pb9r7)',
  [{ fret: 7 }, { fret: 7, bend: 2 }, { fret: 7, bend: 2, release: true }, { fret: 7, bend: 2, prebend: true, release: true }].map(tabToken).join(' ') === '7 7b9 7b9r7 7pb9r7');
{
  const bentTab = { textContent: '', scrollLeft: 0, scrollWidth: 0 };
  drawTab(bentTab, [{ string: 3, fret: 7, bend: 2, release: true }, { string: 2, fret: 5 }]);
  const bentLines = bentTab.textContent.split('\n');
  check('bends: a tab with a bend still has six lines of equal length',
    bentLines.length === 6 && new Set(bentLines.map((l) => l.length)).size === 1 && bentLines[2].includes('7b9r7'), bentTab.textContent);
}
{
  // Bent right after the pick, so the bend happens while the note's quality is still being judged.
  const bendRiff = [...silence(20), ...pick(62).slice(0, 8), ...glide(62, 64, 10), ...hold(64, 20)];
  const c = riffConfidence(riffFrom(bendRiff), bendRiff.map((r) => r[2]));
  check('bends: a clean bend doesn\'t lower the confidence score (it\'s out of tune on purpose)', c.score > 0.9, describe(c));
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
  ['walking up a string with a repeated note stays on that string', [41, 42, 43, 44, 44, 45, 46, 47, 48], 'E1 E2 E3 E4 E4 E5 E6 E7 E8'],
  ['1-2-3-4 finger exercise across strings', [41, 42, 43, 44, 46, 47, 48, 49], 'E1 E2 E3 E4 A1 A2 A3 A4'],
  ['A minor pentatonic box at the 5th fret', [45, 48, 50, 52, 55, 57, 60, 62, 64, 67, 69, 72], 'E5 E8 A5 A7 D5 D7 G5 G7 B5 B8 e5 e8'],
  ['open-position riff', [40, 40, 43, 40, 45, 47], 'E0 E0 E3 E0 A0 A2'],
  ['A minor pentatonic box, coming DOWN (starts under the pinky)', [72, 69, 67, 64, 62, 60, 57, 55, 52, 50, 48, 45], 'e8 e5 B8 B5 G7 G5 D7 D5 A7 A5 E8 E5'],
];
for (const [label, midis, expected] of patterns) {
  const notes = midis.map((midi) => ({ midi }));
  placeNotes(notes);
  const got = notes.map((n) => LABEL[6 - n.string] + n.fret).join(' ');
  check(label, got === expected, got);
}

// G major from G2 can be played in open position or 2nd position (same notes, both standard);
// either is fine, but it must not drift up the neck.
{
  const scale = [43, 45, 47, 48, 50, 52, 54, 55, 57, 59, 60, 62, 64, 66, 67].map((midi) => ({ midi }));
  placeNotes(scale);
  const highest = Math.max(...scale.map((n) => n.fret));
  check('G major scale from G2 stays near the nut (no drifting up the neck)', highest <= 5,
    scale.map((n) => LABEL[6 - n.string] + n.fret).join(' '));
}
// Learner's pentatonic box at the 6th fret (tools/recordings/pentatonic-6th), with and without its first note.
{
  const place = (midis) => { const n = midis.map((midi) => ({ midi })); placeNotes(n); return n.map((x) => LABEL[6 - x.string] + x.fret).join(' '); };
  const all = place([46, 49, 51, 53, 56, 58, 61, 63, 65, 68, 70, 73]);
  check('pentatonic box at the 6th fret stays in 6th position', all === 'E6 E9 A6 A8 D6 D8 G6 G8 B6 B9 e6 e9', all);
  const noFirst = place([49, 51, 53, 56, 58, 61, 63, 65, 68, 70, 73]);
  check('...even if its first note was missed', noFirst === 'E9 A6 A8 D6 D8 G6 G8 B6 B9 e6 e9', noFirst);
  const desc = place([72, 69, 67, 64, 62, 60, 57, 57]);
  check('a short pentatonic run coming down stays in the box', desc === 'e8 e5 B8 B5 G7 G5 D7 D7', desc);
}

// --- Rhythm (note values) and the tab picture ---
// A riff at 120 BPM (one beat = 0.5 s): eighths, a quarter, an eighth and two sixteenths,
// a half note (bent and released), a quarter, a dotted quarter and an eighth. 8 beats = 2 bars.
const timed = [
  { string: 6, fret: 0, t: 0 }, { string: 6, fret: 0, t: 0.25 }, { string: 5, fret: 2, t: 0.5 },
  { string: 5, fret: 5, t: 1.0 }, { string: 5, fret: 2, t: 1.25 }, { string: 5, fret: 0, t: 1.375 },
  { string: 3, fret: 7, bend: 2, release: true, t: 1.5 }, { string: 4, fret: 5, t: 2.5 },
  { string: 4, fret: 7, t: 3.0 }, { string: 6, fret: 3, t: 3.75 },
];
const valueNames = (r) => r.map(({ value }) => (value.dotted ? 'dotted ' : '') + value.name).join(', ');
const expectedValues = 'eighth, eighth, quarter, eighth, sixteenth, sixteenth, half, quarter, dotted quarter, eighth';
const rhythm = rhythmOf(timed, 120, 4.0);
check('rhythm: note values at 120 BPM', valueNames(rhythm) === expectedValues, valueNames(rhythm));
check('rhythm: where each note starts, in beats', rhythm.map((r) => r.beat).join(' ') === '0 0.5 1 2 2.5 2.75 3 5 6 7.5', rhythm.map((r) => r.beat).join(' '));
{
  // Real playing isn't perfectly on time: nudge every note by up to 25 ms either way.
  const wobbly = timed.map((n, i) => ({ ...n, t: n.t + (i % 2 ? 0.025 : -0.02) * (i ? 1 : 0) }));
  check('rhythm: slightly early or late notes still snap to the same note values', valueNames(rhythmOf(wobbly, 120, 4.0)) === expectedValues, valueNames(rhythmOf(wobbly, 120, 4.0)));
}
check('rhythm: the same timing at half the tempo (60 BPM) gives notes half as long',
  valueNames(rhythmOf(timed.slice(0, 3), 60, 1.0)) === 'sixteenth, sixteenth, eighth', valueNames(rhythmOf(timed.slice(0, 3), 60, 1.0)));
check('rhythm: two notes very close together never land on the same spot',
  rhythmOf([{ t: 0 }, { t: 0.01 }], 120, 1).map((r) => r.beat).join(' ') === '0 0.25');
{
  const svg = tabSvg(timed, { bpm: 120, endTime: 4.0 });
  const count = (cls) => (svg.match(new RegExp(`class="${cls}"`, 'g')) || []).length;
  check('tab picture: no broken numbers (NaN) in the drawing', !svg.includes('NaN') && !svg.includes('undefined'));
  check('tab picture: 2 bars = a line at the start, one between the bars and one at the end', count('t-bar') === 3, count('t-bar'));
  check('tab picture: every fret number is drawn, in order',
    [...svg.matchAll(/class="t-fret[^"]*"[^>]*>([^<]+)</g)].map((m) => m[1]).join(' ') === '0 0 2 5 2 0 7 5 7 3');
  check('tab picture: the bend is an arrow labelled "full", with a release', svg.includes('>full<') && count('t-bend') === 2);
  check('tab picture: the tempo and 4/4 are shown', svg.includes('♩ = 120') && count('t-time') === 2);
  const plain = tabSvg(timed, { bpm: 120, endTime: 4.0, timing: false });
  check('tab picture: with rhythm off there are no bars, tempo or stems, just the notes',
    !plain.includes('♩') && !plain.includes('t-time') && !plain.includes('t-stem') && (plain.match(/class="t-bar"/g) || []).length === 2);
  check('tab picture: an empty riff is still a clean empty staff', !tabSvg([]).includes('NaN') && tabSvg([]).includes('t-line'));
  // A long rest: 5 seconds at 120 BPM is 10 beats, so the second note is in measure 3.
  const rest = tabSvg([{ string: 6, fret: 0, t: 0 }, { string: 6, fret: 3, t: 5 }], { bpm: 120, endTime: 6 });
  const measures = [...rest.matchAll(/class="t-measure"[^>]*>(\d+)</g)].map((m) => m[1]).join(' ');
  check('tab picture: a long rest still draws every bar line and measure number (1 2 3)',
    measures === '1 2 3' && (rest.match(/class="t-bar"/g) || []).length === 4 && !rest.includes('NaN'), measures);
}

// --- Where the last note ends (that sets its note value) ---
// Like app.js: the last note lasts while its own pitch is still heard, RINGING_READINGS in a row.
// Readings are [frequency, clarity, volume] at 60 a second, or [..., time] from a real recording.
function riffEnd(readings) {
  const track = createNoteTracker();
  const notes = [];
  let ringing = 0;
  let end = 0;
  readings.forEach(([f, c, v, time = null], i) => {
    const t = time ?? i / 60;
    const result = track(f, c, v, t);
    if (result?.fix) Object.assign(notes[notes.length - 1], result.fix);
    else if (result?.bend) Object.assign(notes[notes.length - 1], result.bend);
    else if (result) notes.push(result);
    ringing = stillRinging(notes[notes.length - 1], f, c, v) ? ringing + 1 : 0;
    if (ringing >= RINGING_READINGS) end = t;
  });
  return end;
}
check('last note: still heard when it gets less clear as it dies away, an octave up, or at its bent pitch',
  stillRinging({ midi: 45 }, hz(45), 0.6, 0.05) && stillRinging({ midi: 45 }, hz(57), 0.9, 0.05) && stillRinging({ midi: 62, bend: 2 }, hz(64), 0.9, 0.1));
check('last note: amp hiss (no clear pitch), a different note, too quiet, or no note at all don\'t count',
  [[{ midi: 45 }, hz(45), 0.3, 0.05], [{ midi: 45 }, hz(47), 0.95, 0.05], [{ midi: 45 }, hz(45), 0.95, 0.001], [undefined, hz(45), 0.95, 0.1]]
    .every((args) => !stillRinging(...args)));
{
  // Hiss: louder than the volume limit, but no clear pitch (made-up, but the same every time).
  const hiss = (n) => Array.from({ length: n }, (_, i) => [80 + ((i * 37) % 700), 0.2 + ((i * 13) % 25) / 100, 0.03]);
  const rang = [...pick(45), ...ring(45, 60, 0.2)]; // the note rings until reading 81 (1.35 s)
  const end = riffEnd([...rang, ...hiss(180)]);
  check('last note: ends when the note stops, not when you tap Stop 3 s later over amp hiss', Math.abs(end - 81 / 60) < 0.02, `${end.toFixed(2)} s`);
  const held = [...pick(45), ...hold(45, 120)];
  check('last note: a note still ringing when you tap Stop lasts until Stop', riffEnd(held) === (held.length - 1) / 60, riffEnd(held).toFixed(2));
  const bent = [...pick(62), ...glide(62, 64, 10), ...hold(64, 60)];
  check('last note: a bend held until Stop lasts until Stop', riffEnd(bent) === (bent.length - 1) / 60, riffEnd(bent).toFixed(2));
}
// Real playing, then 3 s of that same room and amp (the quiet start of the recording, before
// the first note), like waiting a moment before tapping Stop. The run on the A string has a
// few louder bumps in its room noise, so one stray reading must not count.
for (const [name, label] of [['crazy-train', 'Crazy Train'], ['run-2-A', 'the run on the A string']]) {
  const { readings } = JSON.parse(readFileSync(new URL(`./recordings/${name}.json`, import.meta.url), 'utf8'));
  const room = readings.filter((r) => r[3] < readings[0][3] + 0.6);
  let t = readings[readings.length - 1][3];
  const waited = [...readings, ...Array.from({ length: 180 }, (_, i) => {
    t += 1 / 60;
    return [...room[i % room.length].slice(0, 3), t];
  })];
  const plain = riffEnd(readings);
  const withRoom = riffEnd(waited);
  check(`last note: waiting 3 s over real room noise before Stop doesn't make it longer (${label})`,
    Math.abs(withRoom - plain) < 0.05, `${plain.toFixed(2)} s without the wait, ${withRoom.toFixed(2)} s with it`);
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

// --- Input picker (audio.js), with a pretend mic, so no real audio is needed ---
{
  const tries = []; // what audio.js asked the browser for, each time
  let fail = null;  // (what it asked for) => an error to throw, or nothing
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      async getUserMedia({ audio }) {
        tries.push(audio);
        const error = fail?.(audio);
        if (error) throw error;
        return audio.deviceId ? 'picked input' : 'default input';
      },
      async enumerateDevices() {
        return [
          { kind: 'audioinput', deviceId: 'default', label: 'Default - MacBook Air Microphone' },
          { kind: 'audioinput', deviceId: 'mic', label: 'MacBook Air Microphone' },
          { kind: 'audioinput', deviceId: 'scarlett', label: 'Scarlett 2i2 USB' },
          { kind: 'audioinput', deviceId: '', label: '' },
          { kind: 'videoinput', deviceId: 'cam', label: 'FaceTime HD Camera' },
        ];
      },
    },
  });
  const named = (name) => Object.assign(new Error(name), { name });
  const guitarSound = (audio) => audio.echoCancellation === false && audio.noiseSuppression === false && audio.autoGainControl === false;

  check('input picker: opens the input you picked, with the voice clean-up turned off',
    await openInput('scarlett') === 'picked input' && tries[0].deviceId.exact === 'scarlett' && guitarSound(tries[0]), JSON.stringify(tries));

  tries.length = 0;
  check('input picker: with nothing picked, it opens the default input',
    await openInput('') === 'default input' && tries.length === 1 && !tries[0].deviceId && guitarSound(tries[0]), JSON.stringify(tries));

  tries.length = 0;
  fail = (audio) => audio.deviceId && named('OverconstrainedError');
  check('input picker: an unplugged input falls back to the default input',
    await openInput('scarlett') === 'default input' && tries.length === 2 && !tries[1].deviceId && guitarSound(tries[1]), JSON.stringify(tries));

  tries.length = 0;
  fail = () => named('NotAllowedError');
  const blocked = await openInput('scarlett').then(() => 'opened', (err) => err.name);
  check('input picker: a blocked mic is reported, not hidden by the fallback', blocked === 'NotAllowedError' && tries.length === 1, `${blocked} after ${tries.length} tries`);

  const inputs = await listInputs();
  check('input picker: lists real inputs only (no "Default" copies, cameras or nameless inputs)',
    inputs.map((input) => input.name).join(' | ') === 'MacBook Air Microphone | Scarlett 2i2 USB', JSON.stringify(inputs));
}

console.log(allOk ? '\nALL CHECKS PASS' : '\nSOME CHECKS FAILED');
process.exit(allOk ? 0 : 1);
