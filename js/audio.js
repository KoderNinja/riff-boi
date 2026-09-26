// audio.js — opens the microphone and asks Pitchy about the sound many times a second.

export const PITCHY_URL = 'https://cdn.jsdelivr.net/npm/pitchy@4.1.0/+esm';
export const BUFFER_SIZE = 2048; // how many sound samples Pitchy looks at each time
// notes.js counts readings ("hold for 7 readings"), so readings must come at a steady rate.
// A fixed timer does that on any screen (60 Hz, 120 Hz, battery saver...).
export const READINGS_PER_SECOND = 60;
// Turn off the "phone call" clean-up features when opening the mic:
// they're made for voices and would mess with a guitar's sound.
const GUITAR_SOUND = { echoCancellation: false, noiseSuppression: false, autoGainControl: false };

let audioContext = null;
let stream = null;
let loopId = null;
let session = 0; // goes up every time listening stops, so a start that's still loading knows to give up

// Start listening to an input: its id from listInputs(), or '' for the default input.
// onReading(freq, clarity, volume) is called 60 times a second.
// `keepSound` (only with ?debug) also keeps the raw sound, for recordedSound().
export async function startListening(onReading, deviceId = '', { keepSound = false } = {}) {
  const mySession = ++session;
  // Create the audio context right away, while we're still inside the button tap
  // (browsers only allow sound to start from something the user did). iPhones often
  // start it paused anyway, so ask it to start now, while it's still the tap.
  audioContext = new AudioContext();
  wake(audioContext);

  const micStream = await openInput(deviceId);
  // Stop was tapped while we waited (e.g. during the permission prompt)? Let the mic go.
  if (mySession !== session) {
    micStream.getTracks().forEach((track) => track.stop());
    return;
  }
  stream = micStream;

  let PitchDetector;
  try {
    ({ PitchDetector } = await import(PITCHY_URL));
  } catch (err) {
    // No internet, or the network blocks the CDN. Let the mic go and tell app.js,
    // which shows its own message for this.
    console.error(err);
    if (mySession !== session) return; // Stop was tapped while it loaded: a newer start may be running, leave it alone
    stopListening();
    const error = new Error("Couldn't load Pitchy");
    error.name = 'PitchyLoadError';
    throw error;
  }
  if (mySession !== session) return; // stopped while Pitchy was loading
  const detector = PitchDetector.forFloat32Array(BUFFER_SIZE);

  // Ask again now that the mic is open (an open mic lets it start without a tap), and every
  // time the phone pauses it (a call, Siri, another app). While it's paused, Pitchy only
  // gets silence, so no notes show up.
  audioContext.addEventListener('statechange', (event) => wake(event.target));
  wake(audioContext);

  // Connect mic → analyser. The analyser lets us grab the latest slice of sound.
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = BUFFER_SIZE;
  source.connect(analyser);
  if (keepSound) keepTheSound(source);
  const samples = new Float32Array(BUFFER_SIZE);

  function tick() {
    analyser.getFloatTimeDomainData(samples);
    const [freq, clarity] = detector.findPitch(samples, audioContext.sampleRate);
    onReading(freq, clarity, getVolume(samples));
  }
  loopId = setInterval(tick, 1000 / READINGS_PER_SECOND);
}

// Stop listening and release the microphone.
// --- Keeping the raw sound (only with ?debug) ---

let sound = { pieces: [], sampleRate: 48000 };

// Copy the input's raw sound while listening (see recorder-worklet.js). If this browser can't,
// nothing else changes: the notes work as always.
async function keepTheSound(source) {
  sound = { pieces: [], sampleRate: source.context.sampleRate };
  try {
    await source.context.audioWorklet.addModule(new URL('./recorder-worklet.js', import.meta.url));
    const recorder = new AudioWorkletNode(source.context, 'riffboi-recorder');
    recorder.port.onmessage = (event) => sound.pieces.push(event.data);
    source.connect(recorder);
    recorder.connect(source.context.destination); // it only sends silence; connected, it keeps running
  } catch (err) {
    console.error(err);
  }
}

// The raw sound of the last recording (with keepSound): { samples, sampleRate }.
export function recordedSound() {
  const samples = new Float32Array(sound.pieces.reduce((sum, piece) => sum + piece.length, 0));
  let at = 0;
  for (const piece of sound.pieces) {
    samples.set(piece, at);
    at += piece.length;
  }
  return { samples, sampleRate: sound.sampleRate };
}

export function stopListening() {
  session++;
  if (loopId !== null) clearInterval(loopId);
  if (stream) stream.getTracks().forEach((track) => track.stop());
  if (audioContext && audioContext.state !== 'closed') audioContext.close();
  loopId = null;
  stream = null;
  audioContext = null;
}

// Start an audio context that's paused ("suspended", or "interrupted" on iPhones).
// A closed one stays closed.
function wake(context) {
  if (context.state !== 'running' && context.state !== 'closed') context.resume().catch(() => {});
}

// For ?debug: is the sound running, and what did the mic really give us? Phones can
// quietly ignore the settings in GUITAR_SOUND, so this shows the ones they actually used.
export function soundInfo() {
  const track = stream?.getAudioTracks()[0];
  const settings = track?.getSettings ? track.getSettings() : {};
  return {
    state: audioContext?.state ?? 'off',
    sampleRate: audioContext?.sampleRate ?? 0,
    mic: !track ? 'off' : track.muted ? 'muted' : track.readyState, // 'live' or 'ended'
    echoCancellation: settings.echoCancellation,
    noiseSuppression: settings.noiseSuppression,
    autoGainControl: settings.autoGainControl,
  };
}

// Open the input you picked. If it's gone (like an unplugged interface), open the default input.
export async function openInput(deviceId) {
  if (deviceId) {
    try {
      return await navigator.mediaDevices.getUserMedia({ audio: { ...GUITAR_SOUND, deviceId: { exact: deviceId } } });
    } catch (err) {
      // Only "that input isn't there" falls back. Anything else, like a blocked mic,
      // is a real problem that app.js tells you about.
      if (err.name !== 'OverconstrainedError' && err.name !== 'NotFoundError') throw err;
    }
  }
  return navigator.mediaDevices.getUserMedia({ audio: GUITAR_SOUND });
}

// The inputs you can pick from, like "MacBook Air Microphone" or "Scarlett 2i2".
// Browsers keep the names secret until you've allowed the mic once, so before that
// this list is empty and the picker only shows "Default input".
export async function listInputs() {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices
    // Chrome also lists "Default" and "Communications" copies of real inputs: skip those.
    .filter((d) => d.kind === 'audioinput' && d.label && !['', 'default', 'communications'].includes(d.deviceId))
    .map((d) => ({ id: d.deviceId, name: d.label }));
}

// Call onChange when an input is plugged in or unplugged.
export function onInputsChange(onChange) {
  navigator.mediaDevices?.addEventListener('devicechange', onChange);
}

// Volume of a slice of sound (root mean square): 0 is silence, 1 is as loud as it gets.
export function getVolume(samples) {
  let sum = 0;
  for (const s of samples) sum += s * s;
  return Math.sqrt(sum / samples.length);
}
