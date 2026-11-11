# The gate

The gate replaces a reviewer's eye on the numbers. A script reads one capture's `metrics.json`, applies the limits, and writes `gate.json`. No model judges the numbers. A model that runs the gate only returns `gate.json` word for word.

```sh
node scripts/gate.mjs <run>/metrics.json [--kind idle|walk|run|move] [--limits scripts/gate-limits.json]
node --test scripts/gate.test.mjs
```

It writes `gate.json` beside the metrics (`{pass, kind, hero, checks: [{id, value, limit, pass, note}]}`), prints one line, and exits 0 on pass, 1 on fail, or 2 on bad usage (no file given, a file that cannot be read or is not JSON, a kind with no limits). `--kind` defaults to the metrics' `clip` when that names a kind (`idle`, `walk`, `run`); a clip with any other name (`shield-bash`) is gated as a `move`.

**The gate cannot see paint.** Soft fills, missing ink, ragged split edges, a clone of the near part: only a look at the close-ups finds these ([defects.md](defects.md)). A passing gate is the entry ticket to review, not a verdict.

## Limits

`gate-limits.json` has per-kind defaults under `kinds.<kind>`, plus per-hero overrides under `heroes.<hero id>.<kind>.<check>`. A limit is `{max}`, `{min}`, `{min, max}` or `{equals}`. `null` switches a check off for that hero, and a check with no limit is not run. The shipped values were calibrated on one game's accepted captures: 1600x900, 30 fps, unlit, about 0.55 screen px per skeleton unit for the reference hero, with heroes standing about 320-375 px tall on screen. **Pixel limits are in those screen pixels.**

### Which numbers carry over

| Carry over as they are | Depend on your capture and your heroes |
|---|---|
| `errors = 0`, `boxOverflowUnits <= 0` | `soleDriftPx`, `slidePxMax`, `chestBobPx` (lengths in screen px) |
| `groundSpeedRatio`, `stanceSymmetry`, `footfallsPerLoopMin`, `framePopRatio` (ratios and counts) | `holeMaxAreaPx`, `holeThinMaxAreaPx` (areas in screen px) |
| `headAngleRangeDeg` (degrees, though a calmer or livelier idle is a style choice) | `seamMeanAbsDiff`, `framePopMeanAbsDiff` (0-255 means over the figure: they depend on how much fine paint your figure has) |

### Setting limits for your first hero

"Recalibrate on accepted clips" does not help when nothing is accepted yet. A way to start, built from how the original set its limits (an outline, not a tested procedure):

