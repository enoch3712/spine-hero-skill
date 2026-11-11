# The pipeline and who does what

Models author and look. Scripts measure. The human decides. Each role is a tier, not a fixed model: use whatever you have at that tier. The last column names what the original project used, as an example, not a requirement.

| Role | Tier | Does | Never | Original project |
|---|---|---|---|---|
| Orchestrator | your strongest model, in the main session | plans, writes one brief per move, starts the runs, makes the reference video, reads every full-size close-up before the human sees anything, verifies and commits | passes on a result it has not looked at | Claude Opus 5.5, with Claude Fable 5.2 on planning and briefs |
| Author | a strong coding model | writes keys, IK, part cuts and fills as code on the rig, then builds, gates and looks at its own capture. This is the only stage that needs taste | edits shared build or gate files, re-authors an approved clip, commits | Claude Opus 5.5; the escalation tier is the same model at maximum effort |
| Gate | a script, not a model | capture, then `metrics.json`, then `gate.mjs`, then `gate.json` | gives opinions | a cheap model (Haiku, then Sonnet if that failed) only ran the command and returned `gate.json` word for word |
| Review | a mid-tier model | after the gate passes: reads `gate.json`, the contact sheet and the 2x feet and head close-ups, and judges what numbers cannot (weight, paint, doubled parts) | rebuilds, re-measures, runs test suites | Claude Sonnet 5.5 |
| Check | a mid-tier model, independent of the author and the reviewer | a second look before anything reaches the human: goes through [defects.md](defects.md) item by item on every full-size close-up, and names frame, part and fix | trusts the author's or reviewer's summary | Claude Sonnet 5.5, with Opus as its escalation |
| Plumb | a mid-tier model | finishes the hero spec numbers, the moves table, tests and docs once a clip has passed | touches the clip's keys or art | Sonnet, then Opus |
| Video model (optional) | image-to-video | animates the hero's own rest picture: timing, beats, and how hidden parts look mid-stride. Without one, the beats file is written by hand ([reference-video.md](reference-video.md)) | gets used as frames | Google Flow, model Omni 1.2 Flash, driven by the orchestrator in the human's signed-in browser (the sub-agents could not reach it) |
| Image model | image generation | paints what the painting never showed: hidden parts and swappable gear as isolated pieces on a flat background, redraws of the figure without an occluder (for fills), and, for fast blows, sheets of whole-figure key drawings without the gear. The hero's own painting is attached as the style reference | recolours the whole figure, or gets asked for "finish" | the Codex CLI's image tool (gear, the far arm, the redraws, the held-pose sheets); Nano Banana 2.1 in Google Flow for the far-leg sheet |
| Human | | gives the final say. Every defect they catch becomes a new check | | |

The pass/fail look (review and check) worked on the mid-tier model. Keep the expensive model for authoring and for the orchestrator's own look.

**What each tier must be able to do**, if your models have other names:

- **Orchestrator:** hold the human's direction across a long session, write a brief another model can act on alone, and judge many full-size images for taste.
- **Author:** write and debug numeric animation code (keys, curves, IK, image cuts) over many rounds, and look at its own captures critically.
- **Review and check:** read images closely and go through a checklist item by item, reporting frame, part and fix, without editing anything.
- **Gate:** no model. If a model runs the script, it only returns the output.

## One clip, end to end

```
brief -> author (keys, IK, parts) -> build + capture + gate -> review -> check -> orchestrator's look -> human
           ^                              |                    |          |
           +------ defects, same tier, up to 3 rounds; then one tier up for 3; then stop ------+
```

- **Attempt, gate, review, check.** A failed gate, review or check sends its defects back to the same tier. After 3 failed rounds, go one tier up for 3 more (in the original: the same model at maximum effort, told to find the root cause the failures share before changing keys again). If it still fails, stop and bring the human the gate output and the video.
- **The orchestrator reads the close-ups itself** before any video goes to the human. Two passing agents are not enough: a boot defect passed the gate and the review twice, and the human saw it at once.
- **The human's eye is final.** When the human is unsure between two readings, render both side by side. Once, the human picked the simple option over the one the critics preferred.
- **Every catch becomes a check.** Add a line to [defects.md](defects.md), and where it can be measured, a gate check (the box check in [gate.md](gate.md) began as a human catch).

## What runs where

- The gate, the capture and the build are scripts. They run the same way every time, so a number can be trusted and compared.
- The author model writes code (the move as keys on bones), not frames. A move is a small program over the rig, so the author can rerun it, measure it and fix it.
- The orchestrator holds the human's direction and the brief. Sub-agents get the brief and file paths. They never get pasted code or conventions (see [orchestration.md](orchestration.md)).
