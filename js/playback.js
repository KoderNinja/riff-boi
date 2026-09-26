// playback.js — plays a riff back with a plucked-string sound, so you can hear what the tab says.

import { rhythmOf, meterOf } from './rhythm.js';

const LONGEST = 2.9;     // seconds: the longest a note rings (each note's sound is made 3 s long)
const FADE = 0.04;       // seconds: a note fades out this fast when the next one starts
const RING_OFF = 0.5;    // seconds: how long the last note rings when there's no end time
const DECAY = 0.996;     // how much of the sound is left each time round the loop (see pluckSamples)

// When each note plays and for how long, in seconds from the first note. With rhythm on, it
// follows the tab: each note starts on its beat and lasts its note value at the riff's tempo
// (leftover time is silence). With rhythm off, the notes play when they were played. `speed`
// slows it down for practice (0.5 = half speed); the notes keep their pitch.
export function playbackPlan(notes, { bpm = 120, endTime = null, timing = true, speed = 1 } = {}) {
  if (notes.length === 0) return [];
  if (timing) {
    const secondsPerBeat = 60 / bpm / speed;
    return rhythmOf(notes, bpm, endTime).map(({ beat, value }, i) => ({
      note: notes[i], start: beat * secondsPerBeat, length: Math.min(LONGEST, value.beats * secondsPerBeat),
    }));
  }
  const first = notes[0].t;
  return notes.map((note, i) => {
    const end = i + 1 < notes.length ? notes[i + 1].t : endTime ?? note.t + RING_OFF;
    return { note, start: (note.t - first) / speed, length: Math.min(LONGEST, Math.max(0.1, end - note.t) / speed) };
  });
}

// A metronome click on every beat (quarter note) from the first note to the end, louder on the
// first beat of each bar: [seconds, accent] pairs, at the same speed as the notes.
export function clickTimes(plan, { bpm = 120, meter = '4/4', speed = 1 } = {}) {
  if (plan.length === 0) return [];
  const secondsPerBeat = 60 / bpm / speed;
  const end = plan.at(-1).start + plan.at(-1).length;
  const barBeats = meterOf(meter).barBeats;
  const clicks = [];
  for (let beat = 0; beat * secondsPerBeat < end - 1e-9; beat++) {
    clicks.push([beat * secondsPerBeat, Math.abs(beat / barBeats - Math.round(beat / barBeats)) < 1e-9]);
  }
  return clicks;
}

// How a note's pitch moves: [seconds into the note, semitones above its fret] points. A bend
// glides up, a release glides back down (after 60% of the note), a pre-bend starts up.
export function pitchPoints({ bend = 0, release = false, prebend = false }, length) {
  if (!bend) return [[0, 0]];
  const glide = Math.min(0.12, length * 0.3);
  const points = prebend ? [[0, bend]] : [[0, 0], [glide, bend]];
  if (release) {
    const at = Math.max(glide, length * 0.6);
    points.push([at, bend], [Math.min(length, at + glide), 0]);
  }
  return points;
}

// The Karplus-Strong plucked string: a burst of noise, one loop long, and then each new sample
// is the average of the two from one loop back, a little quieter. The averaging smooths the
// noise into a tone that fades like a string. A loop of `period` samples sounds once every
// `period` + 0.5 samples (averaging two neighbours adds half a sample). `random` is only
// swapped out by the checks.
export function pluckSamples(sampleRate, period, seconds, random = Math.random) {
  const out = new Float32Array(Math.round(sampleRate * seconds));
  const pick = Math.min(period, out.length);
  let previous = 0;
  for (let i = 0; i < pick; i++) {
    const noise = random() * 2 - 1;
    out[i] = (noise + previous) / 2; // a softer pick: take the edge off the noise
    previous = noise;
  }
  const mean = out.subarray(0, pick).reduce((sum, x) => sum + x, 0) / pick;
  for (let i = 0; i < pick; i++) out[i] -= mean; // no steady offset, just the string
  for (let i = period; i < out.length; i++) out[i] = DECAY * 0.5 * (out[i - period] + (i > period ? out[i - period - 1] : 0));
  return out;
}

