# Riff Boi demo video storyboard (about 3:15)

Built from four reviews of the old script: a hackathon judge, a judge who doubts how much of it is really mine, a guitarist and a video coach. The words to say are in `script.md`. Say them in my own words; don't read them.

What the judges score, and what each part of the video is for:
- **Learning & Growth (30%):** where I started, and two specific things I learned (parts 2 and 10).
- **Creativity (25%):** the sound gives the note, my hand gives the string (parts 7 and 8).
- **Execution (25%):** one unbroken take with my hands, my guitar and the screen, on a riff it's never heard (part 3).
- **Technical Understanding:** three problems explained with the guitar, not slides (part 7).
- **Presentation (20%):** start with playing, keep it moving, end on what I learned.

## Shots

The rules say 3 to 5 minutes, so aim for 3:10 to 3:30 and never go under 3:00.

| Time | What's on screen | What I say (see `script.md`) | Text on screen |
|---|---|---|---|
| 0:00 to 0:06 | **Cold open.** Me playing a lick, the tab writing itself. My hands and the screen both in the shot. | Nothing, just the guitar | "Tab. Live. While you play." |
| 0:06 to 0:20 | Me with the guitar, talking to the camera | Who I am, the lost-riffs problem, never coded before | "Riff Boi · FirstCommit 2026" |
| 0:20 to 0:55 | **Live demo, one take, no cuts.** Screen with my fretting hand in a corner window. New Riff, a new riff (picked notes, a bend and release, a hammer-on), Stop. | A riff it's never heard, gray then red, the bend and rhythm, single notes only | "Gray = hearing it · Red = in the tab" |
| 0:55 to 1:15 | Me to the camera (or the GitHub page) | Built with Claude Code, what I did, the distorted-guitar example | "Built with Claude Code (AI), disclosed" |
| 1:15 to 1:30 | **Quick cuts, about 2 s each:** drag a note, Play at 75% with Loop, Your sound, Link, Upload a recording | Fix, practice, share, upload | A label on each clip |
| 1:30 to 2:12 | **How it works, with the guitar:** the same E on three strings, the Tuner's Hz during a bend and a hammer-on, the 12th and 7th fret harmonics | Browser, Web Audio and Pitchy, then the three problems | "Web Audio · Pitchy · plain JavaScript", then "1. Which string?" · "2. Bend or new note?" · "3. Overtones" |
| 2:12 to 2:25 | **Camera (beta):** Settings, Camera (beta) on, Set up camera, the 3rd and 12th frets, the fret lines appear | Sound gives the note, my hand gives the string | "Camera (beta)" |
| 2:25 to 2:52 | Terminal running `node tools/score.mjs`, **zoomed in on the TOTAL line** | How I measure it, 116 of 118, 8 to 29 of 31, the bend fix the scoreboard caught | "116 / 118 notes · 0 wrong" |
| 2:52 to 3:07 | Me to the camera | What I learned | "A test only proves something if it can fail" |
| 3:07 to 3:15 | End card | "Try it free at riffboi.com" | "riffboi.com · github.com/riff-boi/riff-boi" |

**The camera part (2:12):** only keep it if it gets the string right every time I test it. If it doesn't, show just the setup and the fret lines and say it's in beta.

## What to play

- **The cold open and the live demo:** a new riff, never on the scoreboard. Single notes, alternate picking, a mix of note lengths (not all the same), a bend straight off the pick that I let back down (7b9r7), and a quick hammer-on.
- **Say something off the cuff right before I play in the live demo,** so it can't look pre-recorded.
- **Don't play on camera** (known limits, and they'd undercut the 116/118): gallops or anything in triplets, palm-muted chugs, power chords or other chords, pinch harmonics, very slow bends (longer than about half a second), or a pre-bend I don't let down.
- If auto tempo says "not sure" in the take, don't mention the tempo, or do another take.

## Recording checklist

**Before:**
- Tune with the tuner.
- Reload riffboi.com with Cmd+Shift+R.
- Turn on Auto detect tempo (in Settings on the home screen).
- Delete test riffs so the list looks clean.
- Do the camera setup if I'm using that part.
- Close other tabs and turn off notifications.

**Setup:**
- Record with OBS (free): the browser window plus the webcam or my phone as a corner window on my fretting hand, all in the same take, so the playing and the tab stay in sync.
- Record the guitar audio straight from the interface, not from the laptop mic.
- **Listen on headphones, not speakers.** Riff Boi is listening too, and sound from the speakers can add notes I didn't play.
- Record at 1080p, 30 fps.

**Takes:**
- Do 2 or 3 takes of the live demo and keep the best one. Bends are the hardest to land.
- If talking while playing is too hard, play first and record the talking separately afterward. Keep the off-the-cuff line before the riff live, though.
- Do one take of each part without the guitar (terminal, montage), so those are easy to redo.

**Editing:**
- Edit in CapCut or DaVinci Resolve (both free).
- Cut out the dead air.
- Add captions, since judges often watch muted. Auto-caption, then fix words like "hammer-on" and "bend".
- Use one caption style the whole way through.
- Aim for 3:10 to 3:30: the rules say 3 to 5 minutes, so never under 3:00.

**Upload:** upload to YouTube as Unlisted, watch it once there, then paste the link into Devpost's Video demo link.
