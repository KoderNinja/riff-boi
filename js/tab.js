// tab.js — picks a string and fret for each note, and draws the tab.

import { midiToName } from './notes.js';

// Standard tuning, as MIDI numbers. String 1 is the high e, string 6 is the low E,
// the same order as the lines on a tab (high e on top).
export const TUNING = [64, 59, 55, 50, 45, 40];
const STRING_LABELS = ['e', 'B', 'G', 'D', 'A', 'E'];
export const STRING_NAMES = ['high e', 'B', 'G', 'D', 'A', 'low E']; // string 1 to 6, for buttons
export const MAX_FRET = 22;

// Tunable numbers for the position rule.
const BOX_SIZE = 4;        // your hand covers about 4 frets without moving
const MOVE_COST = 2;       // cost per fret of moving your hand outside that box
const STRING_COST = 1;     // cost per string you jump across
const OPEN_POSITION = 3;   // hand this close to the nut = open strings are easy
const WALK_COST = 0.5;     // walking up/down one string a fret at a time: keeping going is cheap

// Every string/fret spot where this note can be played (up to `maxFret`).
export function positionsFor(midi, maxFret = MAX_FRET) {
  const spots = [];
  TUNING.forEach((openMidi, i) => {
    const fret = midi - openMidi;
    if (fret >= 0 && fret <= maxFret) spots.push({ string: i + 1, fret });
  });
  return spots;
}

// The fret that plays this note on `string`, or null if that string can't (up to `maxFret`).
export function fretOn(midi, string, maxFret = MAX_FRET) {
  const fret = midi - TUNING[string - 1];
  return fret >= 0 && fret <= maxFret ? fret : null;
}

// Where else this note can be played: every other string with a fret that gives the same pitch.
export function otherSpots(note, maxFret = MAX_FRET) {
  return positionsFor(note.midi, maxFret).filter((spot) => spot.string !== note.string);
}

// How a note was played from the note before it, as a tab mark: a hammer-on 'h' or pull-off 'p'
// (note.link = 'legato'), or a slide '/' up or '\' down (note.link = 'slide'). Only between two
// notes on the same string at different frets; otherwise null.
export function linkMark(prev, note) {
  if (!note.link || !prev || prev.string !== note.string || prev.fret === note.fret) return null;
  const up = note.fret > prev.fret;
  if (note.link === 'legato') return up ? 'h' : 'p';
  if (note.link === 'slide') return up ? '/' : '\\';
  return null;
}

// The note on its string at another fret, so it becomes a different note (a bend stays a bend).
export function withFret(note, fret) {
  const midi = TUNING[note.string - 1] + fret;
  return { ...note, fret, midi, name: midiToName(midi) };
}

export function createPositionPicker(first = null, finger = 0) {
  let boxLow = null;        // lowest fret of the hand's box (null = no note yet)
  let total = 0;            // effort of every move so far
  let lastString = null;
  let lastFret = null;
  let lastStep = 0;         // fret change of the last move, if it stayed on the same string

  function cost(spot) {
    const walking = Math.abs(lastStep) === 1 && spot.string === lastString && spot.fret - lastFret === lastStep;
    if (walking) return WALK_COST;

    let move = 0;
    const openIsEasy = spot.fret === 0 && boxLow <= OPEN_POSITION;
    if (!openIsEasy) {
      if (spot.fret < boxLow) move = boxLow - spot.fret;
      else if (spot.fret > boxLow + BOX_SIZE - 1) move = spot.fret - (boxLow + BOX_SIZE - 1);
    }
    return move * MOVE_COST + Math.abs(spot.string - lastString) * STRING_COST;
  }

  // First note: the lowest fret, not counting open strings (unless open is the only way).
  function firstSpot(spots) {
    const fretted = spots.filter((s) => s.fret > 0);
    if (fretted.length === 0) return spots[0];
    return fretted.reduce((a, b) => (b.fret < a.fret ? b : a));
  }

  // Slide the box just enough to include the new fret. Open strings don't move your hand.
  function moveBox(fret) {
    if (fret === 0) return;
    if (fret < boxLow) boxLow = fret;
    else if (fret > boxLow + BOX_SIZE - 1) boxLow = fret - (BOX_SIZE - 1);
  }

  function pick(midi) {
    const spots = positionsFor(midi);
    if (spots.length === 0) return null;

    let spot;
    if (boxLow === null) {
      spot = first ?? firstSpot(spots);
      boxLow = Math.max(spot.fret - finger, 1);
    } else {
      spot = spots.reduce((best, s) => {
        const diff = cost(s) - cost(best);
        return diff < 0 || (diff === 0 && s.string > best.string) ? s : best;
      });
      total += cost(spot);
      moveBox(spot.fret);
    }
    // Remember the direction of a walk along a string. Repeating the same fret keeps it.
    if (spot.string !== lastString) lastStep = 0;
    else if (spot.fret !== lastFret) lastStep = spot.fret - lastFret;
    lastString = spot.string;
    lastFret = spot.fret;
    return spot;
  }
  pick.totalCost = () => total;
  return pick;
}

