# Riff Boi demo video script (about 4:30)

Talking points for each part of `storyboard.md`. Say it in my own words; don't read it word for word. The lines below are just one way to say it. What to show is in [brackets].

## 1. Cold open (0:00 to 0:08)
[No talking. Play a lick while the tab writes itself. My hands and the screen both in the shot.]

## 2. Who I am (0:08 to 0:25)
[Me with the guitar, to the camera.]

I'm Colton. I've played guitar for six years, mostly metal. My best riffs show up when I'm just messing around, and by the time I write them down, they're gone. So I made Riff Boi. You play, and the tab writes itself.

Before this hackathon, I'd never written code.

## 3. Live demo, one take (0:25 to 1:05)
[One unbroken take: the screen, my fretting hand in a corner window, guitar audio from the interface. Say something off the cuff first.]

Here's a riff I've never played for it before.

[Tap New Riff. Play picked notes, a bend I let back down, and a quick hammer-on.]

Each note shows up gray while it's listening and turns red once it's sure. The bend is written like real tab, release and all, and the rhythm goes underneath, like Songsterr.

[Tap Stop.]

Stop saves it, and it figured out the tempo from how I played. It's single notes for now, no chords yet.

## 4. How I built it (1:05 to 1:25)
[To the camera, or the GitHub page.]

I built this with Claude Code, an AI coding tool. It wrote most of the code and the tests and explained them to me as we went. I decided what to build, recorded and labeled every test riff, tested it on my own guitar, and caught what it got wrong. Its tests passed on clean test tones, but my distorted guitar still wrote notes I never played. That's where most of the work went.

## 5. Fix it and practice it (1:25 to 1:45)
[The saved riff.]

The sound can't tell which string I played, so sometimes it picks a different spot. I played this one on the G string, so I just drag it there.

[Drag a note. Then Play, Speed 75%, Loop.]

I can slow it down and loop it to practice.

[Play Your sound.]

And it keeps my real recording right next to the tab.

## 6. Everything else (1:45 to 1:53)
[Montage: Share link, Save .txt, Upload an mp3, Tuner, New Tab.]

It also shares riffs with a link, gets the tab from a recording, and has a tuner.

## 7. How it works (1:53 to 2:55)
[Me and the guitar. The Tuner open for part two.]

The browser listens about 60 times a second, and a library called Pitchy tells it the pitch. Everything after that is the note tracker, and it has three problems to solve.

One. [Play the same E on three strings.] These are the same note, so the sound can't tell the string. It picks the spot that needs the least hand movement, and keeps bends away from the nut, where they're hard to play.

Two. [On the Tuner, bend a note, then hammer one on.] A bend glides through every pitch in between. A hammer-on jumps straight there. That's how it tells a bend from a new note.

Three. [Play the 12th and 7th fret harmonics.] These notes are hidden inside every note I play, and distortion makes them loud. So it trusts the lowest note it hears. That's why the early versions wrote notes an octave or a fifth too high.

## 8. The camera, in beta (2:55 to 3:15)
[Camera (beta) on. Set up camera: the 3rd fret, then the 12th, on the low E. The fret lines appear. Then play a note.]

So the sound gives the note, and my hand gives the string. Two notes of setup, and it measures my neck. I thought about an AI that looks at the picture instead, but it would be slow, cost money every time, and need a secret key. Measuring two frets is free and instant.

(Only if it gets the string right every time I test it. If not, show the setup, say it's in beta, and skip the last two sentences.)

## 9. How I know it works (3:15 to 3:55)
[Terminal: `node tools/score.mjs`, zoomed in on the TOTAL line. Then `tools/recordings/bend-G.txt` next to the tab it wrote.]

How do I know it works? I recorded myself, typed out exactly what I played, and this script scores Riff Boi against it: 116 of 118 notes. My hardest riff, Crazy Train, went from 8 of 31 to 29, with zero wrong notes. It would rather miss a note than write a wrong one.

It catches mistakes too. This week my own bends came out as three separate notes. The first fix broke Crazy Train, the scoreboard caught it, and we narrowed the fix until everything passed.

## 10. What I learned (3:55 to 4:20)
[To the camera.]

The biggest thing I learned: a test only proves something if it can fail. And you have to measure instead of guessing, because fixing one thing can break another.

And now I can explain how a guitar note turns into tab.

## 11. Outro (4:20 to 4:30)

It's at riffboi.com, free, no account. Plug in and play something.

[End card: riffboi.com and github.com/riff-boi/riff-boi]
