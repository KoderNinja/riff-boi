// tools/replay.mjs — replays a saved debug recording through notes.js, for tuning.
// Usage: node tools/replay.mjs ~/Downloads/riffboi-readings.json
// Prints the notes the CURRENT notes.js would write, so you can change a number and compare.

import { readFileSync } from 'node:fs';
import { createNoteTracker, cleanUpRiff } from '../js/notes.js';
import { placeNotes } from '../js/tab.js';

const { notes: recorded, readings } = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const trackNote = createNoteTracker();
const raw = [];
for (const [freq, clarity, volume, t] of readings) {
  const result = trackNote(freq, clarity, volume, t);
  if (result?.fix) Object.assign(raw[raw.length - 1], result.fix);
  else if (result) raw.push(result);
}
const notes = cleanUpRiff(raw);
placeNotes(notes);

console.log(`${readings.length} readings (${(readings.at(-1)?.[3] ?? 0).toFixed(1)}s)`);
console.log(`During recording: ${recorded.length} notes: ${recorded.map((n) => n.name).join(' ')}`);
console.log(`Replayed now:     ${notes.length} notes: ${notes.map((n) => n.name).join(' ')}`);
console.log(`Replayed frets:   ${notes.map((n) => `${n.string}/${n.fret}`).join(' ')}`);
