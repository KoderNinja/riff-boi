---
doc: todo
---

# Riff Boi to-do and ideas

Deadline: Wednesday, Sep 30, 2026 at 5:00pm EDT (Beginner's Paradise – FirstCommit). The hackathon checklist is in `CLAUDE.md`.

## Before the deadline

### Stuff only I can do
- [ ] Make a free GitHub org and invite Matt, so he can deploy on Vercel
- [ ] Move the repo to the org once Claude says everything's pushed, then give Claude access to it (https://github.com/apps/claude/installations/select_target)
- [ ] Matt deploys it on Vercel (free plan, Framework Preset "Other", keep the repo public)
- [ ] Buy riffboi.com, add it in Vercel (Project, then Settings, then Domains) and copy the DNS records it shows
- [ ] Test each new feature with my guitar
- [ ] Record a few string bends with `?debug` for the bends feature
- [ ] Join the hackathon on Devpost
- [ ] Write my Devpost description: what it is, the problem, who it's for and how it works (my words)
- [ ] Say how I used AI (Claude Code) in that description (my words)
- [ ] Write the "AI use" part of the README (my words)
- [ ] Record the 3 to 5 minute demo video: live demo, how it works, the tech, the hard parts and what I learned
- [ ] Submit on Devpost, Wednesday morning if I can, not at 4:59

GitHub Pages isn't needed if Vercel hosts the live link.

### Building with Claude, in this order
- [x] Put the project on GitHub
- [ ] Confidence bar (slice 6): built, waiting for my guitar test
- [x] README (the AI part is still mine to write; add the live link and a screenshot later)
- [x] New layout and the Metal look (I picked it from 2 options)
- [ ] String bends: hear them and write them in the tab, like `7b9`
- [ ] Input picker and a "Can't hear your guitar" message (slice 4)
- [ ] App icon so it can go on my phone's home screen
- [ ] If there's time: precision test (slice 7), final review and code tour

## Ideas for later
- A super light Apple Watch version (my idea). It would need a real Apple Watch app written in Swift, since a web app can't use the watch's mic.
- An iOS app (my idea). A tool like Capacitor can wrap this web app so the same code runs as a real iPhone app. That needs a Mac with Xcode. Trying it on my own iPhone is free, but the App Store needs a paid Apple Developer account. Keeping Riff Boi as plain HTML, CSS and JavaScript with no server keeps this easy.
- A camera that watches my hands (my idea), for better string and fret accuracy. The phone or laptop camera would track my fretting hand to see which string and fret I'm on. Hand tracking like Google's MediaPipe already runs in the browser. A clip-on camera is another way to do it. Too big for the hackathon (see `scope.md`, Explicitly Cut).
- A tuning setting like Drop D (my idea)
- Tap a note to move it to another string
- Power chords
- Rename, delete or export riffs
- Show rhythm in the tab (note times are already saved)
- Play a riff back so I can hear it
- Put it out for other guitarists
