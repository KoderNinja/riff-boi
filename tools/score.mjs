// tools/score.mjs — how accurate is notes.js on a real recording?
// Usage: node tools/score.mjs recording.json "F#2 F#2 C#3 ..."   (the notes you really played)
// Lines up what Riff Boi hears against the real notes and counts correct, missed and extra notes.

import { readFileSync } from 'node:fs';
import { createNoteTracker } from '../js/notes.js';

const { readings } = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const truth = process.argv[3].trim().split(/\s+/);

const trackNote = createNoteTracker();
const heard = [];
for (const [freq, clarity, volume, t] of readings) {
  const result = trackNote(freq, clarity, volume, t);
  if (result?.fix) heard[heard.length - 1] = result.fix.name; // Riff Boi corrected its last note
  else if (result) heard.push(result.name);
}

// Line up the two lists with the fewest changes (edit distance), then count.
const n = truth.length, m = heard.length;
const d = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
for (let i = 1; i <= n; i++)
  for (let j = 1; j <= m; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (truth[i - 1] === heard[j - 1] ? 0 : 1));
let i = n, j = m, correct = 0, wrong = 0, missed = 0, extra = 0;
while (i > 0 || j > 0) {
  if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + (truth[i - 1] === heard[j - 1] ? 0 : 1)) {
    truth[i - 1] === heard[j - 1] ? correct++ : wrong++;
    i--; j--;
  } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) { missed++; i--; }
  else { extra++; j--; }
}

console.log(`Played: ${n} notes   Heard: ${m} notes`);
console.log(`Correct: ${correct}   Wrong note: ${wrong}   Missed: ${missed}   Extra: ${extra}`);
console.log(`Heard: ${heard.join(' ')}`);
