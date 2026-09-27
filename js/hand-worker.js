// hand-worker.js — runs the hand tracking (MediaPipe) in the background, off the page, so the
// page can keep listening to your guitar without waiting for it. camera.js sends it camera
// frames and gets back where the hands are.

import { FilesetResolver, HandLandmarker } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/vision_bundle.mjs';

const VISION_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

let landmarker = null;

async function load() {
  const files = await FilesetResolver.forVisionTasks(`${VISION_URL}/wasm`, true); // true: the module version, for a worker
  const options = (delegate) => ({ baseOptions: { modelAssetPath: MODEL_URL, delegate }, runningMode: 'VIDEO', numHands: 2 });
  try {
    landmarker = await HandLandmarker.createFromOptions(files, options('GPU'));
  } catch {
    landmarker = await HandLandmarker.createFromOptions(files, options('CPU')); // no graphics chip here: slower, but works
  }
  // The first look takes seconds (getting ready), so do it now, on a blank picture.
  const blank = new OffscreenCanvas(64, 48);
  blank.getContext('2d').fillRect(0, 0, 64, 48);
  landmarker.detectForVideo(blank, performance.now());
}

self.onmessage = async ({ data }) => {
  if (data.type === 'load') {
    try {
      await load();
      self.postMessage({ type: 'ready' });
    } catch (err) {
      self.postMessage({ type: 'failed', message: String(err) });
    }
  } else if (data.type === 'look') {
    const started = performance.now();
    const { landmarks, handedness } = landmarker.detectForVideo(data.frame, data.at);
    data.frame.close();
    self.postMessage({ type: 'hands', at: data.at, landmarks, handedness, took: performance.now() - started });
  }
};
