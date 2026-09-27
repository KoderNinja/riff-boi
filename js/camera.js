// camera.js — watches your fretting hand with the camera, so Riff Boi can tell which string you
// played (see neck.js). The hand tracking is Google's MediaPipe Hand Landmarker: it finds 21
// points on each hand, right in the browser. The video never leaves your device.

import { pickFrettingHand, fretLine } from './neck.js';

const EVERY_MS = 33;           // look for the hands up to 30 times a second
const KEEP_MS = 2000;          // remember the last 2 seconds of hand positions
const SMOOTH_MS = 100;         // a note's hand is the middle of the looks in the 100 ms before it
const TIPS = [8, 12, 16, 20];  // MediaPipe's points: index, middle, ring and pinky fingertips
const KNUCKLES = [5, 17];      // index and pinky knuckles
const DRAW_FRETS = 17;         // draw the frets up to this one
const NUMBERED = [3, 5, 7, 9, 12, 15, 17]; // and number the ones with dots on a guitar

// The hand tracking runs in a worker (hand-worker.js), in the background, so the page never
// waits for it and listening stays exactly as smooth with the camera on.
let worker = null;
let preparing = null;          // the promise while hand tracking loads
let ready = false;
let stream = null;
let starts = 0;                // goes up on every start and stop, so a start still opening knows to give up
let running = 0;               // which look loop is running (0 = none), so an old one stops
let history = [];              // [{ at (performance.now() ms), hand }]: the fretting hand
let neck = null;               // where the frets are in the picture (from the setup, see neck.js)
let view = null;               // { video, canvas } while the camera runs
let waiting = false;           // is a frame out with the worker?
let sentAt = 0;                // ...since when (if it never answers, send another after 1 s)

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

// Starts the camera in `video` and draws the hands on `canvas` (hand tracking must be ready, see
// prepareHandTracking). Returns false if it was stopped while starting. Throws if there's no
// camera or it isn't allowed.
export async function startCamera(video, canvas) {
  const mine = ++starts;
  // The whole picture (most webcams are 16:9): asking for 4:3 makes many of them cut off the
  // sides, which is right where your fretting hand is.
  const opened = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
  if (mine !== starts) {
    opened.getTracks().forEach((track) => track.stop()); // stopped while it opened
    return false;
  }
  stream = opened;
  video.srcObject = stream;
  try {
    await video.play();
  } catch (err) {
    if (mine === starts) throw err;
  }
  if (mine !== starts) return false;
  running = mine;
  history = [];
  view = { video, canvas };
  loop(mine);
  return true;
}

export function stopCamera(video) {
  starts++;
  running = 0;
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
  if (video) video.srcObject = null;
  view?.canvas.getContext('2d').clearRect(0, 0, view.canvas.width, view.canvas.height);
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

// Where the frets are in the picture (from the setup), or null: to pick out the fretting hand
// and draw the frets on the video (set by app.js).
export function setNeck(newNeck) {
  neck = newNeck;
}

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

// What the worker saw in a frame: every hand, turned into { tips, knuckles } in camera pixels.
function onHands({ at, landmarks }) {
  waiting = false;
  if (!view) return;
  const { videoWidth: width, videoHeight: height } = view.video;
  const hands = landmarks.map((points) => {
    const point = (p) => [points[p].x * width, points[p].y * height];
    return { tips: TIPS.map(point), knuckles: KNUCKLES.map(point) };
  });
  const hand = pickFrettingHand(hands, neck);
  if (hand) history.push({ at, hand });
  while (history.length && at - history[0].at > KEEP_MS) history.shift();
  draw(view.canvas, view.video, hands, hand);
}

// The video with the frets from the setup (white lines), and dots on the fingertips and
// knuckles: red for the fretting hand, gray for the other hand.
function draw(canvas, video, hands, fretting) {
  if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
    Object.assign(canvas, { width: video.videoWidth, height: video.videoHeight });
  }
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, canvas.width, canvas.height);
  const size = canvas.width / 100; // dots, lines and numbers grow with the picture
  if (neck) {
    g.strokeStyle = g.fillStyle = 'rgba(255, 255, 255, 0.85)';
    g.font = `bold ${Math.round(size * 1.8)}px sans-serif`;
    for (let fret = 0; fret <= DRAW_FRETS; fret++) {
      const [[x1, y1], [x2, y2]] = fretLine(fret, neck);
      g.lineWidth = size * (fret === 0 ? 0.6 : 0.25); // the nut is thicker
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.stroke();
      if (NUMBERED.includes(fret)) label(g, String(fret), x2 + (x2 - x1) * 0.3, y2 + (y2 - y1) * 0.3);
    }
  }
  for (const hand of hands) {
    g.fillStyle = hand === fretting ? '#f5363f' : 'rgba(210, 210, 210, 0.85)';
    for (const [x, y] of [...hand.tips, ...hand.knuckles]) {
      g.beginPath();
      g.arc(x, y, size * 0.8, 0, Math.PI * 2);
      g.fill();
    }
  }
}

// Text on the video, centered at (x, y). The video is shown mirrored, so flip the text back.
function label(g, text, x, y) {
  g.save();
  g.translate(x, y);
  g.scale(-1, 1);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 0, 0);
  g.restore();
}
