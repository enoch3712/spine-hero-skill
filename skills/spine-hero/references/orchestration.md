# Orchestration: briefs, parallel moves, the lock, budgets, the ladder

The orchestrator (your strongest model, in the main session) runs the work. It does not author keys itself. It writes briefs, starts runs, reads results, looks at the close-ups, and commits.

## One run per move

- **One hero per run, one clip per run.** Each move gets its own orchestration run (a workflow, a script, or a sub-agent loop) with its own brief, output folder and port.
- **Moves in parallel.** Several runs can author different moves of the same hero at once. That works because:
  - each move is its own module (see [rig.md](rig.md)), and a broken module is left out of the build with a warning;
  - the build, publish, capture and gate run as **one locked step** (`scripts/with_lock.sh`), so a capture never loads a rig another author is half-way through publishing;
  - each author writes only its own files, listed in the brief.
- **Run one capture at a time on a machine.** Two at once starve each other. The lock does this for you.
- **Commit from a build limited to the finished moves.** Agents never commit. The orchestrator verifies (reads the gate result, looks at the close-ups, runs the tests) and commits.

## The locked build-and-gate

Wrap the whole sequence in one script and run that script under the lock:

```sh
# build_and_gate.sh <clip> <outdir> <port>: build every move module, publish the bundle, capture the clip unlit and lit, gate it
LOCK_DIR=work/.build.lock bash skills/spine-hero/scripts/with_lock.sh bash build_and_gate.sh shield-wall out/shield-wall/r1/try1 5410
```

The brief names this as the only way to build. The author runs it, reads the `gate.json` it prints, then looks at the pictures.

## The brief

Briefs point to files. They never paste code or conventions: the author reads the skill and the project's docs itself. A brief that worked had these parts:

```
You are animating ONE move for <hero, one line of what he looks like> on his skeletal rig.
Other agents are animating his other moves on the same rig at the same time; the tools below keep you apart.

MOVE: clip "<clip>". How it should look: <one or two sentences>.
HUMAN: <the human's direction for this move, as a lesson, e.g. "stances held as one drawing read static: animate on the rig, alive in its holds">.
PLAN: <beats and timings from the reference video; what moves, what stays planted>.

READ FIRST (do not re-derive what they say):
- this skill's SKILL.md, references/moves.md (or locomotion.md), references/defects.md
- the rig conventions doc, one finished move module as a template
- pose references: <the hero's own reference video sheet>, <an older design doing this move: poses and beats only>

WHAT YOU WRITE (only these):
- rig/moves/<clip>.py (CLIP, optional DRAWINGS, build(world, parents, idle0) -> (animation, report))
- if you need new drawings: rig/moves/<clip>_art.py and source/<clip>_*.png; new drawing names prefixed <Prefix>_
NEVER: edit the build script, other moves, the gate files, or the approved clips (idle, walk: frozen); commit;
run two builds or captures at once.

BUILD AND GATE (the only way to build): <the locked command> <clip> out/<clip>/r<round>/try<N> <port>
Then LOOK: the lit strip and every full-size feet and head close-up (crop before reading).
The gate cannot see paint; you are the taste stage. Fix what you see, and gate again.

Budget: about <N>k tokens. Keep context small: crop images before reading, open each once, tail long output.
Return: { gateDir, gatePass, gateSummary, duration, notes (what you built and why), problems (anything left,
including a gate limit you think should change and why) }
```

When a run has failed before, the brief says where it stands. It names the files on disk to start from and what each earlier round got wrong. It sets the order of priorities when two goals traded against each other. In the original, a run brief settled "it reads as a run" first and "the far leg may hide" second, after rounds had traded one for the other.

## The check prompt

An independent model writes the second check. It does not edit anything and does not rebuild.

