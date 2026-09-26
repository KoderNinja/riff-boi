# Beginner's Paradise – FirstCommit (Devpost hackathon)

This folder is my entry for **Beginner's Paradise – FirstCommit**: https://firstcommit.devpost.com/

- **Deadline:** Sep 30, 2026 @ 5:00pm EDT. Keep the project small enough to finish well before then.
- **Theme:** none. Any software project is allowed: web app, mobile app, desktop app, game, AI tool, hardware, and so on.
- **Eligibility:** ages 13–21, students only.
- **Rule:** the core work must be done during the event (Aug 21 – Sep 30, 2026). Existing libraries, templates and frameworks are fine.

## How Claude should help me

I'm a beginner and this hackathon is judged mostly on **what I learn**, so:

- Act like a teacher and pair programmer, not a ghostwriter. Explain what you're doing and why, in plain language, and check that I understand the important parts.
- Let me make the real decisions (the idea, features, design, which tech to use). Give me options with a recommendation, and don't decide silently.
- Build in small steps that work, and have me run and test each one myself before moving on.
- Keep a running list of what I've learned and the problems we solved in `devpost/learning-log.md`. I'll use it for my demo and write-up.
- Don't write my Devpost project description or demo script for me. Help me brainstorm, and point out gaps or fix spelling and grammar, but the words should be mine.
- Never commit secrets (API keys, `.env` files) to git.
- Ask me questions before you do anything, so we can make sure it's done right.
- Keep the design and the writing plain and human, not AI-looking, but still professional.

The planning and building skills in `~/.claude/skills` (`/1-start` → `/2-scope` → `/3-prd` → `/4-spec` → `/5-build`) fit this well. They save their progress in `devpost/`. The `/6-ship` skill is written for a different Devpost event, so use the submission checklist below instead.

## Starting a session

A new session doesn't remember the last one, so start here:

1. Read `devpost/todo.md`. "Next up" at the top says where we left off. Also read `devpost/learner-profile.md` if it's there (it's private, so it's only on my Mac).
2. Run `git status`. If it says my branch is ahead of `origin/main`, those commits aren't on GitHub yet, so help me push them first.
3. Before calling a step done, run `node tools/check.mjs` (every check must pass) and `node tools/score.mjs` (keep it at 110/115 notes and 83/83 strings, with no false bends listed, unless we decide to change that).
4. Before the session ends, update "Next up" in the to-do list and add what I learned to `devpost/learning-log.md`.

## Judging (weights)

| Criterion | Weight | What it means |
|---|---|---|
| Learning & Growth | 30% | Progress, challenges overcome, new skills, understanding my own project |
| Creativity & Impact | 25% | Original idea, real problem, useful to people |
| Technical Execution | 25% | It works, clean code, sensible technical decisions, good use of tools |
| Presentation & Communication | 20% | Demo quality, explaining my process and what I learned, clear docs |

## Submission checklist

Required:
- [ ] A working project made during the hackathon
- [x] A **public GitHub repository** with the source code: https://github.com/riff-boi/riff-boi
- [x] A **README** with clear setup and run instructions for judges (`README.md`; the "AI use" part is still mine to write)
- [ ] A Devpost project description: what I built, the problem it solves, who it's for, and how it works
- [ ] A **demo video (3–5 min)**: live demo, how it works, the tech used, challenges I overcame, what I learned
- [ ] Disclosure of significant AI help (Claude Code) in the project description

Recommended:
- [ ] A live, deployed version
- [ ] Screenshots
- [ ] A list of the technologies, frameworks, APIs and libraries used
- [ ] Slides or extra docs

Prize categories include Champion, Most Ambitious, Most Creative, Best Web/App Experience, Best Design, Best Technical Achievement, Biggest Learning Journey, Most Polished and Community Loved.
