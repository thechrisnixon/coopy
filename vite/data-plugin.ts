import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Plugin } from 'vite'
import { parse as parseYaml } from 'yaml'
import { Recipe } from '../src/lib/schema.ts'

/**
 * Two data surfaces, deliberately asymmetric:
 *
 * - `/data/recipes.json` and `/data/recipes/<slug>.json` — a read-only public
 *   API over the archive, emitted as static files at build time. This is what
 *   the /weekly-shop skill (or anything else) reads from the live site; no
 *   server, nothing to keep running. Under /data, not /api, because /api is
 *   Vercel's function namespace.
 *
 * - `/skills/weekly-shop/SKILL.md` — the Claude Code skill itself, copied
 *   verbatim from `.claude/skills/` so anyone can install it with one curl
 *   (see the /skills page). It holds no household data; that stays local.
 *
 * - `/__local/plans.json` — weekly shopping plans from `plans/`. Served by the
 *   dev server ONLY and never emitted into the build: plans hold prices and
 *   order details, and the deployed site is public. It's the /plans page's
 *   fallback under `vite dev`, which doesn't run `api/plans.ts` (the
 *   passcode-gated private store the deployed page uses).
 */

const SITE = 'https://coopy-nu.vercel.app'

/** Published path → source path, relative to the project root. */
const SKILLS: Record<string, string> = {
  'skills/weekly-shop/SKILL.md': '.claude/skills/weekly-shop/SKILL.md',
}

function loadRecipes(root: string) {
  const dir = join(root, 'recipes')
  return readdirSync(dir)
    .filter((f) => f.endsWith('.yaml'))
    .map((file) => {
      const slug = file.replace(/\.yaml$/, '')
      // `pnpm validate` runs before the build and reports bad input properly.
      const recipe = Recipe.parse(parseYaml(readFileSync(join(dir, file), 'utf8')))
      return { slug, url: `${SITE}/r/${slug}`, ...recipe }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

function loadPlans(root: string): unknown[] {
  const dir = join(root, 'plans')
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.yaml'))
    .sort()
    .reverse()
    .map((file) => ({
      id: file.replace(/\.yaml$/, ''),
      ...parseYaml(readFileSync(join(dir, file), 'utf8')),
    }))
}

export function coopyData(): Plugin {
  let root = process.cwd()

  return {
    name: 'coopy-data',

    configResolved(config) {
      root = config.root
    },

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url?.split('?')[0] ?? ''

        const skill = SKILLS[path.slice(1)]
        if (skill) {
          res.setHeader('content-type', 'text/markdown; charset=utf-8')
          return res.end(readFileSync(join(root, skill), 'utf8'))
        }

        let body: unknown

        if (path === '/data/recipes.json') {
          body = loadRecipes(root)
        } else if (path.startsWith('/data/recipes/') && path.endsWith('.json')) {
          const slug = path.slice('/data/recipes/'.length, -'.json'.length)
          body = loadRecipes(root).find((r) => r.slug === slug)
        } else if (path === '/__local/plans.json') {
          body = loadPlans(root)
        } else {
          return next()
        }

        if (body === undefined) {
          res.statusCode = 404
          return res.end('{"error":"not found"}')
        }
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify(body))
      })
    },

    generateBundle() {
      for (const [fileName, source] of Object.entries(SKILLS)) {
        this.emitFile({
          type: 'asset',
          fileName,
          source: readFileSync(join(root, source), 'utf8'),
        })
      }

      const recipes = loadRecipes(root)
      this.emitFile({
        type: 'asset',
        fileName: 'data/recipes.json',
        source: JSON.stringify(recipes),
      })
      for (const r of recipes) {
        this.emitFile({
          type: 'asset',
          fileName: `data/recipes/${r.slug}.json`,
          source: JSON.stringify(r),
        })
      }
    },
  }
}
