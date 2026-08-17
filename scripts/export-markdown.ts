/**
 * Writes the Markdown cookbook into `cookbook/`.
 *
 * Runs as part of `pnpm build`, and the output is committed — so the archive
 * is readable directly on GitHub with no app, no build, and no JavaScript, and
 * stays readable if this project is ever abandoned. Output is deterministic,
 * so regenerating only produces a diff when a recipe actually changed.
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { Recipe, type LoadedRecipe } from '../src/lib/schema'
import { recipeToMarkdown, cookbookToMarkdown } from '../src/lib/markdown'

const root = join(import.meta.dirname, '..')
const recipesDir = join(root, 'recipes')
const outDir = join(root, 'cookbook')

const recipes: LoadedRecipe[] = readdirSync(recipesDir)
  .filter((f) => f.endsWith('.yaml'))
  .map((file) => {
    const slug = file.replace(/\.yaml$/, '')
    // `pnpm validate` runs first in the build and reports properly on bad
    // input, so parsing is allowed to throw here.
    return { ...Recipe.parse(parseYaml(readFileSync(join(recipesDir, file), 'utf8'))), slug }
  })
  .sort((a, b) => a.name.localeCompare(b.name))

// Rebuild from scratch so a deleted recipe doesn't leave an orphaned page.
rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

for (const recipe of recipes) {
  writeFileSync(join(outDir, `${recipe.slug}.md`), recipeToMarkdown(recipe))
}

writeFileSync(join(outDir, 'README.md'), cookbookToMarkdown(recipes))

console.log(
  `✓ exported ${recipes.length} recipe${recipes.length === 1 ? '' : 's'} to cookbook/`,
)
