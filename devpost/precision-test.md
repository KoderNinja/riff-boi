---
doc: precision-test
---

# Precision test (slice 7)

My question from the start was "how precise will the app be?" This test answers it with real numbers for the demo: I play one riff I know 3 ways, and the scoreboard counts the right, missed and extra notes, and the right strings.

## What to play

The first 8 notes of Crazy Train, on the low E and A strings:

```
E: 2 2 A: 4 E: 2 A: 5 E: 2 A: 4 E: 2
```

That's the answer key: what I really play, as string and fret. (Any riff of 8 to 12 single notes works. Just write its answer key the same way first. Bends are written like `G: 7b9r7`.)

## Steps

1. Tune up with the Tuner.
2. Open http://localhost:8000/?debug on my Mac (with the server running), or https://riffboi.com/?debug. Set the tempo to the one I'm playing at.
3. Tap New Riff, play the riff once, and tap Stop.
4. On the home screen, tap "Save last recording's readings". It saves `riffboi-readings.json` in Downloads.
5. Rename it for the take (like `precision-slow-clean.json`) and move it into `tools/recordings/`. Next to it, save the answer key in a text file with the same name (`precision-slow-clean.txt`).
6. Do the other takes the same way (below).
7. Run `node tools/score.mjs`. Every take gets a line: notes played, correct, wrong, missed, extra, right string, accuracy and confidence.
8. Fill in the table and write what I learned in `devpost/learning-log.md`, in my own words.
9. Then Claude can tune the detection numbers with these recordings. The scoreboard makes sure the old recordings don't get worse.

## Takes

| Take | Setup | Tempo | Correct | Missed | Extra | Right string | Confidence |
|---|---|---|---|---|---|---|---|
| `precision-slow-clean` | audio interface, clean tone | slow | | | | | |
| `precision-fast-clean` | audio interface, clean tone | fast | | | | | |
| `precision-distorted` | audio interface, distortion | my normal speed | | | | | |
| `precision-iphone` (bonus) | iPhone mic, amp in the room | my normal speed | | | | | |
