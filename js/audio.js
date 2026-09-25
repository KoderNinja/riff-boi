// audio.js — opens the microphone and asks Pitchy about the sound many times a second.

const PITCHY_URL = 'https://cdn.jsdelivr.net/npm/pitchy@4.1.0/+esm';
const BUFFER_SIZE = 2048; // how many sound samples Pitchy looks at each time

let audioContext = null;
let stream = null;
let loopId = null;

// Start listening. onReading(freq, clarity, volume) is called about 60 times a second.
export async function startListening(onReading) {
  // Create the audio context right away, while we're still inside the button tap
  // (browsers only allow sound to start from something the user did).
  audioContext = new AudioContext();

  // Ask for the mic. Turn off the "phone call" clean-up features:
  // they're made for voices and would mess with a guitar's sound.
  stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  });

  const { PitchDetector } = await import(PITCHY_URL);
  const detector = PitchDetector.forFloat32Array(BUFFER_SIZE);

  // Connect mic → analyser. The analyser lets us grab the latest slice of sound.
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = BUFFER_SIZE;
  source.connect(analyser);
  const samples = new Float32Array(BUFFER_SIZE);

  function tick() {
    analyser.getFloatTimeDomainData(samples);
    const [freq, clarity] = detector.findPitch(samples, audioContext.sampleRate);
    onReading(freq, clarity, getVolume(samples));
    loopId = requestAnimationFrame(tick); // run again on the next screen refresh (~60/s)
  }
  tick();
}

// Stop listening and release the microphone.
export function stopListening() {
  if (loopId !== null) cancelAnimationFrame(loopId);
  if (stream) stream.getTracks().forEach((track) => track.stop());
  if (audioContext) audioContext.close();
  loopId = null;
  stream = null;
  audioContext = null;
}

// Volume of a slice of sound (root mean square): 0 is silence, 1 is as loud as it gets.
function getVolume(samples) {
  let sum = 0;
  for (const s of samples) sum += s * s;
  return Math.sqrt(sum / samples.length);
}
