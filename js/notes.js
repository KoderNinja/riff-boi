// notes.js — turns Pitchy's readings into guitar notes.

// Tunable limits. Change these if Riff Boi hears too much or too little.
export const CLARITY_MIN = 0.8;   // how sure Pitchy must be (0 to 1)
export const VOLUME_MIN = 0.01;   // how loud the sound must be (0 to 1)

// Guitar range in standard tuning: low E (MIDI 40) to the 22nd fret on the high E (MIDI 86).
export const LOWEST_MIDI = 40;
export const HIGHEST_MIDI = 86;

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Frequency in Hz → the nearest MIDI note number. A4 = 440 Hz = MIDI 69,
// and every note (semitone) up multiplies the frequency by the 12th root of 2.
export function frequencyToMidi(freq) {
  return Math.round(69 + 12 * Math.log2(freq / 440));
}

// MIDI note number → a name like "A2" (the number is the octave).
export function midiToName(midi) {
  const octave = Math.floor(midi / 12) - 1;
  return NOTE_NAMES[midi % 12] + octave;
}

// One reading from the listener → a note, or null if it isn't a clear guitar note.
export function readNote(freq, clarity, volume) {
  if (clarity < CLARITY_MIN || volume < VOLUME_MIN) return null;
  let midi = frequencyToMidi(freq);
  // Up to an octave below the low E can't come from a guitar: Pitchy heard the
  // octave below by mistake, so move it up an octave.
  if (midi >= LOWEST_MIDI - 12 && midi < LOWEST_MIDI) midi += 12;
  if (midi < LOWEST_MIDI || midi > HIGHEST_MIDI) return null;
  return { midi, name: midiToName(midi), freq };
}

// More tunable numbers, for deciding when a NEW note starts.
// (One "reading" is one check of the sound, about 1/60 of a second.)
export const STABLE_READINGS = 3;   // a new note name must be heard this many times (in a short window)
export const LEGATO_READINGS = 4;   // ...or this many if it wasn't picked (hammer-on, pull-off)
export const QUIET_READINGS = 4;    // this many quiet readings in a row = the note has ended
export const GLITCH_READINGS = 2;   // up to this many junk readings don't interrupt a note
export const PICK_JUMP = 1.8;       // volume this many times louder than just before = you picked
export const PICK_GAP = 6;          // ignore extra jumps for this many readings after a pick
export const PICK_WINDOW = 10;      // a pick only counts if its note shows up this soon after it
export const FIX_WINDOW = 20;       // how long after a note appears Riff Boi may fix its octave
export const REPICK_LEVEL = 0.75;  // picking the same note again must be this loud compared to the note's loudest
export const REPICK_HOLD = 7;      // ...and then hold its pitch this many readings

// Is this pitch probably a harmonic of the ringing note, not a new note?
// Distortion and strong picking make a note's overtones loud. The ones with a DIFFERENT
// note name are the fifth (in any octave above, e.g. C over F) and two octaves + a major
// third. (Octave overtones have the same name, so the octave fix below handles those.)
function isLikelyHarmonic(midi, ringingMidi) {
  const jump = midi - ringingMidi;
  return jump > 0 && (jump % 12 === 7 || jump === 28);
}

