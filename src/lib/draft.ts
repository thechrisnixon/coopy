import { stringify } from 'yaml'

/** Shape returned by /api/parse — nulls where the source said nothing. */
export type ParsedRecipe = {
  name: string
  serves: number | null
  tags: string[]
  time: { prep: string | null; cook: string | null; total: string | null }
  sources: { key: string; name: string; url: string | null; role: string | null }[]
  ingredients: {
    qty: string | null
    unit: string | null
    item: string
    from: string | null
    note: string | null
    group: string | null
    discrete: boolean
  }[]
  steps: string[]
  notes: string | null
}

/** Drop nulls, empty strings, and empty collections so the YAML stays clean. */
function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined || v === '' || v === false) continue
    if (Array.isArray(v) && v.length === 0) continue
    if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) continue
    out[k] = v
  }
  return out as Partial<T>
}

/**
 * Render a parsed recipe as the YAML that gets committed. The output is the
 * canonical form — what you review before it lands in the repo, and what the
 * site reads back — so it stays deliberately readable rather than compact.
 */
export function toYaml(parsed: ParsedRecipe): string {
  const sources = Object.fromEntries(
    parsed.sources.map((s) => [
      s.key,
      compact({ name: s.name, url: s.url, role: s.role }),
    ]),
  )

  const doc = compact({
    name: parsed.name,
    serves: parsed.serves,
    tags: parsed.tags,
    time: compact(parsed.time),
    sources,
    ingredients: parsed.ingredients.map((i) =>
      compact({
        qty: i.qty,
        unit: i.unit,
        item: i.item,
        from: i.from,
        note: i.note,
        group: i.group,
        discrete: i.discrete,
      }),
    ),
    steps: parsed.steps,
    notes: parsed.notes,
  })

  return stringify(doc, { lineWidth: 80, defaultStringType: 'PLAIN' })
}

/** Filename-safe slug derived from the recipe name. */
export function toSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'untitled-recipe'
  )
}
