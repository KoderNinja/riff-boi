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
