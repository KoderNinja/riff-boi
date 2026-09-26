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

// --- Tuner ---
export const TUNER_CLARITY = 0.9;  // the tuner only trusts very clear readings
export const IN_TUNE_CENTS = 5;    // within this many cents (hundredths of a semitone) = in tune

// Frequency → the nearest note and how far off it is, in cents (-50 = a quarter-tone flat,
// +50 = a quarter-tone sharp). 100 cents = one semitone = one fret.
export function tuningOf(freq) {
  const exact = 69 + 12 * Math.log2(freq / 440);
  const midi = Math.round(exact);
  return { midi, name: midiToName(midi), cents: Math.round((exact - midi) * 100) };
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
export const FIX_WINDOW = 10;       // how long after a note appears Riff Boi may fix its octave
export const REPICK_LEVEL = 0.75;  // picking the same note again must be this loud compared to the note's loudest
export const REPICK_HOLD = 7;      // ...and then hold its pitch this many readings
export const BREAK_RING = 8;       // a pitch break only counts as a re-pick after the note rang this long
export const QUALITY_WINDOW = 20;  // judge each note's quality over its first 20 readings (1/3 s)

// Bends: pushing the string sideways makes the ringing note's pitch glide, with no new pick.
export const BEND_START = 0.3;     // semitones away from the note's own pitch before it counts as moving
export const BEND_STEADY = 0.15;   // the pitch has settled when 3 readings in a row stay this close together
export const BEND_NEAR = 0.25;     // a settled pitch this close to a whole semitone counts as that note
export const BEND_BETWEEN = 0.15;  // a reading this far from a whole semitone is "in between" two notes
export const GLIDE_READINGS = 3;   // a bend passes through at least this many in-between readings
export const BEND_MAX = 3;         // the biggest bend Riff Boi writes: 3 semitones (1½ steps)
export const GLIDE_MAX = 40;       // a move that hasn't settled after this many readings (2/3 s) isn't a bend
const SETTLE_READINGS = 3;         // readings the pitch must hold still to count as settled
// (Tried stricter settling so very slow bends aren't split up: on the learner's recordings it
// lost 6-7 real notes and heard a false bend, because real notes drift. So bends slower than
// about 0.4 s for a whole step can come out as separate notes.)
const BASE_READINGS = 3;           // the note's own pitch = the middle of its first 3 clear readings

// Support for a new note that's already been heard clearly twice. With distortion, Pitchy often
// hears a fast note less clearly, or locks onto a whole fraction of its pitch (1/2 to 1/6 of it,
// often below the guitar's range). Readings like that can't start a note on their own, but right
// after 2 clear readings of a note they count as one more (see update).
export const WEAK_CLARITY = 0.6;   // an unclear reading must still be this clear to count
export const SUPPORT_CENTS = 40;   // ...and this close to the note (or the fraction of it)
const SUPPORT_AFTER = 2;           // clear readings a note needs before support counts

function supports(freq, clarity, volume, midi) {
  if (!(freq > 0) || clarity < WEAK_CLARITY || volume < VOLUME_MIN) return false;
  const pitch = 69 + 12 * Math.log2(freq / 440);
  // The same note name (in any octave), just not clear enough, but in tune.
  if (Math.round(pitch) % 12 === midi % 12 && Math.abs(pitch - Math.round(pitch)) * 100 <= SUPPORT_CENTS) return true;
  // A whole fraction of the note's pitch: 1/2, 1/3, 1/4, 1/5 or 1/6 of it.
  for (let k = 2; k <= 6; k++) {
    if (Math.abs(pitch + 12 * Math.log2(k) - midi) * 100 <= SUPPORT_CENTS) return true;
  }
  return false;
}

// Is this pitch probably a harmonic of the ringing note, not a new note?
// Distortion and strong picking make a note's overtones loud. The ones with a DIFFERENT
// note name are the fifth (in any octave above, e.g. C over F) and two octaves + a major
// third. (Octave overtones have the same name, so the octave fix below handles those.)
function isLikelyHarmonic(midi, ringingMidi) {
  const jump = midi - ringingMidi;
  return jump > 0 && (jump % 12 === 7 || jump === 28);
}

// Makes a note tracker. Feed it every reading. It returns:
// - a new note { midi, name, t, peak, quality } when one starts (peak = how loud it got while
//   its pitch was heard; quality = how clear, steady and in tune its first readings were;
//   both keep updating while the note rings, because the tracker updates that same object),
// - { fix: { midi, name } } when the note it just wrote was in the wrong octave,
// - { bend: { bend, release, prebend, ... } } when the ringing note was bent, released or
//   pre-bent (the tracker marks that same note object too; see followBend below),
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
  let candidateCount = 0;   // how many times we've heard it (clear readings plus support)
  let candidateClear = 0;   // ...how many of those were clear
  let candidateLow = null;  // the lowest MIDI number heard for it
  let repickCount = 0;      // readings of the same note since a re-pick (0 = no re-pick)
  let repickLow = null;     // the lowest MIDI number heard during the re-pick
  let lowerCount = 0;       // readings in a row of the ringing note's lower octave
  let candidateBreak = false; // did the candidate come right after a break in the pitch?
  let junk = 0;             // junk readings in a row (unclear, out of range)
  let quiet = 0;            // quiet readings in a row
  let volumes = [0, 0, 0];  // the last few volumes, to spot a pick
  let sincePick = Infinity; // readings since the last pick
  let pickUsed = true;      // has the last pick already started a note?
  // Bends (see followBend), reset every time a note starts:
  let base = null;          // the ringing note's own pitch, in semitones with decimals (like MIDI)
  let baseReadings = [];    // its first clear readings, to find `base`
  let bendMove = 'none';    // 'none', 'moving' (glide or jump?), 'bent', 'jumped' or 'done'
  let level = 0;            // where the pitch last settled, in semitones above `base` (0 or the bend)
  let move = [];            // the pitch on each reading since it left `level`

  function start(midi, t, volume) {
    current = { midi, name: midiToName(midi), t, peak: volume, quality: { heard: 0, matched: 0, claritySum: 0, centsSum: 0 } };
    sinceStart = 0;
    pickUsed = true; // one pick = one note
    candidate = null;
    candidateCount = 0;
    repickCount = 0;
    base = null;
    baseReadings = [];
    bendMove = 'none';
    level = 0;
    move = [];
    return current;
  }

  // Follows the ringing note's pitch to spot bends. A bend GLIDES smoothly through the
  // in-between pitches; hammer-ons, pull-offs and slides JUMP from fret to fret. So when the
  // pitch settles again, a glide = a bend (or a release) and a jump = a new note. Returns:
  // - a { bend } change when a bend, a release or a pre-bend is sure,
  // - true while the pitch is gliding or held bent (so it doesn't start new notes),
  // - false when nothing bend-like is going on.
  function followBend(freq) {
    const pitch = 69 + 12 * Math.log2(freq / 440);
    if (base === null) {
      if (Math.abs(pitch - current.midi) < 0.5) baseReadings.push(pitch);
      if (baseReadings.length === BASE_READINGS) base = median(baseReadings);
      return false;
    }
    if (bendMove === 'done') return false;
    const offset = pitch - base;
    // Way off (an octave or a harmonic for a moment): not part of a bend.
    if (Math.abs(offset) > BEND_MAX + 0.4) return bendMove === 'moving' || bendMove === 'bent';

    // Back where it started? Then nothing happened (vibrato, a wobble).
    if (Math.abs(offset - level) < BEND_START) {
      if (bendMove === 'moving' || bendMove === 'jumped') bendMove = level === 0 ? 'none' : 'bent';
      return bendMove === 'bent';
    }
    if (bendMove === 'jumped') return false; // a hammer-on or slide: its new note is on the way
    if (bendMove !== 'moving') {             // leaving the note's pitch (or the bend)
      bendMove = 'moving';
      move = [];
    }
    move.push(offset);

    // Wait until the pitch settles: the last few readings stay close together.
    const recent = move.slice(-SETTLE_READINGS);
    const unsettled = recent.length < SETTLE_READINGS || Math.max(...recent) - Math.min(...recent) > BEND_STEADY;
    if (unsettled && (level > 0 || move.length <= GLIDE_MAX)) return true;
    const settled = average(recent);
    const steps = Math.round(settled);
    if (unsettled || Math.abs(settled - steps) > BEND_NEAR) {
      // Never settled, or settled BETWEEN two notes: that's a smeared note change or a wobble,
      // not a bend we can write. Leave it to the normal note rules (unless the note is bent).
      if (level > 0) return true;
      bendMove = 'jumped';
      return false;
    }
    const between = move.slice(0, -SETTLE_READINGS).filter((x) => Math.abs(x - Math.round(x)) > BEND_BETWEEN).length;
    return settle(steps, between >= GLIDE_READINGS);
  }

  // The pitch settled `steps` semitones above the note's own pitch. `glided` = it got there smoothly.
  function settle(steps, glided) {
    const from = level;
    if (steps === from) {                 // just a little sharp or flat: nothing changed
      bendMove = from === 0 ? 'none' : 'bent';
      return from !== 0;
    }
    if (from === 0 && !glided) {          // it jumped: a hammer-on, pull-off or slide
      bendMove = 'jumped';
      return false;
    }
    if (from === 0 && steps > 0) return bendTo(steps); // glided up: a bend
    if (from === 0) {
      // Glided DOWN from the picked pitch: the string was bent before the pick, then released.
      const fretted = current.midi + steps;
      if (fretted < LOWEST_MIDI) {
        bendMove = 'done';
        return false;
      }
      base += steps;
      bendMove = 'done';
      return changeNote({ midi: fretted, name: midiToName(fretted), bend: -steps, prebend: true, release: true });
    }
    if (steps === 0) {                    // glided back down from the bend: a release
      bendMove = 'done';
      return changeNote({ release: true });
    }
    if (steps > from) return bendTo(steps); // bent further
    level = steps;                        // let part of the bend go: keep following it
    bendMove = steps > 0 ? 'bent' : 'done';
    return steps > 0;
  }

  function bendTo(steps) {
    level = steps;
    bendMove = 'bent';
    return changeNote({ bend: steps });
  }

  // Mark the ringing note as bent (or released), and tell the app so it redraws the tab.
  function changeNote(changes) {
    Object.assign(current, changes);
    candidate = null; // the bent pitch isn't a new note
    candidateCount = 0;
    return { bend: changes };
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
    // Keep score of the ringing note's first readings: did we hear it clearly and in tune?
    // (Not once it starts bending: a bent note is out of tune on purpose.)
    if (current && bendMove === 'none' && current.quality.heard < QUALITY_WINDOW) {
      const q = current.quality;
      q.heard++;
      if (note && note.midi % 12 === current.midi % 12) {
        q.matched++;
        q.claritySum += clarity;
        q.centsSum += Math.abs(tuningOf(freq).cents);
      }
    }
    if (!note) {
      lowerCount = 0;
      // An unclear reading of a new note that's already been heard clearly twice, or a whole
      // fraction of its pitch, counts as one more reading of it (not while a note is bending).
      const midBend = current && (bendMove === 'moving' || bendMove === 'bent');
      if (candidate !== null && candidateClear >= SUPPORT_AFTER && !midBend && supports(freq, clarity, volume, candidateLow)) {
        candidateCount++;
        return confirm(t, volume, picked);
      }
      // A few junk readings don't interrupt anything; more than that resets the candidate.
      if (++junk > GLITCH_READINGS) {
        candidate = null;
        candidateCount = 0;
      }
      return null;
    }
    const pitchBreak = junk >= 2; // the pitch just broke up for a moment, like a new attack does
    junk = 0;
    const name = note.midi % 12;

    // Is the ringing note being bent? (A new pick always means a new note, so only without one.)
    let bending = false;
    if (current && !picked) {
      const bend = followBend(freq);
      if (bend && typeof bend === 'object') return bend; // a bend, release or pre-bend just became sure
      bending = bend;
    }

    // Same note name as the one ringing.
    if (current && name === current.midi % 12) {
      if (bending) return null; // mid-bend: no re-picks or octave fixes
      candidate = null;
      candidateCount = 0;
      current.peak = Math.max(current.peak, volume); // the loudest this note has been
      // Heard the lower octave twice in a row soon after the note started, without a new pick?
      // Then the first guess was a harmonic: fix it. (A picked lower note is a real new note.)
      lowerCount = note.midi < current.midi ? lowerCount + 1 : 0;
      if (lowerCount >= 2 && !picked && repickCount === 0 && sinceStart <= FIX_WINDOW) {
        current.midi = note.midi;
        current.name = note.name;
        current.fixed = true; // Riff Boi wasn't sure about this one
        lowerCount = 0;
        // The bend tracking measured the note's pitch in the wrong octave: start it over.
        base = null;
        baseReadings = [];
        return { fix: { midi: note.midi, name: note.name } };
      }
      // Picked again, as loud as the note's attack? Wait until the pitch holds (it might be
      // the pick of the NEXT note, heard a moment before the new fret is pressed down).
      // (A short break in the pitch also counts as a pick, since quiet picks don't always make the
      // volume jump. But not right after the note started: that's usually a slide or fret change.)
      const breakPick = pitchBreak && sinceStart > BREAK_RING;
      if (repickCount === 0 && (picked || breakPick) && volume >= current.peak * REPICK_LEVEL) {
        repickCount = 1;
        repickLow = note.midi;
      } else if (repickCount > 0) {
        repickCount++;
        repickLow = Math.min(repickLow, note.midi); // could be an octave jump: A2 → A3
      }
      if (repickCount >= REPICK_HOLD) {
        const newerPick = sincePick < repickCount - 1; // you already picked again during the wait
        const started = start(repickLow, t, volume);
        if (newerPick) pickUsed = false; // ...so keep that pick for the next note
        return started;
      }
      return null;
    }

    // A different note name: count how often we hear it before believing it.
    repickCount = 0;
    lowerCount = 0;
    if (name === candidate) {
      candidateCount++;
      candidateClear++;
      candidateLow = Math.min(candidateLow, note.midi);
    } else {
      candidate = name;
      candidateCount = 1;
      candidateClear = 1;
      candidateLow = note.midi;
      candidateBreak = pitchBreak;
    }
    if (bending) return null; // the bent pitch isn't a new note
    return confirm(t, volume, picked);
  };

  // Has the candidate been heard enough to be a new note? Then start it.
  function confirm(t, volume, picked) {
    const needed = !current || picked || candidateBreak ? STABLE_READINGS : LEGATO_READINGS;
    if (candidateCount < needed) return null;
    // Unpicked, no break in the pitch, and exactly a harmonic of the ringing note?
    // Probably not a new note. (A pitch break means a new attack, even if the pick was missed.)
    if (current && !picked && !candidateBreak && isLikelyHarmonic(candidateLow, current.midi)) return null;
    return start(candidateLow, t, volume);
  }
}

