// neck.js — works out which fret your fretting hand is at, from the camera (see camera.js).
//
// The sound already says which note you played, and the same note can be played on up to 5
// strings, about 5 frets apart. So Riff Boi only needs to know where your hand is ALONG the
// neck to pick the string. A quick setup shows it where the frets are in the picture: you play
// the 3rd fret and then the 12th fret on the low E with your first finger, and it measures from
// where your fingertip was. Frets get closer together up the neck by the same rule on every
// guitar, so those two are enough to find all the others.
//
// A hand from the camera is { tips: [[x, y] × 4] (index to pinky), knuckles: [[x, y], [x, y]]
// (index and pinky) }, in camera pixels.

export const SETUP_FRETS = [3, 12]; // the two frets the setup asks for, on the low E
const MOVED = [1.2, 5];             // knuckle widths the hand should move between them (about 3)
const SAME_WAY = 0.3;               // the knuckles (index → pinky) point along that move, toward the body
const ON_NECK = 1.5;                // knuckle widths: how far from the low E string the fingertips can be
const LAST_FRET = 22;               // a hand past this is over the body: that's the picking hand
const CLOSE = 2;                    // frets: a spot this close to a fingertip can be the one played,
const CLEARLY = 1;                  // if it's this much closer than the next best spot
const OPEN_COST = 1.5;              // frets: how far a fingertip counts as from an open string (any)

const dot = (a, b) => a[0] * b[0] + a[1] * b[1];

// How wide the knuckles are, and which way they point (index → pinky: along the neck, toward the body).
export function handLine(hand) {
  const [index, pinky] = hand.knuckles;
  const span = Math.hypot(pinky[0] - index[0], pinky[1] - index[1]);
  return { span, u: span > 0 ? [(pinky[0] - index[0]) / span, (pinky[1] - index[1]) / span] : [1, 0] };
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

// The neck from the setup: the hand with its index fingertip on the low E at the 3rd fret, then
// at the 12th. Returns { u (along the neck, toward the body), nut, length, start (a point on the
// low E string), span (knuckle width) }, or null if it doesn't look right: the hand hardly moved
// (or jumped too far), or went the wrong way. Then the camera probably followed the other hand.
export function neckFromSetup(first, second) {
  const [a, b] = [first.tips[0], second.tips[0]];
  const apart = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const span = (handLine(first).span + handLine(second).span) / 2;
  if (!(span > 0 && apart >= MOVED[0] * span && apart <= MOVED[1] * span)) return null;
  const u = [(b[0] - a[0]) / apart, (b[1] - a[1]) / apart];
  if (dot(u, handLine(first).u) + dot(u, handLine(second).u) < 2 * SAME_WAY) return null;
  const [low, high] = SETUP_FRETS;
  const length = apart / (2 ** (-low / 12) - 2 ** (-high / 12));
  return { u, nut: dot(a, u) - length * (1 - 2 ** (-low / 12)), length, start: a, span };
}

// Where a hand is on the neck, from the middle of its fingertips: how far along it (0 = the nut,
// 1 = the bridge) and how far from the low E string (in knuckle widths).
function placeOnNeck(hand, neck) {
  const middle = [0, 1].map((xy) => hand.tips.reduce((sum, tip) => sum + tip[xy], 0) / hand.tips.length);
  return {
    along: (dot(middle, neck.u) - neck.nut) / neck.length,
    across: Math.abs((middle[0] - neck.start[0]) * neck.u[1] - (middle[1] - neck.start[1]) * neck.u[0]) / neck.span,
  };
}

// Which of the hands the camera sees is the fretting hand, or null.
// Once the neck is set up: the hand with its fingertips on the neck (the one nearest the nut, if
// both are). Before that, with two hands: the fretting hand's knuckles point along the neck
// toward the body, where the picking hand is, so it's the one pointing at the other hand. Either
// way it works for left-handed players too.
export function pickFrettingHand(hands, neck = null) {
  if (neck) {
    const onNeck = hands
      .map((hand) => ({ hand, ...placeOnNeck(hand, neck) }))
      .filter(({ along, across }) => along > 1 - 2 ** (1 / 12) && along < 1 - 2 ** (-LAST_FRET / 12) && across <= ON_NECK);
    return onNeck.sort((a, b) => a.along - b.along)[0]?.hand ?? null;
  }
  if (hands.length < 2) return hands[0] ?? null;
  const middle = (hand) => [0, 1].map((xy) => (hand.knuckles[0][xy] + hand.knuckles[1][xy]) / 2);
  const toward = (hand, other) => {
    const [from, to] = [middle(hand), middle(other)];
    return dot([to[0] - from[0], to[1] - from[1]], handLine(hand).u);
  };
  return toward(hands[0], hands[1]) >= toward(hands[1], hands[0]) ? hands[0] : hands[1];
}

// The fret each fingertip of this hand is at, on the neck.
export function fingerFrets(hand, neck) {
  return hand.tips.map((tip) => fretAt(dot(tip, neck.u), neck.nut, neck.length));
}

// Which of the spots a note could be played at fits the hand: the one nearest a fingertip, if
// it's close and clearly nearer than the others (an open string can be played with the hand
// anywhere, so it counts as OPEN_COST away). Otherwise null, and the usual rule decides.
export function spotForHand(hand, spots, neck) {
  if (spots.length < 2) return null; // only one way to play it: nothing to choose
  const frets = fingerFrets(hand, neck);
  const [best, next] = spots
    .map((spot) => ({ spot, cost: spot.fret === 0 ? OPEN_COST : Math.min(...frets.map((fret) => Math.abs(fret - spot.fret))) }))
    .sort((a, b) => a.cost - b.cost);
  return best.cost <= CLOSE && next.cost - best.cost >= CLEARLY ? best.spot : null;
}

// Where to draw fret `fret` on the camera picture: a short line across the neck, from just above
// the low E string to past the high e. [[x, y], [x, y]].
export function fretLine(fret, neck) {
  const { u, start, span } = neck;
  const shift = distanceOf(fret, neck.nut, neck.length) - dot(start, u);
  const at = [start[0] + shift * u[0], start[1] + shift * u[1]];
  const down = u[0] >= 0 ? [-u[1], u[0]] : [u[1], -u[0]]; // across the neck, toward the high e (lower down)
  return [-0.2, 0.8].map((k) => [at[0] + k * span * down[0], at[1] + k * span * down[1]]);
}