// The loop for a note: `period` samples long, played at `rate` times normal speed. The loop can
// only be a whole number of samples, so the speed makes up the difference to land exactly on
// the note's pitch.
export function loopFor(sampleRate, midi) {
  const hz = 440 * 2 ** ((midi - 69) / 12);
  const period = Math.max(2, Math.round(sampleRate / hz - 0.5));
  return { period, rate: hz / (sampleRate / (period + 0.5)) };
}

// --- Playing it (browser only) ---

let context = null;
const strings = new Map(); // midi → { buffer, rate }: each pitch's sound, made once

// One pitch's plucked sound, made the first time it's needed.
function pluck(midi) {
  if (!strings.has(midi)) {
    const { period, rate } = loopFor(context.sampleRate, midi);
    const buffer = context.createBuffer(1, Math.round(context.sampleRate * 3), context.sampleRate);
    buffer.copyToChannel(pluckSamples(context.sampleRate, period, 3), 0);
    strings.set(midi, { buffer, rate });
  }
  return strings.get(midi);
}

// A metronome click at time `at` (on the sound system's clock): a short, high blip that dies
// away fast. The first beat of a bar (`accent`) is higher and louder.
function blip(at, accent, destination) {
  const tone = context.createOscillator();
  const level = context.createGain();
  tone.frequency.value = accent ? 2000 : 1500;
  level.gain.setValueAtTime(accent ? 0.5 : 0.3, at);
  level.gain.exponentialRampToValueAtTime(0.001, at + 0.03);
  tone.connect(level).connect(destination);
  tone.start(at);
  tone.stop(at + 0.03);
}

// Play notes (see playbackPlan for the options, plus `click: true` for a metronome click, which
// needs `meter`). Call it from a tap: phones only let a page make sound after one. `onNote(i)` is
// called as note i starts, and `onEnd(finished)` once: finished is true if it played to the end,
// false if it was stopped. Returns a function that stops it.
export function playNotes(notes, options, onNote, onEnd) {
  context ??= new AudioContext();
  context.resume();
  const plan = playbackPlan(notes, options);
  const t0 = context.currentTime + 0.1;
  const volume = context.createGain();
  volume.gain.value = 0.5;
  volume.connect(context.destination);
  for (const { note, start, length } of plan) {
    const { buffer, rate } = pluck(note.midi);
    const source = context.createBufferSource();
    source.buffer = buffer;
    for (const [at, semitones] of pitchPoints(note, length)) {
      const value = rate * 2 ** (semitones / 12);
      if (at === 0) source.playbackRate.setValueAtTime(value, t0 + start);
      else source.playbackRate.linearRampToValueAtTime(value, t0 + start + at);
    }
    const fade = context.createGain();
    fade.gain.setValueAtTime(1, t0 + start + length);
    fade.gain.linearRampToValueAtTime(0, t0 + start + length + FADE);
    source.connect(fade).connect(volume);
    source.start(t0 + start);
    source.stop(t0 + start + length + FADE);
  }
  if (options.click && options.timing !== false) {
    for (const [at, accent] of clickTimes(plan, options)) blip(t0 + at, accent, volume);
  }

  // Follow along on screen, and finish after the last note. These are timers, not animation
  // frames, because a page in the background gets no frames and would never finish. They're
  // set to when each note is heard: after the start delay and the speakers' own delay.
  const timers = [];
  let stopped = false;
  const stop = (finished = false) => {
    if (stopped) return;
    stopped = true;
    timers.forEach(clearTimeout);
    volume.gain.cancelScheduledValues(context.currentTime);
    volume.gain.setTargetAtTime(0, context.currentTime, 0.01); // quick fade, no click
    setTimeout(() => volume.disconnect(), 100);
    onEnd(finished);
  };
  const heard = (t0 - context.currentTime + (context.outputLatency || 0)) * 1000; // ms until the first note is heard
  plan.forEach(({ start }, i) => timers.push(setTimeout(() => onNote(i), heard + start * 1000)));
  const end = plan.length ? plan.at(-1).start + plan.at(-1).length + FADE : 0;
  timers.push(setTimeout(() => stop(true), heard + end * 1000));
  return () => stop(false);
}
