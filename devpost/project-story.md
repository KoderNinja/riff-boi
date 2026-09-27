## Inspiration
I've been playing guitar for six years, mostly technical metal and instrumental stuff. A lot of my best riffs come out when I'm just messing around, and I've lost so many of them because by the time I grab a pencil or open a tab editor, the riff's gone. I wanted to just play and have the tab write itself.

## What it does
You hit New Riff, play, and the tab shows up while you're playing. It catches bends (like **7b9**), shows the rhythm under the notes like Songsterr does, and can figure out your tempo on its own. When you hit Stop, the riff gets saved so you don't lose it.

After that you can fix notes if it guessed wrong, play the riff back, slow it down to practice it, or copy it, share it with a link, or save it as a text file. You can also upload a recording and get the tab from that. There's a tuner too. It all runs in the browser at [riffboi.com](https://riffboi.com). No account, nothing to download.

## How I built it
It's just HTML, CSS and JavaScript, no framework. The browser's Web Audio API listens to the mic, and a library called Pitchy figures out the pitch about 60 times a second. The rest is my code: deciding when a new note actually starts, noticing when the pitch bends instead of jumping, picking which string and fret to write, and working out the rhythm. Everything saves in your browser, so there's no server, and it's hosted on Vercel. The code is on [GitHub](https://github.com/riff-boi/riff-boi).

The thing that helped the most was testing with real recordings. I recorded myself playing and wrote down exactly what I played, and a script checks how many notes Riff Boi gets right. That way when I changed something, I knew if it actually got better or if I just thought it did.

## Challenges I ran into
Distortion was the first big one. My amp makes the overtones really loud, so Riff Boi kept writing notes an octave or a fifth too high, or notes I never played. It took a lot of trial and error to get it to trust the real note.

Then the tempo. It kept saying 141 BPM no matter what I played. It turned out the auto tempo only worked if I played perfectly on the beat, which nobody does, so it gave up and reused an old number. I rebuilt it so it tries every tempo and keeps the one where the rhythm makes the most sense.

Vibrato was a weird one. When I added vibrato to a note, Riff Boi thought I was picking it again and added extra notes. A real pick messes up the pitch for a split second and vibrato doesn't, so that's how it tells them apart now.

And bends: if I paused halfway up a bend, it wrote three separate notes. Now it keeps following the bend through the pause.

## Accomplishments that I'm proud of
On my test recordings it gets **116 out of 118 notes** right, every bend included, and puts 84 of 87 on the right string. And it works with my actual rig, distortion and all, not just a clean guitar.

## What I learned
Way more than I expected about how sound works: pitch, overtones, why distortion makes everything harder. I learned that fixing one thing can break another (that happened a lot), which is why the automatic checks matter. And I learned how to take an idea all the way to something live on a real website that other people can use.

## What's next
There's a camera mode in beta that watches my fretting hand to get the string right. After that I want it to hear harmonics, support Drop D, and maybe make a bass version.

## How I used AI
I built Riff Boi with Claude Code as a coding partner. The idea, the features and the design choices were mine, and I recorded and labeled the test riffs and tested everything on my guitar. Claude Code wrote most of the code and tests and explained it to me as we went. It also helped write this story from my notes, and I edited it.
