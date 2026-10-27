"""Link preview images (1200x630) for every project page, in English and Turkish.

Run from the repo root after changing project copy in site/content.js:
    pip install pillow fonttools brotli
    python3 scripts/og.py
Writes site/assets/og/<id>-<lang>.png. The site fonts ship as two subsets (latin and
latin-ext), so text is drawn glyph by glyph from whichever subset has the character.
"""
import io, json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(ROOT, 'site', 'assets', 'fonts')
OUT = os.path.join(ROOT, 'site', 'assets', 'og')
W, H = 1200, 630
PAPER, INK, INK2, BLUE, SKY, SAFFRON, LINE = '#E9ECF2', '#191C2E', '#4A4F6B', '#3550D0', '#B7CFF0', '#E8A631', '#C8CEDC'


def load_content():
    js = "global.window={};require(%s);console.log(JSON.stringify(window.BP))" % json.dumps(os.path.join(ROOT, 'site', 'content.js'))
    return json.loads(subprocess.check_output(['node', '-e', js]))


class Face:
    """A font made of two subsets; picks the subset that has each character."""
    def __init__(self, name, size, axes):
        self.parts = []
        for sub in ('latin', 'latin-ext'):
            path = os.path.join(FONTS, f'{name}-{sub}-{"standard-normal" if "bricolage" in name else "wght-normal"}.woff2')
            tt = TTFont(path); tt.flavor = None
            buf = io.BytesIO(); tt.save(buf); buf.seek(0)
            cmap = set(tt.getBestCmap().keys())
            f = ImageFont.truetype(buf, size)
            try:
                names = [a.axisTag for a in tt['fvar'].axes]
                f.set_variation_by_axes([axes.get(n, a.defaultValue) for n, a in zip(names, tt['fvar'].axes)])
            except Exception:
                pass
            self.parts.append((f, cmap))
        self.size = size

    def font_for(self, ch):
        for f, cmap in self.parts:
            if ord(ch) in cmap:
                return f
        return self.parts[0][0]

    def width(self, text):
        return sum(self.font_for(c).getlength(c) for c in text)

    def draw(self, d, xy, text, fill):
        x, y = xy
        for c in text:
            f = self.font_for(c)
            d.text((x, y), c, font=f, fill=fill)
            x += f.getlength(c)


def wrap(face, text, width, max_lines):
    words, lines, cur = text.split(), [], ''
    for w in words:
        trial = (cur + ' ' + w).strip()
        if face.width(trial) <= width or not cur:
            cur = trial
        else:
            lines.append(cur); cur = w
    if cur:
        lines.append(cur)
    if len(lines) > max_lines:
        lines = lines[:max_lines]
        while face.width(lines[-1] + '…') > width and ' ' in lines[-1]:
            lines[-1] = lines[-1].rsplit(' ', 1)[0]
        lines[-1] += '…'
    return lines


def render(p, lang):
    img = Image.new('RGB', (W, H), PAPER)
    d = ImageDraw.Draw(img)
    panel = {'saffron': SAFFRON, 'blue': '#9DB0EE'}.get(p.get('tone'), SKY)
    d.rectangle([780, 0, W, H], fill=panel)
    art_path = os.path.join(ROOT, 'site', 'assets', 'art', f"{p['id']}.webp")
    art = Image.open(art_path).convert('RGBA')
    art.thumbnail((380, 460))
    img.paste(art, (780 + (420 - art.width) // 2, (H - art.height) // 2), art)

    brand = Face('bricolage-grotesque', 34, {'wght': 700, 'wdth': 80, 'opsz': 48})
    title_size = 92 if len(p['title']) <= 16 else 74 if len(p['title']) <= 26 else 62
    title = Face('bricolage-grotesque', title_size, {'wght': 760, 'wdth': 78, 'opsz': 96})
    body = Face('schibsted-grotesk', 30, {'wght': 420})
    small = Face('schibsted-grotesk', 24, {'wght': 600})

    d.rounded_rectangle([80, 70, 132, 122], radius=14, fill=INK)
    brand.draw(d, (95, 73), 'b', PAPER)
    Face('schibsted-grotesk', 30, {'wght': 650}).draw(d, (148, 80), 'burak.pm', INK)

    kicker = 'PROJE' if lang == 'tr' else 'PROJECT'
    small.draw(d, (80, 178), kicker, BLUE)
    y = 214
    for line in wrap(title, p['title'], 660, 2):
        title.draw(d, (76, y), line, INK)
        y += int(title_size * 0.98)
    y += 26
    for line in wrap(body, p['blurb'], 640, 3):
        body.draw(d, (80, y), line, INK2)
        y += 42
    footer = 'Burak Çevik' + ('  ·  Yapay zekâ ile iç veriye dokunmadan' if lang == 'tr' and p.get('noai') else '  ·  No AI on internal data' if p.get('noai') else '')
    small.draw(d, (80, 548), footer, INK)
    os.makedirs(OUT, exist_ok=True)
    out = os.path.join(OUT, f"{p['id']}-{lang}.png")
    img.save(out, optimize=True)
    return out


def main():
    bp = load_content()
    for i, en in enumerate(bp['P']['en']):
        for lang in ('en', 'tr'):
            p = dict(en, **(bp['P']['tr'][i] if lang == 'tr' else {}))
            print(render(p, lang))


if __name__ == '__main__':
    sys.exit(main())
