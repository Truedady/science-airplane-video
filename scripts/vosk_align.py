import json, sys, wave, re
from vosk import Model, KaldiRecognizer, SetLogLevel
SetLogLevel(-1)
wav, model_dir, script, out, mode = sys.argv[1:6]
m = Model(model_dir)
wf = wave.open(wav)
if mode == "grammar":
    words = sorted(set(re.findall(r"[a-z']+", open(script).read().lower().replace("’","'"))))
    rec = KaldiRecognizer(m, wf.getframerate(), json.dumps(words + ["[unk]"]))
else:
    rec = KaldiRecognizer(m, wf.getframerate())
rec.SetWords(True)
res = []
while True:
    d = wf.readframes(4000)
    if not d: break
    if rec.AcceptWaveform(d): res.append(json.loads(rec.Result()))
res.append(json.loads(rec.FinalResult()))
words = [w for r in res for w in r.get("result", [])]
json.dump(words, open(out, "w"), indent=0)
print(len(words)); print(" ".join(w["word"] for w in words))
