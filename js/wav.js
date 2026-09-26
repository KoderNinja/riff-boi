// wav.js — turns raw sound (numbers from -1 to 1) into a WAV file: 16-bit, one channel.

export function wavFile(samples, sampleRate) {
  const bytes = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(bytes);
  const text = (at, s) => [...s].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  text(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true); // the size of everything after this
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true);             // the format part is 16 bytes long
  view.setUint16(20, 1, true);              // plain samples (PCM)
  view.setUint16(22, 1, true);              // one channel
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // bytes per second
  view.setUint16(32, 2, true);              // bytes per sample
  view.setUint16(34, 16, true);             // bits per sample
  text(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  samples.forEach((x, i) => {
    const clipped = Math.max(-1, Math.min(1, x)); // louder than full volume can't be stored
    view.setInt16(44 + i * 2, clipped < 0 ? clipped * 32768 : Math.round(clipped * 32767), true);
  });
  return bytes;
}
