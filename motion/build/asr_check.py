"""Transcribe each caption span of voice.wav with Whisper to sanity-check TTS intelligibility."""
import json, sys, re
import numpy as np, soundfile as sf, sherpa_onnx
A = sys.argv[1]
rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=f"{A}/small-encoder.int8.onnx", decoder=f"{A}/small-decoder.int8.onnx", tokens=f"{A}/small-tokens.txt", language="fa", task="transcribe", num_threads=4)
w, sr = sf.read(sys.argv[2], dtype='float32')
T = json.loads(open(sys.argv[3]).read().split('=', 1)[1])
import scipy.signal as ss
for s, e, txt in T["captions"]:
    seg = w[int(s * sr):int(e * sr) + 2000]
    seg16 = ss.resample_poly(seg, 16000, sr).astype('float32')
    st = rec.create_stream(); st.accept_waveform(16000, seg16); rec.decode_stream(st)
    print("REF:", txt); print("ASR:", st.result.text.strip()); print()
