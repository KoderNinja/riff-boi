# Riff Boi

"I play a riff and the tabs just show up."

I've played guitar for six years, mostly technical metal and instrumental stuff. When I improvise I find riffs I want to keep, but stopping to write them down by hand kills the flow. Riff Boi listens while I play, writes the tab as I go, and saves the riff so I don't lose it.

I made it for the [Beginner's Paradise – FirstCommit](https://firstcommit.devpost.com/) hackathon (2026).

**Try it:** https://riffboi.com (allow the mic when your browser asks)

## What it does

- Writes tab live while you play single notes.
- Hears string bends and writes them like real tab: `7b9` for a bend, `7b9r7` for a bend and release, `7pb9r7` for a pre-bend.
- Draws the tab like a tab site (Songsterr style): string lines with the fret numbers on them, bar lines, and the rhythm underneath, at the tempo you set, in the time signature you pick (2/4 to 12/8). It can also work out the tempo from how you played (Auto detect tempo), and you can fix a saved riff's tempo by typing it. You can turn off Show note lengths to just see the notes.
- Saves each riff to a Latest Riffs list that's still there next time you open it. You can rename or delete riffs there.
- Shows how sure it is about the tab, with a hint when something's off, like background noise or an out-of-tune guitar.
- Lets you write a tab by hand too (New Tab): pick a string, a fret and a note value for each note.
- Plays a riff back with a plucked-string sound, so you can hear what the tab says. For practice it can slow down (75% or 50%), loop, and click on the beat.
- Lets you fix a saved riff's tab: drag a note to another string (the string is a best guess), or tap it to change its fret or delete it.
- Copies a riff as text tab (with bar lines), to paste into a message or a forum.
- Says which key and scale a riff sounds like, like E minor pentatonic.
- Shares a riff with a link: the riff is packed into the link itself, so nothing is uploaded anywhere.
- Gets the tab of a recording too: upload an mp3, wav or m4a.
- Has a tuner built in.
- Lets you pick your mic or audio interface, remembers it, and tells you when it can't hear your guitar.

## Run it

The quickest way is the live version at https://riffboi.com. To run it on your own computer instead, you'll need Chrome (other modern browsers should work too), Python 3 for a small local server (Macs usually have it already), a mic or an audio interface, and internet the first time the page loads, because it downloads the pitch detection library.

```
git clone https://github.com/riff-boi/riff-boi.git
cd riff-boi
python3 -m http.server 8000
```

On Windows, try `py -m http.server 8000` if `python3` doesn't work. No git? Click Code, then Download ZIP on GitHub, unzip it and open a terminal in that folder.

Then open http://localhost:8000 in Chrome, click New Riff, allow the mic and play some single notes. Click Stop to save the riff.

The server is needed because browsers block the mic and JavaScript modules on a page opened straight from a file. On localhost they're allowed.

No guitar around? A piano or keyboard app playing single notes should work too, or upload a recording of single notes.

If it can't hear your guitar, add `?debug` to the address (like https://riffboi.com/?debug). The Recording and Tuner screens then show what the mic is picking up: how loud and how clear the sound is, its pitch, and whether the browser's sound is running.

## How it works

The browser's Web Audio API listens to the mic 60 times a second, and [Pitchy](https://github.com/ianprime0509/pitchy) works out the pitch of each slice of sound and how clear it is. `js/notes.js` turns those pitches into notes. It decides when a new note starts (a pick, a pitch change, a hammer-on) and ignores harmonics and background noise. It also follows the pitch closely to hear bends: a bend glides smoothly through the pitches in between, while a hammer-on or slide jumps from fret to fret. `js/tab.js` picks a string and fret for each note. The sound can't tell you which string you played, so it goes with the spot that needs the least hand movement. `js/rhythm.js` turns when each note started into note values (quarter, eighth and so on) using your tempo and time signature, and it can work out the tempo from your playing when Auto is on. `js/tabsvg.js` draws the tab picture. `js/confidence.js` scores how clear, in tune, quiet and steady the notes were, and `js/editor.js` turns a tab you write by hand into the same kind of riff, `js/playback.js` plays a tab back with a plucked-string sound made from noise (the Karplus-Strong trick), `js/upload.js` reads a recording with the same steps as listening live, just all at once, `js/scale.js` works out the key and scale, `js/share.js` packs a riff into a link, and `js/storage.js` saves riffs in the browser's localStorage, so there's no server and no accounts.

The full plan is in [`devpost/spec.md`](devpost/spec.md).

## Built with

Plain HTML, CSS and JavaScript (no framework), the Web Audio API, Pitchy 4.1.0 from the jsDelivr CDN, localStorage, and the UnifrakturCook and Oswald fonts from Google Fonts. Node.js is only used for the test scripts.

## Tests

With Node.js 18 or newer:

```
node tools/check.mjs
node tools/score.mjs
```

`check.mjs` runs 167 checks on the note, bend, rhythm, time signature, tempo, tab, confidence, input picker, saving, tab editor, playback, upload, scale finder and share link logic, no guitar needed. `score.mjs` scores Riff Boi against recordings of me playing, where I wrote down exactly what I played. Right now it gets 110 of 115 notes right (96%) and puts all 83 checked notes on the right string.

## What it can't do yet

It only hears single notes, so no chords or power chords yet. It assumes standard tuning. The string and fret are a best guess, because the sound doesn't say which string you played (drag a note on a saved riff to move it). A really soft first note can get missed. A pre-bend only shows up once you release it, since until then it sounds just like a normal note, and a very slow bend (slower than about 0.4 seconds for a whole step) can come out as separate notes. Auto tempo needs a steady beat and at least 4 notes, and it can come out at double or half speed (you can type the right tempo on the saved riff). On an iPhone, the silent switch can mute playback. Uploaded recordings can be up to 5 minutes long.

## How I made it

My planning docs and learning log are in [`devpost/`](devpost/): the scope, the product plan, the tech spec, the build checklist and notes on what I learned along the way.

## AI use

<!-- Colton: write this part yourself: what Claude Code helped with, and what you decided and did. -->
Coming soon.

Made by [KoderNinja](https://github.com/KoderNinja).
