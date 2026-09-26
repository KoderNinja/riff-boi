// app.js — starts Riff Boi, switches screens and wires up the buttons.

import { startListening, stopListening, listInputs, onInputsChange, soundInfo } from './audio.js';
import { createNoteTracker, cleanUpRiff, stillRinging, tuningOf, median, TUNER_CLARITY, IN_TUNE_CENTS, VOLUME_MIN, RINGING_READINGS } from './notes.js';
import { placeNotes } from './tab.js';
import { tabSvg } from './tabsvg.js';
import { METERS, detectTempo } from './rhythm.js';
import { loadRiffs, saveRiff, updateRiff, deleteRiff, riffTiming, loadSettings, saveSettings, DEFAULT_SETTINGS, loadInputId, saveInputId } from './storage.js';
import { riffConfidence } from './confidence.js';
import { writtenRiff, retime, EDITOR_MAX_FRET } from './editor.js';
import { playNotes } from './playback.js';
import { riffFromRecording } from './upload.js';

const screens = {
  home: document.getElementById('screen-home'),
  recording: document.getElementById('screen-recording'),
  saving: document.getElementById('screen-saving'),
  tuner: document.getElementById('screen-tuner'),
  riff: document.getElementById('screen-riff'),
  editor: document.getElementById('screen-editor'),
};
const $ = (id) => document.getElementById(id);
const liveTab = $('live-tab');
const noteName = $('note-name');
const noteFreq = $('note-freq');
const statusMsg = $('status-msg');
const statusHint = $('status-hint');
const stopBtn = $('stop-btn');
const liveConfidence = $('live-confidence');
const recTime = $('rec-time');

// The riff being recorded right now. Lives in memory only until Stop saves it.
let riffNotes = [];
let startTime = 0;
let trackNote = null;
let volumes = []; // every reading's volume, to measure background noise for the confidence bar
let lastSound = 0; // when the last note could last be heard (seconds): where it ends
let ringing = 0;   // readings in a row that still sound like the last note
let heardNote = false; // has a note shown up in the tab yet? (until then, "Can't hear your guitar" can show)

// The confidence bar moves slowly, so it's updated 4 times a second (every 15 readings).
const CONFIDENCE_EVERY = 15;

// Debug recorder: open Riff Boi as http://localhost:8000/?debug to record every raw
// reading, then save them as a file. Lets us replay real playing while tuning notes.js.
// It also shows the mic's numbers on the Recording and Tuner screens.
const DEBUG = new URLSearchParams(location.search).has('debug');
const saveReadingsBtn = $('save-readings-btn');
let readings = [];
$('debug-info').hidden = !DEBUG;
$('tuner-debug').hidden = !DEBUG;

// ?debug: what the mic is really giving Riff Boi, on screen. For finding out why a phone
// can't hear notes: a paused sound system, a muted mic, the phone's voice clean-up, or
// just too quiet or unclear.
function showMicNumbers(element, freq, clarity, volume) {
  const sound = soundInfo();
  const onOff = (setting) => (setting === undefined ? '?' : setting ? 'on' : 'off');
  element.textContent =
    `Sound ${sound.state} · ${sound.sampleRate} Hz · mic ${sound.mic}\n` +
    `Echo cancel ${onOff(sound.echoCancellation)} · noise cut ${onOff(sound.noiseSuppression)} · auto volume ${onOff(sound.autoGainControl)}\n` +
    `Volume ${volume.toFixed(3)} · clarity ${clarity.toFixed(2)} · pitch ${freq.toFixed(1)} Hz`;
}

// Show one screen and hide the others.
function showScreen(name) {
  stopPlayback(); // leaving a screen stops a riff that's playing
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

// --- Settings: tempo (BPM) or Auto, time signature and rhythm on/off, remembered between visits ---

const settings = loadSettings();
const BPM_MIN = 40;
const BPM_MAX = 240;

// A whole-number tempo from 40 to 240 BPM, or `fallback` if it isn't a number.
function clampBpm(bpm, fallback) {
  return Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(bpm) || fallback));
}

