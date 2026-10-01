// musicxml.js — reads sheet music saved as MusicXML (.musicxml, .xml, or the zipped .mxl that
// notation apps and Audiveris save), so Riff Boi can turn it into tab. Audiveris is a free app
// that reads a photo or scan of sheet music and saves it as MusicXML.
//
// It reads one melody: the first part, its first voice, one note at a time (for a chord, the
// first note written). Strings and frets are picked afterwards, like for any riff (tab.js).

import { METERS } from './rhythm.js';

const STEPS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const GUITAR_RANGE = [40, 88]; // the low E to the 24th fret of the high e

// Reads a MusicXML file (a File or Blob). Returns { title, bpm, meter, notes: [{ midi, beats }],
// skipped }, where `beats` is how long each note lasts (rests make the note before last longer)
// and `skipped` counts notes no guitar can play. bpm and meter are null if the file doesn't say.
export async function readMusicXml(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b; // "PK": a zipped .mxl
  const text = isZip ? await scoreFromZip(bytes) : new TextDecoder().decode(bytes);
  return melodyOf(parseXml(text));
}

// The melody from a parsed score (see parseXml).
export function melodyOf(root) {
  const score = root.find('score-partwise');
  if (!score) throw new Error('Not MusicXML (only "partwise" scores are read)');
  const part = score.find('part');
  if (!part) throw new Error('No music in this file');
  const partId = part.attrs.id;
  const partName = score.find('part-list')?.all('score-part').find((p) => p.attrs.id === partId)?.find('part-name')?.text ?? '';
  const title = (score.find('work')?.find('work-title')?.text || score.find('movement-title')?.text || '').trim();

  let divisions = 1;
  let octaveShift = 0;  // a clef or transposition saying the music sounds octaves away from where it's written
  let saidOctave = false;
  let bpm = null;
  let meter = null;
  const notes = [];     // { midi, beats }
  let tied = false;     // the last note continues into the next one
  for (const measure of part.all('measure')) {
    for (const el of measure.children) {
      if (el.name === 'attributes') {
        divisions = Number(el.find('divisions')?.text) || divisions;
        const time = el.find('time');
        if (time && !meter) meter = `${time.find('beats')?.text}/${time.find('beat-type')?.text}`;
        const change = el.find('clef')?.find('clef-octave-change') ?? el.find('transpose')?.find('octave-change');
        if (change) {
          octaveShift = Number(change.text) || 0;
          saidOctave = true;
        }
      } else if (el.name === 'direction' || el.name === 'sound') {
        const tempo = el.name === 'sound' ? el.attrs.tempo : el.find('sound')?.attrs.tempo ?? el.find('per-minute')?.text;
        if (bpm === null && Number(tempo) > 0) bpm = Number(tempo);
      } else if (el.name === 'note') {
        if (el.find('grace') || el.find('chord') || el.find('cue')) continue;
        const voice = el.find('voice')?.text;
        if (voice && voice !== '1') continue;
        const beats = (Number(el.find('duration')?.text) || 0) / divisions;
        const pitch = el.find('pitch');
        if (!pitch) {
          // A rest: the note before it rings on (Riff Boi's tab has no rests yet).
          if (notes.length) notes[notes.length - 1].beats += beats;
          tied = false;
          continue;
        }
        const midi = (Number(pitch.find('octave')?.text) + 1) * 12 + STEPS[pitch.find('step')?.text] + (Number(pitch.find('alter')?.text) || 0);
        const ties = el.all('tie').map((t) => t.attrs.type);
        if (tied && ties.includes('stop') && notes.length && notes[notes.length - 1].midi === midi) {
          notes[notes.length - 1].beats += beats; // the same note held on
        } else {
          notes.push({ midi, beats });
        }
        tied = ties.includes('start');
      }
    }
  }

  // Guitar music is written an octave higher than it sounds. Then move it by octaves into the
  // guitar's range if it's outside (like a flute melody that's written low).
  let shift = octaveShift * 12;
  if (!saidOctave && /guitar/i.test(partName)) shift -= 12;
  const low = () => Math.min(...notes.map((n) => n.midi)) + shift;
  const high = () => Math.max(...notes.map((n) => n.midi)) + shift;
  while (notes.length && low() < GUITAR_RANGE[0] && high() + 12 <= GUITAR_RANGE[1]) shift += 12;
  while (notes.length && high() > GUITAR_RANGE[1] && low() - 12 >= GUITAR_RANGE[0]) shift -= 12;
  const playable = notes.map((n) => ({ midi: n.midi + shift, beats: n.beats })).filter((n) => n.midi >= GUITAR_RANGE[0] && n.midi <= GUITAR_RANGE[1]);

  return { title, bpm, meter: METERS.includes(meter) ? meter : null, notes: playable, skipped: notes.length - playable.length };
}

