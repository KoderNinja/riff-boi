---
doc: scope
status: approved
---

# Riff Boi

A guitar app that listens while you play and writes out the tablature in real time.

## The Unique Kernel
Riff capture at the moment of discovery. When a guitarist finds a great phrase while improvising, they shouldn't have to stop playing to write it down. They play it, and the tab appears.

## Who It's For
The primary user is the developer: a guitarist with six years of experience who's focused on technical metal and instrumental music. They regularly find riffs worth keeping while improvising. Today they capture them by writing them out by hand, which is slow and breaks their creative flow. A public release to other guitarists may come later.

## The Core Loop
1. Open the app. It's already listening, with no setup screens.
2. Play a riff.
3. The tab appears on screen.
4. Keep playing.

They come back to it every time they're improvising and want to keep something they've found.

## Inspiration & Identity
Instant and unobtrusive: the app should feel "automatically ready to transcribe." It's made by and for players of technical metal and instrumental guitar. The visual direction is set in the PRD.

## Why This Matters to the Learner
It solves a problem they run into when improvising. It's also a practical way to learn Claude Code by building a real app they'll use.

## What "Working" Looks Like
In the learner's words: **"I play a riff and the tabs just show up."**
The key moment in the demo: a single-note riff played on a real guitar appears as tab on screen.

## The POC Boundary
- Detects **single notes** from a guitar, played one at a time.
- Converts each note to tab notation (a string and fret number) and shows it on screen.
- Starts listening as soon as it opens, with no configuration.

## Later
- **Power chord detection:** these come up in the learner's riffs, but detecting several notes at once is much harder than single notes.
- **Public release** to other guitarists.

## Explicitly Cut
- **Camera-based fretboard tracking:** it would help the app know which string you played, but it's a hard computer vision problem that doesn't fit the 5-day timeline.

## Open Questions for the PRD
- **String assignment:** audio tells you the pitch, but not which string it was played on. How the app picks a position, and whether you can correct it, is decided in the PRD.
- **Keeping riffs:** whether captured riffs can be saved, copied or exported.
