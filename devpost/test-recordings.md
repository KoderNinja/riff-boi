# Test recordings to make

Two sets of recordings, so Claude can work on things Riff Boi can't do yet. Record them on my Mac in Chrome, with my guitar the way I normally play it.

## How to record each take

1. Open http://localhost:8000/?debug (the `?debug` matters).
2. Turn off Count-in and Auto detect tempo. Tempo doesn't matter.
3. Tap New Riff, play the take, tap Stop.
4. On the home screen, tap **Save last recording's readings** and **Save last recording's sound (WAV)**.
5. Rename the two downloaded files to the take's name (like `strings-A.json` and `strings-A.wav`), and write down exactly what I played in a `.txt` file with the same name, in the tab style below.

Pick each note clearly and let it ring about a second, unless the take says otherwise.

## Set 1: which string (the sound of each string)

The same 5 notes on 3 different strings, one take per string. Riff Boi will use these to see whether it can tell the strings apart by their sound.

| Take | What to play | Write down |
|---|---|---|
| `strings-E` | low E string, frets 12, 14, 15, 17, 19 | `E: 12 14 15 17 19` |
| `strings-A` | A string, frets 7, 9, 10, 12, 14 | `A: 7 9 10 12 14` |
| `strings-D` | D string, frets 2, 4, 5, 7, 9 | `D: 2 4 5 7 9` |

These are the same 5 notes (E3, F#3, G3, A3, B3) in all three takes.

## Set 2: hammer-ons, pull-offs and slides

On the G string. Play each take 4 times in a row, with a short pause between.

| Take | What to play | Write down (for one time) |
|---|---|---|
| `hammer` | pick fret 5, hammer on fret 7 | `G: 5h7` |
| `pulloff` | pick fret 7, pull off to fret 5 | `G: 7p5` |
| `slide-up` | pick fret 5, slide up to fret 7 | `G: 5/7` |
| `slide-down` | pick fret 7, slide down to fret 5 | `G: 7\5` |
| `picked` | pick fret 5, then pick fret 7 | `G: 5 7` |

The last one is the "no trick" version, so Riff Boi can learn the difference.

Then give Claude the files (put them in `tools/recordings/`), and it can test string detection and hammer-on, pull-off and slide detection on real playing.
