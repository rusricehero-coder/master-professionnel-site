"""Genere l'identite visuelle MASTER PROFESSIONNEL (SVG) a partir des courbes
extraites par ttf2svg.py.

Sorties dans assets/brand/ :
  logo-mark.svg            pictogramme seul (fond clair ou sombre)
  logo-horizontal.svg      logotype horizontal, texte encre (fond clair)
  logo-horizontal-dark.svg logotype horizontal, texte blanc (fond sombre)
  logo-stacked.svg         version verticale pour les reseaux sociaux
  logo-mono.svg            version monochrome encre
  favicon.svg              pictogramme simplifie
"""
import json
import os

WS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRAND = os.path.join(WS, "assets", "brand")
TMP = os.environ.get("TEMP", ".")

NAVY = "#0B2653"
BLUE = "#1C55C9"
CORAL = "#E8385A"
WHITE = "#FFFFFF"
MUTED = "#5B7091"


def load(name):
    with open(os.path.join(TMP, name), "r", encoding="utf-8-sig") as fh:
        return json.load(fh)


MASTER = load("w_master.json")
PROF = load("w_prof.json")
CENTRE = load("w_centre.json")
HEVIE = load("w_hevie.json")

DEFS = """<defs>
    <linearGradient id="mp-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0E2F6B"/>
      <stop offset=".55" stop-color="#1B54C4"/>
      <stop offset="1" stop-color="#2E72F5"/>
    </linearGradient>
    <linearGradient id="mp-shine" x1=".2" y1="0" x2=".8" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".22"/>
      <stop offset=".6" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
  </defs>"""

MARK = """<rect width="96" height="96" rx="26" fill="url(#mp-grad)"/>
  <rect width="96" height="96" rx="26" fill="url(#mp-shine)"/>
  <path d="M25 65V31l23 21 23-21v34" fill="none" stroke="#fff" stroke-width="8.6"
        stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="31" y="73.5" width="34" height="5" rx="2.5" fill="#FF5470"/>"""


def svg(w, h, body, bg=None):
    back = ('<rect width="%s" height="%s" fill="%s"/>' % (w, h, bg)) if bg else ""
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %s %s" width="%s" height="%s" '
        'role="img" aria-label="Master Professionnel">%s%s%s</svg>\n'
        % (w, h, w, h, DEFS, back, body)
    )


def mark(size=96):
    return svg(size, size, MARK)


S1 = 0.40   # echelle du mot MASTER
S2 = 0.186  # echelle du mot PROFESSIONNEL


def horizontal(dark=False):
    ink = WHITE if dark else NAVY
    sub = "#A9BEDF" if dark else MUTED
    tw = max(MASTER["width"] * S1, PROF["width"] * S2)
    gap = 26
    w = round(96 + gap + tw + 6, 1)
    tx = 96 + gap
    body = (
        '<g>%s</g>'
        '<g transform="translate(%s,50) scale(%s)"><path d="%s" fill="%s"/></g>'
        '<g transform="translate(%s,79) scale(%s)"><path d="%s" fill="%s"/></g>'
        % (MARK, tx, S1, MASTER["path"], ink, tx, S2, PROF["path"], sub)
    )
    return svg(w, 96, body)


def stacked(dark=False):
    ink = WHITE if dark else NAVY
    sub = "#A9BEDF" if dark else MUTED
    tw = max(MASTER["width"] * S1, PROF["width"] * S2)
    w = round(tw + 40, 1)
    h = 218
    cx = round((w - tw) / 2, 1)
    body = (
        '<g transform="translate(%s,0)">%s</g>'
        '<g transform="translate(%s,160) scale(%s)"><path d="%s" fill="%s"/></g>'
        '<g transform="translate(%s,194) scale(%s)"><path d="%s" fill="%s"/></g>'
        % (round((w - 96) / 2, 1), MARK, cx, S1, MASTER["path"], ink, cx, S2, PROF["path"], sub)
    )
    return svg(w, h, body)


def mono():
    tw = max(MASTER["width"] * S1, PROF["width"] * S2)
    w = round(96 + 26 + tw + 6, 1)
    h = 96
    body = (
        '<g><rect width="96" height="96" rx="26" fill="%s"/>'
        '<path d="M25 65V31l23 21 23-21v34" fill="none" stroke="#fff" stroke-width="8.6" '
        'stroke-linecap="round" stroke-linejoin="round"/>'
        '<rect x="31" y="73.5" width="34" height="5" rx="2.5" fill="#fff"/></g>'
        '<g transform="translate(122,50) scale(%s)"><path d="%s" fill="%s"/></g>'
        '<g transform="translate(122,79) scale(%s)"><path d="%s" fill="%s"/></g>'
        % (NAVY, S1, MASTER["path"], NAVY, S2, PROF["path"], NAVY)
    )
    return svg(w, h, body)


def favicon():
    # pictogramme simplifie, lisible a 16 px
    body = (
        '<rect width="96" height="96" rx="22" fill="%s"/>'
        '<path d="M23 68V30l25 23 25-23v38" fill="none" stroke="#fff" stroke-width="12" '
        'stroke-linecap="round" stroke-linejoin="round"/>'
        % BLUE
    )
    return svg(96, 96, body)


def write(name, content):
    with open(os.path.join(BRAND, name), "w", encoding="utf-8") as fh:
        fh.write(content)


if __name__ == "__main__":
    os.makedirs(BRAND, exist_ok=True)
    write("logo-mark.svg", mark())
    write("logo-horizontal.svg", horizontal())
    write("logo-horizontal-dark.svg", horizontal(dark=True))
    write("logo-stacked.svg", stacked())
    write("logo-stacked-dark.svg", stacked(dark=True))
    write("logo-mono.svg", mono())
    write("favicon.svg", favicon())
    # apercu
    preview = """<!doctype html><meta charset="utf-8"><style>
    body{margin:0;font-family:Segoe UI,sans-serif;background:#eef2f9}
    .row{display:flex;gap:36px;align-items:center;padding:28px 36px}
    .dark{background:#0B2653}
    .tag{font-size:12px;color:#5B7091;letter-spacing:.12em;text-transform:uppercase}
    </style>
    <div class="row"><img src="assets/brand/logo-horizontal.svg" width="430"></div>
    <div class="row"><img src="assets/brand/logo-mark.svg" width="96">
      <img src="assets/brand/favicon.svg" width="48"><img src="assets/brand/favicon.svg" width="24">
      <img src="assets/brand/favicon.svg" width="16"></div>
    <div class="row dark"><img src="assets/brand/logo-horizontal-dark.svg" width="430"></div>
    <div class="row"><img src="assets/brand/logo-stacked.svg" width="240"></div>
    <div class="row"><img src="assets/brand/logo-mono.svg" width="430"></div>
    """
    with open(os.path.join(WS, "_preview-brand.html"), "w", encoding="utf-8") as fh:
        fh.write(preview)
    print("ok")
