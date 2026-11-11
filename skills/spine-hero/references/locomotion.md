# Walk and run

These lessons come from building the walk and run of several painted heroes. Some of them cost days. The sections up to "Run" are rules: they held for every hero. Numbers from one hero are in "Examples from the original" at the end; use them as a scale, not as targets. Items marked *(occluder)* apply when the hero carries something that hides part of him (a shield, a cape, a big weapon).

## Route

1. **A timing reference of this hero.** Best: one clip from an image-to-video model, by the rules in [reference-video.md](reference-video.md), with the hero's own rest picture as its first frame. Rebuild his walk, and later his run and moves, from his own reference. Never borrow another rig's clip as the animation: a walk borrowed from an older design was rejected. The video also shows how hidden parts look mid-stride. No video model: see "Without a video model" in [reference-video.md](reference-video.md).
2. **Read the beats, not the body.** Per foot, note the contact, down, passing and up frames. Also note the cycle time, the stride length and how high the swing foot lifts. Write these into a beats file ([reference-video.md](reference-video.md) has its shape). Never fit bones to per-frame landmarks: the video's body turns toward the camera, and a one-view rig that follows it turns to mush.
3. **Author in the rig's own view:** sparse keys plus IK feet. Use a launch, one steady loop, and a brake.
4. **Publish** with `groundSpeed` (the planted foot's speed) and `loopWindow` in `clips.json`, and the same numbers in the hero's spec.
5. **Gate** the walk: contact slide, ground speed, stance symmetry, and both feet landing each loop (see [gate.md](gate.md)).
6. **The human's eye.** If you are unsure between two readings, render both side by side.

## Rules

- **Each leg stays under its own hip** when the painted hips sit apart, as they do on a side-view painting. A crossing walk is impossible on this kind of paint.
- **The near leg draws in front of the far leg** while the stride shows.
- **A swing that eases down reads as skating.** Hold the height, then drop in 2-3 frames, arriving at the floor's speed.
- **Roll the foot about the sole's true rear end**, then ground the lowest point.
- **Keep foot roll on the ground small (under about 3 degrees).** The gate measures slide at the sole bone's origin, so a heel strike plus a peel on the ground reads as slide. Land flat, and do the rest of the peel in the air.
- **No bone scale.** Foreshorten with rescaled end meshes instead.
- **Secondary motion** (hair, beard, belt, coat) moves only as far as the painted backing behind it covers. A stretch past that shows a band.
- **Stride comes from the hips, speed from cadence.** With legs under their own hips and no crossing, the step is capped by hip spacing and each leg's reach. Stride in body heights does not carry over between rigs. For more speed, quicken the cadence. Never lengthen the stride past the cap.
- **Only the loop window plays.** The loop window sets the animation's start and end, so the launch and brake never play in game or in captures. The idle blends into the window's first pose over about 0.1 s, so start the window near the idle stance.
- **Walk-only drawings.** The idle's cut may paint into the body whatever stands behind an occluder, covering legs that never move at rest. A walk needs its own drawings on the same slots, switched by attachment keys. Spine restores the setup attachments when the clip mixes out, so the idle stays identical.
- **Tall props that touch the floor** sink under the pelvis bob. Carry them up a few units in the walk.

## Revealed paint

- **Remove the occluder's rim** *(occluder)*. The occluder's outline pixels just outside its cut stay on the part behind it, and become a stick once that part moves out.
- **Fill from an aligned redraw's drawn paint, not from inpainting.** Inpainting reads as a smear. Check the alignment locally (the sole line must run on without a step), and feather seams on the fill side only.
- **Fill values:** a colour match that clips at black makes dark fills come out light. Finish with a multiplicative value step.
- **Rim light the occluders hid goes dark.** Rim-light fragments under an arm or a prop at rest show as detached flecks once it swings. Repaint them with the part's own paint, and keep the rim stripes that are visible at rest.

## The far limb

- **Its own paint, never a toned copy of the near one** (see [rig.md](rig.md)). Bind each drawing in its own drawn pose. Leave out any pose the gait never makes. On a rigid foot, a heel lift on a planted toe sinks the ball of the foot into the floor.
- **Every drawing of one part at one size.** Scale each drawing so the part's own area (a boot's leather, say) matches the reference drawing. Landmarks on a tilted foot, or the image's bottom part, give wrong sizes, and the swinging foot pops bigger at every switch.
- **Prefer one drawing per limb through the stride.** A second drawing bound in its own painted bend folds its mesh as the rig leaves that bend, and its switch in and out reads as a flicker. When the joint angle barely changes between drawings, one drawing turned by the rig is cleaner.
- **A far part reads smaller than it measures,** because it is darker and often half hidden. Size it by eye at game size, then lock it.
- **Painted gaps raise the hole limit.** Give the hero a per-kind limit with a note naming the gap, and have the review confirm it is a gap, not a crack.

## Run

A run is not a fast walk. Start from the walk's skeleton and structure, not its keys. The priorities, in order (a brief settled them after rounds had traded one for another):

1. **It reads as a run.** Judge it on every consecutive frame of one stride, beside the hero's own run reference. Look for a clear forward lean of the torso, and at least 3 captured frames in a row per step with both feet clearly off the floor. The near leg drives its knee up and kicks back. The chest bob sits in the upper half of the gate's range, the arms pump, and a carried prop leans with him. Contact sheets that show every 4th frame hide the flight, so cut a sheet of consecutive frames.
2. **A far leg may hide** *(occluder)*. If the occluder covers most of the far leg, carry it so the far leg's swing happens behind it. The far foot only needs to show around its landing and stance, and there it must be a foot joined to its leg. A thin strip that reads as neither foot nor leg, a foot loose from its leg, or a folded mesh is never acceptable. Hide it rather than slow the run down.
3. **Speed comes from cadence and a short flight**, not from legs reaching past what they can. Take the cadence from the hero's own reference.
4. **The gate still passes,** with any real gap named in the hole limit.

## When the timing reference has no contact data

An older per-frame animation used as a timing reference has fixed foot offsets, so a capture of it gives no contact metrics. Read its beats from its clip events and its strip instead. Run one capture at a time: two at once starve each other.

## Examples from the original

All from side-view painted heroes; the heavy tank hero carried a tower shield in front.

- **Hip cap.** The tank hero's hips were 140 units apart with about 120 units of reach, giving 144-unit steps.
- **Foot roll.** A heel strike plus a peel on the ground read as 3-4 px of slide at the sole bone.
- **Waist stretch.** Over about 8 px, it showed a band.
- **Far-limb size.** Sole landmarks and the image's bottom 40 % both gave wrong sizes, and the swing boot popped about 40 % bigger at every switch. The tank hero's far boot was settled by eye at about 1.44 times the measured match, a bit bigger than the near boot.
- **One far drawing.** The ankle angle changed only from about 91 to 94 degrees between two drawings, so one drawing turned by the rig was cleaner.
- **Rim light.** Orange rim fragments under an arm and a prop showed as flecks once they swung.
- **Run.** The tank hero's run video showed 15-20 degrees of forward lean. Aim for about 0.55-0.7 body heights per second for the heaviest hero; the lighter heroes ran at 0.76-1.5. One round traded the run away to cure a far-boot sliver and came out as a brisk walk.
- **Painted gaps.** Between arm and coat, and between a shin and the shield.
