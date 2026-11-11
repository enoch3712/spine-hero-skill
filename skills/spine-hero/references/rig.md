# From one painting to a rig

The hero starts as one finished painting in side view: the rest pose. Everything else is built on it.

## Step 0: build the rig

**Not included.** The original's part-cutting and rig-building scripts were written for its own heroes and paths, so this repo does not ship them. What follows is the method they used, so you can write your own or build the rig by hand in the Spine editor.

- **In:** the painting; image-model redraws of the same figure in the same pose with an occluder removed (for example "without the shield and weapon", "body without arms"); the bone list below.
- **Out:** a Spine skeleton file (the original wrote Spine 4.2 JSON from a script, without the Spine editor), its atlas and part images, `clips.json`, and a rest-pose comparison sheet.

1. **Cut the parts.** Draw one polygon per part on the painting, front part first. A pixel belongs to the first polygon that holds it, and whatever is left is the body. Inner edges follow the ink line between two parts. Outer edges can run wide, because the painting's own alpha trims them.
2. **Fill what each part hides.** Visible pixels always come from the painting. Hidden pixels (behind a shield, under an arm) come from the aligned redraws: key each redraw off its flat background, warp it onto the painting with a similarity transform found from feature matches on parts both pictures share (face, belt, boots), refine per region, then colour-match the fill to the painting's neighbouring paint of the same material. Thin bands at seams can be inpainted from the part's own paint. Write overlay sheets of the cut and of the fills.
3. **Build the skeleton.** Bones by the role names below, a grid mesh per part with weights from where each vertex sits on the painting, IK on the feet, bleed on every part's edges. The original wrote one atlas page per part image, with mipmaps (see "Drawing it crisp").
4. **Compare the rest pose with the painting.** Render the setup pose at the painting's scale, placed by Root, and write the painting, the rig, and their difference times 4 side by side.
5. **Stop and ask.** The human approves the rest-pose rig (no visible seams, cuts or colour shift against the painting) before any clip is authored. Every clip inherits it.

Then write the capture (step 0b, in [gate.md](gate.md)), and then the idle.

## Parts from the painting

- **Units are painting pixels.** In the original, the figure stood about 935 units tall. Spine's y axis points up. Root sits on the floor between the soles.
- **Every part is a mesh on a grid.** A vertex takes its bone weights from where it sits on the painting. So the coat bends between pelvis and hem, the beard between head and chest, the braids on their own bones, and each leg at the knee.
- **Feet are IK-planted.** Each leg's IK constraint aims at a foot target under Root. A transform constraint holds the boot's angle.
- **Bleed edge colour into transparent pixels** (alpha stays 0), so linear filtering never pulls black into a part's edge.
- **Paint the revealed parts before animating**, not after the gate fails. Walking reveals the inner thigh, the back of the coat, and whatever stood behind a shield. Paint them as isolated parts.
- **A cut part carries its neighbour's paint.** In the original, the head cut kept a sliver of the shield's rim, and the hammer cut kept scraps of coat and leg around its head. These scraps stay hidden while the neighbour covers them, and show as loose bits once it moves. Look at every edge where a part leaves its neighbour, and give the move a cleaned drawing.
- **A hidden far limb gets its own paint, never a toned copy of the near one.** A copy reads at once as a clone. Have the image model paint a sheet of that limb in 2-3 poses on flat grey. Key the grey off, scale it to the near part, and bind each drawing in its own drawn pose, so the rig's angles drive it and one mesh keeps trouser and boot joined.

## Skeleton conventions

- **Facing right.** The skeleton faces +x, and the controller mirrors it.
- **Root on the floor** between the soles, at y = 0. Nothing in the idle, walk or run moves Root: the game controller moves the figure over the ground. A clip that travels hands its distance to the controller (root motion).
- **Shared bone role names** across heroes, so tools can find the chest, head and soles by name:

