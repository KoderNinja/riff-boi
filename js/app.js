// app.js — starts Riff Boi, switches screens and wires up the buttons.

import { startListening, stopListening } from './audio.js';
import { createNoteTracker, cleanUpRiff } from './notes.js';
import { placeNotes, drawTab } from './tab.js';
import { loadRiffs, saveRiff } from './storage.js';

const screens = {
  home: document.getElementById('screen-home'),
  recording: document.getElementById('screen-recording'),
  saving: document.getElementById('screen-saving'),
  riff: document.getElementById('screen-riff'),
};
const $ = (id) => document.getElementById(id);
const liveTab = $('live-tab');
const noteName = $('note-name');
const noteFreq = $('note-freq');
const statusMsg = $('status-msg');
const stopBtn = $('stop-btn');

// The riff being recorded right now. Lives in memory only until Stop saves it.
let riffNotes = [];
let startTime = 0;
let trackNote = null;

// Debug recorder: open Riff Boi as http://localhost:8000/?debug to record every raw
// reading, then save them as a file. Lets us replay real playing while tuning notes.js.
const DEBUG = new URLSearchParams(location.search).has('debug');
const saveReadingsBtn = $('save-readings-btn');
let readings = [];

// Show one screen and hide the others.
function showScreen(name) {
  for (const [key, el] of Object.entries(screens)) {
    el.hidden = key !== name;
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function noteCount(n) {
  return `${n} note${n === 1 ? '' : 's'}`;
}

// The riff so far, cleaned up (ghost notes dropped, octave glitches fixed) with strings + frets.
function currentRiff() {
  const notes = cleanUpRiff(riffNotes);
  placeNotes(notes);
  return notes;
}

// --- Home: Latest Riffs ---

function showHome() {
  const riffs = loadRiffs();
  $('riff-list').replaceChildren(...riffs.map((riff) => {
    const row = document.createElement('button');
    row.className = 'riff-row';
    const label = document.createElement('span');
    label.textContent = riff.label;
    const count = document.createElement('span');
    count.className = 'riff-count';
    count.textContent = noteCount(riff.notes.length);
    row.append(label, count);
    row.addEventListener('click', () => showRiff(riff));
    const item = document.createElement('li');
    item.append(row);
    return item;
  }));
  $('no-riffs-msg').hidden = riffs.length > 0;
  showScreen('home');
}

// --- Riff View: one saved riff ---

function showRiff(riff) {
  $('riff-title').textContent = riff.label;
  drawTab($('riff-tab'), riff.notes);
  $('riff-tab').scrollLeft = 0; // start at the beginning of the riff
  $('riff-count').textContent = noteCount(riff.notes.length);
  showScreen('riff');
}

$('back-btn').addEventListener('click', showHome);

// --- Recording ---

// Called for every reading from the mic (~60 times a second).
// When a new note starts (or the last one's octave gets fixed), redraw the tab.
function handleReading(freq, clarity, volume) {
  const t = (performance.now() - startTime) / 1000; // seconds since New Riff
  if (DEBUG) readings.push([round(freq, 2), round(clarity, 3), round(volume, 4), round(t, 3)]);
  const peakBefore = riffNotes[riffNotes.length - 1]?.peak;
  const result = trackNote(freq, clarity, volume, t);
  // Redraw only when something changed: a new note, an octave fix, or the last note
  // getting louder (that can change whether it counts as a quiet "ghost" note).
  if (!result && riffNotes[riffNotes.length - 1]?.peak === peakBefore) return;

  if (result?.fix) {
    // The last note was really an octave lower: correct it.
    Object.assign(riffNotes[riffNotes.length - 1], result.fix);
  } else if (result) {
    result.t = round(result.t, 2);
    riffNotes.push(result); // the tracker keeps updating this note's peak loudness
  }
  const shown = currentRiff();
  drawTab(liveTab, shown);
  noteName.textContent = shown.length ? shown[shown.length - 1].name : '–';
  noteFreq.textContent = noteCount(shown.length);
}

function round(x, digits) {
  return Number(x.toFixed(digits));
}

$('new-riff-btn').addEventListener('click', async () => {
  riffNotes = [];
  readings = [];
  startTime = performance.now();
  trackNote = createNoteTracker();
  drawTab(liveTab, riffNotes);
  noteName.textContent = '–';
  noteFreq.textContent = 'Play a riff';
  statusMsg.textContent = '';
  stopBtn.disabled = false;
  showScreen('recording');
  try {
    await startListening(handleReading);
  } catch (err) {
    console.error(err);
    statusMsg.textContent = "Can't hear your guitar";
  }
});

// --- Stop: save the riff ---

stopBtn.addEventListener('click', async () => {
  stopBtn.disabled = true; // one tap is enough
  stopListening();
  saveReadingsBtn.hidden = !DEBUG;
  const notes = currentRiff();

  if (notes.length === 0) {
    statusMsg.textContent = 'No notes caught — nothing saved';
    await wait(2000);
    showHome();
    return;
  }

  $('saving-title').textContent = 'Saving…';
  $('saving-details').textContent = '';
  $('saving-where').textContent = '';
  showScreen('saving');
  let riff;
  try {
    riff = saveRiff(notes);
  } catch (err) {
    console.error(err);
    $('saving-title').textContent = "Couldn't save";
    $('saving-details').textContent = 'Your browser blocked saving (private window?)';
    await wait(3000);
    showHome();
    return;
  }
  await wait(500);
  $('saving-title').textContent = 'Saved';
  $('saving-details').textContent = `${riff.label} · ${noteCount(riff.notes.length)}`;
  $('saving-where').textContent = 'Saved to Latest Riffs';
  await wait(1500);
  showHome();
});

// Save the readings (plus the notes Riff Boi wrote) as a .json file in Downloads.
saveReadingsBtn.addEventListener('click', () => {
  const data = JSON.stringify({ notes: currentRiff(), readings });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  link.download = 'riffboi-readings.json';
  link.click();
});

showHome();
