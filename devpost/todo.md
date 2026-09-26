---
doc: todo
---

# Riff Boi to-do and ideas

Deadline: Wednesday, Sep 30, 2026 at 5:00pm EDT (Beginner's Paradise – FirstCommit). The hackathon checklist is in `CLAUDE.md`.

## Next up

Where we left off (Sep 26, 2026, early afternoon):
- On GitHub and riffboi.com: the cloud session's work, my bar line fix and the Rhythm switch fix.
- Only on my Mac, on the `ideas` branch (I asked Claude not to push until I'm back): the time signature, Auto detect tempo, New Tab, Rename and Delete, Play, Upload a recording and Try a sample, moving a note to another string, Copy, the key and scale finder, Share, Practice (speed, loop, click), and clearer switch labels. 163 checks pass and the scoreboard is unchanged (110/115, 83/83).
- My part first: test those at http://localhost:8000 (Cmd+Shift+R first). When they work, Claude fast-forwards `main` to `ideas` and pushes, and riffboi.com updates.
- Claude built ideas 4, 5, 6, 10 and 14 while I was away, using its recommended choices. They're listed in `checklist.md` so I can change any of them.
- Skipped for now, to do with me: ideas 7 to 9 (Drop D, dimming unsure notes, hammer-ons/pull-offs/slides) change how notes are heard, so they need my decisions and my guitar. 11 to 13 and 16 need decisions too.
- Next with Claude: accuracy, and ways to tell which string I played (my request).
- Still mine: test on my iPhone and with my guitar, the Devpost description and AI part (my words), screenshots, the demo video, and submitting.

## Before the deadline

In order of priority. "Me" is stuff only I can do, "Claude" is building with Claude.

### 1. Must do, to submit
- [x] Me: get the new commits from the cloud session onto GitHub (bring them to my Mac from the zip and push, like last time), so riffboi.com updates. Or give the Claude GitHub App access to the org, so the cloud session can push by itself: https://github.com/apps/claude/installations/select_target, then the `riff-boi` org, then the `riff-boi` repo
- [ ] Me: test Riff Boi on my iPhone at https://riffboi.com (reload the page first). If it still can't hear, open https://riffboi.com/?debug and send Claude a screenshot of the numbers on the Recording screen
- [ ] Me: test each new feature with my guitar:
  - [ ] Input picker and the "Can't hear your guitar" message (slice 4)
  - [ ] Confidence bar (slice 6)
  - [ ] String bends: `7b9`, `7b9r7` and `7pb9r7`
  - [ ] Note values, drawn like a Songsterr tab, at the BPM I set
- [ ] Me: write my Devpost description: what it is, the problem, who it's for and how it works (my words)
- [ ] Me: say how I used AI (Claude Code) in that description (my words)
- [ ] Me: take screenshots for the Devpost gallery and thumbnail
- [ ] Me: do a practice run with my audio interface before recording
- [ ] Me: record the 3 to 5 minute demo video: live demo, how it works, the tech, the hard parts and what I learned
- [ ] Me: submit on Devpost, Wednesday morning if I can, not at 4:59

### 2. Should do, to make it better
- [ ] Me: write the "AI use" part of the README (my words)
- [ ] Me: put the live link in Devpost's "Try it out" field (the GitHub About box is ready)
- [ ] Me: fill in Devpost's "Built with" tags (like javascript, html, css, web audio api, pitchy)
- [ ] Me: record a few string bends with `?debug`, so Claude can tune the bends feature
- [x] Claude: a code tour, a plain-words walk through each file, so I can explain my own code in the video (`devpost/code-tour.md`)
- [ ] Me + Claude: precision test (slice 7). I play a known riff slow, fast and distorted, and we count the right, missed and extra notes. Real numbers for the demo. The steps and the table to fill in are in `devpost/precision-test.md`
- [x] Claude: fix the Rhythm switch (my request). Turning rhythm on or off used to change how every saved riff is drawn. Now it only changes the riff I'm recording: each riff saves whether rhythm was on, and riffs from before that show with rhythm on
- [x] Claude: update all the GitHub descriptions (the About box: description, riffboi.com and topics) and the README (my request, after the to-do list)
- [x] Claude: a quick codebase check (my request). Nothing unused or left over; the new code looked right

### 3. If there's time
- [x] Claude: change the time signature (like 3/4, 6/8 or 7/8), not just 4/4
- [x] Claude: tempo detection (my idea). A choice to let Riff Boi work out the tempo from how I play, instead of setting the BPM myself (the Auto switch)
- [x] Claude: start a manual tab editor, to write my own tabs from scratch (my request). New Tab on the home screen: pick a string, a fret and a note value, then Add note. Later: bends, rests, editing a note in the middle, and editing recorded riffs
- [x] Claude: rank my ideas list below by priority (my request)
- [ ] Me + Claude: better accuracy, and ways to tell which string I played (my request, after everything else)

### Later, after the hackathon
- [ ] Upload a tab (a file, or paste it in) and Riff Boi turns it into sheet music (my idea). Tab says the exact string and fret, so the notes are easy. The rhythm only comes along if the tab has it, like a Guitar Pro file
- [ ] The other way too, upload sheet music and Riff Boi turns it into tab (my idea). It would pick the strings and frets with the same rule it already uses. A music file (like MusicXML) is the easy start; a photo or PDF of printed music needs the computer to read the page first, which is much harder
- [ ] Only if I want cloud sessions on Riff Boi for good: give the Claude GitHub App access to the org (the link is in the first "must do")

### Done
- [x] Put the project on GitHub, then make a free GitHub org (`riff-boi`) and move the repo there: https://github.com/riff-boi/riff-boi
- [x] Give Matt access (Matt is a collaborator on GitHub, not on my Devpost team, so Matt doesn't go on the submission)
- [x] Get the newest copy onto my Mac from the `riff-boi.zip` download (git brought it into my `beginners-paradise` folder, so that folder is the up-to-date one) and push from my Mac (with GitHub's `gh` tool, approved in Chrome)
- [x] Get a live link: https://riffboi.com, on Vercel. It updates whenever I push to GitHub
- [x] Buy riffboi.com and point it at the live link
- [x] Join the hackathon on Devpost
- [x] README (the AI part is still mine to write; the live link is in; add a screenshot later)
- [x] New layout and the Metal look (I picked it from 2 options)
- [x] A switch to turn rhythm off and just get the notes (evenly spaced, no bars, stems or tempo)
- [x] App icon so it can go on my phone's home screen (the blackletter R; I picked it from 2 options)
- [x] Quick code review to check for bugs (my request). It found my iPhone's sound system starting paused, bends on octave-fixed notes, and amp hiss stretching the last note. All 3 fixed in the cloud session

## Ideas, ranked (Sep 26)

Ranked by how much each one helps Riff Boi before the deadline, for how much work it is. Claude asks me about the design of each one before building it. Sizes: small is an hour or two, medium is a few hours, big is days.

### Before the deadline, in this order
1. [x] Rename or delete riffs. Size: small. Done: Rename and Delete under every riff card (my pick).
2. [x] Play a riff back so I can hear it. Size: small to medium. Done: a Play button on saved riffs and in New Tab, with a plucked-string sound (my pick). Each note turns red as it plays.
3. [x] Upload a recording (like an mp3) and get its tab, not in real time (my idea). Size: medium. Done: Upload a recording and Try a sample (my pentatonic scale) under New Riff. The sample gives the same tab as the scoreboard.
4. [x] Tap a note to move it to another string. Size: small to medium. Done: tap a note on a saved riff, then pick another string (built while I was away, so check it).
5. [x] Copy a riff as text tab, part of the export idea. Size: small. Done: a Copy button on saved riffs, with bar lines (built while I was away, so check it).
6. [x] A key and scale finder that shows what key or scale a riff is in, like E minor pentatonic. Size: small to medium. Done: "Sounds like ..." under a saved riff (built while I was away, so check it).
7. A tuning setting like Drop D (my idea). Size: medium. Drop D is very common in metal.
8. Mark the notes Riff Boi isn't sure about (dim them in the tab), so I know which ones to double-check. Size: medium. It goes with the accuracy work.
9. Techniques in the tab: hammer-ons (`5h7`), pull-offs (`7p5`), slides (`5/7` up, `7\5` down), vibrato (`~`), palm mutes (P.M.), tremolo picking, pinch harmonics, tapping (`t`), sweep picking, and natural and artificial harmonics. Riff Boi already knows if a note was picked, so hammer-ons, pull-offs and slides are the easiest start. Size: medium to big. Hearing them right is the hard part.
10. [x] Share a riff with a link that opens its tab in a friend's browser. Size: medium. Done: Share on saved riffs, and Save to my riffs when you open one (built while I was away, so check it).
11. A metronome: play a click while I record. Size: small to medium. Showing a riff's tempo is done (that's Auto). The click could leak into the mic, so it needs care.
12. An offline version with limited features (my idea): the core live tab works with no internet, and the extras stay online-only. Size: small to medium.
13. Calibrate to my rig: play each open string once, and Riff Boi tunes its settings to my guitar, amp and mic. Size: medium. It goes with the accuracy work.
14. [x] Practice loop: play a saved riff back at my tempo with a click, and slow it down to learn it. Size: medium. Done: Speed, Loop and Click under Play (built while I was away, so check it).
15. [x] Practice mode: the tab scrolls along at my speed so I can learn a riff back. Size: medium. Mostly done: Play scrolls the tab and turns each note red, at the practice speed.
16. Takes: record several takes of the same riff and keep the best one. Size: medium.

### After the hackathon (big, or needs another kind of app)
- A camera that watches my hands (my idea), for better string and fret accuracy. The phone or laptop camera would track my fretting hand to see which string and fret I'm on. Hand tracking like Google's MediaPipe already runs in the browser. A clip-on camera is another way to do it. Too big for the hackathon (see `scope.md`, Explicitly Cut).
- 7- and 8-string guitars, with the low B and F# strings and drop tunings
- A bass version (my idea) for 4- and 5-string bass. Bass notes go much lower (the low E is about 41 Hz), so it needs to listen to a longer slice of sound to catch them
- Power chords
- Export a riff as a Guitar Pro file or a printable PDF (the rest of the export idea)
- An iOS app (my idea). A tool like Capacitor can wrap this web app so the same code runs as a real iPhone app. That needs a Mac with Xcode. Trying it on my own iPhone is free, but the App Store needs a paid Apple Developer account. Keeping Riff Boi as plain HTML, CSS and JavaScript with no server keeps this easy.
- A super light Apple Watch version (my idea). It would need a real Apple Watch app written in Swift, since a web app can't use the watch's mic.
- Free AI that turns YouTube videos or sound files into tabs, kind of like Songsterr but free (my idea). YouTube's rules limit downloading videos, so it might work from sound files, or a video playing into the mic
- Put it out for other guitarists
