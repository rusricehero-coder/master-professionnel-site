"""Convertit un texte en chemins SVG a partir d'une police TrueType locale.

Utilise uniquement la bibliotheque standard. Sert a produire le logotype
MASTER PROFESSIONNEL en courbes (aucune dependance a une police installee
chez le visiteur).

Usage :
    python ttf2svg.py "MASTER PROFESSIONNEL" C:\\Windows\\Fonts\\bahnschrift.ttf 120
"""
import json
import struct
import sys


class Font:
    def __init__(self, path):
        self.data = open(path, "rb").read()
        self.tables = {}
        num = struct.unpack(">H", self.data[4:6])[0]
        for i in range(num):
            off = 12 + i * 16
            tag = self.data[off:off + 4].decode("latin-1")
            o, ln = struct.unpack(">II", self.data[off + 8:off + 16])
            self.tables[tag] = (o, ln)
        head = self.tables["head"][0]
        self.upem = struct.unpack(">H", self.data[head + 18:head + 20])[0]
        self.loc_format = struct.unpack(">h", self.data[head + 50:head + 52])[0]
        self.num_glyphs = struct.unpack(">H", self.data[self.tables["maxp"][0] + 4:self.tables["maxp"][0] + 6])[0]
        hhea = self.tables["hhea"][0]
        self.num_hmetrics = struct.unpack(">H", self.data[hhea + 34:hhea + 36])[0]
        self.ascent = struct.unpack(">h", self.data[hhea + 4:hhea + 6])[0]
        self.descent = struct.unpack(">h", self.data[hhea + 6:hhea + 8])[0]
        self.cmap = self._cmap()
        self.loca = self._loca()

    def _cmap(self):
        base = self.tables["cmap"][0]
        n = struct.unpack(">H", self.data[base + 2:base + 4])[0]
        best = None
        for i in range(n):
            rec = base + 4 + i * 8
            pid, eid, off = struct.unpack(">HHI", self.data[rec:rec + 8])
            sub = base + off
            fmt = struct.unpack(">H", self.data[sub:sub + 2])[0]
            if fmt == 4 and pid in (0, 3):
                best = best or sub
            if fmt == 12 and pid == 3:
                best = sub
        if best is None:
            raise SystemExit("cmap introuvable")
        return best

    def glyph_id(self, ch):
        fmt = struct.unpack(">H", self.data[self.cmap:self.cmap + 2])[0]
        base = self.cmap
        code = ord(ch)
        if fmt == 4:
            segx2 = struct.unpack(">H", self.data[base + 6:base + 8])[0]
            seg = segx2 // 2
            ends = base + 14
            starts = ends + segx2 + 2
            deltas = starts + segx2
            ranges = deltas + segx2
            for i in range(seg):
                end = struct.unpack(">H", self.data[ends + i * 2:ends + i * 2 + 2])[0]
                if code <= end:
                    start = struct.unpack(">H", self.data[starts + i * 2:starts + i * 2 + 2])[0]
                    if code < start:
                        return 0
                    delta = struct.unpack(">h", self.data[deltas + i * 2:deltas + i * 2 + 2])[0]
                    ro = struct.unpack(">H", self.data[ranges + i * 2:ranges + i * 2 + 2])[0]
                    if ro == 0:
                        return (code + delta) % 65536
                    addr = ranges + i * 2 + ro + (code - start) * 2
                    g = struct.unpack(">H", self.data[addr:addr + 2])[0]
                    return 0 if g == 0 else (g + delta) % 65536
            return 0
        # format 12
        ngroups = struct.unpack(">I", self.data[base + 12:base + 16])[0]
        for i in range(ngroups):
            o = base + 16 + i * 12
            s, e, g = struct.unpack(">III", self.data[o:o + 12])
            if s <= code <= e:
                return g + (code - s)
        return 0

    def _loca(self):
        o = self.tables["loca"][0]
        if self.loc_format == 0:
            return [2 * v for v in struct.unpack(">%dH" % (self.num_glyphs + 1), self.data[o:o + 2 * (self.num_glyphs + 1)])]
        return list(struct.unpack(">%dI" % (self.num_glyphs + 1), self.data[o:o + 4 * (self.num_glyphs + 1)]))

    def advance(self, gid):
        o = self.tables["hmtx"][0]
        if gid < self.num_hmetrics:
            return struct.unpack(">H", self.data[o + gid * 4:o + gid * 4 + 2])[0]
        return struct.unpack(">H", self.data[o + (self.num_hmetrics - 1) * 4:o + (self.num_hmetrics - 1) * 4 + 2])[0]

    def glyph(self, gid, depth=0):
        if gid >= self.num_glyphs:
            return []
        glyf = self.tables["glyf"][0]
        start = glyf + self.loca[gid]
        end = glyf + self.loca[gid + 1]
        if end - start < 10:
            return []
        ncont = struct.unpack(">h", self.data[start:start + 2])[0]
        if ncont < 0:
            return self._composite(start, depth)
        p = start + 10
        ends = list(struct.unpack(">%dH" % ncont, self.data[p:p + 2 * ncont]))
        p += 2 * ncont
        ilen = struct.unpack(">H", self.data[p:p + 2])[0]
        p += 2 + ilen
        npts = (ends[-1] + 1) if ends else 0
        flags = []
        while len(flags) < npts:
            f = self.data[p]
            p += 1
            flags.append(f)
            if f & 8:
                rep = self.data[p]
                p += 1
                flags.extend([f] * rep)
        flags = flags[:npts]
        xs = []
        v = 0
        for f in flags:
            if f & 2:
                d = self.data[p]
                p += 1
                v += d if f & 16 else -d
            elif not f & 16:
                v += struct.unpack(">h", self.data[p:p + 2])[0]
                p += 2
            xs.append(v)
        ys = []
        v = 0
        for f in flags:
            if f & 4:
                d = self.data[p]
                p += 1
                v += d if f & 32 else -d
            elif not f & 32:
                v += struct.unpack(">h", self.data[p:p + 2])[0]
                p += 2
            ys.append(v)
        pts = [(xs[i], ys[i], bool(flags[i] & 1)) for i in range(npts)]
        contours = []
        s = 0
        for e in ends:
            contours.append(pts[s:e + 1])
            s = e + 1
        return contours

    def _composite(self, start, depth):
        if depth > 6:
            return []
        p = start + 10
        out = []
        while True:
            flags, gid = struct.unpack(">HH", self.data[p:p + 4])
            p += 4
            if flags & 1:
                a, b = struct.unpack(">hh", self.data[p:p + 4])
                p += 4
            else:
                a, b = struct.unpack(">bb", self.data[p:p + 2])
                p += 2
            dx, dy = (a, b) if flags & 2 else (0, 0)
            sc = 1.0
            if flags & 8:
                sc = struct.unpack(">h", self.data[p:p + 2])[0] / 16384.0
                p += 2
            elif flags & 64:
                sc = struct.unpack(">h", self.data[p:p + 2])[0] / 16384.0
                p += 2
            elif flags & 128:
                sc = struct.unpack(">h", self.data[p:p + 2])[0] / 16384.0
                p += 4
            for c in self.glyph(gid, depth + 1):
                out.append([(x * sc + dx, y * sc + dy, on) for (x, y, on) in c])
            if not flags & 32:
                break
        return out


