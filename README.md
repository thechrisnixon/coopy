# coopy

The Nixon family recipes, kept properly.

Every recipe is a YAML file in [`recipes/`](recipes). Quantities are stored at
**1X — one batch, exactly as the source wrote them** — so nothing is lost to
rounding and the app can scale cleanly at display time. Git history is the
changelog for how a blend evolved.

The thing this exists for: a recipe blended from two sources records **which
source each decision came from, and why**. See
[`recipes/skyline-chili.yaml`](recipes/skyline-chili.yaml) — a 1970s "Chili
Capital of the U.S.A." card supplies the aromatics and the long simmer, a
modern copycat supplies the chocolate that makes it read as Skyline, and every
line that differs says which won and what it cost.

## Recipe format

`name` and `ingredients` are the only required fields. Everything else is
optional, and the site hides sections that aren't there.

```yaml
name: Skyline Chili
serves: 8                # how many people 1X feeds
tags: [cincinnati, chili]
time: { prep: 20m, cook: 2h 30m }

sources:
  a:
    name: The Chunky Chef — Copycat Skyline
    url: https://…
    role: the chocolate and the heavy chili powder
  b:
    name: "\"Chili Capital of the U.S.A.\" card"
    role: the aromatics and the 3-hour simmer
    scan: /sources/skyline-chili-card.png   # the heirloom itself

ingredients:
  - qty: 2
    unit: lb
    item: lean ground beef
    from: b                # which source this line came from
    note: never browned — it's what gives the fine texture
  - qty: 2
    unit: large
    item: yellow onions, chopped
    from: b
    discrete: true         # can't be halved; scaling rounds to a whole number
  - group: To serve        # optional sub-heading
    qty: 1
    unit: lb
    item: thin spaghetti

steps:
  - Heat the water and whisk in the tomato paste and chocolate…

notes: |
  Better on day two.
```

Quantities are written the way the source writes them — `1 1/2`, `1½`, and
`0.5` all work, and unparseable ones (`a pinch`) pass through unscaled rather
than being silently invented.

`pnpm validate` runs on every build, so a malformed recipe or a `from:` that
points at an undeclared source fails the deploy instead of shipping broken.

## The app

| Route | What it is |
|---|---|
| `/` | Editorial index — search by name, ingredient, or tag; filter by tag |
| `/r/:slug` | Ingredients with a batch scaler, the blend panel, method, notes |
| `/cook/:slug` | Kitchen mode — oversized type, tap-to-check, screen stays awake |
| `/add` | Parse a recipe from a photo, link, or text, then commit it |

React 19 + TypeScript + Vite, built on [Astryx](https://astryx.atmeta.com)
(Meta's design system) with a retuned Stone theme. Playfair Display and Inter
are self-hosted — no CDN call, no layout shift.

## Adding a recipe

**From your phone or a browser:** go to `/add`, drop a photo of a recipe card
(or paste a link or text), review the parsed YAML, and commit. Vercel rebuilds
in about fifteen seconds.

**By hand:** add a `.yaml` file to `recipes/`, run `pnpm validate`, commit.

## Setup

```sh
pnpm install
pnpm dev
```

Two secrets, neither of which lives in this repo:

| Secret | Where it goes | Scope |
|---|---|---|
| `ANTHROPIC_API_KEY` | Vercel environment variable | Read only by `/api/parse`, server-side |
| GitHub token | Pasted into `/add`, stored in browser `localStorage` | Fine-grained, this repo only, `contents:write` |

The Anthropic key is never shipped to the browser. The GitHub token never
leaves your device. `.gitignore` blocks `.env` files so neither can be
committed by accident.

## Commands

```sh
pnpm dev        # dev server
pnpm build      # validate recipes → typecheck → build
pnpm validate   # check every recipe against the schema
pnpm astryx     # Astryx CLI (component docs, theme tools)
```
