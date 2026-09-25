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
