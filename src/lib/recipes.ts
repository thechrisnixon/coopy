import { parse as parseYaml } from 'yaml'
import { Recipe, checkSourceRefs, type LoadedRecipe } from './schema'

/**
 * Recipes are plain YAML files committed to the repo — git history is the
 * changelog for how a blend evolved. They're inlined at build time, so the
 * deployed site is fully static with no fetch on load.
 */
const files = import.meta.glob('../../recipes/*.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function slugFromPath(path: string): string {
  return path.split('/').pop()!.replace(/\.yaml$/, '')
}

function load(): LoadedRecipe[] {
  const loaded: LoadedRecipe[] = []

  for (const [path, raw] of Object.entries(files)) {
    const slug = slugFromPath(path)
    const parsed = Recipe.safeParse(parseYaml(raw))

    if (!parsed.success) {
      // `pnpm validate` catches this in CI before it can ship; this branch is
      // the dev-time signal while you're editing a file by hand.
      throw new Error(
        `Invalid recipe ${slug}.yaml:\n${JSON.stringify(parsed.error.issues, null, 2)}`,
      )
    }

    const refErrors = checkSourceRefs(parsed.data)
    if (refErrors.length) {
      throw new Error(`Invalid recipe ${slug}.yaml:\n  ${refErrors.join('\n  ')}`)
    }

    loaded.push({ ...parsed.data, slug })
  }

  return loaded.sort((a, b) => a.name.localeCompare(b.name))
}

export const recipes = load()

export function getRecipe(slug: string): LoadedRecipe | undefined {
  return recipes.find((r) => r.slug === slug)
}

export const allTags: string[] = [
  ...new Set(recipes.flatMap((r) => r.tags ?? [])),
].sort()

/**
 * Substring search across the fields someone would actually search by.
 * With a family-sized collection this beats pulling in a search index.
 */
export function searchRecipes(
  query: string,
  tags: string[] = [],
): LoadedRecipe[] {
  const q = query.trim().toLowerCase()

  return recipes.filter((r) => {
    if (tags.length && !tags.every((t) => r.tags?.includes(t))) return false
    if (!q) return true

    return (
      r.name.toLowerCase().includes(q) ||
      r.tags?.some((t) => t.toLowerCase().includes(q)) ||
      r.ingredients.some((i) => i.item.toLowerCase().includes(q)) ||
      r.notes?.toLowerCase().includes(q)
    )
  })
}
