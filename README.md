# Mei Knutson — Portfolio

Static site. Built from the Figma file
[Portfolio-website](https://www.figma.com/design/2RsYl8r4Jb1vkiLLCKA6BA/Portfolio-website):

| Frame | Node | Size | Shown |
| --- | --- | --- | --- |
| Home (desktop) | [`1:3`](https://www.figma.com/design/2RsYl8r4Jb1vkiLLCKA6BA/Portfolio-website?node-id=1-3&m=dev) | 1440×1024 | ≥768px |
| Home (mobile) | [`113:398`](https://www.figma.com/design/2RsYl8r4Jb1vkiLLCKA6BA/Portfolio-website?node-id=113-398&m=dev) | 402×874 | <768px |

The mobile frame is the designed "under construction" notice, not a full mobile
layout — it has no nav by design and points visitors at the desktop site.

## Run

```bash
python3 -m http.server 4173
```

Then open <http://localhost:4173>. No build step, no dependencies.

## Layout

```
index.html              both artboards, one shown at a time
css/style.css
assets/*.webp           web-ready art (8.5MB)
assets/ellipse.svg      blurred ellipse, vector, straight from Figma
assets/source/*.png     Figma masters (43MB)
tools/process-assets.py regenerates assets/ from assets/source/
```

Each artboard is a stack of painted layers composited with CSS blend modes
(`hard-light`, `multiply`, `color-burn`), plus — on desktop — a magenta nav bar
on `hue`. Every layer's geometry lives in `index.html` as `--x/--y/--w/--h`
percentages of its artboard, so each composition scales as one piece and
`style.css` stays generic. Both stages reuse the same `.layer` primitives, and
share ten of their twelve assets at different offsets. Every layer in both
frames sits within 0.01px of its Figma coordinates.

Two notes on how the art is stored:

- **The collage assets are pre-transposed.** Figma exports those layers rotated,
  wrapping each in `rotate(90deg) scaleY(-1)` — which composes to a reflection
  across the main diagonal. `tools/process-assets.py` bakes that in, so the CSS
  needs no transforms and the shared alpha mask lines up in page coordinates.
  The two mobile-only assets are not rotated.
- **Two layers share one alpha mask** (Figma's "clip group"). They're kept as
  two separate masked boxes rather than one nested group so each keeps its own
  blend mode against the art underneath. Both artboards position the mask
  identically relative to its contents, so one CSS rule serves both.

## Known gaps

- Only the home page exists. `sustainability`, `physical`, `print` and `about`
  link to `#`. All four have frames in the Figma file (`1:8`, `1:6`, `1:10`,
  `1:14`) that haven't been built yet.
- The 768px breakpoint is a choice, not something the design specifies — the
  file gives a 1440 frame and a 402 frame and nothing in between. Between 768
  and 1440 the desktop artboard scales down proportionally, so nav text gets
  small at the low end.
- `assets/source/` is 43MB of PNG masters. Worth moving out of git (or into
  LFS) before this repo grows.
