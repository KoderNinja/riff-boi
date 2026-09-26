// upload.js — turns a recording (like an mp3) into a riff. The same steps as listening live,
// just all at once: a reading 60 times a second of the latest 2048 samples, then notes.js.

import { PITCHY_URL, BUFFER_SIZE, READINGS_PER_SECOND, getVolume } from './audio.js';
import { notesFromReadings } from './notes.js';

export const LONGEST_RECORDING = 300; // seconds: longer ones take too long to read
const SAMPLE_RATE = 48000;            // the rate most phones and laptops listen at

// Readings through the whole sound, like live: 60 a second, each from the latest 2048 samples,
// so each reading's time is where its slice ends. `findPitch` is Pitchy's.
export function* readingsFrom(samples, sampleRate, findPitch) {
  const step = sampleRate / READINGS_PER_SECOND;
  for (let i = 0; BUFFER_SIZE + Math.round(i * step) <= samples.length; i++) {
    const end = BUFFER_SIZE + Math.round(i * step);
    const slice = samples.subarray(end - BUFFER_SIZE, end);
    const [freq, clarity] = findPitch(slice, sampleRate);
    yield [freq, clarity, getVolume(slice), end / sampleRate];
  }
}

// A recording (a File or Blob) → { notes, endTime, volumes }. `onProgress(fraction)` is called
// as it goes. Throws "EncodingError" if it isn't a sound file the browser can read,
// "TooLongError" if it's over 5 minutes, and "PitchyLoadError" if Pitchy can't load.
export async function riffFromRecording(file, onProgress = () => {}) {
  // Decode it (mp3, wav, m4a...) at the usual rate, and mix it to one channel, like the live
  // input is.
  const sound = await new OfflineAudioContext(1, 1, SAMPLE_RATE).decodeAudioData(await file.arrayBuffer());
  if (sound.duration > LONGEST_RECORDING) throw named('TooLongError', 'Recording is over 5 minutes');
  const samples = new Float32Array(sound.length);
  for (let c = 0; c < sound.numberOfChannels; c++) {
    const channel = sound.getChannelData(c);
    for (let i = 0; i < channel.length; i++) samples[i] += channel[i] / sound.numberOfChannels;
  }

  let PitchDetector;
  try {
    ({ PitchDetector } = await import(PITCHY_URL));
  } catch (err) {
    console.error(err);
    throw named('PitchyLoadError', "Couldn't load Pitchy");
  }
  const detector = PitchDetector.forFloat32Array(BUFFER_SIZE);
  const total = Math.max(1, Math.floor((samples.length - BUFFER_SIZE) / (sound.sampleRate / READINGS_PER_SECOND)) + 1);
  const readings = [];
  for (const reading of readingsFrom(samples, sound.sampleRate, (slice, rate) => detector.findPitch(slice, rate))) {
    readings.push(reading);
    if (readings.length % 600 === 0) { // every 10 seconds of sound, let the page show progress
      onProgress(readings.length / total);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
  return { ...notesFromReadings(readings), volumes: readings.map((reading) => reading[2]) };
}

function named(name, message) {
  const error = new Error(message);
  error.name = name;
  return error;
}
