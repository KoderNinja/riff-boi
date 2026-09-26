# Learning Log

What I learned and the problems I solved along the way. I'll use this for my demo video and write-up.

## Sep 25, 2026 — Getting started (`/1-start`)
- **Flipped interaction:** instead of just asking the AI for things, I let it interview me so my ideas and decisions shape the project.
- **Plan before building:** the path is scope → PRD (what it does) → spec (how it's built) → build → ship.
- **`.gitignore`:** a file that tells git which files never to commit. I used it to keep my personal learner profile and any `.env` secret files out of my public repo.
- **Starting idea:** an app where I play guitar and it writes out the tabs.

## Sep 25, 2026 — Scoping (`/2-scope`)
- **Proof of concept:** the smallest working version that proves the core idea. Mine: "I play a riff and the tabs just show up."
- **Finding the kernel:** my real problem is losing riffs I find while improvising because writing them down breaks my flow.
- **Feasibility tradeoffs:** computers can detect single notes much more easily than chords, because the notes in a chord blend together. So single notes come first and power chords come later.
- **Cutting scope:** I cut the camera idea (seeing which string/fret I'm on). It's a hard computer vision problem and too big for 5 days.
- **Open problem:** audio gives the pitch but not the string, so the app will have to guess the fret position.

## Sep 25, 2026 — Product requirements (`/3-prd`)
- **PRD:** a non-technical description of exactly what the app does: screens, buttons, what you see, and how to tell it works.
- **Acceptance criteria:** checkable statements like "playing a note makes a fret number appear" so I can test each part.
- **Tradeoff I made:** one tap to start (from a riff list) instead of listening the instant the app opens, because I wanted my riffs saved in the app.
- **Hard problem, simple answer:** audio can't tell which string a note was played on. Instead of building an editing feature, I went with a simple rule that picks a playable position. Editing is next in line if there's time.
- **Edge cases ("what if?"):** planned what happens with no riffs yet, no microphone permission, and when the app can't hear the guitar.
- **Named it:** Riff Boy. Dark, metal, black and red.

## Sep 25, 2026 — Technical plan (`/4-spec`)
- **Tech spec:** the blueprint for *how* the app gets built: tools, files, and how data moves between them.
- **Web vs mobile app:** I pictured a mobile app, but chose a mobile-first **web app** to start. The browser can already use the mic, it's free to put online, and it can go on my phone's home screen.
- **HTML / CSS / JavaScript:** structure / look / behavior. No framework, so I can understand every file.
- **Web Audio API + Pitchy:** the browser's sound toolkit, plus a small library that tells you what note it hears and how sure it is (the "clarity" score).
- **localStorage:** the browser's notebook for one website. That's where my riffs are saved, with no accounts or server.
- **GitHub Pages:** free hosting from my GitHub repo. Phones only allow the mic on secure (https) sites, so I need it for phone testing.
- **My decision:** add an input picker so I can use my audio interface for more precision. It remembers my choice.
- **My big question: how precise will it be?** It depends on a clean signal, figuring out where one note ends and the next begins (hardest), playing speed, and tuning. Plan: test a known riff slow/fast/distorted and count right, missed and extra notes.

## Sep 25, 2026 — Build slice 1: hearing notes (`/5-build`)
- **Building in slices:** small steps I can actually try, each tested and saved before the next. The riskiest part (the mic + Pitchy) went first so problems show up early.
- **git and commits:** `git init` made my folder a repository; each commit is a saved checkpoint I can go back to.
- **Local server:** `python3 -m http.server 8000` serves my app at http://localhost:8000. Needed because the mic and JavaScript modules don't work when you just double-click the file.
- **How it hears notes:** about 60 times a second the app grabs a slice of sound, Pitchy says the pitch and how sure it is, and `notes.js` turns the frequency into a note name (110 Hz = A2). Unclear, quiet or out-of-range sounds are ignored.
- **Voice filters off:** browsers clean up mic sound for voice calls (echo/noise removal, auto volume), which would mess up a guitar, so I turned them off.
- **Testing without a guitar:** Claude tested with fake tones; I tested with my real guitar and the notes matched.

## Sep 25, 2026 — Build slice 2: live tab (`/5-build`)
- **When does a new note start?** The app hears a ringing note ~60 times a second, so it needs rules: a steady pitch after silence, a pitch change, or a volume jump (the pick hitting the string again).
- **Position rule:** audio gives the note but not the string, so Riff Boy picks the fret closest to my last one.
- **Fake tones vs a real guitar:** everything passed with clean test tones, but my real guitar (laptop mic, slightly distorted amp) added lots of random notes. Distortion adds harmonics (extra pitches an octave or fifth up) that fooled the detector.
- **The fix:** notes I didn't pick (hammer-ons/pull-offs) must hold a bit longer, and unpicked octave/fifth jumps are ignored as harmonics. Result: the right notes now.
- **Debug recorder:** `?debug` saves everything the app heard to a file, so we can replay real playing while tuning instead of guessing.
- **Renamed:** Riff Boy → **Riff Boi** during the build.

## Sep 25, 2026 — Making note detection accurate with real data
- **Evidence over guessing:** I recorded myself playing the Crazy Train riff with `?debug`, and we replayed that recording through the code after every change, scoring it against the notes I really played. Score went from **8 to 26 of 31 notes correct**.
- **What was wrong:** with a laptop mic and distortion, the detector often heard the **octave above** the real note; some real notes were just under the "clarity" limit; and my amp/room made the volume **pulse about 6 times a second**, which looked like extra picks.
- **Fixes:** follow the note's *name* first and pick the lowest octave heard (a guitar note's real pitch is its lowest); accept slightly less clear readings; a repeated note only counts if it's nearly as loud as the note's first attack.
- **Tuning numbers:** I tested several settings side by side and kept the one with the fewest total mistakes, not just the most correct notes.
- **Checks:** `node tools/check.mjs` re-runs all the logic checks in one command, so a fix can't secretly break something that worked before.
- **Strings are still a guess:** audio can't tell which string you played. The rule now imagines a 4-fret hand box and avoids jumping strings, which fixed my Crazy Train opening.
- **New ideas:** a built-in tuner (added to the plan) and a tuning setting like Drop D (saved for later).

## Sep 25, 2026 — My own test set (my idea!)
- **Labeled test data:** I recorded myself playing frets 1–12 on every string and wrote down exactly what I played (the "ground truth"). Every change to Riff Boi now gets a score against my answers, for notes AND strings.
- **Scoreboard:** `node tools/score.mjs` scores every recording at once. Result: **97 of 103 notes and 72 of 72 strings right**.
- **What the data showed:** one small mistake snowballs — a stray note or one wrong octave pulled whole runs onto the wrong string. Fixing the first mistake fixed the whole run.
- **Background noise:** quiet sounds before I start playing showed up as notes. Riff Boi now drops notes much quieter (under 35%) than my typical note. I picked 35% by measuring: noise was 14–22%, my real notes were 56% or louder.
- **Overfitting:** if you tune on the same recordings you test on, the score can look better than it really is. The fair test is a new riff that wasn't used for tuning.

## Sep 25, 2026 — Code review and a fair test
- **Independent review:** separate AI reviewers tried to break Riff Boi's logic, and other reviewers double-checked every problem they reported. 9 real problems were confirmed (e.g. picking the same note twice was often lost, and on a 120 Hz screen the app would have taken readings twice as fast and broken).
- **Write the test first:** for each problem we wrote a check, watched it FAIL, then fixed the code and watched it pass. That proves the check really tests the problem.
- **A bug in my own earlier fix:** a pedal riff (open low E, a high note, back to E) was being "corrected" into the wrong octave. No test covered it until we thought about how metal riffs actually work.
- **Fair test:** my pentatonic at the 6th fret (never used for tuning) scored 10/12 notes, 6/10 strings before the fixes and 11/12, 11/11 after.
- **Same notes, different places:** the sound can't tell the 6th-fret box from the 1st-position box. Riff Boi now tries every place you could have started and picks the one that needs the least hand movement.
- **Scoreboard now:** 110/115 notes (96%), 0 wrong notes, 83/83 strings.
