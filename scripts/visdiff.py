"""Compare two snapshot folders pixel by pixel. usage: python3 visdiff.py base new [diffdir]"""
import sys, os, glob
from PIL import Image, ImageChops
base, new = sys.argv[1], sys.argv[2]; out = sys.argv[3] if len(sys.argv) > 3 else None
worst = 0
for f in sorted(glob.glob(os.path.join(base, '*.png'))):
    n = os.path.join(new, os.path.basename(f))
    if not os.path.exists(n): print('MISSING', os.path.basename(f)); continue
    a, b = Image.open(f).convert('RGB'), Image.open(n).convert('RGB')
    note = '' if a.size == b.size else f' size {a.size}->{b.size}'
    h = min(a.height, b.height); a, b = a.crop((0, 0, a.width, h)), b.crop((0, 0, b.width, h))
    d = ImageChops.difference(a, b).convert('L').point(lambda v: 255 if v > 24 else 0)
    pct = 100 * sum(d.histogram()[255:]) / (d.width * d.height)
    worst = max(worst, pct)
    print(f'{os.path.basename(f):32s} {pct:6.3f}% changed{note}')
    if out and pct > 0.01:
        os.makedirs(out, exist_ok=True); bbox = d.getbbox()
        if bbox:
            pad = 40; box = (max(0, bbox[0]-pad), max(0, bbox[1]-pad), min(a.width, bbox[2]+pad), min(h, bbox[3]+pad))
            side = Image.new('RGB', ((box[2]-box[0])*2+10, box[3]-box[1]), 'red')
            side.paste(a.crop(box), (0, 0)); side.paste(b.crop(box), (box[2]-box[0]+10, 0)); side.save(os.path.join(out, os.path.basename(f)))
print(f'worst: {worst:.3f}%')
