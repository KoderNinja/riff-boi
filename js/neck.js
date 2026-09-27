// neck.js — works out which fret your fretting hand is at, from the camera (see camera.js).
//
// The sound already says which note you played; the same note can be played on up to 5
// strings, about 5 frets apart. So Riff Boi only needs to know where your hand is ALONG the
// neck to pick the string. Nothing to set up: it learns where the frets are from the notes you
// play. Your knuckles line up with the neck (index finger toward the nut), the neck is about
// 8.6 times as long as your knuckles are wide, and the first few notes show where fret 0 is.

export const MIN_NOTES = 4;      // notes it needs before it trusts what it learned
const NECK_PER_HAND = 8.6;       // a 65 cm (25.5") neck ÷ about 7.5 cm across the knuckles
const CLOSE = 1.2;               // frets: a fingertip this close to a spot counts as playing it
const WORST = 2.5;               // frets: a miss counts as at most this much when learning
const OPEN_COST = 1.5;           // frets: how far a fingertip would be from an open string (any)

// The hand from the camera: { tips: [[x, y] × 4] (index to pinky), knuckles: [[x, y], [x, y]]
// (index and pinky) }, in camera pixels. Returns the direction along the neck (toward the
// body, the pinky side), how wide the knuckles are, and where each fingertip is along it.
export function handLine(hand) {
  const [index, pinky] = hand.knuckles;
  const span = Math.hypot(pinky[0] - index[0], pinky[1] - index[1]);
  const u = span > 0 ? [(pinky[0] - index[0]) / span, (pinky[1] - index[1]) / span] : [1, 0];
  return { u, span, along: hand.tips.map(([x, y]) => x * u[0] + y * u[1]) };
}

// Fret number (with decimals) at a distance along the neck, with fret 0 at `nut` and the whole
// neck (nut to bridge) `length` long: frets get closer together by 2^(1/12) each (so fret 12 is
// halfway). Before the nut is 0; near the bridge it stops at 24.
export function fretAt(distance, nut, length) {
  const part = (distance - nut) / length;
  if (part <= 0) return 0;
  return Math.min(24, -12 * Math.log2(1 - Math.min(part, 0.9375)));
}

// Where fret `fret` is along the neck.
function distanceOf(fret, nut, length) {
  return nut + length * (1 - 2 ** (-fret / 12));
}

// notes: [{ hand, spots: [{ string, fret }] }], the places each note could have been played.
// Returns the neck { u, nut, length, notes } or null if there's not enough to go on yet.
// Tries every "fingertip f played spot c" for fret 0, and keeps the one that fits the most
// notes best (each note counts its closest fingertip to its closest spot, up to WORST frets).
export function learnNeck(notes) {
  const seen = notes.filter((n) => n.hand && n.spots.some((s) => s.fret > 0));
  if (seen.length < MIN_NOTES) return null;
  // One direction for everything: the average of the knuckle lines, and a length from the
  // typical knuckle width.
  const lines = seen.map((n) => handLine(n.hand));
  let ux = 0, uy = 0;
  lines.forEach((l) => { ux += l.u[0]; uy += l.u[1]; });
  const norm = Math.hypot(ux, uy) || 1;
  const u = [ux / norm, uy / norm];
  const spans = lines.map((l) => l.span).sort((a, b) => a - b);
  const length = NECK_PER_HAND * spans[Math.floor(spans.length / 2)];
  const along = seen.map((n) => n.hand.tips.map(([x, y]) => x * u[0] + y * u[1]));
  const miss = (i, nut) => {
    let best = WORST;
    for (const d of along[i]) {
      const fret = fretAt(d, nut, length);
      for (const s of seen[i].spots) if (s.fret > 0) best = Math.min(best, Math.abs(fret - s.fret));
    }
    return best;
  };
  let best = null;
  seen.forEach((note, i) => along[i].forEach((d) => note.spots.forEach((s) => {
    if (s.fret === 0) return;
    const nut = d - (distanceOf(s.fret, 0, length));
    let total = 0;
    for (let j = 0; j < seen.length; j++) total += miss(j, nut);
    if (!best || total < best.total) best = { total, nut };
  })));
  return { u, nut: best.nut, length, notes: seen.length, fit: best.total / seen.length };
}

// The fret each fingertip of this hand is at, on the learned neck.
export function fingerFrets(hand, neck) {
  return hand.tips.map(([x, y]) => fretAt(x * neck.u[0] + y * neck.u[1], neck.nut, neck.length));
}

// Which of the spots a note could be played at fits the hand best: the one closest to a
// fingertip (an open string can be played with the hand anywhere, so it counts as OPEN_COST).
// Returns null if none is close to a fingertip, so the usual rule decides.
export function spotForHand(hand, spots, neck) {
  const frets = fingerFrets(hand, neck);
  let best = null;
  for (const spot of spots) {
    const cost = spot.fret === 0 ? OPEN_COST : Math.min(...frets.map((f) => Math.abs(f - spot.fret)));
    if (!best || cost < best.cost) best = { spot, cost };
  }
  return best && best.cost <= CLOSE ? best.spot : null;
}
