// tab.js — picks a string and fret for each note, and draws the tab.

// Standard tuning, as MIDI numbers. String 1 is the high e, string 6 is the low E,
// the same order as the lines on a tab (high e on top).
const TUNING = [64, 59, 55, 50, 45, 40];
const STRING_LABELS = ['e', 'B', 'G', 'D', 'A', 'E'];
export const MAX_FRET = 22;

// Tunable numbers for the position rule.
const BOX_SIZE = 4;        // your hand covers about 4 frets without moving
const MOVE_COST = 2;       // cost per fret of moving your hand outside that box
const STRING_COST = 1;     // cost per string you jump across
const OPEN_POSITION = 3;   // hand this close to the nut = open strings are easy
const WALK_COST = 0.5;     // walking up/down one string a fret at a time: keeping going is cheap

// Every string/fret spot where this note can be played.
export function positionsFor(midi) {
  const spots = [];
  TUNING.forEach((openMidi, i) => {
    const fret = midi - openMidi;
    if (fret >= 0 && fret <= MAX_FRET) spots.push({ string: i + 1, fret });
  });
  return spots;
}

// Makes a position picker for one riff. It remembers where your hand is,
// so call it once per riff and then pick(midi) for every note in order.
//
// The rule: imagine your hand covers a box of 4 frets. Each possible spot for a note
// gets a "cost": moving your hand outside the box, and jumping across strings, both
// cost effort. The cheapest spot wins; on a tie, the thicker string.
// One exception: if you just moved one fret along a string, taking one more step the
// same way on that string is cheap — you're probably walking up (or down) that string.
export function createPositionPicker() {
  let boxLow = null;        // lowest fret of the hand's box (null = no note yet)
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

  return function pick(midi) {
    const spots = positionsFor(midi);
    if (spots.length === 0) return null;

    let spot;
    if (boxLow === null) {
      spot = firstSpot(spots);
      boxLow = Math.max(spot.fret, 1);
    } else {
      spot = spots.reduce((best, s) => {
        const diff = cost(s) - cost(best);
        return diff < 0 || (diff === 0 && s.string > best.string) ? s : best;
      });
      moveBox(spot.fret);
    }
    lastStep = spot.string === lastString ? spot.fret - lastFret : 0;
    lastString = spot.string;
    lastFret = spot.fret;
    return spot;
  };
}

// Give every note in a riff its string and fret, in order. Running the whole riff
// again each time means a corrected note also moves the notes after it.
export function placeNotes(notes) {
  const pick = createPositionPicker();
  for (const note of notes) Object.assign(note, pick(note.midi));
}

// Draw notes as six lines of tab text inside the given element, e.g.
//   e|-------
//   A|-5-7---
// Each note gets its own column, left to right in the order played.
export function drawTab(element, notes) {
  const lines = STRING_LABELS.map((label) => label + '|-');
  for (const note of notes) {
    const fret = String(note.fret);
    for (let s = 1; s <= 6; s++) {
      lines[s - 1] += (s === note.string ? fret : '-'.repeat(fret.length)) + '-';
    }
  }
  element.textContent = lines.map((line) => line + '--').join('\n');
  element.scrollLeft = element.scrollWidth; // keep the newest notes in view
}
