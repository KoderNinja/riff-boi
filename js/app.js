// app.js — starts Riff Boi, switches screens and wires up the buttons.

import { startListening, stopListening } from './audio.js';
import { createNoteTracker, cleanUpRiff, tuningOf, median, TUNER_CLARITY, IN_TUNE_CENTS, VOLUME_MIN } from './notes.js';
import { placeNotes, drawTab } from './tab.js';
import { loadRiffs, saveRiff } from './storage.js';
import { riffConfidence } from './confidence.js';

const screens = {
  home: document.getElementById('screen-home'),
  recording: document.getElementById('screen-recording'),
  saving: document.getElementById('screen-saving'),
  tuner: document.getElementById('screen-tuner'),
  riff: document.getElementById('screen-riff'),
};
const $ = (id) => document.getElementById(id);
const liveTab = $('live-tab');
const noteName = $('note-name');
const noteFreq = $('note-freq');
const statusMsg = $('status-msg');
const stopBtn = $('stop-btn');
const liveConfidence = $('live-confidence');
const recTime = $('rec-time');

// The riff being recorded right now. Lives in memory only until Stop saves it.
let riffNotes = [];
let startTime = 0;
let trackNote = null;
let volumes = []; // every reading's volume, to measure background noise for the confidence bar

// The confidence bar moves slowly, so it's updated 4 times a second (every 15 readings).
const CONFIDENCE_EVERY = 15;

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

// Seconds → "m:ss", for the time since New Riff.
function formatTime(seconds) {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// The riff so far, cleaned up (ghost notes dropped, octave glitches fixed) with strings + frets.
function currentRiff() {
  const notes = cleanUpRiff(riffNotes);
  placeNotes(notes);
  return notes;
}

// Fill in a confidence bar (see confidence.js). With no score yet, it shows an empty bar.
function showConfidence(element, confidence) {
  const pct = confidence ? Math.round(confidence.score * 100) : 0;
  element.querySelector('.confidence-pct').textContent = confidence ? `${pct}%` : '–';
  element.querySelector('.confidence-fill').style.width = `${pct}%`;
  element.querySelector('.confidence-bar').setAttribute('aria-valuenow', pct);
  element.querySelector('.confidence-hint').textContent = confidence ? confidence.hint : '';
}

// --- Home: Latest Riffs ---

const MINI_TAB_NOTES = 12; // how many notes the preview on each riff card shows

function showHome() {
  const riffs = loadRiffs();
  $('riff-list').replaceChildren(...riffs.map((riff) => {
    // A card: date and time, note count (+ confidence), and a mini tab of the first notes.
    const card = document.createElement('button');
    card.className = 'riff-card';
    const top = document.createElement('span');
    top.className = 'riff-card-top';
    const label = document.createElement('span');
    label.textContent = riff.label;
    const meta = document.createElement('span');
    meta.className = 'riff-meta';
    const confidence = riff.confidence ? ` · ${Math.round(riff.confidence.score * 100)}%` : '';
    meta.textContent = noteCount(riff.notes.length) + confidence;
    top.append(label, meta);
    const preview = document.createElement('span');
    preview.className = 'mini-tab';
    preview.setAttribute('aria-hidden', 'true'); // screen readers read the label, not the dashes
    drawTab(preview, riff.notes.slice(0, MINI_TAB_NOTES));
    card.append(top, preview);
    card.addEventListener('click', () => showRiff(riff));
    const item = document.createElement('li');
    item.append(card);
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
  // Riffs saved before the confidence bar existed don't have a score: hide the bar for those.
  $('riff-confidence').hidden = !riff.confidence;
  if (riff.confidence) showConfidence($('riff-confidence'), riff.confidence);
  showScreen('riff');
}

$('back-btn').addEventListener('click', showHome);

// --- Recording ---

// Called for every reading from the mic (~60 times a second).
// When a new note starts (or the last one's octave gets fixed), redraw the tab.
function handleReading(freq, clarity, volume) {
  const t = (performance.now() - startTime) / 1000; // seconds since New Riff
  if (DEBUG) readings.push([round(freq, 2), round(clarity, 3), round(volume, 4), round(t, 3)]);
  volumes.push(volume);
  const time = formatTime(t);
  if (recTime.textContent !== time) recTime.textContent = time;
  const peakBefore = riffNotes[riffNotes.length - 1]?.peak;
  const result = trackNote(freq, clarity, volume, t);
  if (result?.fix) {
    // The last note was really an octave lower: correct it.
    Object.assign(riffNotes[riffNotes.length - 1], result.fix);
  } else if (result) {
    result.t = round(result.t, 2);
    riffNotes.push(result); // the tracker keeps updating this note's peak loudness
  }
  if (volumes.length % CONFIDENCE_EVERY === 0) {
    showConfidence(liveConfidence, riffConfidence(cleanUpRiff(riffNotes), volumes));
  }
  // Redraw only when something changed: a new note, an octave fix, or the last note
  // getting louder (that can change whether it counts as a quiet "ghost" note).
  if (!result && riffNotes[riffNotes.length - 1]?.peak === peakBefore) return;

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
  volumes = [];
  startTime = performance.now();
  trackNote = createNoteTracker();
  drawTab(liveTab, riffNotes);
  showConfidence(liveConfidence, null);
  recTime.textContent = '0:00';
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
    riff = saveRiff(notes, riffConfidence(notes, volumes));
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

// --- Tuner ---

let tunerFreqs = []; // the last few clear frequencies (the middle one steadies the needle)
let unclear = 0;     // unclear readings in a row

function handleTunerReading(freq, clarity, volume) {
  if (clarity >= TUNER_CLARITY && volume >= VOLUME_MIN && freq > 30 && freq < 1400) {
    tunerFreqs = [...tunerFreqs.slice(-4), freq];
    unclear = 0;
    const steady = median(tunerFreqs);
    showTuning(tuningOf(steady), steady);
  } else if (++unclear > 30) {
    // Half a second without a clear note: go back to waiting.
    tunerFreqs = [];
    showTuning(null);
  }
}

function showTuning(tuning, freq) {
  const needle = $('tuner-needle');
  const inTune = tuning && Math.abs(tuning.cents) <= IN_TUNE_CENTS;
  document.querySelector('.tuner').classList.toggle('in-tune', Boolean(inTune));
  if (!tuning) {
    $('tuner-note').textContent = '–';
    $('tuner-status').textContent = 'Play one string';
    $('tuner-freq').textContent = '';
    needle.hidden = true;
    return;
  }
  $('tuner-note').textContent = tuning.name.replace(/-?\d+$/, ''); // "E2" → "E"
  $('tuner-freq').textContent = `${tuning.name} · ${freq.toFixed(1)} Hz`;
  needle.hidden = false;
  needle.style.left = `${50 + tuning.cents}%`; // -50 cents = left edge, +50 = right edge
  if (inTune) $('tuner-status').textContent = 'In tune';
  else if (tuning.cents < 0) $('tuner-status').textContent = `${-tuning.cents} cents flat — tune up`;
  else $('tuner-status').textContent = `${tuning.cents} cents sharp — tune down`;
}

$('tuner-btn').addEventListener('click', async () => {
  tunerFreqs = [];
  unclear = 0;
  showTuning(null);
  $('tuner-msg').textContent = '';
  showScreen('tuner');
  try {
    await startListening(handleTunerReading);
  } catch (err) {
    console.error(err);
    $('tuner-msg').textContent = "Can't hear your guitar";
  }
});

$('tuner-done-btn').addEventListener('click', () => {
  stopListening();
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
