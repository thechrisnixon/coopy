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
| `/skills` | How to install the `/weekly-shop` Claude Code skill |
| `/orders` | Weekly orders built by /weekly-shop — private, behind the family passcode (`/plans` redirects here) |

React 19 + TypeScript + Vite, built on [Astryx](https://astryx.atmeta.com)
(Meta's design system) with a retuned Stone theme. Playfair Display and Inter
are self-hosted — no CDN call, no layout shift.

## Reading it without the app

The archive is meant to outlive this website. Every build regenerates
[`cookbook/`](cookbook) — plain Markdown, one file per recipe plus a combined
[`cookbook/README.md`](cookbook/README.md) — and that output is committed, so
GitHub renders the whole cookbook with no app, no build step, and no
JavaScript. Quantities are written the way a recipe is written (`½ oz`, not
`0.5`), and the blend attribution and reasoning notes come along with it.

In the app, **Download .md** on any recipe and **Download the whole cookbook**
on the index produce byte-identical files — same renderer
([`src/lib/markdown.ts`](src/lib/markdown.ts)), so the two can't drift.

The export is deterministic: no timestamps, so regenerating produces no diff
unless a recipe actually changed.

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

Secrets, none of which live in this repo:

| Secret | Where it goes | Scope |
|---|---|---|
| `ANTHROPIC_API_KEY` | Vercel environment variable | Read only by `/api/parse`, server-side |
| `COOPY_PASSCODE` | Vercel environment variable | The family passcode for `/api/plans` and `/api/household` |
| `BLOB_READ_WRITE_TOKEN` | Set by Vercel when a Blob store is connected to the project | Read only by `/api/plans` and `/api/household`, server-side |
| GitHub token | Pasted into `/add`, stored in browser `localStorage` | Fine-grained, this repo only, `contents:write` |

The Anthropic key and the Blob token are never shipped to the browser. The
GitHub token never leaves your device. `.gitignore` blocks `.env` files so
none can be committed by accident.

## Private storage (plans and the household profile)

Weekly plans and the household profile hold prices, order details and
dietary needs, and this repo and site are public — so they're never committed
or built into the site. They live in a **private Vercel Blob store**, read and
written only server-side by two functions that require the family passcode in
an `x-coopy-passcode` header:

| Endpoint | Methods |
|---|---|
| `/api/plans` | `GET` all plans (newest first) · `GET ?id=YYYY-MM-DD` one · `PUT ?id=YYYY-MM-DD` store one (validated against `src/lib/plan.ts`) |
| `/api/household` | `GET` the profile · `PUT` store it (any JSON object, ≤ 100 KB) |

Blobs are stored at fixed pathnames (`plans/<date>.json`, `household.json`)
with private access; blob URLs never reach a client. Responses are
`no-store`.

**One-time setup on Vercel:**

1. Project → Storage → create a **Blob** store with **private** access and
   connect it to this project (all environments). That sets
   `BLOB_READ_WRITE_TOKEN`.
2. Project → Settings → Environment Variables → add `COOPY_PASSCODE` (a long
   passphrase the family shares).
3. Redeploy so the functions pick both up.
4. Migrate what's local: `pnpm push-private` uploads `plans/*.yaml` and
   `shopping/household.yaml`. It reads the passcode from `COOPY_PASSCODE` or
   `~/.coopy/passcode`, and targets `COOPY_URL` (default the live site).

**The passcode on each device:** the `/orders` page asks for it once and keeps
it in that browser's `localStorage` (a wrong one is cleared and re-asked).
The `/weekly-shop` skill keeps it in `~/.coopy/passcode` — one line,
`chmod 600` — and asks for it the first time it's missing.

Under `pnpm dev` the functions don't run, so `/orders` falls back to the
local `plans/` folder via the dev-only `/__local/plans.json`.

## Commands

```sh
pnpm dev        # dev server
pnpm build      # validate → export cookbook → typecheck → build
pnpm validate   # check every recipe against the schema
pnpm export     # regenerate cookbook/ (Markdown)
pnpm push-private  # upload local plans + household profile to private storage
pnpm astryx     # Astryx CLI (component docs, theme tools)
```

## Recipe API

The deployed site serves the archive as static JSON, generated at build time
(`vite/data-plugin.ts`) — no server, read-only:

- `https://coopy-nu.vercel.app/data/recipes.json` — every recipe, with `slug`
  and `url` added
- `https://coopy-nu.vercel.app/data/recipes/<slug>.json` — one recipe

`pnpm dev` serves the same paths locally.

## Weekly shop

`.claude/skills/weekly-shop` is a Claude Code skill: tell it what you want to
eat this week (coopy recipes, links, one-offs), and it builds the Whole Foods
order in Chrome, adjusts it with you, and only places it when you say so.

Install it into your own Claude Code (no checkout needed) — the `/skills`
page on the site has the same instructions:

```sh
mkdir -p ~/.claude/skills/weekly-shop && curl -fsSL https://coopy-nu.vercel.app/skills/weekly-shop/SKILL.md -o ~/.claude/skills/weekly-shop/SKILL.md
```

It needs the Claude in Chrome extension, signed in to the Amazon account, and
a household profile. Every build publishes the skill verbatim at
`/skills/weekly-shop/SKILL.md` (`vite/data-plugin.ts`); the profile is never
published.

Inside this repo it reads `shopping/household.yaml` (who eats, dietary needs,
staples, brands) and writes each week to `plans/<date>.yaml`; anywhere else it
uses `~/.coopy/household.yaml` and `~/.coopy/plans/`. Both are gitignored —
they hold prices and order details, and this repo is public. The skill also
pushes every plan and profile change to the private storage above, so the
whole family sees plans at `https://coopy-nu.vercel.app/orders`, and on a new
machine it pulls the profile from there — no files to pass around, just the
passcode.
