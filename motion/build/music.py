"""Synthesize a calm royalty-free bed (pad + arpeggio + bass + shaker) and mix it under the voice with ducking."""
import sys, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, resample_poly
SR = 44100
voice, vsr = sf.read(sys.argv[1], dtype='float32')
voice = resample_poly(voice, SR, vsr).astype(np.float32)
N = len(voice); T = N / SR
t = np.arange(N) / SR
BPM = 92; beat = 60 / BPM; bar = beat * 4
midi = lambda m: 440 * 2 ** ((m - 69) / 12)
# Cmaj7 – G6 – Am7 – Fmaj9 (2 bars each)
CH = [[48, 55, 59, 64, 67], [43, 55, 59, 62, 64], [45, 55, 60, 64, 67], [41, 57, 60, 64, 67]]
rng = np.random.default_rng(7)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
pad = np.zeros(N); arp = np.zeros(N); bass = np.zeros(N); shk = np.zeros(N)
seg = 2 * bar; nseg = int(np.ceil(T / seg))
for k in range(nseg):
    ch = CH[k % 4]; s0 = int(k * seg * SR); s1 = min(N, int((k + 1) * seg * SR) + int(.8 * SR))
    if s0 >= N: break
    tt = np.arange(s1 - s0) / SR; L = len(tt)
    env = np.minimum(1, tt / 1.2) * np.clip((seg + .8 - tt) / 0.8, 0, 1)
    for m in ch[1:]:
        f = midi(m + 12)
        for det in (-0.12, 0.12):
            ff = f * 2 ** (det / 12)
            pad[s0:s1] += env * (np.sin(2 * np.pi * ff * tt) + .35 * np.sin(4 * np.pi * ff * tt) + .12 * np.sin(6 * np.pi * ff * tt)) * .05
    fb = midi(ch[0])
    benv = np.minimum(1, tt / .05) * np.clip((seg - tt) / .3, 0, 1)
    bass[s0:s1] += benv * (np.sin(2 * np.pi * fb * tt) + .2 * np.sin(4 * np.pi * fb * tt)) * .22
    # eighth-note arpeggio up/down
    pattern = ch[1:] + ch[-2:0:-1]
    for i in range(int(seg / (beat / 2))):
        n0 = s0 + int(i * beat / 2 * SR)
        if n0 >= N: break
        m = pattern[i % len(pattern)] + 24; f = midi(m); d = int(.9 * SR); n1 = min(N, n0 + d)
        ta = np.arange(n1 - n0) / SR
        e = np.exp(-ta * 5.5) * np.minimum(1, ta / .004)
        vel = .55 + .45 * ((i % 4) == 0)
        arp[n0:n1] += vel * e * (np.sin(2 * np.pi * f * ta) + .25 * np.sin(4 * np.pi * f * ta) * np.exp(-ta * 9)) * .07
        # shaker on off-beats
        if i % 2 == 1:
            ds = int(.08 * SR); n2 = min(N, n0 + ds)
            shk[n0:n2] += rng.standard_normal(n2 - n0) * np.exp(-np.arange(n2 - n0) / SR * 60) * .025
pad = lp(pad, 2600); arp = lp(arp, 5000); shk = hp(shk, 6000)
# simple stereo: arp ping-pong, pad wide via short delay
dl = int(.012 * SR)
L = pad + bass + arp * np.where((np.arange(N) // int(beat / 2 * SR)) % 2 == 0, .8, .45) + shk * .7
R = np.concatenate([np.zeros(dl), pad[:-dl]]) + bass + arp * np.where((np.arange(N) // int(beat / 2 * SR)) % 2 == 0, .45, .8) + shk
# echo on arp for space
ec = int(beat * .75 * SR)
L[ec:] += .22 * arp[:-ec]; R[ec:] += .22 * arp[:-ec]
music = np.stack([L, R], 1); music /= np.max(np.abs(music)) + 1e-9
# ducking from voice envelope
env = np.abs(voice); win = int(.25 * SR)
env = np.convolve(env, np.ones(win) / win, 'same')
on = (env > .02).astype(float)
k = int(.35 * SR); on = np.convolve(on, np.ones(k) / k, 'same')
gain = .30 - .19 * np.clip(on * 1.5, 0, 1)
fade = np.minimum(1, t / 1.5) * np.clip((T - t) / 3.0, 0, 1)
music *= (gain * fade)[:, None]
mix = music + voice[:, None] * .95
mix /= np.max(np.abs(mix)) / .93
sf.write(sys.argv[2], mix.astype(np.float32), SR)
sf.write(sys.argv[3], (music / (np.max(np.abs(music)) / .8)).astype(np.float32), SR)
print('ok', round(T, 2))
