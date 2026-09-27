// sounds.js — keeps the real sound of each riff (your recording, or the file you uploaded), so
// you can hear how you actually played it. Sound is too big for localStorage, so it goes in the
// browser's IndexedDB instead, under the riff's id. It never leaves your device.

const DB_NAME = 'riffboi';
const STORE = 'sounds';

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Do one thing with the store and resolve with its result once it's really saved.
async function withStore(mode, action) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const done = db.transaction(STORE, mode);
    const request = action(done.objectStore(STORE));
    done.oncomplete = () => {
      db.close();
      resolve(request.result);
    };
    done.onerror = done.onabort = () => {
      db.close();
      reject(done.error);
    };
  });
}

export const saveSound = (id, blob) => withStore('readwrite', (store) => store.put(blob, id));
export const loadSound = (id) => withStore('readonly', (store) => store.get(id));
export const deleteSound = (id) => withStore('readwrite', (store) => store.delete(id));
export const deleteAllSounds = () => withStore('readwrite', (store) => store.clear());

// The file ending for a sound's type, for downloading it: "audio/webm;codecs=opus" → "webm".
export function soundExtension(type = '') {
  const kind = type.split(';')[0].trim().toLowerCase();
  return { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/aac': 'm4a', 'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/wave': 'wav' }[kind] ?? 'webm';
}