// Give every note in a riff its string and fret, in order. Running the whole riff
// again each time means a corrected note also moves the notes after it.
// We don't know where the first note was played, or with which finger, so we try every
// place and every finger, and keep the version of the whole riff that needs the least
// hand movement (e.g. a pentatonic box at the 6th fret instead of 1st position, or a
// scale coming DOWN that starts under the pinky). On a tie, the usual first-note choice
// (lowest fret, not open) wins, then the version played lower on the neck.
export function placeNotes(notes) {
  if (notes.length === 0) return;
  const firstSpots = positionsFor(notes[0].midi).sort(firstNoteOrder);
  let best = null;
  firstSpots.forEach((first, rank) => {
    for (let finger = 0; finger < BOX_SIZE; finger++) {
      const pick = createPositionPicker(first, finger);
      const spots = notes.map((note) => pick(note.midi));
      const total = pick.totalCost();
      const height = spots.reduce((sum, s) => sum + s.fret, 0); // how far up the neck overall
      const better = !best || total < best.total ||
        (total === best.total && (rank < best.rank || (rank === best.rank && height < best.height)));
      if (better) best = { spots, total, rank, height };
    }
  });
  notes.forEach((note, i) => Object.assign(note, best.spots[i]));
}

// Usual preference for a first note: fretted before open, then the lowest fret.
function firstNoteOrder(a, b) {
  return (a.fret === 0) - (b.fret === 0) || a.fret - b.fret;
}

// How one note is written in the tab: "7", or with a bend "7b9" (fret 7 bent up until it
// sounds like fret 9), "7b9r7" (bent, then released back to 7) or "7pb9r7" (bent before
// it was picked, then released).
export function tabToken(note) {
  const fret = String(note.fret);
  if (!note.bend) return fret;
  return `${fret}${note.prebend ? 'pb' : 'b'}${note.fret + note.bend}${note.release ? `r${fret}` : ''}`;
}

// Notes as six lines of tab text, e.g.
//   e|-------------|
//   A|-5-7-7b9r7---|
// Each note gets its own column, left to right in the order played. `newBar` lists the notes
// that start a new bar, to put a bar line before them.
export function tabText(notes, newBar = []) {
  const lines = STRING_LABELS.map((label) => label + '|-');
  notes.forEach((note, i) => {
    if (i > 0 && newBar.includes(i)) for (let s = 0; s < 6; s++) lines[s] += '|-';
    // A hammer-on, pull-off or slide goes right before the note, like 5h7 or 7/9.
    const mark = linkMark(notes[i - 1], note);
    if (mark) lines[note.string - 1] = lines[note.string - 1].slice(0, -1) + mark;
    const token = tabToken(note);
    for (let s = 1; s <= 6; s++) {
      lines[s - 1] += (s === note.string ? token : '-'.repeat(token.length)) + '-';
    }
  });
  return lines.map((line) => line + '|').join('\n');
}

// The same, inside the given element (the checks use it).
export function drawTab(element, notes) {
  element.textContent = tabText(notes);
  element.scrollLeft = element.scrollWidth; // keep the newest notes in view
}

// A file name for a riff's text tab: its title without the characters file names can't have
// (like / and :), e.g. "Sep 26, 9:26 PM" → "Sep 26, 9.26 PM.txt".
export function textFileName(title) {
  const clean = String(title ?? '').replace(/[\\/:*?"<>|]+/g, '.').replace(/\s+/g, ' ').replace(/^[. ]+|[. ]+$/g, '');
  return `${clean || 'riff'}.txt`;
}
