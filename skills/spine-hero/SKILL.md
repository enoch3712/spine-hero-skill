---
name: spine-hero
description: Use when animating a 2D game character from a single painting on a skeletal rig (Spine or similar), such as cutting the painting into parts, authoring an idle, walk, run or combat move as code on the rig, making a reference video for timing, painting hidden parts or swappable gear, gating captured clips with scripted checks, or planning a team of AI models for that work.
---

# Spine hero

One painting of the hero is cut into parts on a skeleton, and every clip is written as code on that rig. Models author and look, scripts measure, and the human's eye decides. The expensive model only does the work that needs taste.

## Before the first clip

- **Step 0: build the rig** from the painting: parts, fills for what each part hides, skeleton, meshes, IK. The tooling is not included; [rig](references/rig.md) gives the method. Stop and have the human approve the rest pose against the painting.
- **Step 0b: write the capture** for your engine: it steps a clip, renders it, and writes `metrics.json` and the close-ups. Nothing below can be judged without it. [gate](references/gate.md) gives the contract and when it is done.

These two are most of the setup work and are yours to do: in the original, the capture alone was about six times the size of the gate script. The loop below starts once both exist.

Then the idle (on the rig, never from video), then the walk and run, then the moves.

## The loop, one clip at a time

1. **Brief.** The orchestrator writes a short brief: the move, how it should look, the plan, the files the author may write, the one build-and-gate command, and a token budget. See [orchestration](references/orchestration.md).
2. **Timing reference.** Best: an image-to-video model animates the hero's own rest picture. It gives timing and beats only, written to a beats file. Without a video model, write the beats file by hand. See [reference video](references/reference-video.md).
3. **Paint what the painting never showed.** An image model paints hidden parts (the far leg, the far arm, the coat behind a shield) and any swappable gear as isolated pieces, and for fast blows, whole-figure key drawings without the gear. Do it before animating. See [rig](references/rig.md) and [moves](references/moves.md).
4. **Author on the rig.** A strong coding model writes sparse keys and IK. Walks and runs: [locomotion](references/locomotion.md). Stances are animated on the rig. Fast blows may be a few whole-figure key drawings with the real gear placed on its bones, so weapons and shields still swap: [moves](references/moves.md).
5. **Gate.** Capture the clip, write `metrics.json`, run `scripts/gate.mjs`. No model judges numbers. See [gate](references/gate.md).
6. **Review.** Only after the gate passes: a mid-tier model reads `gate.json`, the contact sheet and the 2x feet and head close-ups, and judges what numbers cannot (weight, paint, doubled parts).
7. **Check.** A mid-tier model, independent of the author and the reviewer, goes through [defects](references/defects.md) item by item on every full-size close-up. The gate cannot see paint.
8. **Orchestrator's look.** The orchestrator reads every close-up itself before anything reaches the human.
9. **Human.** The human sees the video and decides. Every defect the human catches becomes a new line in `references/defects.md`.

A failed gate, review or check goes back to the same author tier, up to 3 rounds. After that, one tier up for 3 more rounds. If it still fails, stop and bring the human the gate output and the video. Roles and tiers: [pipeline](references/pipeline.md). With one agent, run author, review and check as separate passes with fresh context: [orchestration](references/orchestration.md).

## Done for a hero

- The rest pose, idle, walk, run and every move are approved by the human, and listed as frozen where every brief can see them.
- Every clip passes the gate on the final build, with every raised limit carrying a note.
- `clips.json` holds each clip's duration and loop flag, and the walk's and run's `groundSpeed` and `loopWindow`. The hero's spec holds the same speeds, the standing height, the sole bones and a `box`.
- The box holds every clip with every weapon and shield (the box check).
- The swap test passes: every frame of every clip with every gear combination, gear changed mid-clip too.
- The moves table, tests and docs are updated (the plumbing step).

For a smaller set (an idle, a walk and one attack, say), apply the same list to the clips you ship: the run and the other moves are not required.

## Rules that held

- Never re-author a clip the human approved just to satisfy a check. Report the conflict instead.
- The idle is authored on the rig, never taken from video.
- The video gives beats and timing. Never fit bones to per-frame landmarks from it.
- Swappable gear is never painted into a drawing. It rides its own bone, so it can be swapped.
- Switch drawings with attachment keys, never with opacity.
- Agents never commit. The orchestrator verifies and commits.
- Before stating a claim such as "this swaps cleanly", ask a skeptic to refute it.
- Keep context small. Crop an image to the part and frames you need, open each image once, and tail long output.

## Files

| File | Read it when |
|---|---|
| [references/pipeline.md](references/pipeline.md) | planning who does what, and which model tier |
| [references/rig.md](references/rig.md) | building the rig from the painting (step 0); conventions; the idle |
| [references/locomotion.md](references/locomotion.md) | a walk or a run |
| [references/moves.md](references/moves.md) | a stance, a blow, held key drawings, gear and swaps, ranged weapons |
| [references/reference-video.md](references/reference-video.md) | making the timing reference, with or without a video model; the beats file |
| [references/defects.md](references/defects.md) | every visual check (13 defects a human caught that checks missed) |
| [references/gate.md](references/gate.md) | the capture (step 0b), each check and its limit, setting limits for a first hero |
| [references/orchestration.md](references/orchestration.md) | briefs, one run per move, the build lock, budgets, the ladder, one-agent mode |
| `scripts/gate.mjs`, `scripts/gate-limits.json` | gating a capture: `node scripts/gate.mjs <run>/metrics.json --kind idle\|walk\|run\|move` |
| `scripts/with_lock.sh` | several authors building on one rig at once |
| `assets/metrics.example.json` | an example of the capture contract |
