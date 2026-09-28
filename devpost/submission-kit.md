# Submission kit (for Wednesday)

Helpers for the Devpost page and the video. The words on Devpost and in the video are mine; this is just the checklist, the facts and the outline.

## Screenshots (`devpost/screenshots/`)
Taken from riffboi.com on Sep 26 and 27 (3:2 for the gallery, plus a phone one). I can take my own too.
- `home.png`: the home screen
- `riff-bend.png`: RIFFTEST as a saved riff (rhythm, tempo, the buttons; its bend at the end is cut off on the right)
- `bends.png`: my real 7b9 bends from Sep 27 (moved to the G string, where I played them), with the bend arrows and the release
- `riff-rhythm.png`: a pentatonic run with rhythm
- `phone-riff.png`: RIFFTEST on a phone

For the gallery (my pick, Sep 27): `bends.png` instead of `riff-bend.png`, plus `riff-rhythm.png`, `home.png` and `phone-riff.png`.

## Built with (Devpost tags)
javascript, html5, css3, web-audio-api, pitchy, mediapipe, localstorage, vercel, github, node.js (only for the tests)

## Video (3 to 5 minutes)
The storyboard is in `devpost/video/storyboard.md` (shots, timing, text on screen, what to play and not play, and a recording checklist). The talking points are in `devpost/video/script.md`. Both were rewritten on Sep 28 after four reviews of the old script, from a hackathon judge, a judge who doubts how much of it is really mine, a guitarist and a video coach. What they agreed on:
- Open with playing.
- Prove it's live: my hands in the shot, and a riff it has never heard.
- Say how I used Claude Code once, early and plainly.
- Explain how it works with the guitar.
- End on what I learned.
- Aim for about 4:30.

## Facts for the AI part (to help me remember; I write it myself)
What I did and decided:
- The idea (tab from a riff while I play), who it's for, and the name.
- The look, the layout and the icon (picked from options), and the names of switches like "Show note lengths" and "Auto detect tempo".
- Which features, and in what order (the ranked ideas list), and what to take out again (Try a sample, the count-in).
- Design choices along the way: harmonics marked by hand, the camera (first it tried to find my frets by itself, then got a 5-second setup when that didn't work), the tempo box speeding a riff up.
- Played and labeled the test recordings the scoreboard uses, tested on my guitar and phone, and decided when to push.

What Claude Code did:
- Wrote most of the code and the tests (`tools/check.mjs`, `tools/score.mjs`), and explained it as we went (`devpost/code-tour.md`).
- Measured accuracy on my recordings and tuned the note, bend and rhythm rules against them.
- Wrote the planning and tech docs with me (scope, PRD, spec, checklist) and drafted the learning log entries in my voice from our sessions.
