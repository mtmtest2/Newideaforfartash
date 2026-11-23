"""Generate the responsive / optimised image variants used by the site from the originals in assets-src/.

Outputs go to src/assets/img so Vite fingerprints them (safe for immutable caching).
- hero people: WebP q85 (visually identical to the q88 originals) at 480w, 640w and full width
- logos: lossless WebP at 352x89 = 2x the 44px desktop logo (and 3x the 30px phone logo)
"""
from PIL import Image
import os
SRC, OUT = 'assets-src', 'src/assets/img'
os.makedirs(OUT, exist_ok=True)
for name in ('student-man', 'student-woman'):
    im = Image.open(f'{SRC}/{name}.webp').convert('RGBA')
    for w in (480, 640, im.width):
        r = im if w == im.width else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        r.save(f'{OUT}/{name}-{w}.webp', quality=85, method=6)
        print(f'{name}-{w}.webp', r.size, os.path.getsize(f'{OUT}/{name}-{w}.webp') // 1024, 'KiB')
for name in ('logo-day', 'logo-night'):
    im = Image.open(f'{SRC}/{name}.png').convert('RGBA').resize((352, 89), Image.LANCZOS)
    im.save(f'{OUT}/{name}.webp', lossless=True, method=6)
    print(f'{name}.webp', im.size, os.path.getsize(f'{OUT}/{name}.webp') // 1024, 'KiB')
