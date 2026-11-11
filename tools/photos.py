"""Prepare les photos et couvertures pour le site (recadrage + compression).

Sources locales fournies par Papirus Brice, sorties dans :
  assets/img/photos/  (portrait)
  assets/img/livres/  (couvertures)

Usage : python tools/photos.py
"""
import os
from PIL import Image

WS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = r"C:\Users\VIRUS PRO MAX\Desktop\mon livre Burkina-Fasso"
OUT_PHOTOS = os.path.join(WS, "assets", "img", "photos")
OUT_LIVRES = os.path.join(WS, "assets", "img", "livres")


def portrait():
    img = Image.open(os.path.join(SRC, "photo_auteur_PAPIRUS_Brice.png")).convert("RGB")
    w, h = img.size
    # cadrage carre sur le visage et les epaules
    side = min(w, int(h * 0.62))
    top = int(h * 0.13)
    box = (max(0, (w - side) // 2), top, min(w, (w + side) // 2), top + side)
    img = img.crop(box).resize((640, 640), Image.LANCZOS)
    img.save(os.path.join(OUT_PHOTOS, "photo-auteur.jpg"), quality=84, optimize=True)
    print("photo-auteur.jpg", img.size)


def cover(name, src, box=None, width=560):
    img = Image.open(os.path.join(SRC, src)).convert("RGB")
    if box:
        img = img.crop(box)
    ratio = width / img.width
    img = img.resize((width, int(img.height * ratio)), Image.LANCZOS)
    path = os.path.join(OUT_LIVRES, name)
    img.save(path, quality=84, optimize=True, progressive=True)
    print(name, img.size, str(round(os.path.getsize(path) / 1024)) + " Ko")


def main():
    os.makedirs(OUT_PHOTOS, exist_ok=True)
    os.makedirs(OUT_LIVRES, exist_ok=True)
    portrait()
    cover("burkina-faso-aes.jpg", "Premiere_de_couverture_Le_Burkina_Faso_AES.png")
    cover("renaissance-ia.jpg", "couverture_renaissance_avec_PAPIRUS_Brice.png")
    # la couverture de "lueur de moi" est une planche : on garde la page de gauche
    cover("lueur-de-moi.jpg", "Lueur de moi — Recueil de poésie.png", box=(0, 0, 724, 1086))


if __name__ == "__main__":
    main()
