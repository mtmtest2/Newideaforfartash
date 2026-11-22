"""Score each voice / text variant by Whisper character error rate (lower = clearer)."""
import json, sys, numpy as np, sherpa_onnx, scipy.signal as ss, re
TT, A = sys.argv[1], sys.argv[2]
rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=f"{A}/small-encoder.int8.onnx", decoder=f"{A}/small-decoder.int8.onnx", tokens=f"{A}/small-tokens.txt", language="fa", task="transcribe", num_threads=4, tail_paddings=8000)
lines = [l for s in json.load(open('narration.json')) for l in s['lines']]
norm = lambda s: re.sub(r'[\s‌،؛:.!؟ِ]', '', s).replace('ي', 'ی').replace('ك', 'ک')
def cer(r, h):
    r, h = norm(r), norm(h); d = list(range(len(h) + 1))
    for i, rc in enumerate(r, 1):
        p, d[0] = d[0], i
        for j, hc in enumerate(h, 1):
            p, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, p + (rc != hc))
    return d[-1] / max(1, len(r))
for v in sys.argv[3:]:
    md = f"{TT}/m-{v}/vits-piper-fa_IR-{v}"
    tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=f"{md}/fa_IR-{v}.onnx", tokens=f"{md}/tokens.txt", data_dir=f"{md}/espeak-ng-data", length_scale=1.08, noise_scale=0.6, noise_scale_w=0.7), num_threads=4)))
    for variant in ('kasre', 'plain'):
        scores = []
        for l in lines:
            text = l if variant == 'kasre' else l.replace('ِ', '')
            a = tts.generate(text, sid=0, speed=1.0)
            w = ss.resample_poly(np.array(a.samples, dtype=np.float32), 16000, a.sample_rate).astype('float32')
            st = rec.create_stream(); st.accept_waveform(16000, w); rec.decode_stream(st)
            scores.append(cer(l.replace('ِ', ''), st.result.text))
        print(v, variant, 'mean CER %.3f' % np.mean(scores), ' '.join('%.2f' % s for s in scores), flush=True)
