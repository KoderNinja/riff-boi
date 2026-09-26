---
doc: todo
---

# Riff Boi to-do and ideas

Deadline: Wednesday, Sep 30, 2026 at 5:00pm EDT (Beginner's Paradise – FirstCommit). The hackathon checklist is in `CLAUDE.md`.

## Next up

Where we left off (Sep 26, 2026, just after midnight):
- Everything is on GitHub and live at https://riffboi.com (pull request #1, merged). Vercel updates the site whenever `main` changes on GitHub.
- Pushing from my Mac works now: this project's git signs in with GitHub's `gh` tool (in `~/.local/bin`), which I approved in Chrome.
- Built and waiting for my guitar test: the input picker and "Can't hear your guitar" message (slice 4), the confidence bar, string bends and note values.
- Next: one guitar session to test all of those (and my iPhone), then a quick code review, then the time signature and tempo detection if there's time.

## Before the deadline

### Stuff only I can do
- [x] Make a free GitHub org (`riff-boi`) and move the repo there: https://github.com/riff-boi/riff-boi
- [x] Give Matt access (Matt is a collaborator on GitHub)
- [x] Push my newest commits to GitHub from my Mac (with GitHub's `gh` tool, approved in Chrome)
- [ ] Only if I want cloud sessions on Riff Boi again: give the Claude GitHub App access to the org (https://github.com/apps/claude/installations/select_target, then the `riff-boi` org, then the `riff-boi` repo)
- [x] Get a live link: https://riffboi.com, on Vercel. It updates whenever I push to GitHub
- [ ] Put the live link in the repo's About box on GitHub and in Devpost's "Try it out" field (the README has it now)
- [x] Buy riffboi.com and point it at the live link
- [ ] Test Riff Boi on my iPhone with the live link (Safari asks for the mic)
- [x] Get the newest copy onto my Mac (the `riff-boi.zip` download from the cloud session). Git brought it into my `beginners-paradise` folder, so that folder is the up-to-date one
- [ ] Test each new feature with my guitar
- [ ] Record a few string bends with `?debug` for the bends feature
- [x] Join the hackathon on Devpost
- [x] Matt isn't on my Devpost team (Matt is a collaborator on GitHub), so Matt doesn't go on the submission
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
- [x] README (the AI part is still mine to write; the live link is in; add a screenshot later)
- [x] New layout and the Metal look (I picked it from 2 options)
- [ ] String bends: hear them and write them in the tab, like `7b9`, `7b9r7` and `7pb9r7` (built, waiting for my bend recordings and guitar test)
- [ ] Note values, drawn like a Songsterr tab: string lines with the fret numbers on them, bar lines, the tempo, rhythm stems under the tab. I set the BPM (built, waiting for my guitar test)
- [x] A switch to turn rhythm off and just get the notes (evenly spaced, no bars, stems or tempo)
- [ ] Input picker and a "Can't hear your guitar" message (slice 4): built, waiting for my guitar test
- [ ] Quick code review to check for bugs (my request)
- [ ] If there's time: change the time signature (like 3/4, 6/8 or 7/8), not just 4/4
- [ ] If there's time: tempo detection (my idea). A choice to let Riff Boi work out the tempo from how I play, instead of setting the BPM myself
- [x] App icon so it can go on my phone's home screen (the blackletter R; I picked it from 2 options)
- [ ] If there's time: precision test (slice 7), final review and code tour
- [ ] Later: a manual tab editor, to write my own tabs from scratch

## Ideas for later
- A super light Apple Watch version (my idea). It would need a real Apple Watch app written in Swift, since a web app can't use the watch's mic.
- An iOS app (my idea). A tool like Capacitor can wrap this web app so the same code runs as a real iPhone app. That needs a Mac with Xcode. Trying it on my own iPhone is free, but the App Store needs a paid Apple Developer account. Keeping Riff Boi as plain HTML, CSS and JavaScript with no server keeps this easy.
- A camera that watches my hands (my idea), for better string and fret accuracy. The phone or laptop camera would track my fretting hand to see which string and fret I'm on. Hand tracking like Google's MediaPipe already runs in the browser. A clip-on camera is another way to do it. Too big for the hackathon (see `scope.md`, Explicitly Cut).
- A tuning setting like Drop D (my idea)
- 7- and 8-string guitars, with the low B and F# strings and drop tunings
- A bass version (my idea) for 4- and 5-string bass. Bass notes go much lower (the low E is about 41 Hz), so it needs to listen to a longer slice of sound to catch them
- Techniques in the tab: hammer-ons (`5h7`), pull-offs (`7p5`), slides (`5/7` up, `7\5` down), vibrato (`~`), palm mutes (P.M.), tremolo picking, pinch harmonics, tapping (`t`), sweep picking, and natural and artificial harmonics. Riff Boi already knows if a note was picked, so hammer-ons, pull-offs and slides are the easiest start
- A key and scale finder that shows what key or scale a riff is in, like E minor pentatonic
- Tempo and a metronome: show a riff's BPM and play a click while I record
- Mark the notes Riff Boi isn't sure about (dim them in the tab), so I know which ones to double-check
- Calibrate to my rig: play each open string once, and Riff Boi tunes its settings to my guitar, amp and mic
- Takes: record several takes of the same riff and keep the best one
- Practice loop: play a saved riff back at my tempo with a click, and slow it down to learn it
- An offline version with limited features (my idea): the core live tab works with no internet, and the extras stay online-only
- Tap a note to move it to another string
- Power chords
- Rename or delete riffs
- Export a riff as text, a Guitar Pro file or a printable PDF
- Share a riff with a link that opens its tab in a friend's browser
- Practice mode: the tab scrolls along at my speed so I can learn a riff back
- Free AI that turns YouTube videos or sound files into tabs, kind of like Songsterr but free (my idea). YouTube's rules limit downloading videos, so it might work from sound files, or a video playing into the mic
- Upload a recording (like an mp3) and get its tab, not in real time (my idea). Most of the pieces exist: my pentatonic test recording was made from an mp3 with the same Pitchy steps
- Play a riff back so I can hear it
- Put it out for other guitarists