function setBpm(bpm) {
  settings.bpm = clampBpm(bpm, DEFAULT_SETTINGS.bpm);
  $('bpm-input').value = settings.bpm;
  saveSettings(settings);
}

$('bpm-input').value = settings.bpm;
$('rhythm-input').checked = settings.rhythm;
$('bpm-down').addEventListener('click', () => setBpm(settings.bpm - 1));
$('bpm-up').addEventListener('click', () => setBpm(settings.bpm + 1));
$('bpm-input').addEventListener('change', (event) => setBpm(Number(event.target.value)));
$('rhythm-input').addEventListener('change', (event) => {
  settings.rhythm = event.target.checked;
  saveSettings(settings); // only for new riffs: saved riffs keep the rhythm they were recorded with
});

// Auto: Riff Boi works out the tempo from your notes when you tap Stop (see detectTempo).
$('auto-tempo-input').checked = settings.autoTempo;
$('auto-tempo-input').addEventListener('change', (event) => {
  settings.autoTempo = event.target.checked;
  saveSettings(settings);
});

// The time signature, for new riffs (saved riffs keep theirs). A saved setting that isn't in
// the list goes back to 4/4.
if (!METERS.includes(settings.meter)) settings.meter = DEFAULT_SETTINGS.meter;
$('meter-select').replaceChildren(...METERS.map((meter) => new Option(meter, meter)));
$('meter-select').value = settings.meter;
$('meter-select').addEventListener('change', (event) => {
  settings.meter = event.target.value;
  saveSettings(settings);
});

// --- Input picker: the mic or your audio interface, remembered between visits ---

const inputSelect = $('input-select');

// Fill the dropdown with the inputs the browser can see. It only shares their names once
// you've allowed the mic, so before your first riff there's just "Default input".
async function showInputs() {
  let inputs = [];
  try {
    inputs = await listInputs();
  } catch (err) {
    console.error(err);
  }
  inputSelect.replaceChildren(new Option('Default input', ''), ...inputs.map((input) => new Option(input.name, input.id)));
  // Show your pick if it's plugged in. If it isn't, Riff Boi uses the default input for now.
  const saved = loadInputId();
  inputSelect.value = inputs.some((input) => input.id === saved) ? saved : '';
}

inputSelect.addEventListener('change', () => saveInputId(inputSelect.value));
onInputsChange(showInputs); // an input was plugged in or unplugged

// The live tab, redrawn when a note is added or changes. The newest note is red.
function drawLiveTab(notes) {
  liveTab.innerHTML = tabSvg(notes, { bpm: settings.bpm, timing: settings.rhythm, meter: settings.meter, highlightLast: true });
  liveTab.scrollLeft = liveTab.scrollWidth; // keep the newest notes in view
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
    label.className = 'riff-title';
    label.textContent = riffTitle(riff);
    const meta = document.createElement('span');
    meta.className = 'riff-meta';
    const confidence = riff.confidence ? ` · ${Math.round(riff.confidence.score * 100)}%` : '';
    meta.textContent = noteCount(riff.notes.length) + confidence + (riff.written ? ' · written' : '');
    top.append(label, meta);
    const preview = document.createElement('span');
    preview.className = 'mini-tab';
    preview.setAttribute('aria-hidden', 'true'); // screen readers read the label, not the picture
    const shown = riff.notes.slice(0, MINI_TAB_NOTES);
    const timing = riffTiming(riff, settings.bpm);
    if (shown.length < riff.notes.length) timing.endTime = null; // the riff goes on past the preview
    preview.innerHTML = tabSvg(shown, { ...timing, rhythm: false });
    card.append(top);
    if (riff.name) { // a renamed riff still shows when it was made
      const date = document.createElement('span');
      date.className = 'riff-date';
      date.textContent = riff.label;
      card.append(date);
    }
    card.append(preview);
    card.addEventListener('click', () => showRiff(riff));
    const item = document.createElement('li');
    item.append(card, riffActions(riff));
    return item;
  }));
  $('no-riffs-msg').hidden = riffs.length > 0;
  showInputs(); // after your first riff, the inputs' real names show up
  showScreen('home');
}