// Makes a note tracker. Feed it every reading. It returns:
// - a new note { midi, name, t, peak } when one starts (peak = how loud it got while its
//   pitch was heard; it keeps growing while the note rings: the tracker updates that object),
// - { fix: { midi, name } } when the note it just wrote was in the wrong octave,
// - or null.
//
// How it works: it follows the note's NAME (F#, C#...) and works out the octave separately,
// because with distortion Pitchy often hears the octave above for a moment. A guitar note's
// real pitch is its lowest one, so the lowest octave heard wins. A new note starts when:
// - a note name is heard after quiet, or changes to a different name, or
// - the volume jumps while the name stays the same (you picked the same note again).
export function createNoteTracker() {
  let current = null;       // the note ringing now: { midi, name, t, peak } (null = nothing)
  let sinceStart = 0;       // readings since the current note started
  let candidate = null;     // a note name we're hearing but haven't confirmed yet (0-11)
  let candidateCount = 0;   // how many times we've heard it
  let candidateLow = null;  // the lowest MIDI number heard for it
  let repickCount = 0;      // readings of the same note since a re-pick (0 = no re-pick)
  let junk = 0;             // junk readings in a row (unclear, out of range)
  let quiet = 0;            // quiet readings in a row
  let volumes = [0, 0, 0];  // the last few volumes, to spot a pick
  let sincePick = Infinity; // readings since the last pick
  let pickUsed = true;      // has the last pick already started a note?

  function start(midi, t, volume) {
    current = { midi, name: midiToName(midi), t, peak: volume };
    sinceStart = 0;
    pickUsed = true; // one pick = one note
    candidate = null;
    candidateCount = 0;
    repickCount = 0;
    return current;
  }

  return function update(freq, clarity, volume, t) {
    sinceStart++;

    // Did the volume jump? That's the sound of a pick hitting the string.
    const before = Math.min(...volumes);
    volumes = [...volumes.slice(1), volume];
    if (volume > VOLUME_MIN && volume > before * PICK_JUMP && sincePick >= PICK_GAP) {
      sincePick = 0;
      pickUsed = false;
    } else {
      sincePick++;
    }
    const picked = !pickUsed && sincePick < PICK_WINDOW;

    // Quiet = the note has ended.
    quiet = volume < VOLUME_MIN ? quiet + 1 : 0;
    if (quiet >= QUIET_READINGS) {
      current = null;
      repickCount = 0;
    }

    const note = readNote(freq, clarity, volume);
    if (!note) {
      // A few junk readings don't interrupt anything; more than that resets the candidate.
      if (++junk > GLITCH_READINGS) {
        candidate = null;
        candidateCount = 0;
      }
      return null;
    }
    junk = 0;
    const name = note.midi % 12;

    // Same note name as the one ringing.
    if (current && name === current.midi % 12) {
      candidate = null;
      candidateCount = 0;
      current.peak = Math.max(current.peak, volume); // the loudest this note has been
      // Heard a lower octave soon after the note started? The first guess was a harmonic: fix it.
      if (note.midi < current.midi && sinceStart <= FIX_WINDOW) {
        current.midi = note.midi;
        current.name = note.name;
        return { fix: { midi: note.midi, name: note.name } };
      }
      // Picked again, as loud as the note's attack? Wait until the pitch holds (it might be
      // the pick of the NEXT note, heard a moment before the new fret is pressed down).
      if (repickCount === 0 && picked && volume >= current.peak * REPICK_LEVEL) repickCount = 1;
      else if (repickCount > 0) repickCount++;
      if (repickCount >= REPICK_HOLD) return start(Math.min(note.midi, current.midi), t, volume);
      return null;
    }

    // A different note name: count how often we hear it before believing it.
    repickCount = 0;
    if (name === candidate) {
      candidateCount++;
      candidateLow = Math.min(candidateLow, note.midi);
    } else {
      candidate = name;
      candidateCount = 1;
      candidateLow = note.midi;
    }
    const needed = !current || picked ? STABLE_READINGS : LEGATO_READINGS;
    if (candidateCount < needed) return null;
    // Unpicked and exactly a harmonic of the ringing note? Probably not a new note.
    if (current && !picked && isLikelyHarmonic(candidateLow, current.midi)) return null;
    return start(candidateLow, t, volume);
  };
}

// Clean-up rules that need to see the whole riff so far (the tab redraws with them live).
export const GHOST_LEVEL = 0.35;   // a note this much quieter than the riff's typical note is noise

// Returns the riff's notes with two kinds of mistakes cleaned up:
// 1. Ghost notes: much quieter than your other notes (background noise, a finger touching
//    a string before you start). Needs at least 3 notes to know what "typical" is.
// 2. Octave glitches: a note that jumps an octave away from both neighbours, when an
//    octave lower it would sit right between them (F#3 G4 G#3 → F#3 G3 G#3).
//    Real octave riffs like A2 A3 A2 are left alone: there the lower octave EQUALS a
//    neighbour instead of sitting between them.
export function cleanUpRiff(notes) {
  let kept = notes;
  if (notes.length >= 3) {
    const typical = median(notes.map((n) => n.peak));
    kept = notes.filter((n) => n.peak >= typical * GHOST_LEVEL);
  }
  return kept.map((note, i) => {
    const prev = kept[i - 1];
    const next = kept[i + 1];
    const down = note.midi - 12;
    const between = (other) => other.midi !== down && Math.abs(other.midi - down) <= 2;
    if (prev && next && down >= LOWEST_MIDI && between(prev) && between(next)) {
      return { ...note, midi: down, name: midiToName(down) };
    }
    return note;
  });
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
