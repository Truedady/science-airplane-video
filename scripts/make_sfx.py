"""
Procedurally synthesise all sound design for the video (original, license-free):
ambient music pad, wind bed, whooshes, UI blips, engine hum, spool-down,
take-off roar, riser and a soft impact. Output: public/sfx/*.wav (44.1 kHz mono).

Run:  python3 scripts/make_sfx.py
Requires only numpy. Deterministic (fixed seeds).
"""
import json
import os
import wave

import numpy as np

SR = 44100
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "sfx")
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(1234)


def save(name, x, peak=0.89):
    x = np.asarray(x, dtype=np.float64)
    m = np.max(np.abs(x)) or 1.0
    x = x / m * peak
    with wave.open(os.path.join(OUT, name), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
    print("wrote", name, f"{len(x) / SR:.2f}s")


def t_axis(sec):
    return np.arange(int(sec * SR)) / SR


def spectral(x, shape):
    """Static filter in the frequency domain. shape(f) -> gain."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X * shape(f), n=len(x))


def onepole_lp(x, fc):
    """Time-varying one-pole low-pass (fc may be an array)."""
    fc = np.broadcast_to(np.asarray(fc, dtype=np.float64), x.shape)
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    s = 0.0
    for i in range(len(x)):
        s = (1 - a[i]) * x[i] + a[i] * s
        y[i] = s
    return y


def env_adsr(n, a, r):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na) ** 2
    e[n - nr:] *= np.linspace(1, 0, nr) ** 2
    return e


def pink(n):
    return spectral(rng.standard_normal(n), lambda f: 1 / np.sqrt(np.maximum(f, 20)))


# ---------------------------------------------------------------- timeline
with open(os.path.join(ROOT, "data", "alignment.json")) as fh:
    AL = json.load(fh)
S = AL["sentences"]
gap = lambda i: (S[i - 1]["end"] + S[i]["start"]) / 2
TOTAL = AL["durationSec"] + 2.0
bounds = [0, gap(4), gap(5), gap(8), gap(12), gap(16), gap(19), gap(21), gap(27), TOTAL]

# ---------------------------------------------------------------- music pad
note = lambda m: 440 * 2 ** ((m - 69) / 12)
# One chord per scene (MIDI notes) — calm, wondering progression in D.
chords = [
    [50, 57, 62, 64, 69],  # Dadd9     mystery
    [47, 54, 59, 62, 66],  # Bm(add11) surprising answer
    [43, 50, 55, 59, 66],  # Gmaj7     hand
    [45, 52, 57, 61, 64],  # A         lift
    [47, 54, 59, 62, 69],  # Bm9       newton
    [43, 50, 59, 62, 66],  # Gmaj7     speed
    [45, 52, 57, 62, 64],  # Asus4     engines
    [40, 47, 55, 59, 62],  # Em9       glide (tension)
    [50, 57, 62, 66, 69, 74],  # D (resolve) finale
]
n = int(TOTAL * SR)
t = np.arange(n) / SR
pad = np.zeros(n)
for ci, ch in enumerate(chords):
    a, b = bounds[ci], bounds[ci + 1]
    # 2.5 s crossfades between chords
    w = np.clip((t - (a - 1.25)) / 2.5, 0, 1) * np.clip(((b + 1.25) - t) / 2.5, 0, 1)
    w = w ** 0.5
    if ci == 0:
        w = np.clip(t / 4.0, 0, 1) * np.clip(((b + 1.25) - t) / 2.5, 0, 1)
    idx = w > 0
    tt = t[idx]
    sig = np.zeros(idx.sum())
    for k, m in enumerate(ch):
        f0 = note(m)
        for det in (-0.12, 0.0, 0.11):
            ph = rng.uniform(0, 2 * np.pi)
            sig += np.sin(2 * np.pi * f0 * (1 + det / 100) * tt + ph) * (0.55 if k == 0 else 0.32)
            sig += 0.08 * np.sin(2 * np.pi * 2 * f0 * tt + ph)
        sig *= 1
    lfo = 0.8 + 0.2 * np.sin(2 * np.pi * 0.07 * tt + ci)
    pad[idx] += sig * w[idx] * lfo
# gentle shimmer on the finale
fin = t > bounds[8]
pad[fin] += 0.25 * np.sin(2 * np.pi * note(81) * t[fin]) * np.clip((t[fin] - 113.5) / 3, 0, 1) * (0.6 + 0.4 * np.sin(2 * np.pi * 5 * t[fin]))
pad = spectral(pad, lambda f: 1 / (1 + (f / 1800) ** 2))
pad *= np.clip(t / 3, 0, 1) * np.clip((TOTAL - t) / 2.0, 0, 1)
save("music_pad.wav", pad, peak=0.7)

# ---------------------------------------------------------------- wind bed
wind = pink(n)
wind = spectral(wind, lambda f: 1 / (1 + (f / 700) ** 2) * (f > 40))
gust = 0.65 + 0.35 * np.sin(2 * np.pi * 0.05 * t) * np.sin(2 * np.pi * 0.013 * t + 1)
wind *= gust * np.clip(t / 2, 0, 1) * np.clip((TOTAL - t) / 2, 0, 1)
save("wind_bed.wav", wind, peak=0.6)

# ---------------------------------------------------------------- whooshes
def whoosh(sec, f_lo, f_hi, seed):
    r = np.random.default_rng(seed)
    nn = int(sec * SR)
    tt = np.arange(nn) / SR
    x = r.standard_normal(nn)
    sweep = f_lo * (f_hi / f_lo) ** (np.sin(np.pi * tt / sec) ** 1.5)
    y = onepole_lp(x, sweep) - onepole_lp(x, sweep * 0.25)
    e = np.sin(np.pi * tt / sec) ** 2.2
    return y * e

save("whoosh.wav", whoosh(1.3, 300, 4200, 1))
save("whoosh_soft.wav", whoosh(0.9, 250, 2200, 2), peak=0.6)

# ---------------------------------------------------------------- UI blips
tt = t_axis(0.45)
blip = (np.sin(2 * np.pi * 1318.5 * tt) + 0.5 * np.sin(2 * np.pi * 1975.5 * tt)) * np.exp(-tt * 11)
blip *= np.clip(tt / 0.004, 0, 1)
save("ui_blip.wav", blip, peak=0.5)
tt = t_axis(0.2)
tick = np.sin(2 * np.pi * 2637 * tt) * np.exp(-tt * 40) * np.clip(tt / 0.002, 0, 1)
save("ui_tick.wav", tick, peak=0.4)

# ---------------------------------------------------------------- engine hum (cruise)
tt = t_axis(30)
hum = spectral(rng.standard_normal(len(tt)), lambda f: 1 / (1 + (f / 260) ** 2) / np.maximum(f, 30) ** 0.5)
hum /= np.max(np.abs(hum))
hum += 0.18 * np.sin(2 * np.pi * 92 * tt) + 0.08 * np.sin(2 * np.pi * 184 * tt) + 0.03 * np.sin(2 * np.pi * 1420 * tt)
hum *= env_adsr(len(tt), 1.0, 1.0)
save("engine_hum.wav", hum, peak=0.6)

# ---------------------------------------------------------------- spool-down (engines stop — no explosion)
tt = t_axis(4.5)
f = 1400 * np.exp(-tt * 0.75) + 60
ph = 2 * np.pi * np.cumsum(f) / SR
whine = 0.35 * np.sin(ph) + 0.12 * np.sin(2 * ph)
rumble = spectral(rng.standard_normal(len(tt)), lambda fr: 1 / (1 + (fr / 300) ** 2))
rumble /= np.max(np.abs(rumble))
spool = (whine + 0.7 * rumble) * np.exp(-tt * 0.8) * np.clip(tt / 0.05, 0, 1)
save("spool_down.wav", spool, peak=0.7)

# ---------------------------------------------------------------- take-off roar
tt = t_axis(6)
roar = spectral(rng.standard_normal(len(tt)), lambda fr: 1 / (1 + (fr / 900) ** 2) / np.maximum(fr, 30) ** 0.3)
roar /= np.max(np.abs(roar))
fr = 300 + 900 * (tt / 6) ** 1.3
roar += 0.12 * np.sin(2 * np.pi * np.cumsum(fr) / SR)
roar *= np.clip(tt / 3.5, 0, 1) ** 1.5 * np.clip((6 - tt) / 1.5, 0, 1)
save("takeoff_roar.wav", roar, peak=0.75)

# ---------------------------------------------------------------- riser + impact (finale)
tt = t_axis(2.4)
riser = onepole_lp(rng.standard_normal(len(tt)), 300 + 5000 * (tt / 2.4) ** 2) * (tt / 2.4) ** 2
save("riser.wav", riser, peak=0.5)
tt = t_axis(2.5)
boom = np.sin(2 * np.pi * (52 + 30 * np.exp(-tt * 8)) * tt) * np.exp(-tt * 2.2)
boom += 0.25 * spectral(rng.standard_normal(len(tt)), lambda fr: 1 / (1 + (fr / 180) ** 2)) * np.exp(-tt * 6) / 0.05 * 0.01
boom *= np.clip(tt / 0.004, 0, 1)
save("impact.wav", boom, peak=0.8)
