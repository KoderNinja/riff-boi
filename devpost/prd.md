---
doc: prd
status: approved
---

# Riff Boi — Product Requirements

An app for a guitarist to capture riffs while improvising. You play single notes, the tab appears live, and the riff is saved in the app so it isn't lost.
Source: `scope.md > The Unique Kernel`, `scope.md > The Core Loop`.

## The Core Journey
1. **Open the app.** The home screen shows a list of your latest saved riffs and a button to start a new riff.
2. **Tap the new-riff button.** The recording screen opens and the app starts listening right away. No setup.
3. **Play a single-note riff.** Each note you play appears as tab (a fret number on one of six string lines) and builds up live on screen as you go.
4. **Tap the stop button** when you're done.
5. **A "Saving..." confirmation** shows the riff being saved and where it's saved.
6. **Back on the home screen,** the new riff is at the top of the list.

Success is the moment in `scope.md > What "Working" Looks Like`: **"I play a riff and the tabs just show up"**, and the riff is still there afterward.

## Screens and Layout
- **Home: Latest Riffs.** A list of saved riffs, newest first, plus a clear button to start a new riff and an **input picker** for choosing the mic or audio interface. The app remembers your choice. *(Added in `4-spec`.)*
- **Recording.** The live tab area (six string lines with fret numbers appearing as you play) and a stop button.
- **Saving confirmation.** A "Saving..." message showing the riff being saved and where. It shows briefly, then returns home.
- **Riff view** *(assumption)*: tapping a riff in the list opens it so you can see its tab.
- **Tuner** *(added during the build)*: a button on the home screen opens a tuner that shows the nearest note and whether you're sharp or flat.

## Look and Feel
- **Dark theme**, "kinda metal looking."
- **Colors: black and red.**
- Should feel like it belongs with technical metal and instrumental guitar, not a generic app.

## Features and Behavior

### Starting a Riff
- The new-riff button starts listening immediately, with no settings or setup (`scope.md > The Core Loop`).
- [ ] Tapping the button opens the recording screen, and the app is listening without any extra steps.

### Live Note-to-Tab
- The app detects **single notes**, played one at a time (`scope.md > The POC Boundary`).
- Each detected note is placed on a string and fret using a **simple position rule**: pick a sensible, playable spot (for example, close to the previous note). The notes are right, but the position may not match where you actually played.
- Notes appear in order, left to right, as you play.
- [ ] Playing a single note on a real guitar makes a fret number appear on the tab within a moment.
- [ ] Playing a short riff shows the notes in the order played.
- [ ] Every shown position is a real, playable spot for that note in standard tuning.

### Stopping and Saving
- The stop button ends the riff and saves it inside the app.
- A "Saving..." confirmation shows what was saved and where.
- [ ] After tapping stop, the confirmation appears, and then the riff shows at the top of the home list.

### Latest Riffs List
- Home shows saved riffs, newest first.
- [ ] A saved riff is still in the list after closing and reopening the app.
- [ ] Tapping a riff shows its tab *(assumption)*.

## States and Boundaries
- **First use / no riffs yet**: the home list is empty *(assumption: a short message like "No riffs yet" next to the new-riff button)*.
- **Can't hear the guitar**: if no notes are detected (the microphone is blocked, the guitar isn't picked up, or it's just noise), the recording screen shows a message saying it can't hear the guitar.
- **Microphone permission**: the first time you start a riff, the device asks for permission to use the microphone. If you say no, you get the "can't hear the guitar" message.
- **Persistence**: saved riffs stay in the app between sessions.

## Product Decisions
- **Riffs are saved inside the app.** Capturing a riff isn't enough if it can be lost, and saving finishes the job.
- **Home is a list of your latest riffs, with a new-riff button.** You chose one tap to start instead of listening the moment the app opens.
- **A button stops the riff.** Simple and clear.
- **Saving confirmation shows what was saved and where**, so you know the riff is safe.
- **Simple position rule, no manual editing for now.** Audio can't tell which string you played. The demo's value is getting the right notes live; editing is a second feature that would cost about a day.
- **Dark, metal, black and red.**
- **In-app input picker on the home screen** *(decided in `4-spec`)*: lets you send your guitar through an audio interface for better precision. It remembers your choice, so starting a riff is still one tap.

## What We're Building
- Home screen with a list of latest riffs and a new-riff button
- Recording screen with live single-note detection → tab, and a stop button
- Simple rule for choosing a string and fret
- Saving riffs inside the app, with a "Saving..." confirmation
- Viewing a saved riff
- "Can't hear the guitar" message
- Input picker on the home screen (remembers your choice)
- A built-in guitar tuner *(added during the build)*
- A confidence bar showing how sure Riff Boi is about the tab, based on tone clarity, tuning, background noise and steadiness *(added during the build)*
- String bends written like real tab: `7b9` (bend), `7b9r7` (bend and release), `7pb9r7` (pre-bend, once it's released) *(added during the build, learner request)*
- Dark black-and-red metal look

## Deferred From the POC
- **Editing note positions** (tap a note to move it to another string): would fix wrong positions, but it's a whole second feature. It's first in line if the core works early.
- **Power chords:** detecting several notes at once is much harder (`scope.md > Later`).

## Possible Later Enhancements
- Renaming, deleting or exporting riffs.
- **Tuning setting** *(learner idea during the build)*: choose your tuning (e.g. Drop D) and the tabs use it.
- **Apple Watch version** *(learner idea during the build)*: a super-light version for the watch.
- **iOS app** *(learner idea during the build)*: the same app as a real iPhone app (e.g. wrapped with Capacitor).
- **Camera attachment** *(learner idea during the build)*: a camera for better string/fret accuracy (cut from the POC; see Non-Goals).
- Releasing it to other guitarists (`scope.md > Later`).
- "A few other features" the learner mentioned, which aren't defined yet.

## Non-Goals
- **Camera/fretboard tracking.** Cut in scope as a hard computer vision problem (`scope.md > Explicitly Cut`).
- **Chords or several notes at once**, beyond the deferred power chords.
- **Accounts, cloud sync or sharing.** Riffs live on the device.
- **Perfect string/fret accuracy.** The simple rule gets the notes right, not necessarily the exact positions.

## Open Questions
- ~~Name~~ — resolved: **Riff Boi** (first "Riff Boy"; renamed by the learner during the build).
- **Riff titles**: confirmed. Riffs are labeled automatically by date and time.
- **"Where it's saved"**: confirmed. The confirmation says the riff was saved to your Latest Riffs list.
