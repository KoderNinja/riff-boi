# Which string did I play? (research notes)

The sound tells Riff Boi which note I played, but the same note can be played on up to 5 strings. Right now it picks the spot that needs the least hand movement (`placeNotes` in `tab.js`). On my labeled recordings that's right every time (84 of 84 notes, including the pentatonic box and a fret run on every string), and a wrong guess can be fixed by dragging the note to another string.

These are the ways to do better, from what's doable soon to what's a big project.

## 1. The hand-movement rule (what Riff Boi does now)

- **How:** imagine the fretting hand covering 4 frets; moving it costs more than staying put, and jumping across strings costs a little.
- **Good at:** scales, boxes, riffs played in one position.
- **Bad at:** when I choose a spot for the sound (like playing a note higher up on a thicker string for a fatter tone), or slide up one string.
- **To make it better:** more recordings where I write down the strings, so we can see where it guesses wrong.

## 2. The sound of the string (timbre)

The same note sounds a bit different on each string: a thicker string is stiffer, so its overtones sit slightly sharp of where they "should" be (this is called inharmonicity), and the tone is darker higher up the neck. Research on clean guitar recordings has used this to tell strings apart.

- **What it needs:** the raw sound of each note, not just the pitch readings Riff Boi saves now. Then for each note, measure how sharp its overtones are and compare with what each string does.
- **Calibration:** every guitar and set of strings is different, so I'd play each open string (or a few notes on each string) once to teach it my guitar. That's idea 13 in the to-do list ("calibrate to my rig").
- **The catch:** distortion adds its own overtones and smears them, so this works best on a clean or lightly driven sound. It would need testing on my real sound.
- **First step:** record the same notes on different strings with the raw sound saved (`?debug` can now save a WAV file), then check whether the numbers really separate the strings.

## 3. Watching my hand (camera)

A phone or laptop camera and hand tracking in the browser (like Google's MediaPipe) could see where my fretting hand is. Frets are easy to see, but telling strings apart from the camera angle is hard, and the camera has to see the neck the whole time. A big project for after the hackathon.

## 4. Me telling it

Already there: drag a note to another string on a saved riff, and it stays the same note.

## What I'd do next

1. Record a few test takes with `?debug` and save the sound: the same 5 or 6 notes played on 3 different strings, with the strings written down.
2. Check whether the overtone numbers (inharmonicity) tell the strings apart on my guitar and amp.
3. If they do, use them to break ties that the hand-movement rule isn't sure about.
