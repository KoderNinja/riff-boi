// tools/score.mjs — how accurate is Riff Boi on real recordings?
// Usage: node tools/score.mjs                          (scores every recording in tools/recordings/)
//        node tools/score.mjs recording.json answers.txt
// answers.txt holds what you really played, either as note names ("F#2 F#2 C#3 ...")
// or as tab with strings ("E: 2 2 A: 4 E: 2 A: 5h7"; E = low E, e = high e, h/p = hammer-on/pull-off,
// bends like "G: 7b9 7b9r7 7pb9r7").
// Lines up what Riff Boi heard against your answers and counts correct, missed and extra notes.
// With tab answers it also checks whether each correct note landed on the right string,
// and whether the bends were heard (and any bends that weren't played).

import { readFileSync, readdirSync } from 'node:fs';
import { createNoteTracker, cleanUpRiff, midiToName } from '../js/notes.js';
import { placeNotes, tabToken } from '../js/tab.js';
import { riffConfidence } from '../js/confidence.js';

// Standard tuning, string 1 = high e ... string 6 = low E (same as tab.js).
const OPEN = { e: [1, 64], B: [2, 59], G: [3, 55], D: [4, 50], A: [5, 45], E: [6, 40] };

export function parseAnswers(text) {
  if (!text.includes(':')) return text.trim().split(/\s+/).map((name) => ({ name }));
  const notes = [];
  let string = null;
  for (const token of text.split(/[\s,]+|(?<=\d)[hp](?=\d)|(?<=:)/).filter(Boolean)) {
    const label = token.match(/^([eBGDAE]):$/);
    // A fret, maybe with a bend: 7, 7b9, 7b9r7 or 7pb9r7.
    const fretted = token.match(/^(\d+)(?:(pb|b)(\d+)(r\d+)?)?$/);
    if (label) string = OPEN[label[1]];
    else if (fretted && string) {
      const fret = Number(fretted[1]);
      const note = { name: midiToName(string[1] + fret), string: string[0], fret };
      if (fretted[2]) Object.assign(note, { bend: Number(fretted[3]) - fret, prebend: fretted[2] === 'pb', release: Boolean(fretted[4]) });
      notes.push(note);
    }
  }
  return notes;
}

export function score(readings, answers) {
  const track = createNoteTracker();
  const raw = [];
  for (const [freq, clarity, volume, t] of readings) {
    const result = track(freq, clarity, volume, t);
    if (result?.fix) Object.assign(raw[raw.length - 1], result.fix);
    else if (result?.bend) Object.assign(raw[raw.length - 1], result.bend);
    else if (result) raw.push(result);
  }
  const heard = cleanUpRiff(raw);
  placeNotes(heard);
  const confidence = riffConfidence(heard, readings.map((r) => r[2]));

  // Line up the two lists with the fewest changes (edit distance), then count.
  const n = answers.length, m = heard.length;
  const same = (i, j) => answers[i].name === heard[j].name;
  const d = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (same(i - 1, j - 1) ? 0 : 1));
  const r = { confidence, played: n, heard: m, correct: 0, wrong: 0, missed: 0, extra: 0, stringsChecked: 0, stringsRight: 0, bendsChecked: 0, bendsRight: 0, falseBends: 0 };
  const bendOf = (note) => (note.bend ? `${note.prebend ? 'pb' : 'b'}${note.bend}${note.release ? 'r' : ''}` : '');
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + (same(i - 1, j - 1) ? 0 : 1)) {
      if (same(i - 1, j - 1)) {
        r.correct++;
        if (answers[i - 1].string) {
          r.stringsChecked++;
          if (answers[i - 1].string === heard[j - 1].string) r.stringsRight++;
        }
        // Bends: the same kind and size as played? And no bends where none were played.
        if (answers[i - 1].bend) {
          r.bendsChecked++;
          if (bendOf(answers[i - 1]) === bendOf(heard[j - 1])) r.bendsRight++;
        } else if (heard[j - 1].bend) r.falseBends++;
      } else r.wrong++;
      i--; j--;
    } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) { r.missed++; i--; }
    else { r.extra++; j--; }
  }
  r.heardText = heard.map((h) => `${h.name}(${'EADGBe'[6 - h.string]}${tabToken(h)})`).join(' ');
  return r;
}

// "bends 3/4, 1 false", or nothing if the recording has no bends either way.
function bendSummary(r) {
  if (!r.bendsChecked && !r.falseBends) return '';
  return `bends ${r.bendsRight}/${r.bendsChecked}${r.falseBends ? `, ${r.falseBends} false` : ''}`;
}

if (process.argv[1]?.endsWith('score.mjs') && !process.argv[2]) {
  // Scoreboard: every recording that has an answers file next to it.
  const dir = new URL('./recordings/', import.meta.url);
  const total = { played: 0, correct: 0, wrong: 0, missed: 0, extra: 0, stringsChecked: 0, stringsRight: 0, bendsChecked: 0, bendsRight: 0, falseBends: 0 };
  console.log('Recording'.padEnd(24) + 'Played  Correct  Wrong  Missed  Extra  Right string  Accuracy  Confidence');
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.txt')).sort()) {
    const name = file.replace(/\.txt$/, '');
    const { readings } = JSON.parse(readFileSync(new URL(`${name}.json`, dir), 'utf8'));
    const r = score(readings, parseAnswers(readFileSync(new URL(file, dir), 'utf8')));
    for (const k of Object.keys(total)) total[k] += r[k];
    const strings = r.stringsChecked ? `${r.stringsRight}/${r.stringsChecked}` : '-';
    const accuracy = Math.round((100 * r.correct) / (r.played + r.extra));
    const c = r.confidence;
    const conf = c ? `${Math.round(100 * c.score)}% (tone ${Math.round(100 * c.tone)}, tuning ${Math.round(100 * c.tuning)}, noise ${Math.round(100 * c.noise)}, steady ${Math.round(100 * c.steadiness)})` : '-';
    const bends = bendSummary(r);
    console.log(name.padEnd(24) + [r.played, r.correct, r.wrong, r.missed, r.extra].map((x) => String(x).padStart(6)).join(' ') + '  ' + strings.padStart(8) + `${accuracy}%`.padStart(10) + '  ' + conf + (bends ? `  ${bends}` : ''));
  }
  const pct = Math.round((100 * total.correct) / total.played);
  const bends = bendSummary(total);
  console.log(`TOTAL: ${total.correct}/${total.played} notes correct (${pct}%), ${total.wrong} wrong, ${total.missed} missed, ${total.extra} extra; right string ${total.stringsRight}/${total.stringsChecked}` + (bends ? `; ${bends}` : ''));
} else if (process.argv[1]?.endsWith('score.mjs')) {
  const { readings } = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  const r = score(readings, parseAnswers(readFileSync(process.argv[3], 'utf8')));
  console.log(`Played: ${r.played} notes   Heard: ${r.heard} notes`);
  console.log(`Correct: ${r.correct}   Wrong note: ${r.wrong}   Missed: ${r.missed}   Extra: ${r.extra}`);
  if (r.stringsChecked) console.log(`Right string: ${r.stringsRight} of ${r.stringsChecked} correct notes`);
  if (bendSummary(r)) console.log(`Bends: ${r.bendsRight} of ${r.bendsChecked} right${r.falseBends ? `, ${r.falseBends} heard where none were played` : ''}`);
  console.log(`Heard: ${r.heardText}`);
}
