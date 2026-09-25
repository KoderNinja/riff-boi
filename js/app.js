// app.js — starts Riff Boi, switches screens and wires up the buttons.

import { startListening, stopListening } from './audio.js';
import { createNoteTracker } from './notes.js';
import { placeNotes, drawTab } from './tab.js';

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

// Debug recorder: open Riff Boi as http://localhost:8000/?debug to record every raw
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
// When a new note starts (or the last one's octave gets fixed), redraw the tab.
function handleReading(freq, clarity, volume) {
  const t = (performance.now() - startTime) / 1000; // seconds since New Riff
  if (DEBUG) readings.push([round(freq, 2), round(clarity, 3), round(volume, 4), round(t, 3)]);
  const result = trackNote(freq, clarity, volume, t);
  if (!result) return;

  if (result.fix) {
    // The last note was really an octave lower: correct it.
    Object.assign(riffNotes[riffNotes.length - 1], result.fix);
  } else {
    riffNotes.push({ midi: result.midi, name: result.name, t: round(t, 2) });
  }
  placeNotes(riffNotes); // choose string + fret for every note
  drawTab(liveTab, riffNotes);
  noteName.textContent = riffNotes[riffNotes.length - 1].name;
  noteFreq.textContent = `${riffNotes.length} note${riffNotes.length === 1 ? '' : 's'}`;
}

function round(x, digits) {
  return Number(x.toFixed(digits));
}

// Save the readings (plus the notes Riff Boi wrote) as a .json file in Downloads.
saveReadingsBtn.addEventListener('click', () => {
  const data = JSON.stringify({ notes: riffNotes, readings });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  link.download = 'riffboi-readings.json';
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