// Is this reading still the note that's ringing (in any octave, or at its bent pitch)?
// Tells when a riff's last note ended: amp hiss and room noise can be as loud as a note
// that's dying away, but they don't have its pitch.
export const RINGING_CLARITY = 0.5; // a dying note gets less clear, so this is lower than CLARITY_MIN
export const RINGING_READINGS = 2;  // ...heard this many readings in a row (one stray reading of hiss doesn't count)

export function stillRinging(note, freq, clarity, volume) {
  if (!note || !(freq > 0) || clarity < RINGING_CLARITY || volume < VOLUME_MIN) return false;
  const name = frequencyToMidi(freq) % 12;
  return name === note.midi % 12 || Boolean(note.bend) && name === (note.midi + note.bend) % 12;
}

// Clean-up rules that need to see the whole riff so far (the tab redraws with them live).
export const GHOST_LEVEL = 0.35;   // a note this much quieter than the riff's typical note is noise

// Pitchy's typical mistakes, as the fix in semitones: it heard the octave above (-12),
// the octave below (+12), or a third of the real pitch (+19), or three times it (-19).
const GLITCH_FIXES = [-12, 12, 19, -19];

// Returns the riff's notes with two kinds of mistakes cleaned up:
// 1. Ghost notes: much quieter than your other notes (background noise, a finger touching
//    a string before you start). Needs at least 3 notes to know what "typical" is.
// 2. Pitch glitches: a note that leaps far away (10+ semitones) from both neighbours, when
//    one of Pitchy's typical mistakes would put it strictly BETWEEN two different
//    neighbours, like a scale or walk: F#3 G4 G#3 → F#3 G3 G#3. Riffs that jump away and
//    come back (A2 A3 A2, or a pedal riff E2 F#3 E2) are left alone.
export function cleanUpRiff(notes) {
  let kept = notes;
  if (notes.length >= 3) {
    const typical = median(notes.map((n) => n.peak));
    kept = notes.filter((n) => n.peak >= typical * GHOST_LEVEL);
  }
  return kept.map((note, i) => {
    const prev = kept[i - 1];
    const next = kept[i + 1];
    if (!prev || !next) return note;
    if (Math.abs(note.midi - prev.midi) < 10 || Math.abs(note.midi - next.midi) < 10) return note;
    const low = Math.min(prev.midi, next.midi);
    const high = Math.max(prev.midi, next.midi);
    for (const fix of GLITCH_FIXES) {
      const midi = note.midi + fix;
      if (midi > low && midi < high && midi >= LOWEST_MIDI && midi <= HIGHEST_MIDI) {
        return { ...note, midi, name: midiToName(midi), fixed: true };
      }
    }
    return note;
  });
}

