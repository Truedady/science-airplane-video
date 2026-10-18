# Why Don't Airplanes Fall Out of the Sky?

An animated science explainer built with **React + TypeScript + Remotion 4**.
It's 1920×1080 at 30 fps, exported as H.264 MP4, and fully synchronized to the
prerecorded narration in `voiceover.mp3`.

The narration is the master clock. It is never edited, re-timed, sped up or
trimmed. Every scene boundary and visual reveal is anchored to a word
timestamp measured from the recording.

## Quick start

```bash
npm install
npm run dev                         # Remotion Studio (preview + scrub, all scenes editable)
npm run build                       # → out/airplane-explainer.mp4
```

Sandboxed/CI machines that can't download Remotion's headless Chrome can point
the renderer at a local Chromium:

```bash
REMOTION_BROWSER=/path/to/chrome-headless-shell npx remotion render AirplaneExplainer out/airplane-explainer.mp4 --concurrency=4
```

Other useful commands:

```bash
npx remotion render AirplaneExplainer out/opening.mp4 --frames=0-449   # first 15 s
node scripts/stills.mjs AirplaneExplainer 300,1200,2400 out/stills     # inspection frames
node scripts/export-timing.mjs                                          # refresh data/scene-timing.json
python3 scripts/make_sfx.py                                             # regenerate sound design
```

## Duration

| | |
|---|---|
| Voiceover (measured with ffprobe) | **117.081 s** (44.1 kHz mono, 128 kbps) |
| Silent outro after the last word, for the final title and fade | 2.0 s |
| Video | **3573 frames = 119.10 s** |

The narration starts at frame 0 and plays unaltered.

## Audio alignment (`data/`)

| File | Contents |
|---|---|
| `data/alignment.json` | **Word-level** (303 words) and **sentence-level** (30 lines of `script.txt`) timestamps, with confidence and source for each word |
| `data/scene-timing.json` | Resolved scene frame ranges and all 89 visual cues (seconds + frames) |
| `data/raw/vosk_free.json`, `vosk_grammar.json` | Raw recognizer output, kept so the alignment is reproducible |

**How it was produced.** The Whisper model weights could not be downloaded in
the build environment (Hugging Face and the OpenAI model CDN are blocked).
Instead, the alignment uses the Kaldi-based **Vosk** recognizer with the Zamia
`kaldi-generic-en-tdnn_250` English acoustic model, which ships inside the
`vosk-stt` npm package. It runs in two passes:

1. Free speech recognition with word timestamps. The transcript matched the
   script almost word for word ("air planes", "tilted", "contemporary early" for
   "can temporarily" were the only slips).
2. A grammar-constrained pass restricted to the script's vocabulary.

Both passes are matched to `script.txt` with a sequence alignment
(`scripts/build_alignment.py`). A word's timing is accepted only when the two
passes agree within 150 ms (or when only one pass recognized the word). Result:
all **303/303** script words have measured timestamps. None are interpolated or
invented. Frame resolution of the recognizer is 30 ms, about one video frame.

To re-run: `scripts/vosk_align.py` (needs `pip install vosk` and the model
folder from the `vosk-stt` npm package), then `scripts/build_alignment.py`.

## Retiming visuals

`src/timeline.ts` reads `data/alignment.json`:

- `SCENES`: each scene starts in the pause just before its first sentence and
  overlaps the next by 18 frames for a dissolve.
- `CUES`: named visual events, each anchored to a spoken word, e.g.
  `lift: at(11, 'lift.')` means "sentence 11, the word *lift.*"

To move a reveal, anchor it to a different word. If the voiceover is
re-recorded, regenerate `alignment.json` and every scene and cue follows
automatically.

## Scenes

