# Riff Boi demo video script (about 4 minutes)

What to show is in [brackets]. Say it the way you'd actually talk; it doesn't need to be word for word. Swap in whatever riff you really play.

## 1. Intro (0:00 to 0:20)
[You with your guitar, or the home screen]

Hey, I'm Colton. I've been playing guitar for six years, mostly metal and instrumental stuff. When I'm improvising, I come up with riffs I actually like, but by the time I stop to write them down, they're gone. So I made Riff Boi. You play, and the tab writes itself.

## 2. Live demo (0:20 to 1:50)
[riffboi.com in Chrome]

This is Riff Boi. It runs right in the browser, so there's nothing to download and no account.

[Tap New Riff and play a riff with a bend]

I hit New Riff and just play. The note I'm playing shows up right away in gray, and it turns red once it's in the tab. That bend? It writes it like real tab. And underneath, it's writing the rhythm, like Songsterr does.

[Tap Stop]

When I hit Stop, it saves the riff. I have Auto detect tempo on, so it figured out the tempo just from how I played.

[Open the riff, tap Play under "Your sound"]

It also keeps my actual sound, so I can listen to exactly how I played it right next to the tab, or download it.

[Tap a note, change the fret, drag one to another string, mark a hammer-on]

If it guessed something wrong, I can tap a note and change the fret, drag it to another string, or mark a hammer-on, a slide or a harmonic.

[Play, set Speed to 75%, turn on Loop]

I can play it back, slow it down, and loop it to practice.

[Tap Share or Save .txt]

And I can share it with a link or save it as a text file.

[Upload RIFFTEST.mp3]

It works on recordings too. I'll upload one, and there's the tab, bend and all.

[Open the Tuner for a few seconds]

And there's a tuner built in.

## 3. How it works (1:50 to 2:40)
[Show devpost/video/how-it-works.png]

So how does it work? The browser listens to the mic about 60 times a second. A library called Pitchy tells me the pitch and how clear the sound is. Everything after that is my code. It decides when a new note actually starts, whether I picked it or hammered it on, and whether the pitch is bending or jumping to a new note. Then it picks the string and fret, reads the rhythm, and draws the tab.

## 4. The tech (2:40 to 3:00)
[The code, or the GitHub page]

It's all plain HTML, CSS and JavaScript, no framework. The Web Audio API handles the sound, Pitchy finds the pitch, and riffs save right in the browser, so there's no server. It's hosted on Vercel at riffboi.com.

## 5. Challenges (3:00 to 3:50)
[Terminal: run `node tools/score.mjs`, then `node tools/check.mjs`]

The hardest part was making it accurate on my real rig. Distortion makes the overtones really loud, so at first it kept writing notes an octave or a fifth too high. The tempo was another one. It kept saying 141 no matter what I played, because it only worked if you played perfectly on the beat. I rebuilt it so it tries every tempo and keeps the one where the rhythm makes the most sense.

To know if a fix actually worked, I recorded myself and wrote down exactly what I played. This script scores Riff Boi on those recordings, and right now it gets 116 out of 118 notes right. And these 239 checks make sure a fix doesn't break something that already worked.

## 6. What I learned and what's next (3:50 to 4:20)
[Turn on Camera (beta), tap Set up camera, play the 3rd and then the 12th fret on the low E, and show the white fret lines on your neck]

I learned a ton about how sound works, and that you have to measure things instead of guessing. I'm also working on a camera mode, in beta. I play two notes so it learns where my frets are, and then it watches my fretting hand to pick the right string. You can try Riff Boi right now at riffboi.com. Thanks for watching!
