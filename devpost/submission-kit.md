# Submission kit (for Wednesday)

Helpers for the Devpost page and the video. The words on Devpost and in the video are mine; this is just the checklist, the facts and the outline.

## Screenshots (`devpost/screenshots/`)
Taken from riffboi.com on Sep 26 (3:2 for the gallery, plus a phone one). I can take my own too.
- `home.png`: the home screen
- `riff-bend.png`: RIFFTEST as a saved riff (rhythm, tempo, the buttons)
- `riff-rhythm.png`: a pentatonic run with rhythm
- `phone-riff.png`: RIFFTEST on a phone

## Built with (Devpost tags)
javascript, html5, css3, web-audio-api, pitchy, mediapipe, localstorage, vercel, github, node.js (only for the tests)

## Video outline (3 to 5 minutes)
Headings and what to show. The words are mine.
1. **Hook and the problem** (about 20 s): who I am, why writing riffs down by hand kills the flow.
2. **Live demo** (about 1:40): play a riff and the tab shows up live (a bend, the rhythm); Stop saves it; fix a note (drag it, change the fret, mark a hammer-on or a harmonic); Play it back slower; Copy, Share or Save .txt; upload a recording; the tuner.
3. **How it works** (about 50 s): mic → Web Audio → Pitchy 60 times a second → the note tracker (picks, bends, distortion overtones) → picking the string → reading the rhythm (the Viterbi idea) → drawing the tab.
4. **The tech** (about 20 s): plain HTML, CSS and JavaScript, Web Audio, Pitchy, MediaPipe (camera beta), localStorage, Vercel, the test scripts.
5. **Challenges** (about 50 s): pick 2 or 3, with numbers: distortion overtones, tempo stuck on 141 (right 76% of the time now instead of 14%), vibrato that looked like picks, bends that paused, the scoreboard going from 110 to 113 of 115.
6. **What I learned and what's next** (about 40 s): the camera beta, hearing harmonics, Drop D.
Keep it under 5:00. A practice run with the audio interface first.

## Facts for the AI part (to help me remember; I write it myself)
What I did and decided:
- The idea (tab from a riff while I play), who it's for, and the name.
- The look, the layout and the icon (picked from options), and the names of switches like "Show note lengths" and "Auto detect tempo".
- Which features, and in what order (the ranked ideas list), and what to take out again (Try a sample, the count-in).
- Design choices along the way: harmonics marked by hand, the camera finding my hand spot by itself, the tempo box speeding a riff up.
- Played and labeled the test recordings the scoreboard uses, tested on my guitar and phone, and decided when to push.

What Claude Code did:
- Wrote most of the code and the tests (`tools/check.mjs`, `tools/score.mjs`), and explained it as we went (`devpost/code-tour.md`).
- Measured accuracy on my recordings and tuned the note, bend and rhythm rules against them.
- Wrote the planning and tech docs with me (scope, PRD, spec, checklist) and drafted the learning log entries in my voice from our sessions.
