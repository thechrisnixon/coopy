import { z } from 'zod'

/**
 * A quantity as written on the source: `1`, `1.5`, `"1 1/2"`, `"½"`.
 * Stored verbatim so a recipe file always reads the way its source did;
 * `parseQty` in units.ts turns it into a number when we need to scale.
 */
export const Qty = z.union([z.number(), z.string().min(1)])

/**
 * Source keys are short handles (`a`, `b`, `card`) used to tag ingredients.
 * Kept loose so a recipe can name them meaningfully rather than a/b.
 */
export const SourceKey = z.string().min(1).max(24)

export const Source = z.object({
  name: z.string().min(1),
  url: z.url().optional(),
  /** Why this source is in the blend at all. */
  role: z.string().optional(),
  /**
   * Path under /public to a scan or photo of the original — a recipe card,
   * a page from a book. For sources that only exist on paper, this is the
   * actual heirloom and the reason to keep it in git.
   */
  scan: z.string().optional(),
})

export const Ingredient = z.object({
  qty: Qty.optional(),
  unit: z.string().optional(),
  item: z.string().min(1),
  /** Which source this line came from, for the blend view. */
  from: SourceKey.optional(),
  /** Why this line deviates from its source — the thing worth remembering. */
  note: z.string().optional(),
  /** Optional sub-heading, e.g. "For the chili" vs "To serve". */
  group: z.string().optional(),
  /**
   * Discrete things that can't be halved sensibly (eggs, bay leaves).
   * Scaling rounds these to a whole number instead of showing "1½ eggs".
   */
  discrete: z.boolean().optional(),
})

export const Time = z.object({
  prep: z.string().optional(),
  cook: z.string().optional(),
  total: z.string().optional(),
})

export const Recipe = z.object({
  name: z.string().min(1),
  /** How many people 1X feeds. Enables the per-serving view. */
  serves: z.number().positive().optional(),
  tags: z.array(z.string()).optional(),
  time: Time.optional(),
  /** Path relative to /public, or an absolute URL. */
  photo: z.string().optional(),
  sources: z.record(SourceKey, Source).optional(),
  ingredients: z.array(Ingredient).min(1),
  steps: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

export type Source = z.infer<typeof Source>
export type Ingredient = z.infer<typeof Ingredient>
export type Recipe = z.infer<typeof Recipe>

/** A recipe plus the slug derived from its filename. */
export type LoadedRecipe = Recipe & { slug: string }

/**
 * Every `from:` on an ingredient must point at a declared source, otherwise
 * the blend view would silently drop the attribution — the one thing this
 * app exists to preserve. Zod can't express this, so it's checked here and
 * wired into both the build and `pnpm validate`.
 */
export function checkSourceRefs(recipe: Recipe): string[] {
  const declared = new Set(Object.keys(recipe.sources ?? {}))
  const errors: string[] = []

  for (const [i, ing] of recipe.ingredients.entries()) {
    if (ing.from && !declared.has(ing.from)) {
      errors.push(
        `ingredients[${i}] (${ing.item}) is tagged from: "${ing.from}", ` +
          `which is not declared in sources: {${[...declared].join(', ')}}`,
      )
    }
  }
  return errors
}
