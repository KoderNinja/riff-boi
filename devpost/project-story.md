## Inspiration
I've played guitar for six years, mostly technical metal and instrumental stuff. When I improvise, I find riffs I want to keep, but the second I stop to write one down, the flow is gone, and half the time I forget the riff anyway. I wanted something where I just play and the tab shows up.

## What it does
Riff Boi listens to my guitar through the mic or my audio interface and writes the tab live while I play single notes. It hears string bends and writes them like real tab (`7b9`, `7b9r7`), draws the rhythm underneath like a tab site, and works out the tempo by itself. When I tap Stop, the riff is saved, so I don't lose it.

On a saved riff I can fix any note (drag it to another string, change the fret, mark a hammer-on, pull-off, slide or harmonic), play it back with a plucked-string sound, slow it down and loop it to practice, and copy it, share it with a link, or save it as a text file. It also gets the tab from an uploaded recording, tells me what key and scale a riff is in, and has a tuner. It runs in the browser at riffboi.com, with no account and nothing to install.

## How I built it
It's plain HTML, CSS and JavaScript, with no framework. The Web Audio API listens to the mic, and the Pitchy library works out the pitch 60 times a second. From there my code decides when a new note starts (a pick, a hammer-on, the same note picked again), follows the pitch to hear bends, picks a string and fret for each note, and reads the rhythm. Riffs are saved in the browser's localStorage, so there's no server. It's hosted on Vercel and updates every time I push to GitHub.

To know if a change actually made it better, I recorded myself playing riffs and wrote down exactly what I played. A scoreboard script runs Riff Boi on those recordings and counts right, missed and extra notes. Another script runs 230 automatic checks, so I don't break something that already worked.

## Challenges I ran into
- **Distortion.** My amp makes the overtones really loud, so Riff Boi kept hearing notes an octave or a fifth too high, or extra notes that weren't there. It follows the note name first and works out the octave separately, and ignores the overtones it knows distortion makes.
- **The tempo was stuck on 141.** Auto tempo only worked if every note fit one steady beat, so on real playing it gave up almost every time and quietly used the last tempo it found. I rebuilt it: now it tries every tempo and picks the one where the rhythm makes the most sense. On made-up riffs with normal human timing, it went from right 14% of the time to 76%.
- **Vibrato looked like picking.** Vibrato makes the volume pulse, and Riff Boi thought every pulse was a new note. Looking at the numbers, a real pick blurs the pitch for a moment and vibrato doesn't, so that's how it tells them apart now.
- **Bends that pause.** When I paused halfway through a bend, Riff Boi wrote three separate notes. Now a pause between two notes keeps the bend going, as long as it isn't sitting on a real note.

## Accomplishments that I'm proud of
On my test recordings, Riff Boi gets 113 of 115 notes right (98%) and puts all 84 checked notes on the right string. It works live on my real rig with distortion, not just on clean sound. And every change was measured before and after, so I know it got better instead of guessing.

## What I learned
How sound turns into numbers: pitch, clarity and volume, and why distortion makes pitch detection hard. How to test with real recordings and a scoreboard instead of just trying it and hoping. That a fix for one problem can break something else, which the tests caught more than once. And how to plan a project, cut features, and ship it live with a real domain.

## What's next
A camera mode (it's in beta already) that watches my fretting hand to pick the right string, hearing natural harmonics by themselves, Drop D and other tunings, chords, a bass version, and an iPhone app.

## How I used AI
I built Riff Boi with Claude Code as my pair programmer. The idea, the features, the design, and what to cut were my decisions. I played and labeled the test recordings and tested everything on my guitar and phone. Claude Code wrote most of the code and the tests, explained how it worked as we went, measured the accuracy on my recordings, and helped write the docs. It also drafted this story from my notes, and I edited it.
