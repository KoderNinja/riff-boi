// editor.js — turns a tab written by hand (New Tab) into a riff, the same kind Riff Boi saves
// when it hears you, so it's drawn, saved and listed the same way.

import { midiToName } from './notes.js';
import { TUNING } from './tab.js';

export const EDITOR_MAX_FRET = 24; // written tabs can use every fret on a 24-fret guitar

// A fret typed in the Fret box: a whole number from 0 to 24, or null if it isn't one.
export function typedFret(text) {
  const trimmed = String(text).trim();
  if (!/^\d+$/.test(trimmed)) return null; // only digits: no "", "-1", "5.5" or "1e1"
  const fret = Number(trimmed);
  return fret <= EDITOR_MAX_FRET ? fret : null;
}

// `written`: the notes in order, each { string, fret, beats } (beats: how long it lasts, in
// quarter notes). A riff keeps its notes in seconds, so each note starts where the one before
// it ended, at this tempo. Returns the notes and when the last one ends (seconds).
export function writtenRiff(written, bpm) {
  const secondsPerBeat = 60 / bpm;
  let beat = 0;
  const notes = written.map(({ string, fret, beats }) => {
    const midi = TUNING[string - 1] + fret;
    const note = { midi, name: midiToName(midi), string, fret, t: beat * secondsPerBeat };
    beat += beats;
    return note;
  });
  return { notes, endTime: beat * secondsPerBeat };
}

// A new tempo for a written tab. Its note values stay the same, so the notes move closer
// together or further apart. (A recorded riff keeps its times instead, since that's how it
// was played, and the new tempo changes its note values.)
export function retime(riff, bpm) {
  const scale = riff.bpm / bpm;
  return { bpm, notes: riff.notes.map((note) => ({ ...note, t: note.t * scale })), endTime: riff.endTime * scale };
}
