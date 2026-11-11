# Defects a human caught that the checks missed

Before any video goes to the human, every check goes through this list item by item. Look at the full-size 2x close-ups of the feet and the head, and at the strips, frame by frame. When the human catches something new, add a line here, and add a gate check too if the defect can be measured.

| # | Defect | How to see it |
|---|---|---|
| 1 | **A revealed part painted in a softer hand:** no ink outline, a muddy fill, so it reads as a blob. Seen on a far boot painted for the walk. | Compare its outline weight and texture with the same part in the rest painting. |
| 2 | **Ragged, torn edges where a part was split to bend.** Seen on a near shin under a weapon. | Zoom on every split seam. The ink line must run on unbroken. |
| 3 | **Feet that slide in as stiff pieces** instead of rolling. | Watch the sole across a contact. The heel lift and toe-off happen in the air, and the landing is flat. |
| 4 | **A far-side part cloned from its near-side twin:** the same shape, brightness and rim light, so at passing the two read as one doubled part. | Put the two parts side by side. The far one must be darker (it is on the shadow side), carry little or no rim light, and differ in shape where the view differs. |
| 5 | **A far-side part as bright as the near side.** | The far leg, arm or boot sits in shadow in the rest painting and in the hero's own video. Match that value. |
| 6 | **A part floating free of its limb,** with a gap between boot and trouser. | In each sampled frame, follow every limb from hip to sole. No background may show between pieces that should touch. |
| 7 | **A band or patch of the wrong colour** across a part during motion. Seen as a tan band across a shin at passing. | Scan each frame for colour that is not in the rest painting at that place. |
| 8 | **Rigid clothing:** a coat or skirt moving as one block with the body. | Watch the hem across a stride. It should trail the legs slightly. |
| 9 | **A far-side part drawn too small.** A generated far boot matched the near boot's sole length but covered only 67 % (planted) and 48 % (swing) of its area, and the human saw a small boot at once. | Measure the part's own area (its leather, not a share of the part image) against the near twin. It should be at least about 0.9-1.0 of it, and a far part may need to be bigger than it measures to read right at game size ([locomotion.md](locomotion.md)). |
| 10 | **One part drawn at different sizes in different drawings.** The far boot grew about 40 % in area when the swing drawing switched in and shrank on landing, which read as a flicker. | Look at the part in the frames on both sides of every attachment switch. Measure each drawing's part by its own area, never by sole landmarks or the bottom of the image. |
| 11 | **Flecks that come and go.** Rim-light fragments that an arm or prop hid at rest show as detached bits once it moves. Thin strokes also shimmer when the atlas has no mipmaps. | Look at consecutive frames at 4x beside every moving occluder. To find which part owns a fleck, recolour each part's rim colour in a throwaway build and capture once. Give the atlas pages mipmaps ([rig.md](rig.md)). |
| 12 | **A part's mesh folding over itself.** A drawing bound in its own painted bend collapsed as the foot flattened for the landing: a straight cut across the heel for 3 frames each stride. It read as a flicker, and two checks passed it. | Score the pops per frame on the part's region: look for a spike once per stride, away from any drawing switch. Tint the part one colour in a throwaway build. A straight edge with nothing in front of it is a fold. |
| 13 | **A prop cut off flat at an edge of the lit picture.** A leap's raised weapon lost the top of its head, and a crouch's weapon lost its back end, because the pose drew past the hero's box. The lit figure is one picture the size of the box. The unlit capture draws straight to the screen, so it showed nothing wrong. | Now gated: `boxOverflowUnits` must be 0 ([gate.md](gate.md)). After adding a move, a drawing or a weapon, measure every clip with every weapon. Look at the lit frames where a prop is highest, lowest and furthest back. |

## Also look for

These came from the check prompts the original pipeline used:

- a doubled part at passing;
- pops between neighbouring frames, and paint popping when drawings switch;
- a limb or shoulder plate bent into an impossible shape;
- a prop not held: floating at arm's length, detached, or a weapon leaving the fist;
- feet sinking below the floor line or floating while planted;
- a clip that does not end back at rest, or a loop that jumps at its seam;
- a stance that reads as static: no breathing, weight or push in its hold.
