// recorder-worklet.js — only with ?debug: copies the raw sound coming in, so a recording can be
// saved as a WAV file (for testing, like telling strings apart by their sound). It runs on the
// browser's audio thread and sends the sound over in small pieces (128 samples each).
class Recorder extends AudioWorkletProcessor {
  process(inputs) {
    const sound = inputs[0]?.[0];
    if (sound) this.port.postMessage(sound.slice(0));
    return true; // keep going until listening stops
  }
}

registerProcessor('riffboi-recorder', Recorder);
