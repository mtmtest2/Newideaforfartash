"""Compose placeholder professor card photos (Arabic, Turkish) in the style of the mockup crops:
cream background, rounded lime panel, pale-green landmark line drawing, person cutout."""
from PIL import Image, ImageDraw, ImageFilter
S = 2; W, H = 504 * S, 350 * S
CREAM, LIME, LINE = (246, 240, 230), (184, 207, 128), (150, 178, 98)

def base():
    im = Image.new('RGB', (W, H), CREAM); d = ImageDraw.Draw(im)
    d.rounded_rectangle((14 * S, 18 * S, 470 * S, H + 200), radius=190 * S, fill=LIME)
    return im, d

def mosque(d, x, y):  # dome + drum + minaret, line drawing
    w = 4 * S
    d.rectangle((x, y + 120 * S, x + 150 * S, y + 300 * S), outline=LINE, width=w)
    d.pieslice((x + 15 * S, y + 30 * S, x + 135 * S, y + 190 * S), 180, 360, outline=LINE, width=w)
    d.line((x + 75 * S, y + 30 * S, x + 75 * S, y), fill=LINE, width=w)
    d.ellipse((x + 68 * S, y - 16 * S, x + 82 * S, y - 2 * S), outline=LINE, width=w)
    for i in range(3):
        ax = x + (20 + i * 40) * S
        d.rectangle((ax, y + 190 * S, ax + 28 * S, y + 300 * S), outline=LINE, width=w)
        d.pieslice((ax, y + 176 * S, ax + 28 * S, y + 204 * S), 180, 360, outline=LINE, width=w)
    mx = x - 40 * S  # minaret
    d.rectangle((mx, y + 20 * S, mx + 24 * S, y + 300 * S), outline=LINE, width=w)
    d.rectangle((mx - 6 * S, y + 80 * S, mx + 30 * S, y + 92 * S), outline=LINE, width=w)
    d.polygon([(mx - 2 * S, y + 20 * S), (mx + 12 * S, y - 30 * S), (mx + 26 * S, y + 20 * S)], outline=LINE, width=w)

def galata(d, x, y):  # cylindrical tower, gallery, conical roof
    w = 4 * S
    d.rectangle((x, y + 100 * S, x + 110 * S, y + 320 * S), outline=LINE, width=w)
    for r in range(3):
        for c in range(3):
            wx, wy = x + (16 + c * 30) * S, y + (130 + r * 55) * S
            d.rounded_rectangle((wx, wy, wx + 16 * S, wy + 30 * S), radius=8 * S, outline=LINE, width=w)
    d.rectangle((x - 10 * S, y + 80 * S, x + 120 * S, y + 100 * S), outline=LINE, width=w)
    for i in range(6):
        d.line((x + (i * 22) * S, y + 80 * S, x + (i * 22) * S, y + 100 * S), fill=LINE, width=w // 2)
    d.polygon([(x - 6 * S, y + 80 * S), (x + 55 * S, y - 20 * S), (x + 116 * S, y + 80 * S)], outline=LINE, width=w)
    d.line((x + 55 * S, y - 20 * S, x + 55 * S, y - 45 * S), fill=LINE, width=w)

def person(im, src, crop_frac, x_center, top):
    p = Image.open(src).convert('RGBA'); pw, ph = p.size
    p = p.crop((0, 0, pw, int(ph * crop_frac)))
    scale = (H - top) / p.height; p = p.resize((int(p.width * scale), H - top), Image.LANCZOS)
    shadow = Image.new('RGBA', p.size, (0, 0, 0, 0)); shadow.putalpha(p.getchannel('A').point(lambda a: a * .25))
    shadow = shadow.filter(ImageFilter.GaussianBlur(14 * S))
    x = int(x_center - p.width / 2)
    im.paste((40, 50, 30), (x + 6 * S, top + 10 * S), shadow)
    im.paste(p, (x, top), p)

for name, draw, src, frac in (('prof-ar', mosque, 'public/img/student-woman.webp', .52), ('prof-tr', galata, 'public/img/student-man.webp', .5)):
    im, d = base(); draw(d, 70 * S, 60 * S)
    person(im, src, frac, 330 * S, 22 * S)
    im.resize((504, 350), Image.LANCZOS).save(f'public/img/{name}.webp', quality=90)
    print(name)