// A riff's name if you gave it one, or else when it was made (like "Sep 26, 10:12 AM").
function riffTitle(riff) {
  return riff.name || riff.label;
}

// A small text button, like Rename and Delete under each riff card.
function actionButton(text, label, onClick) {
  const button = document.createElement('button');
  button.className = 'riff-action';
  button.textContent = text;
  button.setAttribute('aria-label', label);
  button.addEventListener('click', onClick);
  return button;
}

// Rename and Delete, under each riff card.
function riffActions(riff) {
  const row = document.createElement('div');
  row.className = 'riff-actions';
  const title = riffTitle(riff);
  const remove = actionButton('Delete', `Delete ${title}`, () => {
    if (!confirm(`Delete "${title}"? This can't be undone.`)) return;
    try {
      deleteRiff(riff.id);
    } catch (err) {
      console.error(err); // the browser blocked saving: the riff stays
    }
    showHome();
  });
  remove.classList.add('riff-delete');
  row.append(actionButton('Rename', `Rename ${title}`, () => startRename(row, riff)), remove);
  return row;
}

// Rename swaps the buttons for a name box. Enter or Save keeps the name, Escape or Cancel
// doesn't. An empty name goes back to the date.
function startRename(row, riff) {
  const input = document.createElement('input');
  input.className = 'rename-input';
  input.maxLength = 40;
  input.value = riff.name ?? '';
  input.placeholder = riff.label;
  input.setAttribute('aria-label', 'Riff name');
  let finished = false;
  const finish = (keep) => {
    if (finished) return;
    finished = true;
    if (keep) {
      try {
        updateRiff(riff.id, { name: input.value.trim() || undefined });
      } catch (err) {
        console.error(err); // the browser blocked saving: the old name stays
      }
    }
    showHome();
  };
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') finish(true);
    if (event.key === 'Escape') finish(false);
  });
  row.replaceChildren(input, actionButton('Save', 'Save the name', () => finish(true)), actionButton('Cancel', 'Cancel renaming', () => finish(false)));
  input.focus();
}

// --- Riff View: one saved riff ---

let shownRiff = null; // the riff on this screen

function showRiff(riff) {
  shownRiff = riff;
  $('riff-title').textContent = riffTitle(riff);
  drawRiff(riff);
  $('riff-tab').scrollLeft = 0; // start at the beginning of the riff
  $('riff-count').textContent = noteCount(riff.notes.length) + (riff.name ? ` · ${riff.label}` : '');
  // Riffs saved before the confidence bar existed don't have a score: hide the bar for those.
  $('riff-confidence').hidden = !riff.confidence;
  if (riff.confidence) showConfidence($('riff-confidence'), riff.confidence);
  showScreen('riff');
}

// The riff's tab and its tempo. The tempo is hidden if rhythm was off (the tab has no tempo then),
// and "auto" shows if Riff Boi worked it out.
function drawRiff(riff) {
  stopPlayback();
  const timing = riffTiming(riff, settings.bpm);
  $('riff-tab').innerHTML = tabSvg(riff.notes, timing);
  $('riff-tempo').hidden = !timing.timing;
  $('riff-bpm-input').value = timing.bpm;
  $('riff-auto-tag').hidden = !riff.autoTempo;
}

// Type a new tempo to fix a riff's tempo (like an Auto guess that came out double or half speed).
$('riff-bpm-input').addEventListener('change', (event) => {
  const bpm = clampBpm(Number(event.target.value), riffTiming(shownRiff, settings.bpm).bpm);
  // A written tab keeps its note values (see retime). A recorded riff keeps its times.
  const changes = { ...(shownRiff.written ? retime(shownRiff, bpm) : { bpm }), autoTempo: false };
  try {
    shownRiff = updateRiff(shownRiff.id, changes) ?? { ...shownRiff, ...changes };
  } catch (err) {
    console.error(err); // the browser blocked saving: the tab still changes, but won't be remembered
    shownRiff = { ...shownRiff, ...changes };
  }
  drawRiff(shownRiff);
});

