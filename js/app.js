// app.js — starts Riff Boy, switches screens and wires up the buttons.

import { startListening, stopListening } from './audio.js';
import { createNoteTracker } from './notes.js';
import { choosePosition, drawTab } from './tab.js';

const screens = {
  home: document.getElementById('screen-home'),
  recording: document.getElementById('screen-recording'),
};
const liveTab = document.getElementById('live-tab');
const noteName = document.getElementById('note-name');
const noteFreq = document.getElementById('note-freq');
const statusMsg = document.getElementById('status-msg');

// The riff being recorded right now. Lives in memory only until it's saved (slice 3).
let riffNotes = [];
let startTime = 0;
let trackNote = null;

// Debug recorder: open Riff Boy as http://localhost:8000/?debug to record every raw
// reading, then save them as a file. Lets us replay real playing while tuning notes.js.
const DEBUG = new URLSearchParams(location.search).has('debug');
const saveReadingsBtn = document.getElementById('save-readings-btn');
let readings = [];

// Show one screen and hide the others.
function showScreen(name) {
  for (const [key, el] of Object.entries(screens)) {
    el.hidden = key !== name;
  }
}

// Called for every reading from the mic (~60 times a second).
// When a new note starts, pick its string + fret and redraw the tab.
function handleReading(freq, clarity, volume) {
  const t = (performance.now() - startTime) / 1000; // seconds since New Riff
  if (DEBUG) readings.push([round(freq, 2), round(clarity, 3), round(volume, 4), round(t, 3)]);
  const note = trackNote(freq, clarity, volume, t);
  if (!note) return;

  const previous = riffNotes[riffNotes.length - 1];
  const spot = choosePosition(note.midi, previous);
  riffNotes.push({ midi: note.midi, name: note.name, string: spot.string, fret: spot.fret, t: Number(t.toFixed(2)) });

  drawTab(liveTab, riffNotes);
  noteName.textContent = note.name;
  noteFreq.textContent = `${riffNotes.length} note${riffNotes.length === 1 ? '' : 's'}`;
}

function round(x, digits) {
  return Number(x.toFixed(digits));
}

// Save the readings (plus the notes Riff Boy wrote) as a .json file in Downloads.
saveReadingsBtn.addEventListener('click', () => {
  const data = JSON.stringify({ notes: riffNotes, readings });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  link.download = 'riffboy-readings.json';
  link.click();
});

document.getElementById('new-riff-btn').addEventListener('click', async () => {
  riffNotes = [];
  readings = [];
  startTime = performance.now();
  trackNote = createNoteTracker();
  drawTab(liveTab, riffNotes);
  noteName.textContent = '–';
  noteFreq.textContent = 'Play a riff';
  statusMsg.textContent = '';
  showScreen('recording');
  try {
    await startListening(handleReading);
  } catch (err) {
    console.error(err);
    statusMsg.textContent = "Can't hear your guitar";
  }
});

document.getElementById('stop-btn').addEventListener('click', () => {
  stopListening();
  saveReadingsBtn.hidden = !DEBUG;
  showScreen('home');
});
