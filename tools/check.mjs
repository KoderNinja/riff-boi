// tools/check.mjs — quick checks that Riff Boi's note and tab logic still work.
// Usage: node tools/check.mjs
// Uses made-up readings (no guitar needed). Run it after changing notes.js or tab.js.

import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { readNote, createNoteTracker, cleanUpRiff, tuningOf, stillRinging, RINGING_READINGS, notesFromReadings } from '../js/notes.js';
import { placeNotes, positionsFor, drawTab, tabToken, otherSpots, tabText, fretOn, withFret, linkMark, textFileName, harmonicSpots } from '../js/tab.js';
import { riffConfidence, isUnsure } from '../js/confidence.js';
import { rhythmOf, meterOf, barOf, groupOf, detectTempo, METERS, barStarts } from '../js/rhythm.js';
import { tabSvg } from '../js/tabsvg.js';
import { openInput, listInputs } from '../js/audio.js';
import { saveRiff, loadRiffs, updateRiff, deleteRiff, riffTiming } from '../js/storage.js';
import { writtenRiff, retime, typedFret } from '../js/editor.js';
import { playbackPlan, pitchPoints, pluckSamples, loopFor, clickTimes } from '../js/playback.js';
import { readingsFrom } from '../js/upload.js';
import { findScale } from '../js/scale.js';
import { wavFile } from '../js/wav.js';
import { riffToLink, riffFromLink } from '../js/share.js';
import { learnNeck, spotForHand, fretAt, MIN_NOTES } from '../js/neck.js';
import { soundExtension } from '../js/sounds.js';

