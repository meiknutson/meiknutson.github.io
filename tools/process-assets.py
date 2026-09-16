#!/usr/bin/env python3
"""Rebuild assets/*.webp from the Figma masters in assets/source/.

Two things happen here:

1. Transpose. Figma exports these layers rotated: it wraps each one in
   `rotate(90deg) scaleY(-1)`, which composes to (x, y) -> (y, x) — a
   reflection across the main diagonal, i.e. PIL's TRANSPOSE. Baking it into
   the files lets the CSS place everything in plain page coordinates with no
   transforms, and keeps the shared alpha mask aligned with what it masks.
   `name` is the one layer Figma does not rotate.

2. Downscale to 2x the CSS box and encode as WebP. The masters total ~44MB,
   which is not shippable. WebP stores alpha separately from colour, so even a
   lossy encode leaves the mask's alpha bit-exact (verified: max error 0).

Usage:  python3 tools/process-assets.py     (needs Pillow)
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "source")
OUT = os.path.join(ROOT, "assets")

DPR = 2  # render at 2x the CSS box so the art stays crisp on retina

# name -> (page-space box width, box height, needs transpose, webp quality)
SPEC = {
    "ulva":           (1439.648, 1002.557, True, 88),
    "blob2":          (1236.094,  984.629, True, 88),
    "plocamium":      (1001.953,  901.317, True, 88),
    "white":          ( 949.0,     626.0,  True, 88),
    "teal-soft":      ( 316.055,   958.967, True, 88),
    "teal-mask":      ( 349.453,   984.98, True, 70),  # mask: only alpha matters
    "teal-fill":      ( 349.453,   984.98, True, 88),
    "teal-wash":      ( 850.43,   1024.0,  True, 88),
    "dots-a":         (1147.148,  783.555, True, 88),
    "dots-b":         (1162.969,  787.422, True, 88),
    "portfolio-pill": ( 596.25,    112.84, True, 88),
    "portfolio-word": ( 525.938,    89.991, True, 88),
    "name":           (1482.0,    1054.0,  False, 88),
    # Mobile frame (113:398) only. Figma does not rotate these; the box here is
    # the rendered leaf, which is larger than its crop window.
    "artwork-frame":  ( 976.752,   694.529, False, 88),

    # Sustainability frame (1:8). None are rotated. As above, the box is the
    # rendered leaf, which for the hand-drawn frames overflows its crop window.
    # The scientific-illustration card is assets/sciillust.gif, used as-is:
    # it is animated, so it does not go through this pipeline.
    "invasive-pieces":         ( 431.0,   766.23, False, 88),
    "artwork-sci-frame":       (1420.90, 1010.15, False, 88),
    "artwork-invasive-frame":  (1434.90, 1021.31, False, 88),
}

# assets/ellipse.svg is vector and copied straight from Figma — nothing to do.


def main():
    before = after = 0
    for key, (box_w, box_h, transpose, quality) in sorted(SPEC.items()):
        src = os.path.join(SRC, key + ".png")
        im = Image.open(src).convert("RGBA")
        if transpose:
            im = im.transpose(Image.Transpose.TRANSPOSE)

        # object-fit: cover — scale so the image covers the 2x box, keeping aspect
        scale = max(box_w * DPR / im.width, box_h * DPR / im.height)
        if scale < 1:
            im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)

        dst = os.path.join(OUT, key + ".webp")
        im.save(dst, "WEBP", quality=quality, method=6)

        b, a = os.path.getsize(src), os.path.getsize(dst)
        before, after = before + b, after + a
        print(f"{key + '.webp':22} {im.width:>5}x{im.height:<5} {b / 1e6:6.2f}MB -> {a / 1e6:5.2f}MB")

    print(f"\n{'TOTAL':22} {'':12} {before / 1e6:6.2f}MB -> {after / 1e6:5.2f}MB "
          f"({100 * after / before:.1f}%)")


if __name__ == "__main__":
    main()
