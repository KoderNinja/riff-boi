// camera.js — watches your fretting hand with the camera, so Riff Boi can tell which string you
// played (see neck.js). The hand tracking is Google's MediaPipe Hand Landmarker: it finds 21
// points on each hand, right in the browser. The video never leaves your device.

import { fingerFrets } from './neck.js';

const EVERY_MS = 33;           // look for the hand up to 30 times a second
const KEEP_MS = 2000;          // remember the last 2 seconds of hand positions
const SMOOTH_MS = 100;         // a note's hand is the middle of the looks in the 100 ms before it
const TIPS = [8, 12, 16, 20];  // MediaPipe's points: index, middle, ring and pinky fingertips
const KNUCKLES = [5, 17];      // index and pinky knuckles

// The hand tracking runs in a worker (hand-worker.js), in the background, so the page never
// waits for it and listening stays exactly as smooth with the camera on.
let worker = null;
let preparing = null;          // the promise while hand tracking loads
let ready = false;
let stream = null;
let running = 0;               // which look loop is running (0 = none), so an old one stops
let history = [];              // [{ at (performance.now() ms), hand }]

// Loads the hand tracking in the worker and warms it up (the very first look takes a moment).
// Safe to call again.
export function prepareHandTracking() {
  preparing ??= new Promise((resolve, reject) => {
    worker = new Worker(new URL('./hand-worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => {
      if (data.type === 'ready') {
        ready = true;
        resolve();
      } else if (data.type === 'failed') {
        reject(new Error(data.message));
      } else if (data.type === 'hands') {
        onHands(data);
      }
    };
    worker.onerror = (event) => reject(new Error(event.message));
    worker.postMessage({ type: 'load' });
  }).catch((err) => {
    worker?.terminate();
    worker = null;
    preparing = null; // try again next time
    throw err;
  });
  return preparing;
}

// Is hand tracking loaded and warmed up?
export function handTrackingReady() {
  return ready;
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
  running++;
  history = [];
  view = { video, canvas };
  onStatus('Looking for your fretting hand…');
  loop(running);
}

export function stopCamera(video) {
  running = 0;
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
  if (video) video.srcObject = null;
  history = [];
  view = null;
}

// Where the fretting hand was at `at` (performance.now() ms): the middle of the looks in the
// 100 ms before it (a note is heard a moment after the finger is already down), which evens out
// the little jumps in the tracking. null if the camera didn't see the hand then.
export function handAt(at) {
  const looks = history.filter((look) => look.at <= at && at - look.at <= SMOOTH_MS + 150).slice(-Math.ceil(SMOOTH_MS / EVERY_MS));
  if (looks.length === 0) return null;
  const middle = (values) => values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
  const point = (key, i) => [0, 1].map((xy) => middle(looks.map((look) => look.hand[key][i][xy])));
  return { tips: TIPS.map((_, i) => point('tips', i)), knuckles: KNUCKLES.map((_, i) => point('knuckles', i)) };
}

// The learned neck, to draw its frets on the video (set by app.js).
let neckToDraw = null;
export function showNeck(neck) {
  neckToDraw = neck;
}

let view = null;               // { video, canvas } while the camera runs
let waiting = false;           // is a frame out with the worker?
let sentAt = 0;                // ...since when (if it never answers, send another after 1 s)

// Send the worker a frame whenever it's free (at most every EVERY_MS).
async function loop(mine) {
  if (running !== mine) return; // stopped, or a newer loop took over
  if (waiting && performance.now() - sentAt > 1000) waiting = false;
  if (!waiting && view.video.readyState >= 2) {
    try {
      const at = performance.now();
      const frame = await createImageBitmap(view.video);
      waiting = true;
      sentAt = performance.now();
      worker.postMessage({ type: 'look', frame, at, width: view.video.videoWidth, height: view.video.videoHeight }, [frame]);
    } catch (err) {
      console.error(err);
    }
  }
  setTimeout(() => loop(mine), EVERY_MS);
}

// What the worker saw in a frame.
function onHands({ at, landmarks, handedness }) {
  waiting = false;
  if (!view) return;
  const hand = frettingHand({ landmarks, handedness }, view.video);
  if (hand) history.push({ at, hand });
  while (history.length && at - history[0].at > KEEP_MS) history.shift();
  draw(view.canvas, view.video, hand);
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
