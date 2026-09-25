// notes.js — turns Pitchy's readings into guitar notes.

// Tunable limits. Change these if Riff Boy hears too much or too little.
export const CLARITY_MIN = 0.9;   // how sure Pitchy must be (0 to 1)
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
  const midi = frequencyToMidi(freq);
  if (midi < LOWEST_MIDI || midi > HIGHEST_MIDI) return null;
  return { midi, name: midiToName(midi), freq };
}

// More tunable numbers, for deciding when a NEW note starts.
// (One "reading" is one check of the sound, about 1/60 of a second.)
export const STABLE_READINGS = 3;   // same pitch this many readings in a row = a real (picked) note
export const LEGATO_READINGS = 6;   // an UNPICKED pitch change (hammer-on, pull-off) must hold this long
export const QUIET_READINGS = 3;    // this many quiet readings = the note has ended
export const PICK_JUMP = 1.5;       // volume jumping this many times louder = you picked again
export const PICK_GAP = 6;          // ignore extra jumps for this many readings after a pick
export const PICK_WINDOW = 10;      // a pick only counts if a clear pitch shows up this soon after it

// Jumps (in semitones) that are probably a harmonic of the ringing note, not a new note:
// an octave down or up, an octave + a fifth up, two octaves up. Distortion makes these louder.
const HARMONIC_JUMPS = [-12, 12, 19, 24];

// Makes a note tracker. Feed it every reading; it returns a note only when a NEW one starts:
// - a clear pitch after quiet,
// - the pitch changing to a different note (and staying there a few readings;
//   longer if it wasn't picked, and never for a likely harmonic),
// - or a volume jump while the pitch stays the same (picking the same note again).
// A held note stays one note.
export function createNoteTracker() {
  let current = null;       // MIDI number of the note ringing now (null = nothing)
  let candidate = null;     // the pitch we're currently hearing, not yet confirmed
  let stableCount = 0;      // how many readings in a row we've heard the candidate
  let quietCount = 0;
  let lastVolume = 0;
  let sincePick = Infinity; // readings since the last pick (volume jump)
  let pickUsed = true;      // has the last pick already started a note?

  return function update(freq, clarity, volume, t) {
    // Did the volume jump? That's the sound of a pick hitting the string.
    const jumped = volume > VOLUME_MIN && volume > lastVolume * PICK_JUMP;
    lastVolume = volume;
    if (jumped && sincePick >= PICK_GAP) {
      sincePick = 0;
      pickUsed = false;
    } else {
      sincePick++;
    }

    const note = readNote(freq, clarity, volume);
    if (!note) {
      if (volume < VOLUME_MIN && ++quietCount >= QUIET_READINGS) current = null;
      candidate = null;
      stableCount = 0;
      return null;
    }
    quietCount = 0;

    stableCount = note.midi === candidate ? stableCount + 1 : 1;
    candidate = note.midi;
    if (stableCount < STABLE_READINGS) return null;

    const picked = !pickUsed && sincePick < PICK_WINDOW;
    const repicked = note.midi === current && picked;

    // A different note without a pick: wait longer, and skip likely harmonics.
    if (note.midi !== current && current !== null && !picked) {
      if (stableCount < LEGATO_READINGS) return null;
      if (HARMONIC_JUMPS.includes(note.midi - current)) return null;
    }

    if (note.midi !== current || repicked) {
      current = note.midi;
      pickUsed = true; // one pick = one note
      return { midi: note.midi, name: note.name, t };
    }
    return null;
  };
}
