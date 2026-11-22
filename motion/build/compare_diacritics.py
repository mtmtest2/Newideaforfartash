"""Whisper CER for the same voice speaking the plain caption text vs the fully vowelled TTS text."""
import json, sys, re, numpy as np, sherpa_onnx, scipy.signal as ss
md, A = sys.argv[1], sys.argv[2]
name = re.sub(r'.*vits-piper-', '', md.rstrip('/'))
rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=f"{A}/small-encoder.int8.onnx", decoder=f"{A}/small-decoder.int8.onnx", tokens=f"{A}/small-tokens.txt", language="fa", task="transcribe", num_threads=4, tail_paddings=8000)
tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=f"{md}/{name}.onnx", tokens=f"{md}/tokens.txt", data_dir=f"{md}/espeak-ng-data", length_scale=1.08, noise_scale=0.6, noise_scale_w=0.7), num_threads=4)))
norm = lambda s: re.sub(r'[\s‌،؛:.!؟ً-ْٔ]', '', s).replace('ي', 'ی').replace('ك', 'ک').replace('ة', 'ه')
def cer(r, h):
    r, h = norm(r), norm(h); d = list(range(len(h) + 1))
    for i, rc in enumerate(r, 1):
        p, d[0] = d[0], i
        for j, hc in enumerate(h, 1):
            p, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, p + (rc != hc))
    return d[-1] / max(1, len(r))
lines = [l for s in json.load(open('narration.json')) for l in s['lines']]
res = {'plain': [], 'vowelled': []}
for l in lines:
    for k, text in (('plain', l['cap']), ('vowelled', l['tts'])):
        a = tts.generate(text, sid=0, speed=1.0)
        w = ss.resample_poly(np.array(a.samples, dtype=np.float32), 16000, a.sample_rate).astype('float32')
        st = rec.create_stream(); st.accept_waveform(16000, w); rec.decode_stream(st)
        res[k].append(cer(l['cap'], st.result.text))
for k, v in res.items(): print(k, 'mean CER %.3f' % np.mean(v), ' '.join('%.2f' % x for x in v), flush=True)