```
Independent second check of a 2D game animation capture, pass/fail. Do not edit anything, do not rebuild.
<Hero, one line of how he looks> doing "<move>": <how it should look>. It must start and end in his idle pose.
Capture: <gateDir>. Read gate.json, the lit strip and EVERY full-size feet and head close-up.
Go through references/defects.md item by item on those close-ups, then check:
A it reads as the move (and a stance is not static);
B props held: gripped, close, never floating or detached;
C feet planted where they should be: no slide, no sinking, no floating; the far foot keeps its shape;
D no cracks, slivers, bands or popping at drawing switches; no limb bent into an impossible shape;
E it ends back at rest with no snap (a loop: the last frames flow into the first).
Author's notes: <notes>  Author's problems: <problems>
Pass only if nothing fails. Each defect names frames, the sheet and the item.
```

For a run, the check first cuts every consecutive frame of two strides from the video into a sheet. Strips at every 4th frame hide the flight.

## The ladder and the stop rule

```
for tier in [author, author at maximum effort]:
    for round in 1..3:
        result = author(brief + earlier failures)
        gate = run the locked build-and-gate          # script; a cheap model may run it and return gate.json verbatim
        if gate fails:      record it, next round
        review = mid-tier model on gate.json + sheets  # only after the gate passes
        if review fails:    record it, next round
        check = independent mid-tier model on defects.md, item by item
        if check passes:    stop: passed
        else:               record it, next round
if nothing passed: stop and bring the human the gate output and the video
```

- Each failed round sends its defects back with the full history, oldest first.
- On the first round of the higher tier, ask the author to name the root cause the failures share (art coverage, the rig, a metric, or the brief itself) before changing keys again.
- After a pass, a mid-tier model does the plumbing (spec numbers, moves table, tests, docs) and the gate runs once more on the final build.
- Then the orchestrator reads every full-size close-up itself, and only then shows the human.

## Budgets

The budgets the original used, in tokens:

| Step | Budget |
|---|---|
| author, one round | about 250k (up to 400-500k for a hard move such as a run) |
| check | about 70-80k |
| review | about 50k |
| plumbing | about 100k |
| gate runner | about 20k |

These are ceilings handed to each agent, not measured spend.

**A rough total for one hero** (arithmetic from the table, not a measurement; the orchestrator's own tokens are extra): one clip that passes on its first round is about 0.5M (author 250k, gate 20k, review 50k, check 75k, plumbing 100k). Each failed round adds up to about 0.4M, and the ladder allows six rounds, so one clip can reach about 2.5M. An idle, a walk and one move is about 1.5M if each passes first time, and several times that if they do not.

Stop starting new rounds when the run's budget is nearly spent. Every image and every line of tool output is re-sent on every step. One boot-fix author reached 340k context, mostly from images. So:

- crop the part and frames you need into a small PNG (under about 800 px wide) before reading it;
- open each image once;
- read contact sheets and `gate.json`, not every frame;
- tail or grep long command output;
- past about 150k context, finish what you can and return with a clear note of what is left.

## With one agent, or a small budget

The original ran a main session with sub-agents. This section adapts it for less; it was not run that way.

- **Keep:** the gate script, the item-by-item check against [defects.md](defects.md), your own look at the full-size close-ups, and the human's final say.
- **Run the roles as separate passes with fresh context.** Finish the authoring pass, then start a new session (or clear the context) for the review and the check. Give that pass only the brief, `gate.json`, the pictures and `defects.md`, never the author's reasoning or summary. The value of the check is that it does not share the author's view of the clip. The same model can do every pass.
- **Drop:** the model that only runs the gate (run the script yourself), parallel runs and the lock (one move at a time), and the separate plumbing agent (do it once at the end).
- **The ladder still applies:** 3 rounds, then 3 more starting with the root cause the failures share, then stop and ask the human.
- **A budget well under one author round** (say under 100k tokens) will not run the ladder. Spend it in this order: the capture and the gate, then the idle, then the brief and the reference prompt for the next clip.

## Before stating a claim

Ask a skeptic to refute it first. Before saying "this swaps cleanly", hand the claim to a separate agent or test whose only job is to find the case where it fails. In the original, that meant a test that stepped every frame of every clip with the gear swapped, including swaps mid-clip. State the claim only if the skeptic cannot break it.

## Frozen clips

Once the human approves a clip by eye, it is frozen. Never re-author it to satisfy a check, a new limit or another move. Report the conflict instead, and keep a list of frozen clips where every brief can see it.