1. **Start provisional.** Take the shipped limits. Scale every length by your hero's standing height on screen over about 350 px, and every area by the square of that. Keep the left column as it is.
2. **Gate the idle first.** It is the simplest clip, and every move starts and ends on it. Fix what the gate and the close-ups show until the human approves it by eye.
3. **Freeze it and read its numbers.** The approved idle's `gate.json` is your baseline. Set each project-specific limit a little outside that clip's value, in the direction that would be a defect. Where a real painted gap raises a hole value, put the raise under that hero with a note naming the gap.
4. **Repeat for the walk,** then for the run, with their own baselines. A move inherits the idle's hole baseline unless its own drawings add a named gap.
5. **Tighten, never loosen to pass.** Loosen a limit only when the human has accepted a clip that fails it, and write down why. (The original's per-hero overrides each carry such a note.)

Per-hero hole limits are baselines. Enclosed gaps are normal (between arm and weapon, or rifle and arm). Each raised limit carries a note naming the gap, so the limit guards against new cracks, not against every gap.

## Checks

| Check | Kinds | Default limit | Why |
|---|---|---|---|
| `errors` | all | `= 0` | runtime errors during the capture mean the clip did not play as authored |
| `seamMeanAbsDiff` | idle, move | `<= 0.5` | the last frame against the first (0-255 mean over the figure). An idle must loop exactly, and a move must end back in the idle's rest pose. Only an **unlit** capture is checked, because animated light (flame flicker) changes a lit seam; a capture that does not say (no `torch`) fails. A **held** move is not checked |
| `soleDriftPx` | idle | `<= 1` | feet stay planted in an idle: the largest drift of any sole bone from its first position |
| `chestBobPx` | idle | `0.8-3` | breathing visible but calm (the chest bone's y range) |
| `headAngleRangeDeg` | idle | `<= 8` | a calm idle turns the head only a little (the idle family in [rig.md](rig.md) stays under 7 degrees) |
| `framePopMeanAbsDiff` | idle | `<= 6` | the largest change between two consecutive frames over the figure |
| `framePopRatio` | idle | `<= 3.2` | a pop is one step far bigger than the clip's usual step: the largest step over the mean step |
| `slidePxMax` | walk, run | `<= 2` | skating: the largest x travel of a sole during one ground contact |
| `groundSpeedRatio` | walk, run | `0.95-1.05` | the body's travel per second over the clip's declared `groundSpeed`. The feet must push the ground at the speed the controller moves him |
| `stanceSymmetry` | walk, run | `0.7-1.43` | a limp: the mean contact time of one sole over the other |
| `footfallsPerLoopMin` | walk, run | `>= 1` | each foot lands at least once per stride |
| `chestBobPx` | walk / run | `2-8` / `4-14` | weight shows as a bob of the chest; ranges calibrated on accepted walks and runs |
| `holeMaxAreaPx` | all | `<= 12` (per-hero baselines) | cracks: the largest background region fully enclosed by the figure |
| `holeThinMaxAreaPx` | all | off unless set | cracks only: the enclosed pixels that lie outside every 5x5 square fitting inside the hole. A crack 1-4 px wide is all thin. A gap between arm and torso is not |
| `boxOverflowUnits` | all | `<= 0` | if the lit figure is drawn as one picture the size of the hero's box, anything past the box is cut off flat (a human caught a raised weapon sliced off). Checked only when the capture measures it |

## The capture contract: `metrics.json`

Write the capture for your own engine. The original drove a web page in headless Chrome and is not portable, so it is not shipped here. To use this gate, your capture must play the clip deterministically and write the fields below. `assets/metrics.example.json` is an example.

A field you cannot measure can be left out, with these results: leaving out `pictureBox` skips the box check; leaving out `torch` fails the seam check of an idle or a rig move ("torch missing"); any other missing field fails its check with "metric missing". To stop running a check on purpose, switch it off in the limits with `null` and a note.

### Write the capture before the first clip

Nothing in the loop can be judged until the capture works: no gate, no close-ups for the review and the check, no video for the human. So it is step 0, after the rig exists and before any clip is authored.

- **Scope.** It must step a clip at a fixed time step, render the lit figure and an unlit figure-only mask, read bone positions per frame, find enclosed holes (a flood fill from the crop's border), find foot contacts, and write `metrics.json` plus the pictures below. The original's capture script was about six times the size of `gate.mjs` (roughly 620 lines of JavaScript against 100).
- **Done when:** an unlit capture of the same clip, run twice, gives the same `metrics.json`; it has every field the table below lists for that clip's kind, so the gate prints no "metric missing" (`assets/metrics.example.json` shows a walk); and a clip you break on purpose (a foot nudged during the idle, a last frame off its first) fails the check it should.
- **If your engine's loop cannot be stepped:** Spine runtimes let you advance the animation state yourself (update the state by a fixed delta, apply it to the skeleton, update world transforms), so step the skeleton directly rather than the engine's clock.
- **If you cannot render unlit:** render the skeleton alone on a flat background with no lights for the mask and the seam. If even that is impossible, capture lit and set `torch` to the light's name: the gate then skips the seam check, and the loop seam has to be judged by eye.

### How the original measured, so your numbers mean the same

- **Stepping.** Pause the game, reset the character, and step at a fixed 1/30 s. Seed any randomness, and move everything else off stage. An unlit run must repeat exactly.
- **Where to start.** Record an idle from its second loop, so it does not include the blend into the idle. Before a move, play one whole idle loop, so frame 0 is the idle's time-0 pose. Start walks and runs at their start. Play a walk or run long enough for three strides.
- **The figure mask** comes from a separate render: the figure alone, unlit, on a flat magenta background. Torch light and cast shadows then never count as figure.
- **A pixel is "off"** when any channel differs by more than 24 of 255.
- **Pixels are screen pixels** at your capture size. Record `scale` so others can convert.

### Fields

| Field | Type | Meaning |
|---|---|---|
| `char` | string | the hero's id; picks the per-hero limits |
| `clip` | string | the clip name; the default `--kind` when it is `idle`, `walk` or `run`, otherwise the clip is gated as a `move` |
| `scale` | object, optional | how to convert: the original recorded `worldScale` and `pxPerSkeletonUnit` (screen px per skeleton unit). The gate does not read it |
| `torch` | string | `"off"` for an unlit capture, or the light's name for a lit one. Seams are only gated when it is `"off"`. Required for an idle and a rig move: when it is missing, the seam check fails |
| `held` | boolean, optional | true for a held-drawing move: skips the move's seam check |
| `errors` | array | runtime errors seen during the capture (empty when clean) |
| `seam.meanAbsDiff` | number 0-255 | the last frame against the first, mean absolute RGB difference over the union of both frames' figure masks |
| `soles.<bone>.maxDriftPx` | number | for each sole bone: the largest distance from its first-frame position, in screen px |
| `chestBobPx` | number | the y range of the chest bone over the capture |
| `headAngleRangeDeg` | number | the range of the head bone's world rotation |
| `frameToFrame.maxMeanAbsDiff`, `.meanMeanAbsDiff` | numbers | for each pair of consecutive frames, the mean absolute difference over the union of their masks; then the largest and the mean of those |
| `holes.maxAreaPx` | number | per frame, the background regions (4-connected) that do not reach the crop's border; the largest area over all frames |
| `holes.maxThinAreaPx` | number | the same, counting only each hole's pixels outside every 5x5 square that fits wholly inside the hole |
| `locomotion` | object | walk and run only (and any clip with a `groundSpeed`). Missing for a walk or run, it fails the gate |
| `locomotion.slidePx.max` | number | the largest sole x travel within one contact, in world px (world x times screen scale) |
| `locomotion.groundSpeed.ratio` | number | the body's world travel per second over the analysis window, divided by `groundSpeed` (from `clips.json`) times px per unit |
| `locomotion.stanceSymmetry` | number | the mean contact duration of the first sole over the second (complete contacts if any) |
| `locomotion.footfallsPerLoop.<bone>` | number | contacts per whole stride analysed |
| `locomotion.chestBobPx` | number | the chest bone's y range over the analysed strides |
| `pictureBox.overflowUnits` | number | per frame, take the skeleton's drawn bounds (the attachments' own corners, so a turned drawing counts its empty corners) against the hero's box `[left, right, top, bottom]`; this is the largest overshoot on any side, in skeleton units. Add `side` and `frame` for the note |

**Contacts** (as the original defined them): a sole is in contact while it is within 3 px of its lowest point and moving no more than 1.5 px per frame in world x, for at least 3 frames. The analysis window starts at the loop window's first frame (or at 0.3 s, after the mix-in) and covers whole strides only.

### Files a reviewer needs from the same capture

The gate reads only `metrics.json`. The review and the check need pictures:

- `strip_NN.png`: every Nth frame of the figure (4th in the original), one fixed crop for the whole clip so that drift shows, each frame labelled with its number and time;
- `feet2x_NN.png` and `head2x_NN.png`: the same frames, feet and head at 2x, nearest-neighbour scaled;
- `seam.png`: last frame, first frame, and their difference times 4;
- an mp4 of the clip, both unlit and lit.

Also worth having: a box check that plays every clip with every weapon without taking pictures and prints a box that holds it all. Run it after adding a move, a drawing or a weapon.
