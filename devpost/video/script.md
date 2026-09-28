# Riff Boi demo video script (about 3:15)

The rules say 3 to 5 minutes, so aim for 3:10 to 3:30 and never go under 3:00. Delivery: a steady pace and my own words; the lines are a guide, not a teleprompter. What to show is in [brackets], matching `storyboard.md`.

## 1. Cold open (0:00 to 0:06)
[No narration. Play a lick while the tab writes itself, with my hands and the screen both in frame.]

## 2. Introduction (0:06 to 0:20)
I'm Colton. I've played guitar for six years, and my best riffs come while I'm improvising, but they're gone before I can write them down. So I built Riff Boi: you play, and the tab writes itself. Before this hackathon, I had never written code.

## 3. Live demonstration (0:20 to 0:55)
[One unbroken take: the screen, my fretting hand in a corner window, guitar audio from the interface.]

This is a riff it has never heard.

[Tap New Riff. Play picked notes, a bend with a release, and a quick hammer-on.]

Notes appear in gray while it listens and turn red once they're confirmed. The bend is written the way guitarists write it, and the rhythm goes underneath.

[Tap Stop.]

Stop saves it and detects the tempo. For now, it's single notes only.

## 4. How it was built (0:55 to 1:15)
[To the camera, or the GitHub page.]

I built it with Claude Code, an AI coding assistant that wrote most of the code and explained it to me. I decided what to build, labeled every test recording, and tested it on my guitar. Its tests passed on clean tones, but my distorted guitar exposed wrong notes, and fixing those was most of the work.

## 5. Fix, practice, share (1:15 to 1:30)
[Quick cuts: drag a note to the G string, Play at 75% with Loop, Your sound, Link, Upload a recording.]

If it picks the wrong string, I drag the note. I can slow a riff down to practice, hear my original recording, share it as a link, and even get tab from a recording.

## 6. How it works (1:30 to 2:12)
[With the guitar. The Tuner open for point two.]

It runs in the browser: Web Audio listens about 60 times a second, and a library called Pitchy measures the pitch. Then the note tracker solves three problems.

One: [play the same E on three strings] the same note sounds identical on different strings, so it picks the position with the least hand movement.

Two: [on the Tuner, bend a note, then hammer one on] a bend glides through every pitch in between, while a hammer-on jumps. That's how it tells them apart.

Three: [play the 12th and 7th fret harmonics] every note hides higher overtones, and distortion makes them loud, so it trusts the lowest pitch it hears.

## 7. Camera mode, in beta (2:12 to 2:25)
[Open Settings, turn on Camera (beta), tap Set up camera: the 3rd fret, then the 12th, on the low E. The fret lines appear.]

In beta, the camera adds the missing piece: the sound gives the note, and my hand gives the string. A two-note setup measures the neck, free and instant.

(Only if it gets the string right every time I test it. If not, show the setup and say it's in beta.)

## 8. Results (2:25 to 2:52)
[Terminal: `node tools/score.mjs`, zoomed in on the TOTAL line.]

To measure accuracy, I wrote down exactly what I played in my recordings, and a script scores Riff Boi against them: 116 of 118 notes. My hardest riff went from 8 of 31 to 29, with no wrong notes. And when a fix for my bends broke that riff, the scoreboard caught it.

## 9. What I learned (2:52 to 3:07)
[To the camera.]

My biggest lesson: a test only proves something if it can fail. Measure instead of guessing, because one fix can break something else. And now I can explain how a guitar note becomes tab.

## 10. Closing (3:07 to 3:15)

Try it free at riffboi.com. Plug in and play something.

[End card: riffboi.com and github.com/riff-boi/riff-boi]
