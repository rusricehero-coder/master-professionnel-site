"""Produit les images matricielles de la marque (icônes, image de partage).

Aucune dépendance externe hors Pillow (fourni par le runtime DSH).
Usage : python tools/raster.py
"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

WS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRAND = os.path.join(WS, "assets", "brand")
IMG = os.path.join(WS, "assets", "img")
FONTS = r"C:\Windows\Fonts"

NAVY = (11, 38, 83)
BLUE = (28, 85, 201)
BLUE_LIGHT = (46, 114, 245)
CORAL = (232, 56, 90)
WHITE = (255, 255, 255)
MUTED = (150, 176, 214)


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)


def vertical_gradient(size, top, bottom):
    w, h = size
    base = Image.new("RGB", (1, h))
    for y in range(h):
        t = y / max(1, h - 1)
        base.putpixel((0, y), tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    return base.resize((w, h))


def diagonal(base, accent):
    """Ajoute un halo diagonal coloré (approximation du dégradé du SVG)."""
    w, h = base.size
    glow = Image.new("RGB", (w, h), accent)
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse([w * 0.35, -h * 0.55, w * 1.35, h * 0.95], fill=150)
    mask = mask.filter(ImageFilter.GaussianBlur(w // 6))
    return Image.composite(glow, base, mask)


def badge(size, radius_ratio=0.27, simplified=False):
    img = diagonal(vertical_gradient((size, size), (14, 47, 107), (30, 92, 220)), (46, 114, 245))
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], int(size * radius_ratio), fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    d = ImageDraw.Draw(out)
    s = size / 96.0
    width = max(1, int((12 if simplified else 8.6) * s))
    pts = [(25 * s, 65 * s), (25 * s, 31 * s), (48 * s, 52 * s), (71 * s, 31 * s), (71 * s, 65 * s)]
    d.line(pts, fill=WHITE, width=width, joint="curve")
    r = width / 2.0
    for p in pts:
        d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=WHITE)
    if not simplified:
        d.rounded_rectangle([31 * s, 73.5 * s, 65 * s, 78.5 * s], 2.5 * s, fill=(255, 84, 112, 255))
    return out


def tracked(draw, xy, text, fnt, fill, tracking):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += draw.textlength(ch, font=fnt) + tracking


def og_image():
    W, H = 1200, 630
    img = diagonal(vertical_gradient((W, H), (6, 22, 49), (16, 53, 111)), (28, 85, 201))
    d = ImageDraw.Draw(img, "RGBA")
    # trame discrète
    for x in range(0, W, 64):
        d.line([(x, 0), (x, H)], fill=(255, 255, 255, 10))
    for y in range(0, H, 64):
        d.line([(0, y), (W, y)], fill=(255, 255, 255, 10))
    # halo bleu
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse([560, -260, 1400, 520], fill=(46, 114, 245, 110))
    glow = glow.filter(ImageFilter.GaussianBlur(110))
    img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
    d = ImageDraw.Draw(img, "RGBA")

    mark = badge(132)
    img.paste(mark, (72, 62), mark)

    tracked(d, (228, 74), "MASTER", font("bahnschrift.ttf", 44), WHITE, 6)
    tracked(d, (230, 126), "PROFESSIONNEL", font("bahnschrift.ttf", 21), MUTED, 5)

    f_title = font("bahnschrift.ttf", 62)
    d.text((72, 240), "Formez-vous aux métiers", font=f_title, fill=WHITE)
    d.text((72, 308), "du numérique à Hêvié", font=f_title, fill=WHITE)
    d.rounded_rectangle([72, 392, 392, 404], 6, fill=CORAL)
    f_sub = font("segoeui.ttf", 26)
    d.text((72, 428), "13 filières pratiques · Certificat · Stage", font=f_sub, fill=(198, 214, 242))
    f_small = font("segoeui.ttf", 22)
    d.text((72, 486), "+229 01 95 81 81 67   ·   rusricehero@gmail.com", font=f_small, fill=(159, 192, 255))

    # signature
    d.text((844, 546), "Hêvié · Bénin", font=font("segoeui.ttf", 24), fill=(159, 192, 255), anchor="ra")
    return img


def main():
    os.makedirs(IMG, exist_ok=True)
    os.makedirs(BRAND, exist_ok=True)
    badge(512).save(os.path.join(BRAND, "icon-512.png"))
    badge(192).save(os.path.join(BRAND, "icon-192.png"))
    badge(180, 0.24, simplified=True).save(os.path.join(BRAND, "apple-touch-icon.png"))
    badge(32, 0.26, simplified=True).save(os.path.join(BRAND, "favicon-32.png"))
    og_image().save(os.path.join(IMG, "og-image.png"), quality=92)
    print("Icônes et image de partage générées.")


if __name__ == "__main__":
    main()
