# Moves: stances on the rig, blows as held drawings, gear on bones

## Which way to build a move

- **Stances are animated on the rig.** A shield wall, a shield held overhead, a taunt. A stance held as one drawing read as static. It needs rig motion that stays alive in its hold: breathing, weight, small pushes.
- **Fast blows may be held key drawings.** A slam or a leap reads fine as a few whole-figure drawings cut between them, never blended. The gear is still the rig's own parts on bones, so weapons and shields still swap.

**Deciding.** The rig is the default. In the original tank hero's kit of six moves, four were built on the rig (the shield bash, the shield wall, the shield overhead and the taunt) and two as held drawings (a ground slam and a leap into a slam). Read from those choices:

| Ask | If yes |
|---|---|
| Does the move hold a pose long enough to be looked at (a stance, an aim, a guard)? | the rig: a held drawing reads static there |
| Can the painted parts reach every key pose? (Test it: pose the rig and look. In the original, the near arm's drawing could not rise past the shoulder.) | the rig |
| Is it a fast, big blow whose key poses the parts cannot reach (an arm overhead, a crouch in the air), and is each pose on screen only briefly? | held drawings |
| Is it part hold, part fast action (draw, hold, release)? | build the hold on the rig. The original did not build such a move; making the fast part a short rig phase with a hard corner is the simpler first try |

Held drawings cost more up front: an image-model sheet per move, a config with every hole decided, and no blending between poses.

## Moves on the rig

- **Sparse keys as offsets from the idle's time-0 pose.** Interpolate with a curve that does not overshoot (PCHIP in the original). Key every channel the idle keys, so the first and last frames are the idle's own. The gate checks that the move ends back at rest.
- **Root stays still. Both feet stay on their IK.** A foot that steps does it on its IK target.
- **Contacts have corners.** A strike arrives at full speed, stops dead, and recoils a little. Put a corner in every strike channel at the hit.
- **Holds stay alive.** The chest sinks through a long exhale. Add a small shake on head and chest, swinging braids, and a prop swaying on the wrist.
- **Switch drawings inside motion,** never at rest, where a switch reads as a pop. Key them back to the idle's own drawings before the last frame. Otherwise the hand-over to the idle swaps them on the last frame and the seam fails.
- **A held prop at arm's length floats.** Four checks in a row read a shield held at the video's arm's length as "travelling alone", even with the arm unbroken. Keep the prop close (for the tank hero, about 86 units off the beard), with the hand gripped behind its edge, and let the body carry the travel.
- **A deeper lunge hides the far foot.** With the hips 88 units down, the coat hem covered the far boot's shaft, and the boot flattened into a sliver with a fold under the heel. At 60 down it stayed a boot. Watch the far foot whenever the pelvis drops.
- **Stay inside what the paint takes.** A hanging arm drawing turns about the shoulder plate's dome, not the bone's joint at its lower rim. Slide the bone so the plate stays on the shoulder. Keep the elbow under about 60 degrees and the wrist under about 30. Some drawings cannot do a pose at all: in the original, the near-arm drawing could not rise past the shoulder, so the taunt's wind-up went forward, not overhead.
- **A leap's apex must fit the view.** A raised-weapon air drawing was about 1.4 body heights tall before any lift. Check what the capture's framing cuts off.
- **When the human asks to combine two references, both are references.** Put both in the brief, as motion only.

## Held key drawings

One move is one config file plus one sheet of whole-figure drawings, painted by the image model from the hero's own video of the move. The drawings leave the swappable gear out. The near fist is closed on an empty grip, and the far arm is painted where the gear hid it.

For each drawing, the build makes a one-frame clip named after the pose. In that clip:

- a **figure slot** at the bottom of the draw order shows the drawing. It is anchored so the rear boot stands where the idle's does with its sole on the floor, or, for a drawing in the air, centred on Root with its lowest pixel on the floor (the controller lifts him);
- the rig's own **gear parts** (weapon, shield) are placed by keying their bones to the drawing's grips, so whatever gear is equipped shows there;
- an **arm slot** at the top of the draw order shows the near forearm and fist, cut from the same drawing by a polygon, so the fist closes over the haft of any weapon;
- a **draw-order key** stacks figure, shield, weapon and arm as the pose needs;
- every other slot is empty, and every other bone stands at setup.

A config, per move:

```json
{
  "move": "ground-slam", "sheet": "source/ground-slam-sheet.png", "units": 1.65,
  "poses": [
    { "name": "slam-high", "anchor": "boot",
      "weapon": { "fist": [160, 610], "theta": 60, "along": 0 },
      "shield": { "dx": 40, "dy": 0, "rotate": -4 },
      "order": ["figure", "shield", "weapon", "arm"],
      "arm": [[120, 660], [215, 660], [215, 560], [120, 560]],
      "close": [[168, 602]], "keep": [[60, 420]] }
  ]
}
```

All coordinates are skeleton units (x right, y up, Root on the floor), after the figure is placed. `units` converts sheet pixels to skeleton units. `weapon.fist` is the near fist's middle, `theta` the grip-to-head angle, and `along` how far toward the head the weapon bone's origin sits. `{"hidden": true}` empties a gear slot for that pose.

**Every see-through hole must be decided.** List every enclosed clear hole each drawing has. Under `close`, the hole is painted shut with the drawing's own ink. This is what to do with a slit a fist was painted with around the stock haft: a fist closed on a haft shows no background, and any other weapon's thinner haft would leave part of the slit bare. Under `keep`, the hole is a real opening, such as between an arm and the body. The build fails on any hole that neither list names.

**Playing it:** the controller plays the drawings in order (for example wind-up, high, hit, hit, wind-up) and cuts in with no mix. A mix carried the gear in late while the drawing had already cut. The engine adds the flash and dust. The gate treats a held move differently: it opens on its wind-up drawing, so there is no back-at-rest seam check, only errors, holes and the box.

Tools worth having for the author: a preview that composites exactly as the rig places the parts (with a grid and the idle as a ghost), a zoom with a 25-unit grid, a hole lister, and a sheet measurer that finds each drawing's size.

## Gear that swaps

- **Swappable gear is never in the paint.** Drawings leave weapons and shields out. The rig's own pieces ride their bones.
- **Dress the slot after the clip has posed it.** The equipped weapon replaces whatever the weapon slot shows. So key a gear slot only to the rig's own clean drawing, never to a look you want to keep.
- **Two gear sets (weapon and shield) are both dressed every frame,** one after the other, so choosing one never undoes the other.
- **A swapped shield is the same mesh with another picture.** Make each shield's picture a linked mesh of the rig's drawing: same vertices, weights, triangles and UVs. Then a clip that deforms the shield (flat overhead, say) deforms the new one too. Map whatever drawing the clip shows to the chosen shield's picture of that drawing. An empty slot stays empty.
- **New gear from the image model:** draw one piece alone on flat green in the reference's view, then key the green off. For a weapon, scale it to the stock weapon's pommel-to-head length along its handle, turn it onto the handle line, and grip it at the weapon bone's origin. For a shield, fit its four sides with lines and map it corner to corner (a perspective map) onto the stock shield's outline grown by 2 px, so it still covers the arm and fist behind it.
- **A gear-free drawing must not be shaped to the stock gear.** A fist painted with a see-through slit for the stock haft left background showing through the hand with any other weapon. The rig's own weapon was a cut with a hole where the idle hand sat. Close the fist, and give held moves a whole drawing of each piece of gear, the stock one too.
- **Size the box for every clip with every weapon.** A longer axe reaches further than the hammer.
- **Ask a skeptic to refute "this swaps cleanly"** before saying it does. Step every frame of every clip with every gear combination, changing gear mid-clip, in a test.

## Ranged weapons and projectiles

**What the original built.** A rifle hero: the rifle rode its own gear bone, and his shots, an aimed hold and a lob were clips on his rig. His weapons swapped through the same weapon system the tank hero later used; his weapon entries carried effect points (a fuse, an ember) that the tank hero's melee entries left out. Effects were the engine's work, never the rig's: for the tank hero's slam, the engine added the flash, the stones and the dust. Several of the rifle hero's moves drew past his box, and the box check was switched off for them with a note, waiting for someone to judge them.

**What it did not build: a bow.** The rules above suggest the following. None of it was tried, so treat it as a first plan for the brief, not as a result.

- **The bow is gear on a bone** in the bow hand, so it swaps like any weapon. The string is a mesh on the bow's drawing weighted to a nock bone. While drawing, a transform constraint ties the nock bone to the draw hand; key its mix to 0 at the loose, so the string springs back to the bow.
- **The nocked arrow is gear too,** on its own bone in the draw hand, shown and hidden by attachment keys (never opacity). At the loose, key it empty in the same frame that the engine spawns the flying arrow. The flying arrow is the engine's, like the slam's dust, so it is never part of the figure the gate measures.
- **The quiver is gear on a bone** (on the back or the belt), and hangs with a follow constraint like the other hanging pieces.
- **Draw, hold, loose.** The draw and the hold are a stance: on the rig, alive in the hold (the chest breathes, the bow arm trembles a little). The loose is a contact: a hard corner at release, the string snaps forward, the draw hand recoils back a little.
- **The gate and the box.** A bow at full draw is the widest pose: run the box check over every clip with every bow. The thin string and the bow's open middle enclose background, so expect a per-hero hole baseline named "between bow and string", and set a `holeThinMaxAreaPx` limit to catch real cracks.
- **The reference video.** The original found that weapon words such as "rifle" tripped the video model's content filter. It never tried "bow". If the word trips it, describe the motion without naming the weapon.
