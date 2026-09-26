// confidence.js — how sure is Riff Boi about a riff's notes?
//
// It can only judge the SOUND (it can't know whether a string guess is right), using:
// - tone:       how clear Pitchy found each note (clarity)
// - tuning:     how close each note was to the exact pitch (cents, like the tuner)
// - noise:      how loud the quiet moments were compared with the notes (background noise)
// - steadiness: how often the note's first readings were really that note
// Each part is 0 (bad) to 1 (good). Notes Riff Boi had to correct count against it.

import { median } from './notes.js';

// What counts as bad → good for each part (tuned on the learner's recordings).
const CLARITY_RANGE = [0.8, 0.97];     // average clarity of a note's readings
const CENTS_RANGE = [35, 10];          // average distance from the exact pitch (lower is better)
const NOISE_RANGE_DB = [12, 30];       // how much louder the notes are than the quiet moments
const STEADY_RANGE = [0.2, 0.75];      // share of a note's first readings that were that note
const WEIGHTS = { tone: 0.35, steadiness: 0.25, tuning: 0.2, noise: 0.2 };
const FIX_PENALTY = 0.3;               // lose up to 30% if every note had to be corrected

const HINTS = {
  tone: 'Pitch is unclear. Try less distortion or your audio interface',
  tuning: 'Guitar may be out of tune. Try the tuner',
  noise: 'Lots of background noise',
  steadiness: 'Notes are hard to follow. Pick each note clearly',
};

// 0 at `bad`, 1 at `good`, in between on a straight line.
function scale(value, [bad, good]) {
  return Math.min(1, Math.max(0, (value - bad) / (good - bad)));
}

const average = (values) => values.reduce((sum, v) => sum + v, 0) / values.length;

// notes: the riff's notes (with .quality from the tracker); volumes: every reading's volume.
// Returns { score, tone, tuning, noise, steadiness, hint } (all 0..1), or null with no notes.
export function riffConfidence(notes, volumes) {
  const measured = notes.filter((n) => n.quality && n.quality.matched > 0);
  if (measured.length === 0) return null;

  const tone = average(measured.map((n) => scale(n.quality.claritySum / n.quality.matched, CLARITY_RANGE)));
  const tuning = average(measured.map((n) => scale(n.quality.centsSum / n.quality.matched, CENTS_RANGE)));
  const steadiness = average(measured.map((n) => scale(n.quality.matched / n.quality.heard, STEADY_RANGE)));

  // Background noise: the quietest moments (10th percentile) vs the typical note's loudness.
  const sorted = [...volumes].sort((a, b) => a - b);
  const floor = Math.max(sorted[Math.floor(sorted.length * 0.1)] ?? 0, 0.0001);
  const signal = median(measured.map((n) => n.peak));
  const noise = scale(20 * Math.log10(signal / floor), NOISE_RANGE_DB);

  const parts = { tone, tuning, noise, steadiness };
  const fixedShare = measured.filter((n) => n.fixed).length / measured.length;
  const weighted = Object.entries(WEIGHTS).reduce((sum, [part, w]) => sum + w * parts[part], 0);
  const score = weighted * (1 - FIX_PENALTY * fixedShare);

  // The hint names the weakest part, if it's weak enough to matter.
  const [weakest, value] = Object.entries(parts).sort((a, b) => a[1] - b[1])[0];
  const hint = value < 0.7 ? HINTS[weakest] : 'Sounds clean';
  return { score, ...parts, hint };
}