| Role | Bones |
|---|---|
| Body | `Root`, `Pelvis`, `Spine`, `Chest`, `Neck`, `Head` |
| Near arm (camera side) | `UpperArm_Near`, `Forearm_Near`, `Hand_Near` |
| Far arm | `UpperArm_Far`, `Forearm_Far`, `Hand_Far` |
| Front leg (toward facing) | `UpperLeg_Front`, `LowerLeg_Front`, `Foot_Front` |
| Back leg | `UpperLeg_Back`, `LowerLeg_Back`, `Foot_Back` |
| IK targets | `IK_Foot_Front`, `IK_Foot_Back` (children of Root); `IK_Hand_Near`, `IK_Hand_Far` (children of the held prop) |
| Hanging pieces | `Braid_1..n`, `Pouch_*`, `Coat_*`, each with its own follow constraint |
| Gear | one bone per swappable piece (`Hammer`, `Shield`, `Rifle`, ...) |

## Clips and the clip table

Clip names: `idle` (loops), `walk`, `run`, the hit reactions, then the hero's own moves, in lower case with dashes (`shield-bash`). Next to the skeleton, a small `clips.json` maps each clip to:

| Key | Meaning |
|---|---|
| `duration` | seconds |
| `loop` | true for `idle` and any clip the controller repeats whole |
| `groundTravel`, `groundSpeed` | skeleton units over the ground, in total and per second (walk, run). `groundSpeed` is the planted foot's speed, so the controller moves the body exactly as fast as the feet push |
| `loopWindow` | `[first, last]` frame of the steady stride at the skeleton's fps (24 in the original). Walk and run may have a launch and a brake around it, but only the window plays in game |

The hero's spec (wherever your game declares characters) holds: standing `height`; a `box` `[left, right, top, bottom]` in skeleton units that holds every pose of every clip with every weapon; the sole bones; and the walk and run speeds and loop windows from `clips.json`.

## Drawing it crisp

- If the engine draws the lit figure into an offscreen picture and then scales it, thin bright strokes shimmer on every moving part. In the original (PixiJS with the official Spine runtime), the fix was to draw at one picture pixel per screen pixel and to give the atlas pages mipmaps (`filter: MipMapLinearLinear,Linear`), so each piece is sampled once, at its final size.
- Switch drawing sets with attachment keys, never with opacity. A blend shows both drawings at once and doubles shields and legs.
- If the lit figure is one picture the size of `box`, anything drawn past the box is cut off flat there. The gate checks this (`boxOverflowUnits`). Measure the box over every clip with every weapon after adding a move, a drawing or a weapon.

## The idle

**Rules:** authored on the rig, never from video. Feet planted. Props ride the hands. Hanging pieces (braids, coat, straps) follow a beat late. It must loop exactly: the gate compares the last frame with the first. Heavier heroes breathe slower.

**Example from the original** (a style choice, not a rule): a calm breathing family of a 6.4 s loop, the chest bobbing about 1.65 px at game size, the head turning under 7 degrees, the pelvis swaying about 3 px. The heavy tank hero used 7.2 s with two breaths, a slow weight shift across the loop, and smaller head and arm angles. The shipped idle limits in `gate-limits.json` come from the same game, so set your own (see [gate.md](gate.md)).

## How a move plugs in

Keep one module per move (for example `rig/moves/<clip>.py`). Each module exports:

- `CLIP`, the clip name;
- optionally `DRAWINGS`, the extra drawings it switches in, per slot;
- `build(world, parents, idle0) -> (animation, report)`. Here `idle0` is the idle's time-0 pose. The report holds `duration` and the move's own measures (leg reach, prop height at the hit, first-to-last difference).

The build script loads every module. A module that fails to import or build is left out with a printed warning, so one broken move never blocks the others. An environment variable can limit a build to the finished moves, and you commit from that build. See [orchestration.md](orchestration.md) for running several authors at once.
