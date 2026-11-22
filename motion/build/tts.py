"""Synthesize narration per line, lay out the timeline, write voice.wav + timing.js."""
import json, sys, re
import numpy as np, sherpa_onnx, soundfile as sf

model_dir, out_dir = sys.argv[1], sys.argv[2]
voice = re.sub(r'.*fa_IR-', '', model_dir.rstrip('/'))
name = f"fa_IR-{voice}"
cfg = sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(vits=sherpa_onnx.OfflineTtsVitsModelConfig(
    model=f"{model_dir}/{name}.onnx", tokens=f"{model_dir}/tokens.txt", data_dir=f"{model_dir}/espeak-ng-data",
    length_scale=1.08, noise_scale=0.6, noise_scale_w=0.7), num_threads=4))
tts = sherpa_onnx.OfflineTts(cfg)
SR = 22050
scenes = json.load(open(sys.argv[3]))
LEAD, GAP, SCENE_GAP, TAIL = 1.2, 0.45, 0.9, 4.5  # seconds
t = LEAD; chunks = []; caps = []; timing = []
TARGET = 10 ** (-20 / 20)  # -20 dBFS RMS on voiced samples, same for every line
def level(w):
    """Even out loudness: RMS-normalize the voiced part, then a gentle per-50ms compressor."""
    voiced = w[np.abs(w) > 0.02]
    w = w * (TARGET / (np.sqrt(np.mean(voiced ** 2)) + 1e-9))
    blk = int(0.05 * SR); n = len(w) // blk * blk
    if n:
        b = w[:n].reshape(-1, blk); r = np.sqrt((b ** 2).mean(1)) + 1e-9
        g = np.where(r > TARGET * 1.4, (TARGET * 1.4 / r) ** 0.5, 1.0)  # 2:1 above threshold
        g = np.convolve(g, np.ones(5) / 5, 'same')
        w[:n] = (b * np.repeat(g, blk).reshape(b.shape)).ravel()
    f = int(0.015 * SR); ramp = np.linspace(0, 1, f)
    w[:f] *= ramp; w[-f:] *= ramp[::-1]
    return np.tanh(w * 1.2) / 1.2
def silence(s): return np.zeros(int(s * SR), dtype=np.float32)
chunks.append(silence(LEAD))
for si, sc in enumerate(scenes):
    start = t - (LEAD if si == 0 else 0.5)
    for li, line in enumerate(sc["lines"]):
        a = tts.generate(line["tts"], sid=0, speed=1.0)
        w = np.array(a.samples, dtype=np.float32)
        # trim leading/trailing near-silence
        nz = np.where(np.abs(w) > 0.01)[0]
        w = w[max(0, nz[0] - 200): nz[-1] + 400] if len(nz) else w
        w = level(w)
        caps.append([round(t, 3), round(t + len(w) / SR, 3), line["cap"]])
        chunks.append(w); t += len(w) / SR
        g = GAP if li < len(sc["lines"]) - 1 else SCENE_GAP
        if si == len(scenes) - 1 and li == len(sc["lines"]) - 1: g = TAIL
        chunks.append(silence(g)); t += g
    timing.append({"id": sc["id"], "s": round(max(0, start), 3), "len": round(t - max(0, start) + 0.4, 3)})
voice_track = np.concatenate(chunks)
voice_track = voice_track / max(1e-9, np.max(np.abs(voice_track))) * 0.89
sf.write(f"{out_dir}/voice.wav", voice_track, SR)
total = round(len(voice_track) / SR, 3)
with open(f"{out_dir}/../timing.js", "w") as f:
    f.write("window.TIMING = " + json.dumps({"total": total, "scenes": timing, "captions": caps}, ensure_ascii=False) + "\n")
print("total", total); [print(x) for x in timing]
