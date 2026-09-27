// camera.js — watches your fretting hand with the camera, so Riff Boi can tell which string you
// played (see neck.js). The hand tracking is Google's MediaPipe Hand Landmarker: it finds 21
// points on each hand, right in the browser. The video never leaves your device.

import { fingerFrets } from './neck.js';

const VISION_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const EVERY_MS = 50;           // look for the hand up to 20 times a second
const KEEP_MS = 2000;          // remember the last 2 seconds of hand positions
const TIPS = [8, 12, 16, 20];  // MediaPipe's points: index, middle, ring and pinky fingertips
const KNUCKLES = [5, 17];      // index and pinky knuckles

let landmarker = null;
let preparing = null;          // the promise while hand tracking loads
let stream = null;
let running = false;
let history = [];              // [{ at (performance.now() ms), hand }]

// Loads the hand tracking and warms it up. The very first look takes seconds (the graphics chip
// gets ready), and that would freeze listening, so this runs before recording starts (and in
// the background as soon as the Camera switch is on). Safe to call again.
export function prepareHandTracking() {
  preparing ??= (async () => {
    const { FilesetResolver, HandLandmarker } = await import(`${VISION_URL}/vision_bundle.mjs`);
    const files = await FilesetResolver.forVisionTasks(`${VISION_URL}/wasm`);
    const ready = await HandLandmarker.createFromOptions(files, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numHands: 2,
    });
    const blank = document.createElement('canvas');
    Object.assign(blank, { width: 64, height: 48 });
    blank.getContext('2d').fillRect(0, 0, 64, 48);
    ready.detectForVideo(blank, performance.now());
    landmarker = ready;
  })().catch((err) => {
    preparing = null; // try again next time
    throw err;
  });
  return preparing;
}

// Starts the camera in `video` and draws the hand on `canvas` (hand tracking must be ready, see
// prepareHandTracking). `onStatus(text)` gets short messages. Throws if there's no camera or it
// isn't allowed.
export async function startCamera(video, canvas, onStatus) {
  onStatus('Starting the camera…');
  stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
  video.srcObject = stream;
  await video.play();
  if (!stream) return; // stopped while starting
  running = true;
  history = [];
  onStatus('Looking for your fretting hand…');
  loop(video, canvas);
}

export function stopCamera(video) {
  running = false;
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
  if (video) video.srcObject = null;
  history = [];
}

// Where the fretting hand was at `at` (performance.now() ms): the latest look at or before it,
// if it's recent (a note is usually heard a moment after the finger is already down).
export function handAt(at) {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].at <= at) return at - history[i].at < 250 ? history[i].hand : null;
  }
  return null;
}

// The learned neck, to draw its frets on the video (set by app.js).
let neckToDraw = null;
export function showNeck(neck) {
  neckToDraw = neck;
}

function loop(video, canvas) {
  if (!running) return;
  const started = performance.now();
  let hands = null;
  if (video.readyState >= 2) {
    try {
      hands = landmarker.detectForVideo(video, started);
    } catch (err) {
      console.error(err);
    }
  }
  const hand = hands && frettingHand(hands, video);
  if (hand) history.push({ at: started, hand });
  while (history.length && started - history[0].at > KEEP_MS) history.shift();
  draw(canvas, video, hand);
  // Take a break of at least EVERY_MS, and longer if looking took long, so listening stays smooth.
  const took = performance.now() - started;
  setTimeout(() => loop(video, canvas), Math.max(EVERY_MS, took * 2));
}

// The fretting hand, in camera pixels. MediaPipe names hands as if the picture were mirrored, and
// the camera's picture isn't, so a right-handed player's fretting (left) hand comes out "Right".
function frettingHand({ landmarks, handedness }, video) {
  const i = handedness.findIndex((h) => h[0]?.categoryName === 'Right');
  if (i < 0) return null;
  const point = (p) => [landmarks[i][p].x * video.videoWidth, landmarks[i][p].y * video.videoHeight];
  return { tips: TIPS.map(point), knuckles: KNUCKLES.map(point) };
}

// The video with dots on the fingertips and knuckles, and the frets Riff Boi learned.
function draw(canvas, video, hand) {
  if (canvas.width !== video.videoWidth) Object.assign(canvas, { width: video.videoWidth, height: video.videoHeight });
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, canvas.width, canvas.height);
  if (!hand) return;
  g.fillStyle = '#f5363f';
  for (const [x, y] of [...hand.tips, ...hand.knuckles]) {
    g.beginPath();
    g.arc(x, y, 5, 0, Math.PI * 2);
    g.fill();
  }
  if (!neckToDraw) return;
  // Each fingertip's fret, next to it.
  g.fillStyle = '#ffffff';
  g.font = 'bold 18px sans-serif';
  fingerFrets(hand, neckToDraw).forEach((fret, f) => {
    const [x, y] = hand.tips[f];
    g.save();
    g.translate(x, y - 12);
    g.scale(-1, 1); // the video is shown mirrored, so un-mirror the numbers
    g.fillText(String(Math.round(fret)), -6, 0);
    g.restore();
  });
}