$('back-btn').addEventListener('click', showHome);

// --- Messages: "Can't hear your guitar" and friends ---

// A message in red with a grey hint under it. With no message, both are cleared.
function showMessage(messageEl, hintEl, [message, hint] = ['', '']) {
  messageEl.textContent = message;
  hintEl.textContent = hint;
}

// What to say when listening can't start. The error's name comes from the browser
// (NotAllowedError means the mic is blocked) or from audio.js (PitchyLoadError).
function problemFor(err) {
  if (err.name === 'PitchyLoadError') {
    return ["Couldn't load the pitch detector", 'Check your internet connection, then reload the page.'];
  }
  if (err.name === 'NotAllowedError') {
    return ["Can't hear your guitar", 'The mic is blocked. Allow it for this site in your browser, then try again.'];
  }
  return ["Can't hear your guitar", "Your mic or interface didn't open. Check it's plugged in and not being used by another app."];
}

// No note after 5 seconds of listening (60 readings a second) means something's off.
const CANT_HEAR_READINGS = 5 * 60;
const CANT_HEAR = ["Can't hear your guitar", 'Play a little louder, or check your input on the home screen.'];

// --- Recording ---

// Called for every reading from the mic (~60 times a second).
// When a new note starts (or the last one's octave gets fixed), redraw the tab.
function handleReading(freq, clarity, volume) {
  const t = (performance.now() - startTime) / 1000; // seconds since New Riff
  if (DEBUG) readings.push([round(freq, 2), round(clarity, 3), round(volume, 4), round(t, 3)]);
  volumes.push(volume);
  // volumes has one entry per reading, so this is 5 seconds after listening started.
  if (!heardNote && volumes.length === CANT_HEAR_READINGS) showMessage(statusMsg, statusHint, CANT_HEAR);
  const time = formatTime(t);
  if (recTime.textContent !== time) recTime.textContent = time;
  const peakBefore = riffNotes[riffNotes.length - 1]?.peak;
  const result = trackNote(freq, clarity, volume, t);
  if (result?.fix) {
    // The last note was really an octave lower: correct it.
    Object.assign(riffNotes[riffNotes.length - 1], result.fix);
  } else if (result?.bend) {
    // The last note was bent, released or pre-bent: mark it (the tab shows it like 7b9).
    Object.assign(riffNotes[riffNotes.length - 1], result.bend);
  } else if (result) {
    result.t = round(result.t, 2);
    riffNotes.push(result); // the tracker keeps updating this note's peak loudness
  }
  // The last note lasts while its own pitch can still be heard. Just checking the volume isn't
  // enough: amp hiss can be louder than a note that's dying away, and then it would last until Stop.
  ringing = stillRinging(riffNotes[riffNotes.length - 1], freq, clarity, volume) ? ringing + 1 : 0;
  if (ringing >= RINGING_READINGS) lastSound = t;
  if (volumes.length % CONFIDENCE_EVERY === 0) {
    showConfidence(liveConfidence, riffConfidence(cleanUpRiff(riffNotes), volumes));
    if (DEBUG) showMicNumbers($('debug-info'), freq, clarity, volume);
  }
  // Redraw only when something changed: a new note, an octave fix, or the last note
  // getting louder (that can change whether it counts as a quiet "ghost" note).
  if (!result && riffNotes[riffNotes.length - 1]?.peak === peakBefore) return;

  const shown = currentRiff();
  drawLiveTab(shown);
  noteName.textContent = shown.length ? shown[shown.length - 1].name : '–';
  noteFreq.textContent = noteCount(shown.length);
  if (shown.length && !heardNote) {
    heardNote = true;
    showMessage(statusMsg, statusHint); // it can hear you: hide "Can't hear your guitar"
  }
}

function round(x, digits) {
  return Number(x.toFixed(digits));
}

