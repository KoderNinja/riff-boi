---
doc: todo
---

# Riff Boi — To-Do and Ideas

Deadline: **Wednesday, Sep 30, 2026 at 5:00pm EDT** (Beginner's Paradise – FirstCommit). See `CLAUDE.md > Submission checklist`.

## To-do before the deadline

### Only I can do these
- [ ] Create a free GitHub org and invite Matt (so he can deploy on Vercel)
- [ ] Move the repo to the org (after Claude says the latest work is pushed), then give Claude access to it: https://github.com/apps/claude/installations/select_target
- [ ] Matt deploys it on Vercel (free plan, Framework Preset "Other"; keep the repo public)
- [ ] Buy riffboi.com, then add it in Vercel (Project → Settings → Domains) and copy the DNS records it shows
- (GitHub Pages isn't needed if Vercel hosts the live link.)
- [ ] Test each new feature with my guitar
- [ ] Record a few string bends with `?debug`, for the bends feature
- [ ] Join the hackathon on Devpost
- [ ] Write my Devpost description: what it is, the problem it solves, who it's for, how it works (my own words)
- [ ] Write my AI-use disclosure (Claude Code) in that description (my own words)
- [ ] Write the "AI use" part of the README (my own words)
- [ ] Record the 3–5 minute demo video: live demo, how it works, tech used, challenges, what I learned
- [ ] Submit on Devpost (aim for Wednesday morning, not 4:59)

### Building with Claude (in this order)
- [x] Put the project on GitHub: https://github.com/KoderNinja/riff-boi
- [ ] Confidence bar (slice 6): built, waiting for my guitar test
- [x] **README** (required): what Riff Boi is, how to run it, tech used, a spot for my AI disclosure (update it after the design pass and bends, and add the live link + a screenshot)
- [x] Design and layout pass: the "Metal" look (I picked it from 2 options)
- [ ] String bends: detect them and write them in the tab (like `7b9`)
- [ ] Input picker + "Can't hear your guitar" message (slice 4)
- [ ] App icon, so Riff Boi can go on my phone's home screen
- [ ] If there's time: precision test (slice 7), final review and code tour

## Ideas for later
- **Super-light Apple Watch version** *(my idea)*: would need a native Apple Watch app (Swift), since a web app can't use the watch's mic.
- **iOS app** *(my idea)*: wrap this web app with a tool like Capacitor so the same code runs as a real iPhone app. It needs a Mac with Xcode (free to try on my own iPhone; the App Store needs a paid Apple Developer account). Keeping Riff Boi as plain HTML/CSS/JS with no server keeps this easy.
- **Camera that watches my hands** *(my idea)* for better string/fret accuracy: the phone or laptop camera tracks my fretting hand (hand tracking, e.g. Google's MediaPipe, which runs in the browser) to see which string and fret I'm on. A clip-on camera attachment is another way to do it. Cut from the hackathon version as too big (`scope.md > Explicitly Cut`).
- **Tuning setting** *(my idea)*, e.g. Drop D.
- **Tap a note to move it** to another string (editing positions).
- **Power chords** (several notes at once).
- **Rename, delete or export riffs.**
- **Show rhythm in the tab** (note times are already saved).
- **Play a riff back** so I can hear it.
- **Release it** to other guitarists.
