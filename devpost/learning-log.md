# Learning Log

What I learned and the problems I solved while building Riff Boi. I'm using this for my demo video and write-up.

## Sep 25, 2026: Getting started (`/1-start`)
- Instead of just asking the AI for stuff, I let it interview me first (it calls this "flipped interaction"), so the project is built on my ideas and decisions.
- I planned before building: scope, then the PRD (what it does), then the spec (how it's built), then build and ship.
- A `.gitignore` file tells git which files to never commit. I used it to keep my personal learner profile and any `.env` secret files out of my public repo.
- My starting idea: an app where I play guitar and it writes out the tabs.

## Sep 25, 2026: Scoping (`/2-scope`)
- A proof of concept is the smallest version that proves the idea works. Mine: "I play a riff and the tabs just show up."
- The real problem I'm solving: I lose riffs I find while improvising, because writing them down breaks my flow.
- Computers can pick out single notes a lot more easily than chords, because the notes in a chord blend together. So single notes come first and power chords come later.
- I cut the camera idea (seeing which string and fret I'm on). It's a hard computer vision problem and way too big for 5 days.
- Still open: audio gives you the pitch but not the string, so the app has to guess the fret position.

## Sep 25, 2026: Product requirements (`/3-prd`)
- A PRD is a non-technical description of exactly what the app does: the screens, the buttons, what you see, and how to tell it works.
- Acceptance criteria are checkable statements like "playing a note makes a fret number appear", so I can test each part.
- A tradeoff I made: one tap to start (from a list of riffs) instead of listening the second the app opens, because I wanted my riffs saved in the app.
- Audio can't tell which string a note was played on. Instead of building an editing feature, I went with a simple rule that picks a playable spot. Editing is next in line if there's time.
- I planned the "what if" cases: no riffs yet, no mic permission, and when the app can't hear the guitar.
- I named it Riff Boy. Dark, metal, black and red.

## Sep 25, 2026: Technical plan (`/4-spec`)
- A tech spec is the blueprint for how the app gets built: the tools, the files, and how data moves between them.
- I pictured a phone app, but I went with a mobile-first web app to start. The browser can already use the mic, it's free to put online, and it can go on my phone's home screen.
- HTML is the structure, CSS is the look and JavaScript is the behavior. No framework, so I can understand every file.
- The Web Audio API is the browser's sound toolkit, and Pitchy is a small library that tells you what note it hears and how sure it is (the "clarity" score).
- localStorage is the browser's notebook for one website. That's where my riffs are saved, with no accounts or server.
- GitHub Pages is free hosting from a GitHub repo. Phones only allow the mic on secure (https) sites, so I need a host like that to test on my phone.
- My decision: add an input picker so I can use my audio interface for better precision. It remembers my choice.
- My big question was how precise it would be. That depends on a clean signal, figuring out where one note ends and the next begins (the hardest part), how fast I play, and tuning. The plan: play a known riff slow, fast and distorted, and count the right, missed and extra notes.

## Sep 25, 2026: Build slice 1, hearing notes (`/5-build`)
- I build in slices: small steps I can actually try, each one tested and saved before the next. The riskiest part (the mic and Pitchy) went first so problems would show up early.
- `git init` made my folder a repository, and each commit is a saved checkpoint I can go back to.
- `python3 -m http.server 8000` runs my app at http://localhost:8000. I need it because the mic and JavaScript modules don't work when you just double-click the file.
- About 60 times a second the app grabs a slice of sound, Pitchy says the pitch and how sure it is, and `notes.js` turns the frequency into a note name (110 Hz is A2). Unclear, quiet or out-of-range sounds get ignored.
- Browsers clean up mic sound for voice calls (echo and noise removal, auto volume). That would mess up a guitar, so I turned it off.
- Claude tested with fake tones and I tested with my real guitar. The notes matched.

## Sep 25, 2026: Build slice 2, live tab (`/5-build`)
- The app hears a ringing note about 60 times a second, so it needs rules for when a new note starts: a steady pitch after silence, a pitch change, or a volume jump (the pick hitting the string again).
- Audio gives the note but not the string, so Riff Boy picks the fret closest to my last one.
- Everything passed with clean test tones, but my real guitar (laptop mic, slightly distorted amp) added a bunch of random notes. Distortion adds harmonics, extra pitches an octave or a fifth up, and those fooled the detector.
- The fix: notes I didn't pick (hammer-ons and pull-offs) have to hold a bit longer, and unpicked octave or fifth jumps get ignored as harmonics. After that it got the right notes.
- The `?debug` recorder saves everything the app heard to a file, so we can replay real playing while tuning instead of guessing.
- I renamed it from Riff Boy to Riff Boi.

## Sep 25, 2026: Making note detection accurate with real data
- I recorded myself playing the Crazy Train riff with `?debug`, and we replayed that recording through the code after every change, scoring it against the notes I really played. It went from 8 to 26 of 31 notes correct.
- What was wrong: with a laptop mic and distortion, the detector often heard the octave above the real note, some real notes were just under the clarity limit, and my amp and room made the volume pulse about 6 times a second, which looked like extra picks.
- The fixes: follow the note's name first and pick the lowest octave heard (a guitar note's real pitch is its lowest), accept slightly less clear readings, and only count a repeated note if it's nearly as loud as the note's first attack.
- I tried several settings side by side and kept the one with the fewest total mistakes, not just the most correct notes.
- `node tools/check.mjs` re-runs all the logic checks with one command, so a fix can't quietly break something that used to work.
- Strings are still a guess, since audio can't tell which string you played. The rule now imagines a 4-fret hand box and avoids jumping strings, which fixed my Crazy Train opening.
- New ideas: a built-in tuner (added to the plan) and a tuning setting like Drop D (saved for later).

## Sep 25, 2026: My own test set (my idea!)
- I recorded myself playing frets 1 to 12 on every string and wrote down exactly what I played (the "ground truth"). Every change to Riff Boi now gets scored against my answers, for notes and strings.
- `node tools/score.mjs` scores every recording at once. Result: 97 of 103 notes and 72 of 72 strings right.
- The data showed that one small mistake snowballs. A stray note or one wrong octave pulled whole runs onto the wrong string, and fixing the first mistake fixed the whole run.
- Quiet sounds before I started playing were showing up as notes, so Riff Boi now drops notes that are much quieter (under 35%) than my typical note. I picked 35% by measuring: the noise was 14 to 22%, and my real notes were 56% or louder.
- Overfitting: if you tune on the same recordings you test on, the score can look better than it really is. The fair test is a new riff that wasn't used for tuning.

## Sep 25, 2026: Code review and a fair test
- Separate AI reviewers tried to break Riff Boi's logic, and other reviewers double-checked every problem they reported. 9 real problems were confirmed. For example, picking the same note twice was often lost, and on a 120 Hz screen the app would have taken readings twice as fast and broken.
- For each problem we wrote a check first, watched it fail, then fixed the code and watched it pass. That proves the check really tests the problem.
- One bug was in my own earlier fix: a pedal riff (open low E, a high note, back to E) was getting "corrected" into the wrong octave. No test covered it until we thought about how metal riffs actually work.
- The fair test was my pentatonic at the 6th fret, which was never used for tuning. It scored 10/12 notes and 6/10 strings before the fixes, and 11/12 and 11/11 after.
- The sound can't tell the 6th-fret box from the 1st-position box, so Riff Boi now tries every place you could have started and picks the one that needs the least hand movement.
- Scoreboard now: 110/115 notes (96%), 0 wrong notes, 83/83 strings.

## Sep 25, 2026: Putting Riff Boi on GitHub
- I made my first public repo, since the hackathon needs one. It's now at https://github.com/riff-boi/riff-boi
- Then I made a free GitHub organization called `riff-boi` and moved the repo into it, so Matt can deploy it on Vercel. Vercel's free plan only deploys repos you own, or public repos in an org you belong to. GitHub forwards the old address to the new one.
- My 8 commits went up exactly as they were, with their original dates, which shows the work happened during the hackathon.
- My learner profile, `.claude/` and `.DS_Store` never left my Mac, because of `.gitignore`.
- A remote is the copy of my repo on GitHub, and pushing sends my new commits there. Claude now builds in a cloud session and pushes each checked step, and I test it with my guitar on the live link.

## Sep 25, 2026: Build slice 6, confidence bar
- Riff Boi now shows how sure it is about a riff, from 0 to 100%, live while I play and saved with each riff. It combines four things it can measure about the sound: how clear the tone is, how in tune it is, how much background noise there is, and how steady the notes are.
- It only judges the sound. It can't know if a string guess is right, so a high score means the notes are probably right, not that the tab matches where I played.
- The hint names the weakest part, like "Lots of background noise" or "Guitar may be out of tune. Try the tuner", so I know what to fix.
- Crazy Train (laptop mic and distortion, my least accurate recording) gets the lowest score, 51%. My fret runs get 84 to 100%.
- To prove the new checks really work, Claude broke the confidence code on purpose in 5 different ways in a copy of the project, and a check caught it every time. That's called mutation testing.

## Sep 25, 2026: The Metal look
- Claude built two versions of a new layout and showed me real screenshots, and I picked the Metal one.
- New Riff is now a big round record button, each saved riff shows a mini tab and its confidence, and the recording screen has a REC timer, the last note big, and Stop at the bottom where my thumb is.
- Then I asked for it to look less AI-made but still professional, so the glowing gradients came out. It's flat red now, with sharp corners and a fine grain.
- The angled corners are CSS `clip-path`, which cuts the corners off a box. The grain is a tiny SVG noise pattern repeated behind everything.
- Animations turn off for people who set their device to reduce motion, and keyboard users still get a visible outline inside the angled buttons.
- I picked the app icon too: the blackletter R from my logo. A small file called a web app manifest tells my phone the app's name, colors and icon, so "Add to Home Screen" opens Riff Boi full-screen like a real app.

## Sep 25, 2026: String bends (my request)
- A bend and a hammer-on can end on the same note, so how do you tell them apart by sound? A bend glides smoothly through the pitches in between, and a hammer-on or slide jumps straight from fret to fret. Riff Boi now follows the pitch with decimals (like the tuner) and waits for it to settle before deciding.
- It writes bends the way tab sites do: `7b9` (bend), `7b9r7` (bend and release) and `7pb9r7` (pre-bend). A pre-bend only shows up once I release it, because before that it sounds exactly like a normal higher note.
- The first version broke one note in my Crazy Train recording. A sloppy note change from A2 to G#2 slid down and stopped 0.7 semitones below A2, and Riff Boi called it a pre-bend. Real bends stop right on a note, so now anything that stops between two notes goes back to the normal note rules.
- I tried making it stricter so very slow bends don't get split up. Side by side on my recordings, that lost 6 or 7 real notes, because real notes drift in pitch as they ring. So I kept the version that loses nothing: 110/115 notes and 0 false bends. The catch is that bends slower than about 0.4 seconds for a whole step can come out as separate notes.
- Claude broke the bend code on purpose in 6 ways, and at first two of the breaks got past the checks. Fixing those checks meant copying the exact numbers from my real recording (to 6 decimal places), because the same numbers rounded to 2 decimals took a different path through the code.

## Sep 25, 2026: Note values, drawn like Songsterr (my request)
- To know whether a note is a quarter or an eighth, Riff Boi needs the tempo. I set it myself (BPM) on the home screen, because guessing a tempo can come out double or half speed.
- Each note's start gets snapped to the nearest sixteenth note at that tempo, so notes that are a little early or late still come out right. A note lasts until the next one starts.
- The tab is now a picture (SVG, shapes written as code) like Songsterr: string lines, bar lines, the tempo, bends as arrows, and stems and beams under the tab for the rhythm. I picked this look from 3 real options.
- A bug I noticed with Claude: my last note always came out as a whole note, because it lasted until I tapped Stop. Now it ends when the guitar goes quiet.
- A test can be wrong too. One check expected a quarter note at 60 BPM, but half a second at 60 BPM really is an eighth note, so we fixed the check, not the code.
- A Rhythm switch turns it all off, for when I just want the notes.

## Sep 26, 2026: Moving from the cloud to my Mac
- A cloud session runs on a computer in the cloud. A local session runs on my Mac, with the files in my own folder.
- GitHub wouldn't let the cloud session push to my new org, because the Claude GitHub App isn't installed there. So my newest commits came to my Mac in a zip, with the whole history inside the hidden `.git` folder, and I push them to GitHub from my Mac with my own login.
- A new session doesn't remember the old one. Claude Code reads `CLAUDE.md` at the start of every session, so I gave it a "Starting a session" part, and the to-do list has a "Next up" part that says where we left off.

## Sep 26, 2026: Getting the cloud work onto my Mac and up to GitHub
- The zip had a newer copy of the whole project, history and all (in `.git`). Instead of copying files over, git fetched the 11 new commits straight from the unzipped folder and fast-forwarded my `main`. The zip's history started at my last commit, so there was nothing to merge.
- My unsaved changes were an early copy of the confidence bar. They went on the stash shelf (`git stash list`), not in the trash, just in case.
- Committing and pushing are different. A commit is saved on my Mac. A push sends it to GitHub, and GitHub has to know it's really me.
- Being logged in to GitHub in Chrome doesn't log git in. The Terminal asked for a username and password, and GitHub won't take my real password there, only a token.
- The error tells you what's wrong. "Invalid username or token" meant GitHub didn't recognize what I pasted. "Permission denied" (403) meant it knew it was me, but the token wasn't allowed to change the repo. A token made for my own account can't push to my org's repo: its resource owner has to be the org.
- What finally worked was GitHub's own command-line tool, `gh`. I approved it in the browser with a one-time code, so there was no token to copy, and now pushing from my Mac just works.
- A pull request asks to merge a branch into `main`. My 9 commits went on a branch called `input-picker`, I opened pull request #1 and merged it, and Vercel saw the new `main` and updated riffboi.com by itself.

## Sep 26, 2026: Input picker and "Can't hear your guitar" (slice 4)
- Browsers keep the names of your mics and interfaces secret until you allow the mic once, so the dropdown says "Default input" until my first riff.
- If my interface is unplugged, Riff Boi uses the default input instead of failing, and picks the interface again when it's back.
- The 5-second check counts readings (60 a second) instead of watching the clock, so time spent on the mic permission popup doesn't count.
- Different problems get different messages: a blocked mic, an input that won't open, silence, or no internet for the pitch detector. Each one says what to try.
- Claude tested it without a guitar by giving the browser a pretend mic that plays a test tone. The automatic checks do the same in Node (91 checks now).

## Sep 26, 2026: Code review, and why my iPhone couldn't hear
- I tried Riff Boi on my iPhone (Chrome, with my amp) and the timer ran but no notes showed up. Every browser on an iPhone uses Apple's engine, and it often starts the sound system paused, even right after you tap a button. Paused means Pitchy only gets silence. Riff Boi now asks it to start in the tap, again once the mic is open, and every time the phone pauses it (like a call or Siri).
- Claude can't test on an iPhone, so it made the test browser act like one: every sound system starts paused. The old code wrote no notes, just like my phone, and the fixed code heard all 8. Faking the problem first proves the fix really fixes it.
- `?debug` now shows the mic's numbers on screen: how loud and clear the sound is, its pitch, whether the sound system is running, and the phone's voice clean-up settings. If my phone still can't hear, one test shows why.
- The code review found 2 more real bugs. With distortion, Pitchy hears the octave above for a moment and Riff Boi fixes the note, but the bend tracking kept the wrong octave, so a bend on that note came out as 3 notes (`B3 B4 B5` instead of `B3b5`).
- The other: my last note is supposed to end when the guitar goes quiet, but "quiet" was a fixed volume. In my Crazy Train recording, the amp hiss is louder than that, so the last note lasted until I tapped Stop again. Now the last note lasts while its own pitch can still be heard. Hiss is loud but has no pitch. We tried several rules on all 8 of my recordings, with 3 seconds of each one's own room noise added before Stop. Every rule that only looked at the volume got fooled on at least one recording. Following the note's own pitch (two readings in a row) never did.
- Claude broke each fix on purpose (6 ways) and a check caught every one. 99 checks now, and the scoreboard didn't change (110/115 notes, 83/83 strings).

## Sep 26, 2026: When my Mac and the cloud both had new commits
- My Mac had a commit the cloud never saw (a fix for missing bar lines after a long rest, and for an old Pitchy start switching off a new riff's mic), and the cloud had 6 commits my Mac never saw. Git calls that a split history, so it couldn't just fast-forward.
- I picked a rebase: git took my Mac's commit off, added the cloud's 6, then put mine back on top, so the history is one straight line. A merge would have kept both lines and joined them.
- A conflict is when both sides changed the same line. Here it was only the README's check count (92 on my Mac, 99 in the cloud). The right answer was neither: 100, because both sides added checks.

## Sep 26, 2026: The Rhythm switch only changes the new riff
- The switch was a setting that every saved riff read when it was drawn, so flipping it changed all of them. The fix: each riff saves whether rhythm was on, like it already saved its tempo.
- Old riffs don't have that saved. Code has to decide what missing data means, so old riffs count as rhythm on.

## Sep 26, 2026: Time signatures and Auto tempo
- The tempo always counts quarter notes, so a bar is the top number × 4 / the bottom number, in beats. 3/4 is 3 beats and 7/8 is 3½. I picked 7/8 grouped 2+2+3.
- Auto works out the tempo when I tap Stop. It looks for the longest steady beat that all the gaps between my notes fit, and lets 1 note in 8 be a bit early, late or extra.
- The sound can't tell a riff at 180 from the same riff at 90 with notes twice as short. So Auto picks a tempo from 80 up to 160, and if it's wrong, I type the right one on the saved riff. With under 4 notes or no steady beat, it says it can't tell instead of guessing.
- Mutation testing found a hole in the checks: I changed the tempo range and nothing failed, because none of the test riffs were between 140 and 160. A new riff at 150 now catches it. 129 checks.
- The browser kept an old copy of one file after switching branches, so the page mixed new and old code and broke ("does not provide an export named barOf"). A browser reuses saved copies of files to be fast, so after big changes, reload without the saved copies.

## Sep 26, 2026: Writing a tab by hand (New Tab)
- I picked the design: a New Tab button, tap a string, set the fret, pick a note value, Add note.
- The trick was making a written tab the same kind of thing as a recorded riff. A recorded riff keeps when each note started, in seconds. So the editor works out those seconds from the note values and the tempo, and then the tab picture, saving and the Latest Riffs list all work without changes.
- Changing the tempo means different things for the two kinds. For a recorded riff, the seconds are the truth (that's how I played it), so a new tempo changes the note values. For a written tab, the note values are the truth, so the notes move closer together or further apart instead.
- Testing it in the browser found a small problem the checks couldn't: Dotted stayed on from my last tab. Now New Tab starts fresh each time.

## Sep 26, 2026: Rename and Delete
- A button can't go inside another button. Each riff card is one big button, so Rename and Delete sit under it instead, and the name box replaces them while I type.
- Renaming saves a separate `name` and keeps the original date, so nothing is lost, and clearing the name brings the date back.
- Names are shown as plain text (`textContent`), never as HTML, so a name with `<` or `>` in it can't mess up the page.

## Sep 26, 2026: Playing a riff back
- The plucked-string sound is an old trick called Karplus-Strong. Start with a burst of random noise one loop long. Then each new sample is the average of the two samples from one loop back. Averaging smooths the noise, so it turns into a clean tone that fades like a real string, and the loop's length sets the pitch.
- A check measured the pitch and caught a bug: my loop averaged the wrong two samples, so it sounded half a sample short. That's tiny for low notes but about 24 cents flat on a high E, which you'd hear. Now every note is within 0.1 cents (measured in the browser with Pitchy, the same pitch detector Riff Boi uses).
- A loop can only be a whole number of samples long, so each note's loop plays a tiny bit faster or slower to land exactly in tune. Bends glide that speed up and down.
- The red "now playing" note first used animation frames, which browsers pause when the page isn't showing. The test caught it: the riff never finished. Timers keep running, so now it always finishes.
- Mutation testing showed two checks were too loose (turning off the fade, or leaving a steady offset in the sound, went unnoticed). I measured the real numbers and tightened them.

## Sep 26, 2026: Tabs from a recording (Upload and Try a sample)
- Live, Riff Boi takes a reading 60 times a second of the newest 2048 samples of sound. A file has all its samples at once, so the upload walks through them doing the same thing: a reading every 800 samples (48,000 a second / 60), each from the 2048 samples before that point.
- To be sure an upload gives the same notes as playing live, the steps from readings to notes are now in one shared function, and a check runs every recording through both ways. They match, down to the strings.
- The proof: my pentatonic mp3 in the browser gave exactly the tab the saved readings of the same recording give (11 of 12 notes, 85% confidence). Judges without a guitar can tap Try a sample and see it work.
- Mutation testing showed two lines that can't change anything, because the note tracker already fixes the note itself. Code that looks important but does nothing is worth knowing about. I kept them so it matches the live code.

## Sep 26, 2026: Moving a note to another string
- The sound says which note, not which string, so Riff Boi guesses the string. Now I can tap a note on a saved riff and pick another string for it, and the riff saves my choice.
- The tab is one picture for screen readers, so the notes inside it aren't real buttons. The strings to pick from are real buttons under the tab, and a note can also be reached with Tab and Enter. After moving, the keyboard focus goes back to the note so you don't lose your place.

## Sep 26, 2026: Copy as text tab
- Copy puts the riff on the clipboard as plain text tab, with bar lines where each bar starts, so I can paste it into a message or a forum.
- Browsers only let a page copy right after a real tap, and some block the newer way to copy completely (the test browser did, even on a real click). So Riff Boi tries the newer way, then the older one: put the text in a hidden box, select it and copy. Testing on the strictest browser found this.

## Sep 26, 2026: Which key and scale a riff is in
- Riff Boi tries 7 scales starting on each of the 12 notes (84 in all) and keeps the one with the fewest notes outside it. When several fit, the "home" note decides (the first note counts most, then the lowest, then the last), then the smaller scale.
- Many scales share their notes: C major and A minor are the same 7 notes, just with a different home. So Riff Boi names both, like "C# major pentatonic (the same notes as A# minor pentatonic)" for my sample. My sample starts on C# because the first A# was missed; with it, it says A# minor pentatonic.
- Mutation testing changed the design: the tests didn't notice when I swapped two rules. Trying a riff that lives on A showed the order matters: size first said "E minor pentatonic", home note first says "A minor", which is what a guitarist would say.

## Sep 26, 2026: Sharing a riff with a link
- The whole riff fits in the link: it's turned into short text (JSON), then into base64, which is letters and digits that are safe in a link. It goes after a `#`, and browsers never send that part to the website, so no server or account is needed and nothing is stored anywhere.
- Anyone can type any link, so the app treats a link like a stranger's input: it checks every value before using it (a string and fret must really make the note it says, there can't be a string 7, and so on) and turns down anything odd.
- A test only proves something if it can fail. My first test link happened to have no `+` or `/` in it, so removing the code that makes links safe went unnoticed. A riff name that produces both fixed the test.

## Sep 26, 2026: Practice: speed, loop and click
- Slowing a riff down only changes when the notes play, not their pitch, because each note's sound is made on its own. Half speed just means every time is doubled.
- Loop needed playback to say whether a riff finished or was stopped: finished means go round again, stopped means stop.
- To check the click in the browser, I measured the sound at 1500 and 2000 Hz with and without Click: about 9 dB louder with it. Measuring with and without is the fair test, because the plucked notes have some sound up there too.

## Sep 26, 2026: Dragging notes to another string
- Dragging uses pointer events, which work the same for a mouse, a finger or a pen: pointerdown on a note, pointermove while it moves, pointerup to drop it. "Pointer capture" keeps the moves coming even when the finger slides off the little number.
- To know which string line the finger is over, the app turns the screen position into the tab picture's own coordinates and picks the closest line.
- On a phone, dragging down normally scrolls the page. `touch-action: none` on the notes tells the browser a drag there is ours.
- Testing kept breaking in a confusing way: the page loaded a new file next to an old saved copy of another file, so it couldn't start. The fix was a small test server that tells the browser never to keep old copies. When a test fails, check the test before blaming the code.

## Sep 26, 2026: Making real-time work better with distortion
- First I found out exactly which notes were missed, by lining up what Riff Boi heard against my answer keys, with times. All 5 misses were in distorted, fast playing (Crazy Train) or a soft first note.
- Looking at the raw readings showed why. With distortion, Pitchy often hears a short note's pitch blurry, or hears a whole fraction of it: a D3 (147 Hz) came out as 73 Hz (half), 37 Hz (a quarter) or 24.5 Hz (a sixth). The note only got 2 clear readings, and it needs 3.
- The fix: once a note has 2 clear readings, a blurry-but-in-tune reading, or a whole fraction of its pitch, can be its third. Those readings can never start a note by themselves, so noise can't make fake notes.
- Distortion also squashes the volume jump that shows a pick, so fast picked notes were treated like hammer-ons (4 readings). But a pick breaks the pitch up for a moment, so a break now counts as a new attack.
- 110 → 113 of 115 notes, with 0 wrong and no new extra notes, and notes land closer to when I played them. I kept the changes only because the numbers proved them, and I left the last 2 misses alone because fixing them risked fake notes.
- A test is only useful if it can fail: I checked that the new tests fail on the old code, and broke each new rule on purpose to make sure a test notices.

## Sep 26, 2026: How fast is real-time, and which string?
- I measured the delay: a note shows up about 64 ms after its pitch first appears (90% within 164 ms). The slow ones start with a blurry attack. Faster would mean trusting blurry readings, which is where fake notes come from, so it stays.
- Knowing the string from the sound is a real research problem: a thicker string is stiffer, so its overtones sit a little sharp (inharmonicity), and that can tell strings apart on a clean sound. To try it, Riff Boi needs the raw sound, not just pitch readings, so `?debug` can now save a WAV file. The plan is in `devpost/string-detection.md`.
- The raw sound is copied on the browser's audio thread by an AudioWorklet, a small piece of code that gets every 128 samples as they come in.

## Sep 26, 2026: Fading the notes Riff Boi isn't sure about
- Each note already had a quality score from its first readings (clear, steady, in tune). Notes under 0.4 are now drawn faded, so I know which to check, and dragging or changing one un-fades it.
- I checked what the scores look like on my recordings before picking the line: 93 of 114 notes score 80 or more, and the 10 under 40 are exactly the hardest ones.
- The checks on real recordings caught a bad first idea: also fading notes whose octave was fixed made a clean G3 look unsure. An octave fix is routine, so it doesn't count anymore.

## Sep 26, 2026: Easier to read, easier to start
- Text has to stand out enough from its background to be easy to read: the guideline is a contrast of 4.5 to 1 for normal text. White on my red buttons was 4.43, just under, and small red text on the dark background was 3.5. One red can't do both jobs (dark enough behind white text, light enough as text on black), so there are two now, and the button red changed so little you can't see it.
- The empty home screen now says how to start, and on a computer, Space starts and stops recording. Space already presses whatever button is picked, so the shortcut stays out of the way when a button or box is in use.

## Sep 26, 2026: Count-in, and when is a note "played"?
- The count-in plays one bar of clicks, then listening starts on the downbeat, so my first note lands on a beat and the bars line up with how I really played.
- Testing it showed something hidden: Riff Boi writes down a note's time when it's SURE of it, 60 to 100 ms after I played it. That never mattered before, because the rhythm counted from my first note and every note was late by the same amount. With a count-in, the downbeat is fixed, so the delay pushed notes a sixteenth late.
- I tried stamping each note when it was first heard instead. The timing got less even, because that first reading isn't always the real start. So the times stay as they were, and only the count-in takes a fixed 60 ms off. Measuring before and after is how I knew which idea was better.
- The lag: the only part the app controls is waiting for 3 clear readings (33 ms), and cutting it to 2 let fake notes in (2 wrong, 3 extra). The rest is the attack of the note and the mic.

## Sep 26, 2026: Hammer-ons, pull-offs and slides in the tab
- The tab can show them now, like real tab: an arc with h or p, or a slanted line for a slide, and Copy writes `5h7` or `7/9`. For now I mark them by hand on a saved riff.
- Riff Boi already knows when a note started without a pick, so I measured whether that could mark them: it would have marked 5 of 114 notes on recordings where I (I think) picked everything, so about 1 mark in 23 would be wrong, and it can't tell a hammer-on from a slide. Detecting them for real needs recordings where I write down what I played (`devpost/test-recordings.md`).

## Sep 26, 2026: Showing the note right away
- The tab can't safely confirm notes faster, so the Recording screen now shows the note name as soon as it's heard, in gray, and it turns red when the tab is sure.
- I measured 6 ways to decide when to show the name, on my recordings: how early the right name shows up vs how often a wrong name flashes. The fastest was wrong 1 time in 3; the strictest was barely faster than the tab. The one I kept is 17 ms ahead and wrong about 1 time in 6, and gray makes it clear it isn't in the tab yet.

## Sep 26, 2026: Taking the count-in back out
- After trying the count-in, I didn't want it, so it's out. Taking a feature out cleanly is its own skill: every spot it touched went back to how it was before, and old riffs saved with it still open.

## Sep 26, 2026: Tempo that actually gets detected, and better rhythm
- Auto tempo looked stuck on 141. The real problem: it only worked if every gap between notes fit one steady pulse, so on real playing it gave up almost every time (87% of made-up riffs with normal human timing), and then it quietly used the last tempo it had found, which was 141.
- The new way tries every tempo from 80 to 160 BPM and asks "how likely is this rhythm at this tempo?", then keeps the best one. It's called the Viterbi algorithm: instead of snapping each note on its own, it looks at every way the whole riff could be written and picks the cheapest one, where timing errors, tempo drift and complicated beats all cost something.
- A faster tempo means a finer grid, and a finer grid fits any timing better, so at first it always picked tempos near the top. I had to add a cost that evens that out.
- "Modes" fixed the stray dotted notes: a riff of quarter notes stays quarters even when one note is 60 ms late, because switching to sixteenths costs more than one late note.
- I tested it on made-up riffs (15 rhythms, random tempos, timing wobble and drift) and on my recordings. With normal timing, it finds the tempo 76% of the time instead of 14%, and when it says it's sure, it was right every time in the test. All my steady runs now come out as clean quarter notes.
- Typing a new tempo on a saved riff now keeps the notes and plays faster or slower, and Detect tempo reads the rhythm again when the tempo was wrong.

## Sep 26, 2026: Bends that pause, and vibrato that isn't a pick
- My RIFFTEST.mp3 ended with an 8b10 bend with vibrato, and Riff Boi wrote 8-9-10-10-10. Looking at the pitch numbers showed two separate problems.
- The bend stopped for a moment about 2/3 of the way up. Riff Boi saw the pitch settle "between two notes" and decided it wasn't a bend. Now a pause at least half a step up, between two notes, keeps the bend going.
- My first try broke a real note in Crazy Train: a G#2 played sharp and an A2 played flat were only 2/3 of a step apart, so they looked like a paused bend. The fix: a pause can't be sitting on a real note. The scoreboard caught this, which is exactly why it's there.
- Vibrato makes the volume pulse, and Riff Boi took each pulse as a new pick. The difference I found in my recordings: a real pick on a ringing string blurs the pitch for a moment (or makes the volume jump all at once), and vibrato just swells. Now RIFFTEST comes out right, and the scoreboard didn't change.

## Sep 26, 2026: Saving a riff as a file
- Save .txt saves the same tab as Copy into a text file. The browser makes the file from the text in memory (a Blob) and downloads it, so there's still no server. File names can't have / or :, so a riff called "Sep 26, 9:26 PM" saves as "Sep 26, 9.26 PM.txt".

## Sep 26, 2026: Marking natural harmonics
- A harmonic at the 12th fret is the exact same note as fret 12, so Riff Boi can't hear the difference yet (the tone is purer, which might work later). For now I mark them by hand: tap a note and pick where it was played as a harmonic, and the tab shows `<12>`.
- The math: touching the string over the 12th, 7th, 5th and 4th frets gives notes 12, 19, 24 and 28 semitones above the open string. So E4 can be a harmonic at the 7th fret of the A string or the 5th fret of the low E.