$('new-riff-btn').addEventListener('click', async () => {
  riffNotes = [];
  readings = [];
  volumes = [];
  lastSound = 0;
  ringing = 0;
  heardNote = false;
  $('debug-info').textContent = '';
  startTime = performance.now();
  trackNote = createNoteTracker();
  drawLiveTab([]); // an empty staff, ready for notes
  showConfidence(liveConfidence, null);
  recTime.textContent = '0:00';
  noteName.textContent = '–';
  noteFreq.textContent = 'Play a riff';
  showMessage(statusMsg, statusHint);
  stopBtn.disabled = false;
  showScreen('recording');
  try {
    await startListening(handleReading, loadInputId());
  } catch (err) {
    console.error(err);
    showMessage(statusMsg, statusHint, problemFor(err));
  }
});

// The tempo to save a riff at. With Auto detect tempo on, work it out from the notes (not with
// rhythm off: that tab has no tempo). If Riff Boi can't tell (under 4 notes, or no steady beat),
// it's the tempo in the box.
function tempoFor(notes) {
  const auto = settings.autoTempo && settings.rhythm;
  const detected = auto ? detectTempo(notes) : null;
  return { auto, detected, bpm: detected === null ? settings.bpm : clampBpm(detected, settings.bpm) };
}

// --- Stop: save the riff ---