let allOk = true;
function check(label, ok, detail = '') {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}${ok ? '' : `   got: ${detail}`}`);
  if (!ok) allOk = false;
}

// --- Every script loads: no typos that would stop the page (app.js can't run here, but Node can
// still check that it's valid JavaScript) ---
for (const file of readdirSync(new URL('../js/', import.meta.url)).filter((name) => name.endsWith('.js'))) {
  let ok = true;
  try {
    execFileSync(process.execPath, ['--check', new URL(`../js/${file}`, import.meta.url).pathname], { stdio: 'pipe' });
  } catch {
    ok = false;
  }
  check(`${file} has no syntax errors`, ok);
}

// --- Save .txt: a file name from the riff's name ---
check('text file: a riff\'s name makes its file name ("Sep 26, 9:26 PM" → "Sep 26, 9.26 PM.txt")', textFileName('Sep 26, 9:26 PM') === 'Sep 26, 9.26 PM.txt', textFileName('Sep 26, 9:26 PM'));
check('text file: characters files can\'t have are taken out, and a blank name is "riff"',
  textFileName('AC/DC riff: take 2?') === 'AC.DC riff. take 2.txt' && textFileName('  ') === 'riff.txt' && textFileName(undefined) === 'riff.txt', `${textFileName('AC/DC riff: take 2?')} ${textFileName('  ')}`);

// --- Your sound: the file ending for downloading a riff's recording ---
check('your sound: the file ending comes from the sound type (webm, m4a, mp3, wav; unknown is webm)',
  ['audio/webm;codecs=opus', 'audio/mp4', 'audio/mpeg', 'audio/wav', '', 'video/x-weird'].map(soundExtension).join(' ') === 'webm m4a mp3 wav webm webm',
  ['audio/webm;codecs=opus', 'audio/mp4', 'audio/mpeg', 'audio/wav', '', 'video/x-weird'].map(soundExtension).join(' '));

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
  // Vibrato makes the volume swell and fade (RIFFTEST): that's one note, not the same note picked again.
  ['vibrato with a pulsing volume is one note, not re-picks',
    [[hz(62), 0.95, 0.01], [hz(62), 0.97, 0.12], ...Array.from({ length: 60 }, (_, i) => [hz(62 + 0.2 * Math.sin(i / 2)), 0.98, 0.1 + 0.06 * Math.sin(i / 2)])], 'D4'],
  // A distorted re-pick: the volume swells over a few readings, but the pick blurs the pitch.
  ['a re-pick that blurs the pitch counts, even when the volume only swells',
    [...pick(42), [hz(42), 0.8, 0.09], [hz(42), 0.85, 0.15], [hz(42), 0.95, 0.24], [hz(42), 0.97, 0.3], ...ring(42, 15)], 'F#2 F#2'],
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
  // RIFFTEST.mp3: the bend stopped for 3 readings about 2/3 of the way to the next note, then went on up.
  ['a bend that pauses between two notes on its way up is still one bend (RIFFTEST)', [...pick(62), ...glide(62, 62.63, 2), ...hold(62.63, 3), ...glide(62.63, 64, 3), ...hold(64, 20)], 'B3b5'],
  // Vibrato on a held bend makes the volume swell and fade (RIFFTEST): not new picks.
  ['vibrato on a held bend doesn\'t add notes (RIFFTEST)', [...pick(62), ...glide(62, 64, 10), ...Array.from({ length: 60 }, (_, i) => [hz(64 + 0.15 * Math.sin(i / 2)), 0.98, 0.1 + 0.06 * Math.sin(i / 2)])], 'B3b5'],
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
  // The real notes from Crazy Train at 6.1 s: G#2 played 17 cents sharp, then A2 15 cents flat, so
  // they're only 2/3 of a step apart. That's two notes, not a bend pausing on its way up.
  ['two notes a fret apart, one sharp and one flat, are two notes (Crazy Train at 6.1 s)',
    [...pick(44.17), ...hold(44.17, 8, 0.07), [hz(44.47), 0.71, 0.03], [hz(21.3), 0.78, 0.03], ...hold(44.85, 12, 0.04)], 'G#2 A2'],
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

// --- Time signatures ---
// The tempo always counts quarter notes, so a bar is top × 4 / bottom beats. Beams join a beat
// in x/4, threes in 6/8, 9/8 and 12/8, and 2+2+3 in 7/8.
check('time signature: each one has the right bar length and beam groups',
  METERS.map((m) => `${m}=${meterOf(m).barBeats}:${meterOf(m).groups.join('+')}`).join(' ') ===
  '2/4=2:1+1 3/4=3:1+1+1 4/4=4:1+1+1+1 5/4=5:1+1+1+1+1 6/8=3:1.5+1.5 7/8=3.5:1+1+1.5 9/8=4.5:1.5+1.5+1.5 12/8=6:1.5+1.5+1.5+1.5');
check('time signature: one that isn\'t in the list is 4/4', meterOf('nonsense').barBeats === 4 && meterOf(undefined).top === 4);
{
  const m78 = meterOf('7/8');
  check('time signature: 7/8 bars are 3½ beats long', [0, 3.25, 3.5, 6.75, 7].map((b) => barOf(b, m78)).join(' ') === '0 0 1 1 2');
  const groups = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5].map((b) => groupOf(b, m78)).join(' ');
  check('time signature: 7/8 eighths group 2+2+3 in every bar', groups === '0 0 1 1 2 2 2 3 3 4 4 5 5 5', groups);
}
{
  // Which notes each beam joins, like "1-2 3-4" (notes counted from 1).
  const beamsOf = (svg) => {
    const xs = [...svg.matchAll(/class="t-fret[^"]*" x="([\d.]+)"/g)].map((m) => Number(m[1]));
    return [...svg.matchAll(/class="t-beam" x1="([\d.]+)" y1="[\d.]+" x2="([\d.]+)"/g)].map((m) => `${xs.indexOf(Number(m[1])) + 1}-${xs.indexOf(Number(m[2])) + 1}`).join(' ');
  };
  const eighths = (n) => Array.from({ length: n }, (_, i) => ({ string: 6, fret: i, t: i * 0.25 })); // at 120 BPM
  const quarters = (n) => Array.from({ length: n }, (_, i) => ({ string: 6, fret: i, t: i * 0.5 }));
  const waltz = tabSvg(quarters(6), { bpm: 120, endTime: 3, meter: '3/4' });
  const measures = [...waltz.matchAll(/class="t-measure"[^>]*>(\d+)</g)].map((m) => m[1]).join(' ');
  check('tab picture: 6 quarter notes in 3/4 are 2 bars, with 3 over 4 at the start',
    measures === '1 2' && (waltz.match(/class="t-bar"/g) || []).length === 3 && /class="t-time"[^>]*>3<.*class="t-time"[^>]*>4</.test(waltz), measures);
  const rest = tabSvg([{ string: 6, fret: 0, t: 0.5 }, { string: 6, fret: 3, t: 5 }], { bpm: 120, endTime: 6, meter: '3/4' });
  const restMeasures = [...rest.matchAll(/class="t-measure"[^>]*>(\d+)</g)].map((m) => m[1]).join(' ');
  check('tab picture: a long rest in 3/4 still draws every measure (1 2 3 4)', restMeasures === '1 2 3 4', restMeasures);
  const seven = beamsOf(tabSvg(eighths(7), { bpm: 120, endTime: 1.75, meter: '7/8' }));
  check('tab picture: 7 eighths in 7/8 are beamed 2+2+3', seven === '1-2 3-4 5-7', seven);
  const six = beamsOf(tabSvg(eighths(6), { bpm: 120, endTime: 1.5, meter: '6/8' }));
  check('tab picture: 6 eighths in 6/8 are beamed in threes', six === '1-3 4-6', six);
  const four = beamsOf(tabSvg(eighths(8), { bpm: 120, endTime: 2 }));
  check('tab picture: 8 eighths in 4/4 are still beamed in twos', four === '1-2 3-4 5-6 7-8', four);
}

// --- Auto tempo: working out the tempo from when the notes started ---
{
  // A riff from note lengths in sixteenths at a tempo, with a repeatable wobble of up to ±ms,
  // because real playing isn't perfectly on time.
  const played = (bpm, sixteenths, wobbleMs = 15) => {
    const step = 60 / bpm / 4;
    let t = 1;
    const notes = sixteenths.map((length, i) => {
      const note = { t: t + ((((i * 7) % 5) - 2) / 2) * wobbleMs / 1000 };
      t += length * step;
      return note;
    });
    return [...notes, { t }];
  };
  const cases = [
    ['quarters at 138', played(138, Array(12).fill(4)), 138],
    ['eighths at 138', played(138, Array(16).fill(2)), 138],
    ['sixteenths at 138', played(138, Array(16).fill(1), 8), 138],
    ['eighths and quarters at 100', played(100, [2, 2, 4, 2, 2, 4, 4, 2, 2, 4]), 100],
    ['dotted 3+3+2 at 138', played(138, [3, 3, 2, 3, 3, 2, 3, 3, 2], 8), 138],
    ['a gallop (an eighth and two sixteenths) at 160', played(160, [2, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1], 6), 160],
    ['quarters at 60 come out as 120 (the same as half notes at 120)', played(60, Array(8).fill(4)), 120],
    ['quarters at 150 stay 150 (the guess lands from 80 up to 160)', played(150, Array(12).fill(4)), 150],
    ['quarters at 138 with one note missed', played(138, [4, 4, 4, 8, 4, 4, 4, 4, 4, 4]), 138],
    ['quarters at 138 with one extra note', played(138, Array(10).fill(4)).flatMap((n, i) => (i === 5 ? [n, { t: n.t + 0.1 }] : [n])), 138],
    ['thrash eighths at 180 come out as 90 (type 180 on the riff)', played(180, Array(16).fill(2), 6), 90],
  ];
  for (const [label, notes, want] of cases) {
    const got = detectTempo(notes);
    check(`auto tempo: ${label}`, got.bpm === want && got.sure, JSON.stringify(got));
  }
  // It always guesses, but says when it isn't sure.
  const three = detectTempo(played(120, [4, 4]));
  check('auto tempo: only 3 notes: a guess, marked not sure', Math.abs(three.bpm - 120) <= 4 && !three.sure, JSON.stringify(three));
  const free = detectTempo([0, 0.31, 0.77, 0.93, 1.52, 1.61, 2.34, 2.9, 3.05, 3.71].map((t) => ({ t })));
  check('auto tempo: free time, no steady beat: not sure', !free.sure, JSON.stringify(free));
  check('auto tempo: a single note can\'t have a tempo', detectTempo([{ t: 1 }]) === null);

  // Real playing: the tempo drifts and notes come early or late. (This used to be where Auto gave
  // up and used the last tempo instead.)
  const drifting = (bpm, sixteenths, speedUp, wobbleMs) => {
    let t = 1;
    return [...sixteenths, 0].map((length, i) => {
      const note = { t: t + ((((i * 7) % 5) - 2) / 2) * wobbleMs / 1000 };
      t += (length * 15) / (bpm * (1 + (speedUp * i) / sixteenths.length));
      return note;
    });
  };
  const rushing = drifting(120, Array(16).fill(4), 0.07, 20); // quarters that speed up 7%
  const rushed = detectTempo(rushing);
  check('auto tempo: quarters that speed up from 120 to 128', rushed.bpm >= 120 && rushed.bpm <= 128 && rushed.sure, JSON.stringify(rushed));
  check('rhythm: ...and they all stay quarter notes', new Set(rhythmOf(rushing, rushed.bpm, null).slice(0, -1).map((r) => r.value.name)).size === 1, valueNames(rhythmOf(rushing, rushed.bpm, null)));
  const gallop = drifting(140, [2, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 4], -0.03, 15);
  const galloped = detectTempo(gallop);
  check('auto tempo: a gallop at 140 that slows down a bit', Math.abs(galloped.bpm - 138) <= 3 && galloped.sure, JSON.stringify(galloped));
  check('rhythm: ...written as an eighth and two sixteenths every time',
    rhythmOf(gallop, galloped.bpm, null).slice(0, 15).map((r) => r.value.name[0]).join('') === 'ess'.repeat(5), valueNames(rhythmOf(gallop, galloped.bpm, null)));
}
{
  // Quarter notes at 140 where one note is 60 ms late: that's a late note, not a sixteenth.
  const late = Array.from({ length: 12 }, (_, i) => ({ t: 1 + (i * 60) / 140 + (i === 3 ? 0.06 : 0) }));
  check('rhythm: one late note in a riff of quarters doesn\'t make a stray sixteenth',
    new Set(rhythmOf(late, 140, null).map((r) => r.value.name)).size === 1, valueNames(rhythmOf(late, 140, null)));
  // Eighths with four real sixteenths in the middle: those stay sixteenths.
  const mixed = [2, 2, 2, 2, 1, 1, 1, 1, 2, 2, 2, 2];
  let at = 1;
  const mixedNotes = mixed.map((length, i) => { const note = { t: at + (i % 3 === 1 ? 0.012 : -0.008) }; at += length * 60 / 140 / 4; return note; });
  check('rhythm: real sixteenths among eighths are still sixteenths',
    rhythmOf(mixedNotes, 140, null).slice(0, -1).map((r) => r.value.name[0]).join('') === 'eeeessssee' + 'e', valueNames(rhythmOf(mixedNotes, 140, null)));
  // A played riff sped up with a new tempo keeps its note values (the tempo box on a saved riff).
  const wobbly = timed.map((n, i) => ({ ...n, t: n.t + (i % 2 ? 0.025 : -0.02) * (i ? 1 : 0) }));
  const faster = retime({ bpm: 120, notes: wobbly, endTime: 4.0 }, 150);
  check('rhythm: a new tempo on a played riff keeps its note values',
    valueNames(rhythmOf(faster.notes, 150, faster.endTime)) === valueNames(rhythmOf(wobbly, 120, 4.0)), valueNames(rhythmOf(faster.notes, 150, faster.endTime)));
  check('rhythm: ...and an old riff without an end time keeps none', retime({ bpm: 120, notes: wobbly, endTime: undefined }, 150).endTime === undefined);
}

// --- Distorted, fast playing (from the Crazy Train and pentatonic recordings) ---
{
  // Distortion squashes the volume, so these don't have the jump of a pick: just a steady level.
  const steady = (midi, n, clarity = 0.95, volume = 0.05) => Array.from({ length: n }, () => [hz(midi), clarity, volume]);
  const at = (freq, n, clarity = 0.9, volume = 0.05) => Array.from({ length: n }, () => [freq, clarity, volume]);
  const D3 = 50;
  check('distortion: a new note heard clearly twice, then as 1/6 of its pitch, still counts',
    notesFrom([...silence(4), ...steady(D3, 2), ...at(hz(D3) / 6, 1), ...silence(6)]) === 'D3', notesFrom([...silence(4), ...steady(D3, 2), ...at(hz(D3) / 6, 1), ...silence(6)]));
  check('distortion: ...or an unclear but in-tune third reading of it',
    notesFrom([...silence(4), ...steady(D3, 2), ...steady(D3, 1, 0.7), ...silence(6)]) === 'D3', notesFrom([...silence(4), ...steady(D3, 2), ...steady(D3, 1, 0.7), ...silence(6)]));
  check('distortion: fractions of a pitch alone never make a note', notesFrom([...silence(4), ...at(hz(D3) / 6, 12), ...at(hz(D3) / 4, 12), ...silence(6)]) === '');
  check('distortion: one clear reading plus unclear ones isn\'t enough', notesFrom([...silence(4), ...steady(D3, 1), ...steady(D3, 4, 0.7), ...silence(6)]) === '');
  // 45 cents sharp still rounds to D, but it's too far out of tune to count.
  check('distortion: an unclear reading that\'s out of tune (45 cents) doesn\'t count',
    notesFrom([...silence(4), ...steady(D3, 2), ...at(hz(D3 + 0.45), 1, 0.7), ...silence(6)]) === '');
  // Mid-bend, the gliding pitch passes other note names; a blurry reading there isn't a new note.
  const blurredBend = [...pick(62), ...glide(62, 64, 10).map(([f, c, v], i) => [f, i === 6 ? 0.7 : c, v]), ...hold(64, 20)];
  check('distortion: a blurry reading in the middle of a bend doesn\'t make a new note', tabOf(blurredBend) === 'B3b5', tabOf(blurredBend));
  // A note change right after a break in the pitch is a new attack, even with no volume jump.
  const F2 = 42;
  check('distortion: after a break in the pitch, a new note needs 3 readings, like a picked one',
    notesFrom([...steady(F2, 20), ...at(24.4, 2, 0.5), ...steady(D3, 3), ...silence(6)]) === 'F#2 D3', notesFrom([...steady(F2, 20), ...at(24.4, 2, 0.5), ...steady(D3, 3), ...silence(6)]));
  check('distortion: without a break or a pick, a note change still needs 4 readings (a hammer-on)',
    notesFrom([...steady(F2, 20), ...steady(D3, 3), ...steady(F2, 6)]) === 'F#2' && notesFrom([...steady(F2, 20), ...steady(D3, 4), ...silence(6)]) === 'F#2 D3',
    `${notesFrom([...steady(F2, 20), ...steady(D3, 3), ...steady(F2, 6)])} / ${notesFrom([...steady(F2, 20), ...steady(D3, 4), ...silence(6)])}`);
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

// --- Saved riffs keep the rhythm they were recorded with ---
// A pretend localStorage (Node doesn't have one), so riffs can be saved and loaded back.
const shelf = new Map();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: (key) => shelf.get(key) ?? null,
  setItem: (key, value) => shelf.set(key, String(value)),
} });
saveRiff([], null, { bpm: 100, endTime: 2, rhythm: false });
check('rhythm switch: a riff recorded with rhythm off stays off', riffTiming(loadRiffs()[0], 120).timing === false);
saveRiff([], null, { bpm: 100, endTime: 2, rhythm: true });
check('rhythm switch: a riff recorded with rhythm on stays on', riffTiming(loadRiffs()[0], 120).timing === true);
const oldRiff = riffTiming({ notes: [] }, 90);
check('rhythm switch: an old riff (saved before this) has rhythm on, today\'s tempo and 4/4',
  oldRiff.timing === true && oldRiff.bpm === 90 && oldRiff.endTime === null && oldRiff.meter === '4/4', JSON.stringify(oldRiff));

// --- Saved riffs keep their time signature, and their tempo can be fixed ---
saveRiff([], null, { bpm: 90, endTime: 2, rhythm: true, meter: '7/8', autoTempo: true });
const saved = loadRiffs()[0];
check('saved riff: keeps its time signature and that the tempo was worked out', riffTiming(saved, 120).meter === '7/8' && saved.autoTempo === true);
const later = Date.now() + 2;
while (Date.now() < later); // a riff's id is the time in ms, so wait for the next id to be different
saveRiff([], null, { bpm: 90, endTime: 2, rhythm: true, meter: '4/4', autoTempo: false });
check('saved riff: "auto" is only saved when the tempo was worked out', !('autoTempo' in loadRiffs()[0]));
const fixed = updateRiff(saved.id, { bpm: 180, autoTempo: false });
const reloaded = loadRiffs().find((riff) => riff.id === saved.id);
check('saved riff: typing a new tempo saves it, and it\'s not "auto" any more',
  fixed?.bpm === 180 && reloaded.bpm === 180 && reloaded.autoTempo === false && reloaded.meter === '7/8' && loadRiffs()[0].bpm === 90, JSON.stringify(reloaded));
check('saved riff: changing a riff that isn\'t there does nothing', updateRiff('gone', { bpm: 100 }) === null && loadRiffs().length === 4);

// --- New Tab: a tab written by hand ---
{
  const { notes, endTime } = writtenRiff([
    { string: 6, fret: 0, beats: 1 }, { string: 6, fret: 3, beats: 0.5 }, { string: 5, fret: 2, beats: 0.5 }, { string: 5, fret: 5, beats: 2 },
  ], 120);
  const typed = ['0', '5', ' 7 ', '24', '', ' ', '25', '-1', '5.5', '1e1', 'abc'].map((text) => typedFret(text));
  check('new tab: a typed fret counts only if it\'s a whole number from 0 to 24', JSON.stringify(typed) === '[0,5,7,24,null,null,null,null,null,null,null]', JSON.stringify(typed));
  check('new tab: each note gets its pitch from the string and fret', notes.map((n) => n.name).join(' ') === 'E2 G2 B2 D3', notes.map((n) => n.name).join(' '));
  check('new tab: each note starts where the one before it ended', notes.map((n) => n.t).join(' ') === '0 0.5 0.75 1' && endTime === 2, `${notes.map((n) => n.t).join(' ')} end ${endTime}`);
  check('new tab: it\'s drawn with the note values that were picked', valueNames(rhythmOf(notes, 120, endTime)) === 'quarter, eighth, eighth, half', valueNames(rhythmOf(notes, 120, endTime)));
  // An awkward tempo, dotted notes and fret 24, saved (which rounds the end time) and loaded back.
  const odd = writtenRiff([
    { string: 3, fret: 2, beats: 1.5 }, { string: 3, fret: 4, beats: 0.5 }, { string: 2, fret: 3, beats: 0.75 }, { string: 2, fret: 5, beats: 0.25 }, { string: 1, fret: 24, beats: 1 },
  ], 137);
  saveRiff(odd.notes, null, { bpm: 137, endTime: odd.endTime, rhythm: true, meter: '4/4', written: true });
  const back = loadRiffs()[0];
  const want = 'dotted quarter, eighth, dotted eighth, sixteenth, quarter';
  check('new tab: dotted notes at 137 BPM come back the same after saving',
    valueNames(rhythmOf(back.notes, back.bpm, back.endTime)) === want && back.written === true && back.notes[4].name === 'E6', valueNames(rhythmOf(back.notes, back.bpm, back.endTime)));
  const faster = retime(back, 180);
  check('new tab: a new tempo keeps its note values (the notes move closer together)',
    valueNames(rhythmOf(faster.notes, 180, faster.endTime)) === want && faster.notes[1].t < back.notes[1].t, valueNames(rhythmOf(faster.notes, 180, faster.endTime)));
}

// --- Rename and Delete ---
shelf.set('riffboi.riffs', JSON.stringify(['a', 'b', 'c'].map((id) => ({ id, label: `Riff ${id}`, notes: [] }))));
updateRiff('a', { name: 'Crazy Train intro' });
check('rename: a riff keeps its new name', loadRiffs()[0].name === 'Crazy Train intro' && loadRiffs()[0].label === 'Riff a');
updateRiff('a', { name: undefined });
check('rename: an empty name goes back to the date', !('name' in loadRiffs()[0]));
deleteRiff('b');
check('delete: only that riff is gone, the rest stay in order', loadRiffs().map((riff) => riff.id).join(' ') === 'a c', loadRiffs().map((riff) => riff.id).join(' '));
deleteRiff('gone');
check('delete: deleting a riff that isn\'t there changes nothing', loadRiffs().map((riff) => riff.id).join(' ') === 'a c');

// --- Playback ---
{
  const round = (x) => Math.round(x * 1000) / 1000;
  const describe = (plan) => plan.map(({ start, length }) => `${round(start)}+${round(length)}`).join(' ');
  const { notes, endTime } = writtenRiff([
    { string: 6, fret: 0, beats: 1 }, { string: 6, fret: 3, beats: 0.5 }, { string: 5, fret: 2, beats: 0.5 }, { string: 5, fret: 5, beats: 2 },
  ], 120);
  const plan = playbackPlan(notes, { bpm: 120, endTime });
  check('playback: follows the tab (a quarter, two eighths and a half at 120 BPM)', describe(plan) === '0+0.5 0.5+0.25 0.75+0.25 1+1', describe(plan));
  // 2½ beats between two notes: the tab shows a half note, so the last half beat is silence.
  const gap = playbackPlan([{ t: 0 }, { t: 1.25 }], { bpm: 120, endTime: 1.75 });
  check('playback: a note lasts its note value, and the leftover time is silence', describe(gap) === '0+1 1.25+0.5', describe(gap));
  const loose = playbackPlan([{ t: 2 }, { t: 2.3 }, { t: 3.1 }], { bpm: 120, endTime: 3.6, timing: false });
  check('playback: with rhythm off, the notes play when they were played', describe(loose) === '0+0.3 0.3+0.8 1.1+0.5', describe(loose));
  const half = playbackPlan(notes, { bpm: 120, endTime, speed: 0.5 });
  const looseHalf = playbackPlan([{ t: 2 }, { t: 2.3 }, { t: 3.1 }], { bpm: 120, endTime: 3.6, timing: false, speed: 0.5 });
  check('practice: half speed plays every note twice as long, with or without rhythm',
    describe(half) === '0+1 1+0.5 1.5+0.5 2+2' && describe(looseHalf) === '0+0.6 0.6+1.6 2.2+1', `${describe(half)} / ${describe(looseHalf)}`);
  const clicks = (plan, options) => clickTimes(plan, options).map(([at, accent]) => `${round(at)}${accent ? '!' : ''}`).join(' ');
  const waltz = playbackPlan(Array.from({ length: 4 }, (_, i) => ({ t: i * 0.5 })), { bpm: 120, endTime: 2 });
  const longWaltz = playbackPlan(Array.from({ length: 7 }, (_, i) => ({ t: i * 0.5 })), { bpm: 120, endTime: 3.5 });
  check('practice: the click is on every beat, louder on the first beat of each bar (3/4)',
    clicks(waltz, { bpm: 120, meter: '3/4' }) === '0! 0.5 1 1.5!' && clicks(longWaltz, { bpm: 120, meter: '3/4' }) === '0! 0.5 1 1.5! 2 2.5 3!',
    `${clicks(waltz, { bpm: 120, meter: '3/4' })} / ${clicks(longWaltz, { bpm: 120, meter: '3/4' })}`);
  check('practice: at half speed the click slows down with the notes',
    clicks(playbackPlan(Array.from({ length: 4 }, (_, i) => ({ t: i * 0.5 })), { bpm: 120, endTime: 2, speed: 0.5 }), { bpm: 120, meter: '4/4', speed: 0.5 }) === '0! 1 2 3');
  check('playback: a bend glides up, and a release glides back down',
    JSON.stringify(pitchPoints({ bend: 2, release: true }, 1)) === '[[0,0],[0.12,2],[0.6,2],[0.72,0]]', JSON.stringify(pitchPoints({ bend: 2, release: true }, 1)));
  check('playback: a pre-bend starts up; a plain note stays put',
    JSON.stringify(pitchPoints({ bend: 1, prebend: true }, 0.5)) === '[[0,1]]' && JSON.stringify(pitchPoints({}, 0.5)) === '[[0,0]]');
  // The plucked string's pitch: a loop of 200 samples sounds once every 200.5 samples.
  let seed = 1;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const sound = pluckSamples(44100, 200, 1, random);
  const slice = sound.subarray(4410, 4410 + 4096);
  let bestLag = 0;
  let best = -Infinity;
  for (let lag = 150; lag <= 250; lag++) {
    let sum = 0;
    for (let i = 0; i + lag < slice.length; i++) sum += slice[i] * slice[i + lag];
    if (sum > best) [best, bestLag] = [sum, lag];
  }
  const loudness = (a) => Math.sqrt(a.reduce((sum, x) => sum + x * x, 0) / a.length);
  check('playback: the plucked string repeats every 200.5 samples (its pitch)', Math.abs(bestLag - 200.5) <= 0.5, bestLag);
  // A4 at 48 kHz: a loop of 109 samples sounds at 48000 / 109.5 = 438.4 Hz, so it plays a bit faster.
  const a4 = loopFor(48000, 69);
  check('playback: each note\'s loop and speed land exactly on its pitch',
    a4.period === 109 && Math.abs((48000 / (a4.period + 0.5)) * a4.rate - 440) < 1e-9 && [40, 64, 88].every((m) => Math.abs(loopFor(44100, m).rate - 1) < 0.02), JSON.stringify(a4));
  // Real numbers: the end is about 0.32 as loud as 0.1 to 0.3 s in, and about 0.6 without the fade.
  const fade = loudness(sound.subarray(35280)) / loudness(sound.subarray(4410, 13230));
  check('playback: the plucked string fades like a real one', fade < 0.45, fade.toFixed(3));
  const offset = sound.subarray(0, 200).reduce((sum, x) => sum + x, 0) / 200;
  check('playback: the pick has no steady offset (it would never fade)', Math.abs(offset) < 1e-6, offset);
}

// --- Upload a recording ---
{
  // A whole recording at once must give the same riff as the scoreboard's replay of it
  // (the same steps as live), on every real recording.
  const dir = new URL('./recordings/', import.meta.url);
  const differ = [];
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.json')).sort()) {
    const { readings } = JSON.parse(readFileSync(new URL(file, dir), 'utf8'));
    const track = createNoteTracker();
    const raw = [];
    for (const [freq, clarity, volume, t] of readings) {
      const result = track(freq, clarity, volume, t);
      if (result?.fix) Object.assign(raw[raw.length - 1], result.fix);
      else if (result?.bend) Object.assign(raw[raw.length - 1], result.bend);
      else if (result) raw.push(result);
    }
    const replayed = cleanUpRiff(raw);
    placeNotes(replayed);
    const { notes, endTime } = notesFromReadings(readings);
    placeNotes(notes);
    const tab = (list) => list.map((n) => `${n.name}@${n.string}/${n.fret}${n.bend ? `b${n.bend}` : ''}`).join(' ');
    const lastEnds = Math.min(readings.at(-1)[3], riffEnd(readings));
    if (tab(notes) !== tab(replayed) || endTime !== lastEnds) differ.push(file);
  }
  check('upload: a whole recording gives the same notes, strings and end as playing it live, on every recording', differ.length === 0, differ.join(', '));
  // None of the recordings has a bend or an octave fix yet, so use the made-up bend readings too.
  const viaUpload = (readings) => {
    const { notes } = notesFromReadings(readings.map(([f, c, v], i) => [f, c, v, i / 60]));
    placeNotes(notes);
    return notes.map((n) => 'EADGBe'[6 - n.string] + tabToken(n)).join(' ');
  };
  const wrong = bendCases.filter(([, readings, expected]) => viaUpload(readings) !== expected).map(([label]) => label);
  check('upload: bends, releases, pre-bends and octave fixes come out the same as live', wrong.length === 0, wrong.join('; '));

  // Readings like live: 60 a second, each from the latest 2048 samples, timed where the slice ends.
  const samples = new Float32Array(48000).fill(0.5); // 1 second at 48 kHz
  const slices = [];
  const readings = [...readingsFrom(samples, 48000, (slice) => (slices.push(slice.length), [110, 0.9]))];
  check('upload: 60 readings a second of 2048 samples each, timed where each slice ends',
    readings.length === 58 && slices.every((n) => n === 2048) && readings[0][3] === 2048 / 48000 && readings[1][3] === (2048 + 800) / 48000 && readings[0][2] === 0.5 && readings[0][0] === 110,
    `${readings.length} readings, first at ${readings[0]?.[3]}`);
}

// --- Move a note to another string ---
{
  const spots = (note) => otherSpots(note).map((spot) => `${spot.string}/${spot.fret}`).join(' ');
  check('move a note: C3 on the A string can also go on the low E (fret 8)', spots({ midi: 48, string: 5, fret: 3 }) === '6/8', spots({ midi: 48, string: 5, fret: 3 }));
  check('move a note: G3 on the G string can go on the D, A or low E', spots({ midi: 55, string: 3, fret: 0 }) === '4/5 5/10 6/15', spots({ midi: 55, string: 3, fret: 0 }));
  check('move a note: the open low E can only be played there', spots({ midi: 40, string: 6, fret: 0 }) === '');
  check('edit a note: dragging C3 to the low E makes it fret 8; it can\'t go on the high e',
    fretOn(48, 6) === 8 && fretOn(48, 1) === null && fretOn(48, 5) === 3);
  check('edit a note: frets up to 24 when you edit by hand (22 when Riff Boi guesses)',
    fretOn(88, 1, 24) === 24 && fretOn(88, 1) === null && otherSpots({ midi: 83, string: 1, fret: 19 }, 24).map((s) => `${s.string}/${s.fret}`).join(' ') === '2/24' && otherSpots({ midi: 83, string: 1, fret: 19 }).length === 0);
  const edited = withFret({ midi: 48, name: 'C3', string: 5, fret: 3, bend: 2, t: 1 }, 5);
  check('edit a note: a new fret makes it a new note on the same string, and a bend stays a bend',
    edited.midi === 50 && edited.name === 'D3' && edited.fret === 5 && edited.string === 5 && edited.bend === 2 && edited.t === 1, JSON.stringify(edited));
}

// --- Copy as text tab ---
{
  const notes = [{ string: 5, fret: 5 }, { string: 5, fret: 7 }, { string: 4, fret: 7, bend: 2, release: true }, { string: 6, fret: 0 }];
  const text = tabText(notes, [2]);
  const want = [
    'e|-----|---------|',
    'B|-----|---------|',
    'G|-----|---------|',
    'D|-----|-7b9r7---|',
    'A|-5-7-|---------|',
    'E|-----|-------0-|',
  ].join('\n');
  check('copy: text tab has every note in its column, with a bar line where a bar starts', text === want, `\n${text}`);
  const quarters = Array.from({ length: 7 }, (_, i) => ({ t: i * 0.5 })); // 120 BPM
  check('copy: bar lines go every 4 quarter notes in 4/4, every 3 in 3/4',
    barStarts(quarters, 120, 3.5, '4/4').join(' ') === '4' && barStarts(quarters, 120, 3.5, '3/4').join(' ') === '3 6', `${barStarts(quarters, 120, 3.5, '4/4')} / ${barStarts(quarters, 120, 3.5, '3/4')}`);
}

// --- Key and scale finder ---
{
  const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const riff = (names) => names.split(' ').map((name) => ({ midi: (Number(name.slice(-1)) + 1) * 12 + NAMES.indexOf(name.slice(0, -1)) }));
  const said = (names) => {
    const found = findScale(riff(names));
    return found ? found.name + (found.sameAs ? ` = ${found.sameAs}` : '') : 'none';
  };
  const cases = [
    ['a pentatonic box starting on A#', 'A#2 C#3 D#3 F3 G#3 A#3 C#4 D#4 F4 G#4 A#4 C#5', 'A# minor pentatonic = C# major pentatonic'],
    ['the same box when the first A# was missed (my sample: starts on C#)', 'C#3 D#3 F3 G#3 A#3 C#4 D#4 F4 G#4 A#4 C#5', 'C# major pentatonic = A# minor pentatonic'],
    ['an E minor pentatonic riff', 'E2 G2 A2 B2 D3 E3 D3 B2', 'E minor pentatonic = G major pentatonic'],
    ['a C major scale', 'C3 D3 E3 F3 G3 A3 B3 C4', 'C major = A minor'],
    ['an E Phrygian riff (the F right above the E)', 'E2 F2 E2 G2 A2 B2 C3 D3', 'E Phrygian'],
    ['an A harmonic minor run', 'A2 B2 C3 D3 E3 F3 G#3 A3', 'A harmonic minor'],
    ['an E blues lick', 'E2 G2 A2 A#2 B2 D3 E3', 'E blues'],
    // The home note counts before the size: this riff lives on A, so it's A minor, not E minor pentatonic.
    ['a riff that starts and ends on A (A B D E G)', 'A2 B2 D3 E3 G3 A3', 'A minor = C major'],
    // It starts and ends on A, with a low E under it: the first note counts more than the lowest.
    ['A minor pentatonic with a low E in it', 'A2 C3 D3 E3 G3 E2 A2', 'A minor pentatonic = C major pentatonic'],
    // A pickup note (D#) that fits no scale here: then the lowest note (E) is home, not the last (G).
    ['a riff that starts on a pickup note into a low E', 'D#3 E2 A2 B2 D3 G3', 'E minor pentatonic = G major pentatonic'],
    ['only 3 different notes: can\'t tell', 'E2 G2 A2 E2 G2', 'none'],
    ['a chromatic run: no clear key', 'E2 F2 F#2 G2 G#2 A2 A#2 B2 C3 C#3 D3 D#3', 'none'],
  ];
  const wrongScales = cases.filter(([, names, want]) => said(names) !== want).map(([label, names]) => `${label}: ${said(names)}`);
  check('key and scale: pentatonics, major, minor, Phrygian, harmonic minor and blues come out right, and unclear riffs say nothing', wrongScales.length === 0, wrongScales.join('; '));
  // D# between D and E: no scale here has D, D# and E together, so it's a passing note.
  const passing = findScale(riff('E2 G2 A2 B2 D3 D#3 E3 D3 B2'));
  check('key and scale: a riff with a passing note outside its scale still gets it, and says how many', passing?.name === 'E minor pentatonic' && passing.outside === 1, JSON.stringify(passing));
}

// --- Share a riff with a link ---
{
  // The name's plain base64 has + and /, which links can't carry, so the link-safe swap is tested.
  const riff = {
    label: 'Sep 26, 1:00 PM', name: 'Riff é 🎸 <b> ??? >>>', bpm: 138, endTime: 2.5, rhythm: false, meter: '7/8', written: true,
    notes: [{ midi: 45, string: 5, fret: 0, t: 0 }, { midi: 50, string: 4, fret: 0, t: 0.433, bend: 2, release: true }, { midi: 57, string: 3, fret: 2, t: 1, bend: 1, prebend: true }],
  };
  const link = riffToLink(riff, 'https://riffboi.com/?x=1#old');
  const back = riffFromLink(new URL(link).hash);
  const tabOfRiff = (r) => r.notes.map((n) => `${n.name}@${n.string}/${tabToken(n)}@${n.t}`).join(' ');
  check('share: a riff comes back from its link the same (notes, bends, name, tempo, time signature, rhythm)',
    link.startsWith('https://riffboi.com/?x=1#riff=') && /^[A-Za-z0-9_-]+$/.test(link.split('#riff=')[1]) &&
    tabOfRiff(back) === 'A2@5/0@0 D3@4/0b2r0@0.43 A3@3/2pb3@1' && back.name === 'Riff é 🎸 <b> ??? >>>' &&
    back.bpm === 138 && back.endTime === 2.5 && back.rhythm === false && back.meter === '7/8' && back.written === true && back.shared === true,
    JSON.stringify(back));
  const pack = (data) => '#riff=' + Buffer.from(JSON.stringify(data)).toString('base64url');
  const good = { v: 1, n: 'x', b: 120, e: 1, r: 1, m: '4/4', s: [[45, 5, 0, 0, 0, 0, 0]] };
  const bad = [
    ['not a riff link', '#top'],
    ['cut off', link.split('#')[1].slice(0, 20).replace(/^/, '#')],
    ['garbled', '#riff=%%%%'],
    ['a newer link format', pack({ ...good, v: 2 })],
    ['no notes', pack({ ...good, s: [] })],
    ['a string and fret that don\'t give that note', pack({ ...good, s: [[46, 5, 0, 0, 0, 0, 0]] })],
    ['string 7', pack({ ...good, s: [[45, 7, 0, 0, 0, 0, 0]] })],
    ['a made-up time', pack({ ...good, s: [[45, 5, 0, 'soon', 0, 0, 0]] })],
    ['too many notes', pack({ ...good, s: Array(2001).fill([45, 5, 0, 0, 0, 0, 0]) })],
  ];
  const accepted = bad.filter(([, hash]) => riffFromLink(hash) !== null).map(([label]) => label);
  check('share: links that are cut off, garbled, made up or too long are turned down', accepted.length === 0, accepted.join(', '));
  const odd = riffFromLink(pack({ ...good, n: '   ', b: 999, m: '13/8', e: -1 }));
  check('share: odd values fall back to safe ones (name, tempo, time signature, end)',
    odd?.name === 'Shared riff' && odd.bpm === 120 && odd.meter === '4/4' && odd.endTime === null, JSON.stringify(odd));
}

// --- Saving the raw sound as a WAV file (?debug) ---
{
  const view = new DataView(wavFile(new Float32Array([0, 1, -1, 0.5, 2, -3]), 48000));
  const text = (at, n) => String.fromCharCode(...Array.from({ length: n }, (_, i) => view.getUint8(at + i)));
  const header = [text(0, 4), view.getUint32(4, true), text(8, 4), text(12, 4), view.getUint32(16, true), view.getUint16(20, true), view.getUint16(22, true),
    view.getUint32(24, true), view.getUint32(28, true), view.getUint16(32, true), view.getUint16(34, true), text(36, 4), view.getUint32(40, true)].join(' ');
  check('wav: the header says 16-bit, one channel, 48 kHz, 6 samples', header === 'RIFF 48 WAVE fmt  16 1 1 48000 96000 2 16 data 12' && view.byteLength === 56, header);
  const samples = Array.from({ length: 6 }, (_, i) => view.getInt16(44 + i * 2, true)).join(' ');
  check('wav: sound from -1 to 1 becomes whole numbers, and louder than that is clipped', samples === '0 32767 -32768 16384 32767 -32768', samples);
}

// --- Fading the notes Riff Boi isn't sure about ---
{
  const clear = { heard: 20, matched: 18, claritySum: 18 * 0.97, centsSum: 18 * 5 };
  const blurry = { heard: 16, matched: 2, claritySum: 2 * 0.82, centsSum: 2 * 15 };
  check('unsure notes: a clear, steady note isn\'t faded (even if its octave was fixed); a blurry one is',
    !isUnsure({ quality: clear }) && !isUnsure({ quality: clear, fixed: true }) && isUnsure({ quality: blurry }));
  check('unsure notes: a saved note just says whether it was unsure', isUnsure({ unsure: true }) && !isUnsure({}));
  const svg = tabSvg([{ string: 5, fret: 3, t: 0, unsure: true }, { string: 5, fret: 5, t: 0.5 }], { bpm: 120, endTime: 1 });
  check('unsure notes: drawn faded in the tab', (svg.match(/class="t-fret t-unsure"/g) || []).length === 1);
  shelf.set('riffboi.riffs', '[]');
  saveRiff([{ midi: 48, string: 5, fret: 3, t: 0, unsure: true }, { midi: 50, string: 5, fret: 5, t: 0.5, unsure: false }], null, { bpm: 120, endTime: 1 });
  const savedNotes = loadRiffs()[0].notes;
  check('unsure notes: saved with the riff (only when true)', savedNotes[0].unsure === true && !('unsure' in savedNotes[1]));
  // On real recordings: none on the clean fret runs; on Crazy Train, the notes that were hardest to hear.
  const dir = new URL('./recordings/', import.meta.url);
  const unsureIn = (file) => notesFromReadings(JSON.parse(readFileSync(new URL(file, dir), 'utf8')).readings).notes.filter(isUnsure);
  const clean = readdirSync(dir).filter((name) => name.startsWith('run-') && name.endsWith('.json')).flatMap(unsureIn);
  const crazy = unsureIn('crazy-train.json').map((n) => `${n.name}@${n.t}`);
  check('unsure notes: none on the clean fret runs', clean.length === 0, clean.map((n) => n.name).join(' '));
  check('unsure notes: on Crazy Train, the hardest notes (like the B2 and D3 found only by the distortion rules)',
    crazy.includes('B2@5.83') && crazy.includes('D3@8.33') && crazy.length <= 10, crazy.join(' '));
}

// --- Hammer-ons, pull-offs and slides in the tab ---
{
  const G = (fret, link) => ({ string: 3, fret, link });
  check('marks: h up and p down for a hammer-on or pull-off, / and \\ for slides, and nothing across strings or on the same fret',
    [linkMark(G(5), G(7, 'legato')), linkMark(G(7), G(5, 'legato')), linkMark(G(5), G(9, 'slide')), linkMark(G(9), G(7, 'slide')),
      linkMark({ string: 4, fret: 5 }, G(7, 'legato')), linkMark(G(7), G(7, 'legato')), linkMark(undefined, G(7, 'legato')), linkMark(G(5), G(7))].join(' ') === 'h p / \\    ');
  const notes = [G(5), G(7, 'legato'), G(5, 'legato'), G(9, 'slide'), G(7, 'slide'), { string: 4, fret: 7, link: 'legato' }];
  const text = tabText(notes, [3]).split('\n');
  check('marks: text tab writes them between the notes (5h7p5, and |/9\\7 after a bar line)', text[2] === 'G|-5h7p5-|/9\\7---|' && text[3] === 'D|-------|-----7-|', text.join(' / '));
  const svg = tabSvg(notes.map((n, i) => ({ ...n, t: i * 0.5 })), { bpm: 120, endTime: 3 });
  const letters = [...svg.matchAll(/class="t-link"[^>]*>([^<]+)</g)].map((m) => m[1]).join(' ');
  check('marks: the tab picture draws h and p over an arc, and slides as slanted lines', letters === 'h p' && (svg.match(/class="t-slide"/g) || []).length === 2 && (svg.match(/class="t-slur"/g) || []).length === 2, letters);
  shelf.set('riffboi.riffs', '[]');
  saveRiff([{ midi: 60, string: 3, fret: 5, t: 0 }, { midi: 62, string: 3, fret: 7, t: 0.5, link: 'legato' }], null, { bpm: 120 });
  check('marks: saved with the riff', loadRiffs()[0].notes[1].link === 'legato' && !('link' in loadRiffs()[0].notes[0]));
  const shared = riffFromLink(new URL(riffToLink({ name: 'x', bpm: 120, endTime: 1, notes: [{ midi: 60, string: 3, fret: 5, t: 0 }, { midi: 64, string: 3, fret: 9, t: 0.5, link: 'slide' }] }, 'https://riffboi.com/')).hash);
  const pack = (s) => '#riff=' + Buffer.from(JSON.stringify({ v: 1, n: 'x', b: 120, e: 1, r: 1, m: '4/4', s })).toString('base64url');
  check('marks: share links carry them, older links without them still open, and a made-up mark is turned down',
    shared?.notes[1].link === 'slide' && !('link' in shared.notes[0]) && riffFromLink(pack([[60, 3, 5, 0, 0, 0, 0]])) !== null && riffFromLink(pack([[60, 3, 5, 0, 0, 0, 0, 7]])) === null);

  // --- Natural harmonics, marked by hand ---
  const spots = (midi) => harmonicSpots(midi).map((spot) => `${'eBGDAE'[spot.string - 1]}<${spot.fret}>`).join(' ');
  check('harmonics: where a note can be a natural harmonic (G4, E4, B5), and a note that can\'t (C4)',
    spots(67) === 'G<12>' && spots(64) === 'A<7> E<5>' && spots(83) === 'e<7> B<5> G<4>' && spots(60) === '', `${spots(67)} / ${spots(64)} / ${spots(83)} / ${spots(60)}`);
  const harmonic = { midi: 67, name: 'G4', string: 3, fret: 12, t: 0.5, harmonic: true };
  check('harmonics: written <12> in the tab, with no hammer-on or slide mark to or from it',
    tabToken(harmonic) === '<12>' && tabText([{ midi: 57, string: 3, fret: 2, t: 0 }, harmonic]).split('\n')[2] === 'G|-2-<12>-|'
    && linkMark({ midi: 64, string: 3, fret: 9, t: 0 }, { ...harmonic, link: 'slide' }) === null, tabText([{ midi: 57, string: 3, fret: 2, t: 0 }, harmonic]));
  check('harmonics: typing a fret makes it a fretted note again', withFret(harmonic, 5).harmonic === undefined && withFret(harmonic, 5).midi === 60);
  shelf.set('riffboi.riffs', '[]');
  saveRiff([{ midi: 57, string: 3, fret: 2, t: 0 }, harmonic], null, { bpm: 120 });
  check('harmonics: saved with the riff', loadRiffs()[0].notes[1].harmonic === true && !('harmonic' in loadRiffs()[0].notes[0]));
  const sharedHarmonic = riffFromLink(new URL(riffToLink({ name: 'x', bpm: 120, endTime: 1, notes: [{ midi: 57, string: 3, fret: 2, t: 0 }, harmonic] }, 'https://riffboi.com/')).hash);
  check('harmonics: share links carry them, and a harmonic at a fret that can\'t make that note is turned down',
    sharedHarmonic?.notes[1].harmonic === true && sharedHarmonic.notes[1].fret === 12 && !('harmonic' in sharedHarmonic.notes[0])
    && riffFromLink(pack([[67, 3, 7, 0, 0, 0, 0, 0, 1]])) === null && riffFromLink(pack([[74, 3, 7, 0, 0, 0, 0, 0, 1]]))?.notes[0].harmonic === true);
}

// --- Camera: learning where the frets are from the notes you play (neck.js) ---
{
  // A made-up camera view: the neck runs a bit downhill to the right, the knuckles are 60 px apart,
  // fret 0 is 80 px along. Fingertips sit on the frets of a box (index at the box's fret, then one
  // fret per finger), with a small repeatable wobble like real tracking.
  const u = [Math.cos(0.2), Math.sin(0.2)];
  const normal = [-u[1], u[0]];
  const length = 8.6 * 60;
  const at = (fret) => 80 + length * (1 - 2 ** (-fret / 12));
  let wobble = 0;
  const handAtBox = (box) => {
    const point = (d, across) => { wobble = (wobble * 7 + 3) % 11; const w = (wobble - 5) * 1.2; return [(d + w) * u[0] + across * normal[0], (d + w) * u[1] + across * normal[1]]; };
    const knuckle = at(box) - 10;
    return { tips: [0, 1, 2, 3].map((f) => point(at(box + f), 60)), knuckles: [point(knuckle, 0), [point(knuckle, 0)[0] + 60 * u[0], point(knuckle, 0)[1] + 60 * u[1]]] };
  };
  // A minor pentatonic in the 5th-fret box, then the same scale in the 12th-fret box.
  const played = [[6, 5], [6, 8], [5, 5], [5, 7], [4, 5], [4, 7], [3, 5], [3, 7], [2, 5], [2, 8], [1, 5], [1, 8],
    [6, 12], [6, 15], [5, 12], [5, 14], [4, 12], [4, 14], [3, 12], [3, 14], [2, 13], [2, 15], [1, 12], [1, 15]];
  const notes = played.map(([string, fret]) => {
    const midi = [64, 59, 55, 50, 45, 40][string - 1] + fret;
    return { midi, string, fret, hand: handAtBox(fret >= 12 ? 12 : 5), spots: positionsFor(midi) };
  });
  check('camera: it waits for a few notes before it trusts the neck', learnNeck(notes.slice(0, MIN_NOTES - 1)) === null);
  const neck = learnNeck(notes);
  check('camera: it learns where fret 0 is from the notes alone (within a quarter of a fret)', neck && Math.abs(fretAt(80, neck.nut, neck.length)) < 0.25, JSON.stringify(neck));
  const picked = notes.map((n) => spotForHand(n.hand, n.spots, neck));
  check('camera: every note goes on the string the hand was at, in both boxes',
    picked.every((spot, i) => spot && spot.string === notes[i].string && spot.fret === notes[i].fret), picked.map((spot) => spot && `${spot.string}/${spot.fret}`).join(' '));
  const early = learnNeck(notes.slice(0, 6));
  check('camera: 6 notes in one box are already enough', early && notes.slice(0, 6).every((n) => spotForHand(n.hand, n.spots, early)?.string === n.string), JSON.stringify(early));
  check('camera: an open string isn\'t forced by the hand (the usual rule decides)', spotForHand(handAtBox(5), [{ string: 5, fret: 0 }], neck) === null);
  check('camera: frets get closer together up the neck (fret 12 is halfway)', Math.abs(fretAt(50, 0, 100) - 12) < 1e-9 && fretAt(-5, 0, 100) === 0 && fretAt(99, 0, 100) === 24);
}

console.log(allOk ? '\nALL CHECKS PASS' : '\nSOME CHECKS FAILED');
process.exit(allOk ? 0 : 1);
