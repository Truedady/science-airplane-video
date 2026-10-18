import json, re, difflib, sys
script_path, free_p, gram_p, out = sys.argv[1:5]
lines = [l.strip() for l in open(script_path, encoding="utf-8") if l.strip()]
norm = lambda w: re.sub(r"[^a-z']", "", w.lower().replace("’", "'"))
HOMO = {"two": "to", "its": "it's", "weigh": "way"}
def load(p):
    ws = json.load(open(p))
    return [dict(w, n=HOMO.get(w["word"], w["word"])) for w in ws]
free, gram = load(free_p), load(gram_p)
# script tokens
toks = []
for si, l in enumerate(lines):
    for raw in l.split():
        toks.append({"text": raw, "n": HOMO.get(norm(raw), norm(raw)), "sentence": si})
def match(src):
    a = [t["n"] for t in toks]; b = [w["n"] for w in src]
    m = {}
    for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for k in range(blk.size): m[blk.a + k] = src[blk.b + k]
    return m
mg, mf = match(gram), match(free)
words = []
for i, t in enumerate(toks):
    g, f = mg.get(i), mf.get(i)
    # sanity: both passes should agree on timing within 150 ms when both exist
    if g and f and abs(g["start"] - f["start"]) > 0.15: g = None
    w = g or f
    words.append({"i": i, "text": t["text"], "sentence": t["sentence"],
                  "start": round(w["start"], 3) if w else None, "end": round(w["end"], 3) if w else None,
                  "conf": round(w["conf"], 3) if w else None,
                  "source": ("both" if (mg.get(i) and mf.get(i)) else "grammar" if mg.get(i) else "free" if f else "unmatched")})
missing = [w for w in words if w["start"] is None]
for w in missing:  # should be none; report rather than invent
    print("UNMATCHED:", w)
sents = []
for si, l in enumerate(lines):
    ws = [w for w in words if w["sentence"] == si and w["start"] is not None]
    sents.append({"i": si, "text": l, "start": ws[0]["start"], "end": ws[-1]["end"], "firstWord": ws[0]["i"], "lastWord": ws[-1]["i"]})
json.dump({"audio": "voiceover.mp3", "durationSec": 117.080813, "sampleRate": 44100,
           "method": "Vosk/Kaldi (Zamia kaldi-generic-en-tdnn_250) word timestamps: free recognition + script-vocabulary grammar pass, matched to script.txt with difflib; timings cross-checked between passes (<150ms)",
           "sentences": sents, "words": words}, open(out, "w"), indent=1)
for s in sents: print(f'{s["i"]:2d} {s["start"]:7.2f} {s["end"]:7.2f}  {s["text"][:70]}')
print("sources:", {k: sum(1 for w in words if w["source"]==k) for k in ["both","grammar","free","unmatched"]})
