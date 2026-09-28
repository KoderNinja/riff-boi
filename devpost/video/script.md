# Riff Boi demo video script (about 4:30)

Delivery: a steady pace, a short pause between sections, and my own words. The lines are a guide, not a teleprompter. What to show is in [brackets], and it matches `storyboard.md`.

## 1. Cold open (0:00 to 0:08)
[No narration. Play a lick while the tab writes itself, with my hands and the screen both in frame.]

## 2. Introduction (0:08 to 0:25)
My name is Colton, and I've played guitar for six years, mostly metal and instrumental music. My best ideas come while I'm improvising, and by the time I stop to write them down, they're gone. Riff Boi solves that: you play, and the tab writes itself. Before this hackathon, I had never written code.

## 3. Live demonstration (0:25 to 1:05)
[One unbroken take: the screen, my fretting hand in a corner window, guitar audio from the interface.]

This is a riff Riff Boi has never heard before.

[Tap New Riff. Play picked notes, a bend with a release, and a quick hammer-on.]

Each note appears in gray while Riff Boi is listening and turns red once it's confirmed. Bends are written the way guitarists write them, release included, and the rhythm is notated underneath.

[Tap Stop.]

When I stop, the riff is saved, and the tempo is detected from my playing. For now it transcribes single notes, not chords.

## 4. How it was built (1:05 to 1:25)
[To the camera, or the GitHub page.]

I built Riff Boi with Claude Code, an AI coding assistant. It wrote most of the code and the tests and explained each part to me. I decided what to build, recorded and labeled every test riff, tested it on my own guitar, and caught what it got wrong. Its tests passed on clean test tones, but my distorted guitar still produced notes I never played. Fixing that was most of the work.

## 5. Editing and practice (1:25 to 1:45)
[The saved riff.]

The sound alone can't identify the string, so Riff Boi sometimes chooses a different position. I played this on the G string, so I drag it there.

[Drag a note. Tap Play, set Speed to 75%, and turn on Loop.]

I can slow it down and loop it for practice,

[Play Your sound.]

and my original recording is saved right next to the tab.

## 6. Feature overview (1:45 to 1:53)
[Montage: Link, Save .txt, Upload a recording, Tuner, Write a tab.]

It can also share a riff as a link, create tab from a recording, and tune your guitar.

## 7. How it works (1:53 to 2:55)
[With the guitar. The Tuner open for the second point.]

The browser samples the microphone about 60 times a second, and a library called Pitchy measures the pitch. Everything after that is the note tracker, which solves three problems.

First, [play the same E on three strings] the same note can be played on different strings, and they sound identical. So Riff Boi chooses the position that needs the least hand movement, and keeps bends away from the nut, where they're hard to play.

Second, [on the Tuner, bend a note, then hammer one on] a bend glides through every pitch in between, while a hammer-on jumps straight to the next note. That difference is how it tells them apart.

Third, [play the 12th and 7th fret harmonics] every note contains higher overtones, and distortion makes them loud. Riff Boi trusts the lowest pitch it hears, which is why early versions wrote notes an octave or a fifth too high.

## 8. Camera mode, in beta (2:55 to 3:15)
[Open Settings, turn on Camera (beta), tap Set up camera. Play the 3rd fret, then the 12th, on the low E. The fret lines appear. Then play a note.]

The camera adds the missing piece: the sound gives the note, and my hand gives the string. A two-note setup measures the neck. I considered an AI model that analyzes the video instead, but it would be slow, cost money for every image, and need a secret key. Measuring two frets is free and instant.

(Only if it gets the string right every time I test it. If not, show the setup, say it's in beta, and skip the last two sentences.)

## 9. Results and testing (3:15 to 3:55)
[Terminal: `node tools/score.mjs`, zoomed in on the TOTAL line. Then `tools/recordings/bend-G.txt` next to the tab it produced.]

To measure accuracy, I recorded myself and wrote down exactly what I played, and a scoring script compares Riff Boi's tab against it. It currently gets 116 of 118 notes right. My hardest test riff, Crazy Train, went from 8 of 31 notes to 29, with no wrong notes. It's tuned to miss a note rather than write the wrong one.

The scoreboard also catches mistakes. This week my own bends were coming out as three separate notes. The first fix broke Crazy Train, the scoreboard caught it, and we refined the fix until every recording passed.

## 10. What I learned (3:55 to 4:20)
[To the camera.]

The most important lesson was that a test only proves something if it can fail. I also learned to measure instead of guessing, because fixing one problem can easily create another. Now I can explain, step by step, how a guitar note becomes tab.

## 11. Closing (4:20 to 4:30)

Riff Boi is free at riffboi.com, with no account required. Plug in and play something.

[End card: riffboi.com and github.com/riff-boi/riff-boi]