stopBtn.addEventListener('click', async () => {
  stopBtn.disabled = true; // one tap is enough
  // The last note lasts until it couldn't be heard any more (or until Stop, if it was still ringing).
  const endTime = Math.min((performance.now() - startTime) / 1000, lastSound);
  stopListening();
  saveReadingsBtn.hidden = !DEBUG;
  const notes = currentRiff();

  if (notes.length === 0) {
    showMessage(statusMsg, statusHint, ['No notes caught. Nothing saved', '']);
    await wait(2000);
    showHome();
    return;
  }

  $('saving-title').textContent = 'Saving…';
  $('saving-details').textContent = '';
  $('saving-where').textContent = '';
  showScreen('saving');
  const { auto, detected, bpm } = tempoFor(notes);
  let riff;
  try {
    riff = saveRiff(notes, riffConfidence(notes, volumes), { bpm, endTime, rhythm: settings.rhythm, meter: settings.meter, autoTempo: detected !== null });
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
  const tempo = !auto ? '' : detected === null ? ` · Couldn't tell the tempo, used ${bpm} BPM` : ` · Tempo ${bpm} BPM`;
  $('saving-details').textContent = `${riff.label} · ${noteCount(riff.notes.length)}${tempo}`;
  $('saving-where').textContent = 'Saved to Latest Riffs';
  if (detected !== null) setBpm(bpm); // the next riff's live tab starts at this tempo
  await wait(auto ? 2500 : 1500); // a little longer, to read the tempo
  showHome();
});

// --- Upload a recording, or try the sample ---

$('upload-btn').addEventListener('click', () => $('upload-input').click());
$('upload-input').addEventListener('change', () => {
  const file = $('upload-input').files[0];
  $('upload-input').value = ''; // so picking the same file again still works
  if (file) tabFromRecording(file, file.name.replace(/\.[^.]+$/, '').slice(0, 40));
});

// The sample is my pentatonic scale, so people without a guitar can see Riff Boi work.
$('sample-btn').addEventListener('click', async () => {
  let file;
  try {
    const response = await fetch('samples/pentatonic.mp3');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    file = await response.blob();
  } catch (err) {
    console.error(err);
    return showProblem("Couldn't load the sample", 'Check your internet and try again');
  }
  tabFromRecording(file, 'Sample: pentatonic scale');
});

// Read a recording, save its riff (named `name`) and show it. Uses the tempo, time signature,
// Auto detect tempo and Show note lengths settings, like a riff you record.
async function tabFromRecording(file, name) {
  $('saving-title').textContent = 'Reading the recording…';
  $('saving-details').textContent = '';
  $('saving-where').textContent = '';
  showScreen('saving');
  let result;
  try {
    result = await riffFromRecording(file, (fraction) => {
      $('saving-details').textContent = `${Math.round(fraction * 100)}%`;
    });
  } catch (err) {
    console.error(err);
    if (err.name === 'TooLongError') return showProblem('That recording is too long', 'Try one under 5 minutes');
    if (err.name === 'PitchyLoadError') return showProblem("Couldn't load the pitch detector", 'Check your internet and try again');
    return showProblem("Couldn't read that file", 'Try an mp3, wav or m4a recording');
  }
  if (result.notes.length === 0) return showProblem('No notes found', 'Riff Boi hears single notes, like a riff or a scale');
  placeNotes(result.notes);
  const { detected, bpm } = tempoFor(result.notes);
  let riff;
  try {
    riff = saveRiff(result.notes, riffConfidence(result.notes, result.volumes), {
      bpm, endTime: result.endTime, rhythm: settings.rhythm, meter: settings.meter, autoTempo: detected !== null, name,
    });
  } catch (err) {
    console.error(err);
    return showProblem("Couldn't save", 'Your browser blocked saving (private window?)');
  }
  if (detected !== null) setBpm(bpm); // the next riff's live tab starts at this tempo
  showRiff(riff);
}

// Show a problem on the Saving screen for a moment, then go home.
async function showProblem(title, details) {
  $('saving-title').textContent = title;
  $('saving-details').textContent = details;
  $('saving-where').textContent = '';
  showScreen('saving');
  await wait(3000);
  showHome();
}

// --- Playback: hear a riff ---

let stopPlaying = null; // stops the riff that's playing, if there is one

function stopPlayback() {
  if (stopPlaying) stopPlaying(); // its onEnd puts everything back
}

// Play the notes of a tab on screen, turning each one red as it plays. The button says Stop
// while it plays, and tapping it again stops. `afterEnd` runs when it's done.
function play(button, container, notes, options, afterEnd = null) {
  if (stopPlaying) return stopPlayback();
  const frets = container.querySelectorAll('.t-fret');
  button.textContent = 'Stop';
  stopPlaying = playNotes(notes, options, (i) => {
    frets.forEach((fret, j) => fret.classList.toggle('t-now', j === i));
    keepInView(container, frets[i]);
  }, () => {
    stopPlaying = null;
    button.textContent = 'Play';
    frets.forEach((fret) => fret.classList.remove('t-now'));
    afterEnd?.();
  });
}

// Scroll a tab sideways so this note is in view.
function keepInView(container, element) {
  if (!element) return;
  const box = container.getBoundingClientRect();
  const spot = element.getBoundingClientRect();
  if (spot.left < box.left + 20 || spot.right > box.right - 20) container.scrollLeft += spot.left - box.left - box.width / 3;
}

$('riff-play-btn').addEventListener('click', () => play($('riff-play-btn'), $('riff-tab'), shownRiff.notes, riffTiming(shownRiff, settings.bpm)));

// --- New Tab: write a tab by hand ---

const editor = { written: [], string: 6, beats: 1 }; // the notes so far, and what's picked

// Show one choice as picked in a row of buttons (string or note value).
function pick(row, button) {
  for (const b of $(row).querySelectorAll('.choice-btn')) b.setAttribute('aria-pressed', String(b === button));
}

function setFret(fret) {
  $('fret-input').value = Math.min(EDITOR_MAX_FRET, Math.max(0, Math.round(fret) || 0));
}

function drawEditor() {
  stopPlayback();
  const { notes, endTime } = writtenRiff(editor.written, settings.bpm);
  $('editor-tab').innerHTML = tabSvg(notes, { bpm: settings.bpm, endTime, meter: settings.meter, highlightLast: true });
  $('editor-tab').scrollLeft = $('editor-tab').scrollWidth; // keep the newest notes in view
  $('undo-note-btn').disabled = $('save-tab-btn').disabled = $('editor-play-btn').disabled = editor.written.length === 0;
  $('editor-hint').textContent = editor.written.length
    ? noteCount(editor.written.length)
    : `Pick a string, a fret and how long the note lasts, then Add note. ${settings.meter} at ${settings.bpm} BPM, from the home screen.`;
}

$('new-tab-btn').addEventListener('click', () => {
  // Start fresh: no notes, the low E, fret 0, a quarter note, not dotted.
  editor.written = [];
  editor.string = 6;
  editor.beats = 1;
  pick('string-picker', $('string-picker').querySelector('[data-string="6"]'));
  pick('value-picker', $('value-picker').querySelector('[data-beats="1"]'));
  setFret(0);
  $('dotted-input').checked = false;
  $('dotted-input').disabled = false;
  drawEditor();
  showScreen('editor');
});

$('string-picker').addEventListener('click', (event) => {
  const button = event.target.closest('.choice-btn');
  if (!button) return;
  editor.string = Number(button.dataset.string);
  pick('string-picker', button);
});

$('value-picker').addEventListener('click', (event) => {
  const button = event.target.closest('.choice-btn');
  if (!button) return;
  editor.beats = Number(button.dataset.beats);
  pick('value-picker', button);
  // There's no dotted whole note or dotted sixteenth in the tab, so Dotted is off for those.
  const noDot = editor.beats === 4 || editor.beats === 0.25;
  $('dotted-input').disabled = noDot;
  if (noDot) $('dotted-input').checked = false;
});

$('fret-down').addEventListener('click', () => setFret(Number($('fret-input').value) - 1));
$('fret-up').addEventListener('click', () => setFret(Number($('fret-input').value) + 1));
$('fret-input').addEventListener('change', (event) => setFret(Number(event.target.value)));

$('add-note-btn').addEventListener('click', () => {
  setFret(Number($('fret-input').value));
  const beats = editor.beats * ($('dotted-input').checked ? 1.5 : 1);
  editor.written.push({ string: editor.string, fret: Number($('fret-input').value), beats });
  drawEditor();
});

$('editor-play-btn').addEventListener('click', () => {
  const { notes, endTime } = writtenRiff(editor.written, settings.bpm);
  play($('editor-play-btn'), $('editor-tab'), notes, { bpm: settings.bpm, endTime }, drawEditor);
});

$('undo-note-btn').addEventListener('click', () => {
  editor.written.pop();
  drawEditor();
});

$('save-tab-btn').addEventListener('click', () => {
  const { notes, endTime } = writtenRiff(editor.written, settings.bpm);
  try {
    saveRiff(notes, null, { bpm: settings.bpm, endTime, rhythm: true, meter: settings.meter, written: true });
  } catch (err) {
    console.error(err);
    $('editor-hint').textContent = "Couldn't save. Your browser blocked saving (private window?)";
    return;
  }
  editor.written = [];
  showHome();
});

$('editor-back-btn').addEventListener('click', () => {
  if (editor.written.length && !confirm('Throw away this tab?')) return;
  editor.written = [];
  showHome();
});

// --- Tuner ---

let tunerFreqs = []; // the last few clear frequencies (the middle one steadies the needle)
let unclear = 0;     // unclear readings in a row
let tunerReadings = 0;

function handleTunerReading(freq, clarity, volume) {
  if (DEBUG && ++tunerReadings % CONFIDENCE_EVERY === 0) showMicNumbers($('tuner-debug'), freq, clarity, volume);
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
  else if (tuning.cents < 0) $('tuner-status').textContent = `${-tuning.cents} cents flat, tune up`;
  else $('tuner-status').textContent = `${tuning.cents} cents sharp, tune down`;
}

$('tuner-btn').addEventListener('click', async () => {
  tunerFreqs = [];
  unclear = 0;
  tunerReadings = 0;
  $('tuner-debug').textContent = '';
  showTuning(null);
  showMessage($('tuner-msg'), $('tuner-hint'));
  showScreen('tuner');
  try {
    await startListening(handleTunerReading, loadInputId());
  } catch (err) {
    console.error(err);
    showMessage($('tuner-msg'), $('tuner-hint'), problemFor(err));
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