| # | Scene | Narration | Key synchronized events |
|---|---|---|---|
| 1 | The mystery | 0.0–14.1 s | Title → push-in on the jet · distant traffic on *thousands* · mass gauge on *weigh / hundreds of tons* · gravity arrow on *simply fall?* |
| 2 | The surprising answer | 14.1–18.5 s | Engines highlighted on *surprising*, struck out on *not … engines* · wings glow on *hold them up* |
| 3 | Hand experiment | 18.5–32.3 s | Car side-tracking shot · close-up on *hand* · hand tilts on *Tilt* · flow bends and upward push on *air … upward* · hand morphs into the airfoil on *wing* · giant airliner scale reveal on *much bigger scale* |
| 4 | How a wing makes lift | 32.3–49.2 s | Streamlines on *air flows* · camber callout on *shape* · angle of attack on *angle* · smoke pulse on *moves* (upper parcels pull ahead) · pressure field on *pressure* · −/+ labels on *above/below* · LIFT on *lift* |
| 5 | Newton's third law | 49.2–65.6 s | Pull-back on *another way* · downwash and velocity field on *pushes … downward* · law card on *Newton's* · paired arrows on *pushes air down / pushes the wing up* · "one force, two descriptions" on *same* |
| 6 | Why speed matters | 65.6–76.6 s | Airspeed drops on *catch* (lift ∝ v² shrinks below weight) · rises on *flow past … sufficient speed* · runway roll on *that's why … accelerate* · rotation and lift-off on *taking off* |
| 7 | What engines do | 76.6–85.4 s | Lift + weight recap · engines glow on *engines* · THRUST + exhaust on *thrust* · DRAG on *air resistance* · balance on *maintain speed* |
| 8 | Engine failure & glide | 85.4–106.0 s | Thrust gauge to zero + spool-down on *suddenly stop* · "Not immediately" · glide path on *gliding* · altitude tape on *altitude* · airspeed held on *forward speed* · glide forces and airflow inset on *wings continue producing lift* |
| 9 | It's physics | 106.0–119.1 s | Golden-hour wide shot · "Not magic" · airflow made visible on *invisible air* · **IT'S PHYSICS.** on *physics* · pull-back and fade |

## Scientific accuracy

The airflow is not hand-animated. `src/lib/flow.ts` computes real 2D potential
flow around a cambered **Joukowski airfoil** at 7° angle of attack, with
circulation set by the **Kutta condition**. From that one solution the video
draws:

- **Streamlines and moving parcels.** Streak length is proportional to local
  speed. Air over the top moves at about 1.3× freestream, air underneath at
  about 0.83×.
- **Pressure field** as Cp = 1 − (V/V∞)²: suction above (cyan), overpressure
  below (orange). Surface arrows show local pressure acting normal to the skin.
- **Smoke pulse.** Parcels released together do **not** meet at the trailing
  edge; the upper ones arrive first. This directly refutes the
  equal-transit-time myth.
- **Upwash ahead and downwash behind** the wing, from the velocity field itself.
- The Newton scene treats the downward push on the air and the upward push on
  the wing as **one interaction acting on two different bodies**. The upward
  arrow becomes the single LIFT arrow, never a second force added on top.
- In level flight, lift ≈ weight and thrust ≈ drag. In the glide, lift is drawn
  **perpendicular to the descending path** and drag along it, with no thrust.
- Lift on the runway grows with airspeed²; the jet only rotates once lift
  exceeds weight. Nothing hovers without airflow.
- The video uses no invented figures: no tonnage, speeds or glide ratios. The
  mass gauge says only "hundreds of tons", as the narration does.

## Sound design

The narration plays at volume 1, untouched. All other audio is **original and
synthesized** by `scripts/make_sfx.py` (numpy only, deterministic): an ambient
chord pad that changes with each scene, a wind bed, transition whooshes,
interface blips, cruise engine hum, a take-off roar, a calm engine spool-down
(no explosion), and a riser plus soft impact for the final title. No third-party
or copyrighted audio is used. The mix is in `src/Soundtrack.tsx`; music sits
about 20 dB under the voice.

## Project structure

```
src/
  index.ts / Root.tsx        compositions: full video + each scene standalone
  Video.tsx                  master timeline (scenes as Sequences)
  Soundtrack.tsx             narration + sound design mix
  timeline.ts                audio-derived scene ranges and cues
  theme.ts                   palette + local fonts (Sora, Inter via @fontsource files)
  lib/flow.ts                Joukowski/Kutta potential-flow solver
  lib/anim.ts                easing, deterministic PRNG, helpers
  components/
    Airliner.tsx             original vector jet (anchor points for forces)
    Flow.tsx                 Airfoil, Streamlines, Particles, SmokePulse,
                             PressureField, SurfacePressure, VelocityGrid
    Infographics.tsx         ForceArrow, Gauge, Meter, Callout
    Clouds.tsx               CloudLayer (parallax), CloudSea
    Sky.tsx                  Sky moods, LabBackdrop, Vignette
    HandAndCar.tsx           hand profile (morphs into airfoil), car
    Camera.tsx               virtual camera + parallax planes
    SceneShell.tsx           cinematic dissolve between scenes
    Typography.tsx           Headline (kinetic), Tag, Kicker
  scenes/S1…S9               the nine sequences
scripts/                     alignment, sfx synthesis, stills, timing export
data/                        alignment + scene timing JSON
public/                      voiceover.mp3, fonts, sfx
```

All animation is driven by `useCurrentFrame()`. Randomness is seeded
(mulberry32), so every render worker produces identical frames.

**Rendering note:** don't force `Config.setChromiumOpenGlRenderer('swangle')` on
CPU-only machines. The default renderer measured about 3× faster here.