// --- A small XML reader (MusicXML is plain, regular XML) ---

class XmlElement {
  constructor(name, attrs) {
    this.name = name;
    this.attrs = attrs;
    this.children = [];
    this.text = '';
  }
  // The first child element with this name, or undefined.
  find(name) {
    return this.children.find((child) => child.name === name);
  }
  // Every child element with this name.
  all(name) {
    return this.children.filter((child) => child.name === name);
  }
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const unescape = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) =>
  e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : ENTITIES[e] ?? m);

// Turns XML text into a tree of XmlElements under a root (whose children are the top elements).
export function parseXml(text) {
  const root = new XmlElement('#root', {});
  const stack = [root];
  const tag = /<!--[\s\S]*?-->|<!\[CDATA\[([\s\S]*?)\]\]>|<![^>]*>|<\?[\s\S]*?\?>|<\/([^\s>]+)\s*>|<([^\s/>]+)((?:\s+[^\s=/>]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
  let m;
  while ((m = tag.exec(text))) {
    const top = stack[stack.length - 1];
    if (m[1] !== undefined) top.text += m[1];
    else if (m[2]) {
      if (stack.length > 1) stack.pop();
    } else if (m[3]) {
      const attrs = {};
      for (const a of m[4].matchAll(/([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[a[1]] = unescape(a[2] ?? a[3]);
      const el = new XmlElement(m[3], attrs);
      top.children.push(el);
      if (!m[5]) stack.push(el);
    } else if (m[6]) top.text += unescape(m[6]).trim();
  }
  return root;
}

// --- Unzipping a .mxl (a zip with the score and a META-INF/container.xml pointing to it) ---

async function scoreFromZip(bytes) {
  const files = readZip(bytes);
  const container = files.get('META-INF/container.xml');
  let path = null;
  if (container) path = parseXml(new TextDecoder().decode(await unzipFile(container))).find('container')?.find('rootfiles')?.find('rootfile')?.attrs['full-path'];
  path ??= [...files.keys()].find((name) => !name.startsWith('META-INF/') && /\.(xml|musicxml)$/i.test(name));
  if (!path || !files.has(path)) throw new Error('No score in this .mxl file');
  return new TextDecoder().decode(await unzipFile(files.get(path)));
}

// The files in a zip: name → { method, data } (from its central directory).
function readZip(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = bytes.length - 22;
  while (end >= 0 && view.getUint32(end, true) !== 0x06054b50) end--;
  if (end < 0) throw new Error('Not a zip file');
  const count = view.getUint16(end + 10, true);
  let at = view.getUint32(end + 16, true);
  const files = new Map();
  for (let i = 0; i < count; i++) {
    const method = view.getUint16(at + 10, true);
    const size = view.getUint32(at + 20, true);
    const nameLength = view.getUint16(at + 28, true);
    const extra = view.getUint16(at + 30, true) + view.getUint16(at + 32, true);
    const local = view.getUint32(at + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(at + 46, at + 46 + nameLength));
    const dataStart = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
    files.set(name, { method, data: bytes.subarray(dataStart, dataStart + size) });
    at += 46 + nameLength + extra;
  }
  return files;
}

async function unzipFile({ method, data }) {
  if (method === 0) return data; // stored, not compressed
  if (method !== 8) throw new Error('Unknown zip compression');
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
