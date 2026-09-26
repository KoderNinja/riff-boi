// tabsvg.js — draws a riff as a picture of tab, like tab sites with rhythm do: six string
// lines with the fret numbers on them, bar lines between measures, the tempo, bends as
// curved arrows, and the rhythm underneath (stems, and beams joining eighths and sixteenths).
// The picture is SVG (shapes described as text), so it stays sharp at any size.

import { rhythmOf, BEATS_PER_BAR } from './rhythm.js';
import { tabToken } from './tab.js';

const LEFT = 6;               // where the staff starts
const TOP = 54;               // room above the tab for the tempo, measure numbers and bends
const LINE_GAP = 16;          // space between two strings
const STAFF = LINE_GAP * 5;   // from the high e line down to the low E line
const START = 70;             // where the first note goes (after "TAB" and the 4/4)
const BEAT_WIDTH = 46;        // how wide one beat (a quarter note) is
const MIN_GAP = 26;           // notes never get closer than this
const BEND_ROOM = 22;         // extra room after a bent note, for its arrow
const BAR_PAD = 12;           // extra room around a bar line
const STEM_TOP = TOP + STAFF + 12; // rhythm: stems start here...
const STEM_LENGTH = 26;            // ...and are this long (a half note's is half as long)
const DIGIT = 8.6;            // about how wide one character of a fret number is
const BEND_LABEL = { 1: '½', 2: 'full', 3: '1½' };

const stringY = (string) => TOP + (string - 1) * LINE_GAP; // string 1 (high e) on top

// notes: the riff's notes in order (string, fret, t, and bend info).
// Options: bpm (beats per minute), endTime (seconds, sets the last note's length),
// timing (false = rhythm switched off: notes evenly spaced, no bars, tempo or stems),
// rhythm (draw stems and beams), bendArrows (bends as arrows; false = text like 7b9r7),
// highlightLast (the newest note in red, while recording).
// Returns the picture as SVG text.
export function tabSvg(notes, { bpm = 120, endTime = null, timing = true, rhythm = true, bendArrows = true, highlightLast = false } = {}) {
  // With rhythm off, pretend every note is a quarter note in one long bar: evenly spaced.
  const beats = timing ? rhythmOf(notes, bpm, endTime) : notes.map((_, i) => ({ beat: 0, value: { beats: 0, name: 'none' } }));
  if (!timing) rhythm = false;
  const start = timing ? START : 36; // no 4/4 to make room for when rhythm is off
  const labels = notes.map((note) => (bendArrows ? String(note.fret) : tabToken(note)));
  const widths = labels.map((label) => label.length * DIGIT + 4);

  // Across the page: each note's x, and the bar lines (every 4 beats) in between.
  const xs = [];
  const bars = [];
  notes.forEach((note, i) => {
    if (i === 0) {
      xs.push(start + widths[0] / 2);
      return;
    }
    const prev = xs[i - 1];
    const room = (widths[i - 1] + widths[i]) / 2 + 10 + (notes[i - 1].bend && bendArrows ? BEND_ROOM : 0);
    let gap = Math.max(MIN_GAP, room, (beats[i].beat - beats[i - 1].beat) * BEAT_WIDTH);
    const newBars = Math.floor(beats[i].beat / BEATS_PER_BAR) - Math.floor(beats[i - 1].beat / BEATS_PER_BAR);
    if (newBars > 0) {
      gap += 2 * BAR_PAD;
      bars.push({ x: prev + gap - BAR_PAD - widths[i] / 2 - 6, measure: Math.floor(beats[i].beat / BEATS_PER_BAR) + 1 });
    }
    xs.push(prev + gap);
  });
  const lastBend = notes.length && notes[notes.length - 1].bend && bendArrows ? BEND_ROOM + 10 : 0;
  const lastBeats = notes.length ? beats[beats.length - 1].value.beats : 1;
  const end = (notes.length ? xs[xs.length - 1] + Math.max(MIN_GAP, widths[widths.length - 1] / 2 + 12 + lastBend, lastBeats * BEAT_WIDTH) : start + 60);
  const height = rhythm ? STEM_TOP + STEM_LENGTH + 10 : TOP + STAFF + 14;

  const parts = [];
  // The staff: six string lines, a line at each end, "TAB" and the 4/4 time signature.
  for (let s = 1; s <= 6; s++) parts.push(`<line class="t-line" x1="${LEFT}" y1="${stringY(s)}" x2="${end}" y2="${stringY(s)}"/>`);
  parts.push(`<line class="t-bar" x1="${LEFT}" y1="${TOP}" x2="${LEFT}" y2="${TOP + STAFF}"/>`);
  parts.push(`<line class="t-bar" x1="${end}" y1="${TOP}" x2="${end}" y2="${TOP + STAFF}"/>`);
  ['T', 'A', 'B'].forEach((letter, i) => parts.push(`<text class="t-clef" x="${LEFT + 14}" y="${TOP + 21 + i * 20}">${letter}</text>`));
  if (timing) {
    parts.push(`<text class="t-time" x="${LEFT + 42}" y="${TOP + 32}">4</text><text class="t-time" x="${LEFT + 42}" y="${TOP + 70}">4</text>`);
    parts.push(`<text class="t-tempo" x="${LEFT}" y="16">♩ = ${Math.round(bpm)}</text>`);
    parts.push(`<text class="t-measure" x="${LEFT + 2}" y="${TOP - 8}">1</text>`);
  }
  for (const bar of bars) {
    parts.push(`<line class="t-bar" x1="${bar.x}" y1="${TOP}" x2="${bar.x}" y2="${TOP + STAFF}"/>`);
    parts.push(`<text class="t-measure" x="${bar.x + 3}" y="${TOP - 8}">${bar.measure}</text>`);
  }

  // The fret numbers, each on a little dark patch so the string line doesn't run through it.
  notes.forEach((note, i) => {
    const y = stringY(note.string);
    const now = highlightLast && i === notes.length - 1 ? ' t-now' : '';
    parts.push(`<rect class="t-gap" x="${xs[i] - widths[i] / 2}" y="${y - 8}" width="${widths[i]}" height="16"/>`);
    parts.push(`<text class="t-fret${now}" x="${xs[i]}" y="${y}">${labels[i]}</text>`);
    if (note.bend && bendArrows) parts.push(bendArrow(note, xs[i], widths[i], y));
  });

  if (rhythm) parts.push(rhythmMarks(beats, xs));

  const label = `Tab of ${notes.length} note${notes.length === 1 ? '' : 's'}` + (timing ? ` at ${Math.round(bpm)} BPM` : '');
  return `<svg class="tab-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${end + 4} ${height}" width="${end + 4}" height="${height}" role="img" aria-label="${label}">${parts.join('')}</svg>`;
}

