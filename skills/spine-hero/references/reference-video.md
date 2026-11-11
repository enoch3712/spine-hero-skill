# Motion reference video

An image-to-video model animates the hero's own rest picture. The clip is a reference for **timing and beats** only: when each foot lands, how long a wind-up lasts, how high a swing foot lifts, and how hidden parts look mid-stride. It is never used as frames, and bones are never fitted to its per-frame landmarks. The video's body drifts toward the camera, and a one-view rig that follows it turns to mush.

**It is optional.** The author works from a beats file, and the video is only the best way to fill it. The idle never uses one.

## Who makes it

In the original project, the orchestrator made the videos in Google Flow (model Omni 1.2 Flash) through the human's signed-in browser. Sub-agents could not reach that browser. Approve each generation one at a time, never "approve always", and note what each one cost. A higher-quality model (Veo 3.1 Quality) cost about four times as much per clip there. Use one only if the cheaper model visibly fails to stay loyal to the picture, and ask the human first.

## Settings

- **First frame:** the hero's rest picture on a plain, flat, light grey backdrop.
- **For a loop:** use the same picture as the last frame, and trim the last 0.5 s, where the model morphs back.
- **One action per clip,** 4-8 s, one output unless asked for more.
- Keep a small manifest per clip: model, cost, prompt, input picture.

## Prompt rules

Each of these rules comes from a failure that happened:

- "Static camera, no zoom, no pan, no cut." The figure stays the same size for the whole clip.
- Keep the exact view of the first frame. The body never turns toward or away from the camera, the head stays in profile, and the mouth stays closed.
- The near arm and leg stay on the near side. The legs never cross, and each foot steps under its own hip.
- Props stay rigid and are held the same way, with no regrip.
- Beard, braids, coat and pouches sway only a little.
- A walk crosses the frame left to right, parallel to the camera, so foot plants can be measured.
- Plain flat backdrop, one steady light, and nothing added (no dust, smoke or moving shadows).
- Wording that passed the content filter: "an original character from my own game". Avoid words such as "soldier", "rifle" and the hero's species ("dwarf" in the original).

## Template

> Animate this original character from my own game, using the attached image as the first frame. He walks slowly from left to right across the frame at a steady pace, parallel to the camera, for the whole clip. Static camera, no zoom, no pan, no cut; he stays the same size. Keep exactly the side view of the image: his body and head never turn toward the camera. Each foot steps straight under its own hip, the legs never cross, and the near arm stays on the near side. He holds [props] rigidly in the same grip the whole time. His [hanging pieces: hair, beard, coat] sway only slightly. Plain flat light grey background, one steady light, nothing else appears.

For a move, replace the second sentence with the one action, and keep the rest.

## Reading it

1. Cut a contact sheet of consecutive frames, cropped on the hero. A run needs every frame of one stride, because the flight frames are easy to miss.
2. Write the beats into a small JSON file (below): contact, down, passing and up (or flight) per foot; the step time; the swing height; the lean. For a move: wind-up, strike, hold and return times.
3. The author works from that file and the sheet, in the rig's own view.

## The beats file

No script reads it: it is the author's input, so field names are free. This shape follows the beats files the original wrote for a walk and a run (renamed and trimmed; the numbers show one run and are only illustrative). Keep the reference's own numbers and the rig's numbers apart, because the rig is heavier or lighter than the video and the two differ on purpose.

```json
{
  "source": { "kind": "video", "file": "ref/run.mp4", "fps": 24, "frames": 192, "figureHeightPx": 415,
              "note": "side view; the legs never cross" },
  "cadence": { "stepSeconds": 0.52, "strideSeconds": 1.04 },
  "beats": {
    "contact":  { "near": [27, 52], "far": [40, 65] },
    "liftOff":  { "near": [35, 60], "far": [23, 48] },
    "passing":  { "near": [46, 71], "far": [33, 58] },
    "flight":   [[24, 26], [37, 39]]
  },
  "measures": { "swingLiftBodyHeights": 0.07, "headBobBodyHeights": 0.055, "leanDeg": [15, 20], "flightFramesPerStep": [2, 3] },
  "upperBody": { "props": "rigid in the fist; the arm pumps a little", "hanging": "hair and coat swing up a beat after each landing" },
  "forTheRig": { "fps": 24, "stepFrames": 12, "stanceFrames": 8, "flightFramesPerStep": 3, "leanDeg": 15,
                 "bob": "smaller than the video's: the rig is heavier", "speedFrom": "cadence, not a longer stride" }
}
```

For a move, `beats` holds `windUp`, `strike`, `hold` and `return` as `[firstFrame, lastFrame]`, and `forTheRig` the move's duration.

## Without a video model

- **Idle:** never needs one.
- **Walk, run or move:** write the beats file by hand from any timing reference you have, and set `source.kind` to say what it was. The original did this once: a new walk took its cadence and contact times from an older animation of the same hero, read from that clip's events and its strip (see [locomotion.md](locomotion.md)). Reference footage of a real person or another game would serve the same way, for timing only; the original did not try that.
- **What you lose:** the video also showed how the hidden parts look mid-stride. Without it, the image model paints them from the rest picture alone, and the review and check watch those parts more closely.
- **If the video is poor** (the body turns, the camera moves, a prop regrips): use only the beats you can read from frames where the view holds, and write down which you guessed.