def contour_path(pts):
    n = len(pts)
    # insere les points implicites (milieux) entre deux points hors courbe
    seq = []
    for i in range(n):
        x, y, on = pts[i]
        seq.append([x, y, on])
        nx, ny, non = pts[(i + 1) % n]
        if not on and not non:
            seq.append([(x + nx) / 2.0, (y + ny) / 2.0, True])
    # demarre sur un point sur courbe
    idx = next((i for i, p in enumerate(seq) if p[2]), None)
    if idx is None:
        return ""
    seq = seq[idx:] + seq[:idx]
    d = "M%s %s" % (fmt(seq[0][0]), fmt(seq[0][1]))
    i = 1
    while i < len(seq):
        p = seq[i]
        if p[2]:
            d += "L%s %s" % (fmt(p[0]), fmt(p[1]))
            i += 1
        else:
            q = seq[i + 1] if i + 1 < len(seq) else seq[0]
            d += "Q%s %s %s %s" % (fmt(p[0]), fmt(p[1]), fmt(q[0]), fmt(q[1]))
            i += 2
    return d + "Z"


def fmt(v):
    s = ("%.2f" % v).rstrip("0").rstrip(".")
    return s if s != "-0" else "0"


def main():
    text = sys.argv[1]
    font_path = sys.argv[2]
    size = float(sys.argv[3]) if len(sys.argv) > 3 else 100.0
    track = float(sys.argv[4]) if len(sys.argv) > 4 else 0.0  # en unites/1000 em
    f = Font(font_path)
    s = size / f.upem
    pen = 0.0
    parts = []
    for ch in text:
        gid = f.glyph_id(ch)
        contours = f.glyph(gid)
        d = ""
        for c in contours:
            moved = [(pen + x, -y, on) for (x, y, on) in c]
            d += contour_path(moved)
        if d:
            parts.append(d)
        pen += f.advance(gid) + track * f.upem / 1000.0
    total = (pen - track * f.upem / 1000.0) * s
    out = {
        "path": "".join(parts),
        "width": round(total, 2),
        "ascent": round(f.ascent * s, 2),
        "descent": round(f.descent * s, 2),
        "upem": f.upem,
        "scale": s,
        "size": size,
    }
    # applique l'echelle
    import re
    nums = re.findall(r"-?\d+\.?\d*", out["path"])
    scaled = [fmt(float(n) * s) for n in nums]
    def repl(m):
        return scaled.pop(0)
    out["path"] = re.sub(r"-?\d+\.?\d*", repl, out["path"])
    print(json.dumps(out))


if __name__ == "__main__":
    main()
