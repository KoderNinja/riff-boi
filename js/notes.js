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

// Harmonics with a DIFFERENT note name than the note ringing (in semitones above it):
// octave + fifth, two octaves + major third, two octaves + fifth. Distortion makes them loud.
// (Octave harmonics have the same name, so the octave fix below handles those.)
const HARMONIC_JUMPS = [19, 28, 31];

// Makes a note tracker. Feed it every reading. It returns:
// - a new note { midi, name, t } when one starts,
// - { fix: { midi, name } } when the note it just wrote was in the wrong octave,
// - or null.
//
// How it works: it follows the note's NAME (F#, C#...) and works out the octave separately,
// because with distortion Pitchy often hears the octave above for a moment. A guitar note's
// real pitch is its lowest one, so the lowest octave heard wins. A new note starts when:
// - a note name is heard after quiet, or changes to a different name, or
// - the volume jumps while the name stays the same (you picked the same note again).
export function createNoteTracker() {
  let current = null;       // the note ringing now: { midi, name } (null = nothing)
  let sinceStart = 0;       // readings since the current note started
  let peak = 0;             // the loudest the current note got
  let candidate = null;     // a note name we're hearing but haven't confirmed yet (0-11)
  let candidateCount = 0;   // how many times we've heard it
  let candidateLow = null;  // the lowest MIDI number heard for it
  let junk = 0;             // junk readings in a row (unclear, out of range)
  let quiet = 0;            // quiet readings in a row
  let volumes = [0, 0, 0];  // the last few volumes, to spot a pick
  let sincePick = Infinity; // readings since the last pick
  let pickUsed = true;      // has the last pick already started a note?

  function start(midi, t) {
    current = { midi, name: midiToName(midi) };
    sinceStart = 0;
    peak = 0;
    pickUsed = true; // one pick = one note
    candidate = null;
    candidateCount = 0;
    return { midi, name: current.name, t };
  }

  return function update(freq, clarity, volume, t) {
    sinceStart++;
    peak = Math.max(peak, volume); // the loudest this note has been

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
    if (quiet >= QUIET_READINGS) current = null;

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
      // Heard a lower octave soon after the note started? The first guess was a harmonic: fix it.
      if (note.midi < current.midi && sinceStart <= FIX_WINDOW) {
        current = { midi: note.midi, name: note.name };
        return { fix: { midi: note.midi, name: note.name } };
      }
      // Picked again? That's a new note with the same name.
      if (picked && volume >= peak * REPICK_LEVEL) return start(Math.min(note.midi, current.midi), t);
      return null;
    }

    // A different note name: count how often we hear it before believing it.
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
    if (current && !picked && HARMONIC_JUMPS.includes(candidateLow - current.midi)) return null;
    return start(candidateLow, t);
    return null;
  };
}
