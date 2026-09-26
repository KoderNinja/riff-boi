---
doc: todo
---

# Riff Boi to-do and ideas

Deadline: Wednesday, Sep 30, 2026 at 5:00pm EDT (Beginner's Paradise – FirstCommit). The hackathon checklist is in `CLAUDE.md`.

## Before the deadline

### Stuff only I can do
- [x] Make a free GitHub org (`riff-boi`) and move the repo there: https://github.com/riff-boi/riff-boi
- [ ] Invite Matt to the org, if I haven't yet
- [ ] Give Claude access to the org so it can push again: https://github.com/apps/claude/installations/select_target, then the `riff-boi` org, then the `riff-boi` repo
- [ ] Get a live link. Either turn on GitHub Pages (github.com/riff-boi/riff-boi/settings/pages, "Deploy from a branch", `main`, `/ (root)`), which gives https://riff-boi.github.io/riff-boi/, or Matt deploys it on Vercel (free plan, Framework Preset "Other", keep the repo public)
- [ ] Put the live link in the README, in the repo's About box on GitHub and in Devpost's "Try it out" field
- [ ] Buy riffboi.com and point it at the live link (on Vercel: Settings, then Domains; for GitHub Pages, ask Claude for the DNS steps)
- [ ] Test Riff Boi on my iPhone with the live link (Safari asks for the mic)
- [ ] Sync my Mac copy with GitHub before I edit anything there (ask Claude for the steps)
- [ ] Test each new feature with my guitar
- [ ] Record a few string bends with `?debug` for the bends feature
- [ ] Join the hackathon on Devpost
- [ ] If Matt is on my team, check he's eligible (13 to 21, a student) and add him on Devpost. If he's only helping with hosting, he doesn't go on the submission
- [ ] Write my Devpost description: what it is, the problem, who it's for and how it works (my words)
- [ ] Say how I used AI (Claude Code) in that description (my words)
- [ ] Write the "AI use" part of the README (my words)
- [ ] Take screenshots for the Devpost gallery and thumbnail
- [ ] Fill in Devpost's "Built with" tags (like javascript, html, css, web audio api, pitchy)
- [ ] Do a practice run with my audio interface before recording
- [ ] Record the 3 to 5 minute demo video: live demo, how it works, the tech, the hard parts and what I learned
- [ ] Submit on Devpost, Wednesday morning if I can, not at 4:59

### Building with Claude, in this order
- [x] Put the project on GitHub
- [ ] Confidence bar (slice 6): built, waiting for my guitar test
- [x] README (the AI part is still mine to write; add the live link and a screenshot later)
- [x] New layout and the Metal look (I picked it from 2 options)
- [ ] String bends: hear them and write them in the tab, like `7b9`, `7b9r7` and `7pb9r7`
- [ ] Note values: show quarter notes, half notes, eighth notes and so on for each note. It needs a tempo, so either I set the BPM or Riff Boi guesses it
- [ ] Input picker and a "Can't hear your guitar" message (slice 4)
- [ ] App icon so it can go on my phone's home screen
- [ ] If there's time: precision test (slice 7), final review and code tour

## Ideas for later
- A super light Apple Watch version (my idea). It would need a real Apple Watch app written in Swift, since a web app can't use the watch's mic.
- An iOS app (my idea). A tool like Capacitor can wrap this web app so the same code runs as a real iPhone app. That needs a Mac with Xcode. Trying it on my own iPhone is free, but the App Store needs a paid Apple Developer account. Keeping Riff Boi as plain HTML, CSS and JavaScript with no server keeps this easy.
- A camera that watches my hands (my idea), for better string and fret accuracy. The phone or laptop camera would track my fretting hand to see which string and fret I'm on. Hand tracking like Google's MediaPipe already runs in the browser. A clip-on camera is another way to do it. Too big for the hackathon (see `scope.md`, Explicitly Cut).
- A tuning setting like Drop D (my idea)
- 7- and 8-string guitars, with the low B and F# strings and drop tunings
- A bass version (my idea) for 4- and 5-string bass. Bass notes go much lower (the low E is about 41 Hz), so it needs to listen to a longer slice of sound to catch them
- Hammer-on and pull-off marks in the tab, like `5h7` and `7p5` (Riff Boi already knows if a note was picked)
- Slide and vibrato marks in the tab, like `5/7` and `~`
- A key and scale finder that shows what key or scale a riff is in, like E minor pentatonic
- Tempo and a metronome: show a riff's BPM and play a click while I record
- Tap a note to move it to another string
- Power chords
- Rename or delete riffs
- Export a riff as text, a Guitar Pro file or a printable PDF
- Share a riff with a link that opens its tab in a friend's browser
- Practice mode: the tab scrolls along at my speed so I can learn a riff back
- Play a riff back so I can hear it
- Put it out for other guitarists