function average(values) {
  return values.reduce((sum, x) => sum + x, 0) / values.length;
}

export function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// A whole recording at once (an uploaded file, or a saved debug recording). `readings` are
// [frequency, clarity, volume, seconds], like the ones live. The same steps app.js takes while
// you play: returns the riff's notes (cleaned up, strings not picked yet) and when the last
// note stopped ringing (seconds), which is where Stop would end it.
export function notesFromReadings(readings) {
  const track = createNoteTracker();
  const notes = [];
  let ringing = 0;
  let lastSound = 0;
  for (const [freq, clarity, volume, t] of readings) {
    const result = track(freq, clarity, volume, t);
    if (result?.fix) Object.assign(notes[notes.length - 1], result.fix);
    else if (result?.bend) Object.assign(notes[notes.length - 1], result.bend);
    else if (result) {
      result.t = Math.round(result.t * 100) / 100; // like app.js (the tracker keeps updating this same note)
      notes.push(result);
    }
    ringing = stillRinging(notes[notes.length - 1], freq, clarity, volume) ? ringing + 1 : 0;
    if (ringing >= RINGING_READINGS) lastSound = t;
  }
  return { notes: cleanUpRiff(notes), endTime: Math.min(readings.at(-1)?.[3] ?? 0, lastSound) };
}

