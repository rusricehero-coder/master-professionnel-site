"""Importe en lot les photos du centre deposees dans photos-a-trier/.

- recadre en 4:3, redimensionne a 1200 px de large, compresse en JPEG
- nomme automatiquement photo-01.jpg, photo-02.jpg, ... dans assets/img/photos/
- ignore les fichiers deja importes (meme nom d'origine)

Usage : python tools/photos_import.py
"""
import os
from PIL import Image, ImageOps

WS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(WS, "photos-a-trier")
DST = os.path.join(WS, "assets", "img", "photos")
EXT = (".jpg", ".jpeg", ".png", ".webp")
LARGEUR = 1600


def recadre(img):
    """Conserve le cadrage d'origine et limite seulement la largeur."""
    if img.width > LARGEUR:
        img = img.resize((LARGEUR, int(img.height * LARGEUR / img.width)), Image.LANCZOS)
    return img


def main():
    if not os.path.isdir(SRC):
        print("Dossier absent :", SRC)
        return
    os.makedirs(DST, exist_ok=True)
    deja = [f for f in os.listdir(DST) if f.startswith("photo-") and f.endswith(".jpg")]
    numero = len(deja)
    fichiers = sorted(f for f in os.listdir(SRC) if f.lower().endswith(EXT))
    if not fichiers:
        print("Aucune photo a importer dans photos-a-trier/")
        return
    for nom in fichiers:
        chemin = os.path.join(SRC, nom)
        try:
            img = ImageOps.exif_transpose(Image.open(chemin)).convert("RGB")
        except Exception as e:
            print("Ignore (illisible) :", nom, e)
            continue
        numero += 1
        sortie = os.path.join(DST, "photo-%02d.jpg" % numero)
        recadre(img).save(sortie, quality=82, optimize=True, progressive=True)
        print("photo-%02d.jpg  <-  %s  (%d Ko)" % (numero, nom, os.path.getsize(sortie) // 1024))
    print("\n%d photo(s) importee(s). Relancez la generation si besoin." % len(fichiers))


if __name__ == "__main__":
    main()
