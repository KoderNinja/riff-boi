// app.js — starts Riff Boy, switches screens and wires up the buttons.

import { startListening, stopListening } from './audio.js';
import { readNote } from './notes.js';

const screens = {
  home: document.getElementById('screen-home'),
  recording: document.getElementById('screen-recording'),
};
const noteName = document.getElementById('note-name');
const noteFreq = document.getElementById('note-freq');
const statusMsg = document.getElementById('status-msg');

// Show one screen and hide the others.
function showScreen(name) {
  for (const [key, el] of Object.entries(screens)) {
    el.hidden = key !== name;
  }
}

// Called for every reading from the mic. Only clear guitar notes update the screen.
function handleReading(freq, clarity, volume) {
  const note = readNote(freq, clarity, volume);
  if (note) {
    noteName.textContent = note.name;
    noteFreq.textContent = `${note.freq.toFixed(1)} Hz`;
  }
}

document.getElementById('new-riff-btn').addEventListener('click', async () => {
  noteName.textContent = '–';
  noteFreq.textContent = 'Play a note';
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
  showScreen('home');
});