// A bend: a curved arrow from the note up above the tab, labelled ½, full or 1½.
// A release curves back down to the string. A pre-bend goes straight up (bent before the pick).
function bendArrow(note, x, width, y) {
  const peakY = TOP - 22;
  const label = BEND_LABEL[note.bend] ?? `${note.bend / 2}`;
  const startX = x + width / 2 + 1; // just right of the fret number
  let path;
  let peakX;
  if (note.prebend) {
    peakX = startX + 4; // straight up: the string was already bent when it was picked
    path = `M ${peakX} ${y} L ${peakX} ${peakY + 6}`;
  } else {
    peakX = startX + 12;
    path = `M ${startX} ${y} Q ${peakX} ${y} ${peakX} ${peakY + 6}`;
  }
  let marks = `<path class="t-bend" d="${path}"/>${arrowHead(peakX, peakY, 'up')}`;
  if (note.release) {
    const endX = peakX + 16;
    marks += `<path class="t-bend" d="M ${peakX} ${peakY + 2} Q ${peakX} ${y} ${endX - 6} ${y}"/>${arrowHead(endX, y, 'right')}`;
  }
  return marks + `<text class="t-bend-label" x="${peakX}" y="${peakY - 6}">${label}</text>`;
}

function arrowHead(x, y, direction) {
  const points = direction === 'up'
    ? `${x - 3.5},${y + 7} ${x + 3.5},${y + 7} ${x},${y}`
    : `${x - 7},${y - 3.5} ${x - 7},${y + 3.5} ${x},${y}`;
  return `<polygon class="t-arrow" points="${points}"/>`;
}

// Rhythm under the tab: no stem for a whole note, a short stem for a half note, a full stem
// for the rest. Eighths and sixteenths in the same beat are joined by beams (one for eighths,
// two for sixteenths); a lone one gets flags instead. A dot means half as long again.
function rhythmMarks(beats, xs) {
  const marks = [];
  const bottom = STEM_TOP + STEM_LENGTH;
  const short = (v) => v.name === 'eighth' || v.name === 'sixteenth';
  beats.forEach(({ value }, i) => {
    if (value.name === 'whole') return;
    const stemEnd = value.name === 'half' ? STEM_TOP + STEM_LENGTH / 2 : bottom;
    marks.push(`<line class="t-stem" x1="${xs[i]}" y1="${STEM_TOP}" x2="${xs[i]}" y2="${stemEnd}"/>`);
    if (value.dotted) marks.push(`<circle class="t-dot" cx="${xs[i] + 5}" cy="${stemEnd - 3}" r="1.8"/>`);
  });
  // Group eighths and sixteenths that sit in the same beat, next to each other.
  let i = 0;
  while (i < beats.length) {
    if (!short(beats[i].value)) {
      i++;
      continue;
    }
    let j = i;
    while (j + 1 < beats.length && short(beats[j + 1].value) && Math.floor(beats[j + 1].beat) === Math.floor(beats[i].beat)) j++;
    if (j === i) {
      // A lone eighth (one flag) or sixteenth (two flags).
      const flags = beats[i].value.name === 'sixteenth' ? 2 : 1;
      for (let f = 0; f < flags; f++) marks.push(`<line class="t-stem" x1="${xs[i]}" y1="${bottom - f * 6}" x2="${xs[i] + 8}" y2="${bottom - f * 6 - 8}"/>`);
    } else {
      marks.push(`<line class="t-beam" x1="${xs[i]}" y1="${bottom}" x2="${xs[j]}" y2="${bottom}"/>`);
      for (let k = i; k <= j; k++) {
        if (beats[k].value.name !== 'sixteenth') continue;
        // Second beam: to the next sixteenth, or a short stub if its neighbours are eighths.
        if (k < j && beats[k + 1].value.name === 'sixteenth') {
          marks.push(`<line class="t-beam" x1="${xs[k]}" y1="${bottom - 6}" x2="${xs[k + 1]}" y2="${bottom - 6}"/>`);
        } else if (!(k > i && beats[k - 1].value.name === 'sixteenth')) {
          const stub = k === j ? -8 : 8;
          marks.push(`<line class="t-beam" x1="${xs[k]}" y1="${bottom - 6}" x2="${xs[k] + stub}" y2="${bottom - 6}"/>`);
        }
      }
    }
    i = j + 1;
  }
  return marks.join('');
}
