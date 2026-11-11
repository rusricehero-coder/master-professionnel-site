"""Prepare les couvertures supplementaires (ouvrages et supports de cours).

- nettoie le damier de transparence de la couverture Cybersecurite
- redimensionne et compresse en JPEG sur fond blanc

Sources : pieces jointes fournies par Papirus Brice + fichiers locaux.
Usage : python tools/covers.py
"""
import os
from collections import deque

from PIL import Image

WS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_LIVRES = os.path.join(WS, "assets", "img", "livres")
OUT_SUPPORTS = os.path.join(WS, "assets", "img", "supports")
ATT = r"C:\Users\VIRUS PRO MAX\.dsh\attachments\v1\objects"
SRC = r"C:\Users\VIRUS PRO MAX\Desktop\mon livre Burkina-Fasso"

SOURCES = {
    "telemedecine.jpg": (
        os.path.join(ATT, "fc", "fcb6d50e773bfb5aeeb421194d26d5625a662a61615df7c67942cc472189699e"),
        False,
    ),
    "coreldraw.jpg": (
        os.path.join(ATT, "de", "de78458b748496ad895b6c32af77b67904581d73e83409a6fcbc4f0f1d0711a1"),
        False,
    ),
    "office.jpg": (
        os.path.join(ATT, "c6", "c668b9525f330746e0e80cbba0e58f99fc76980f640d6b753dab6a1d9ae81d17"),
        False,
    ),
    "cybersecurite.jpg": (
        os.path.join(ATT, "a4", "a46c56ea92851cde592a30a78d8eac264ffa50a7703da54fa6575ec190d23f1a"),
        False,
    ),
}

COUVERTURES = {
    # couvertures a plat, plus nettes que les mockups 3D
    "lueur-de-moi.jpg": os.path.join(
        ATT, "f0", "f03faae323482a474f331905b89396450efe1f3ea348e38dd6bea34d2b9fbae6"
    ),
    "audrey.jpg": os.path.join(SRC, "audrey.png"),
}

ELEVAGE = {
    "01-poulet.jpg": os.path.join(ATT, "58", "5809fe8931804f581be5cb50d83c34b2fd1c033abf0bd131c9e5b4391b62e2a9"),
    "02-aliment.jpg": os.path.join(ATT, "86", "868bc19855d84b4bd171663ad6969cd1960c835b63e3bf27e47cb3755703d649"),
    "03-phytotherapie.jpg": os.path.join(ATT, "46", "46cd1d740a78c75ffdc5a4968cc50d0501f8bf2195ecf99c1c393b9219389347"),
    "04-comptabilite.jpg": os.path.join(ATT, "79", "79affcee7e83d0fe07a66ff499c41c81298a316c58e0bf4340fb3734d5badfd9"),
    "05-autres-elevages.jpg": os.path.join(ATT, "72", "72042a9d15fd467694a213bcf3ff02a99220d7724798117b3eba4f080816c491"),
}


def retire_damier(img):
    """Remplace le damier de transparence par du blanc, depuis les bords."""
    img = img.convert("RGB")
    w, h = img.size
    px = img.load()
    vus = bytearray(w * h)
    file_attente = deque()

    def fond(x, y):
        r, g, b = px[x, y]
        return min(r, g, b) >= 176 and (max(r, g, b) - min(r, g, b)) <= 14

    for x in range(w):
        for y in (0, h - 1):
            if not vus[y * w + x] and fond(x, y):
                vus[y * w + x] = 1
                file_attente.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if not vus[y * w + x] and fond(x, y):
                vus[y * w + x] = 1
                file_attente.append((x, y))

    while file_attente:
        x, y = file_attente.popleft()
        px[x, y] = (255, 255, 255)
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not vus[ny * w + nx] and fond(nx, ny):
                vus[ny * w + nx] = 1
                file_attente.append((nx, ny))
    return img


def enregistre(img, chemin, largeur=560):
    if img.width > largeur:
        img = img.resize((largeur, int(img.height * largeur / img.width)), Image.LANCZOS)
    img.save(chemin, quality=80, optimize=True, progressive=True)
    print(os.path.basename(chemin), img.size, str(os.path.getsize(chemin) // 1024) + " Ko")


def main():
    os.makedirs(OUT_SUPPORTS, exist_ok=True)
    os.makedirs(OUT_LIVRES, exist_ok=True)
    for nom, (src, nettoyer) in SOURCES.items():
        img = Image.open(src).convert("RGB")
        if nettoyer:
            img = retire_damier(img)
        enregistre(img, os.path.join(OUT_SUPPORTS, nom))

    for nom, src in COUVERTURES.items():
        enregistre(Image.open(src).convert("RGB"), os.path.join(OUT_LIVRES, nom))

    out_elevage = os.path.join(WS, "assets", "img", "elevage")
    os.makedirs(out_elevage, exist_ok=True)
    for nom, src in ELEVAGE.items():
        enregistre(Image.open(src).convert("RGB"), os.path.join(out_elevage, nom))


if __name__ == "__main__":
    main()

