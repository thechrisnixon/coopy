import type { LoadedRecipe } from './schema'
import { scaleQty } from './units'

/**
 * Renders recipes as plain Markdown.
 *
 * This is the archive's escape hatch: the site can rot, the framework can be
 * abandoned, and the recipes still open in any text editor and render on
 * GitHub. Crucially it carries the source attribution and the reasoning notes
 * — an export that dropped those would preserve the ingredient list while
 * losing the thing the archive exists for.
 *
 * Output is deterministic — no timestamps — so regenerating produces no diff
 * unless a recipe actually changed.
 */

const SLOT_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

function slotFor(recipe: LoadedRecipe, key: string): string {
  const i = Object.keys(recipe.sources ?? {}).indexOf(key)
  return SLOT_LETTERS[i] ?? key.toUpperCase()
}

/** Escape the few characters that would otherwise break a Markdown table cell. */
function inline(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim()
}

function metaLine(r: LoadedRecipe): string {
  const bits: string[] = []
  if (r.serves) bits.push(`Serves ${r.serves} at 1×`)
  if (r.time?.prep) bits.push(`Prep ${r.time.prep}`)
  if (r.time?.cook) bits.push(`Cook ${r.time.cook}`)
  if (r.time?.total) bits.push(`Total ${r.time.total}`)
  return bits.join(' · ')
}

function sourcesSection(r: LoadedRecipe): string[] {
  const entries = Object.entries(r.sources ?? {})
  if (!entries.length) return []

  const out: string[] = ['## Sources', '']
  out.push(
    entries.length > 1
      ? `Blended from ${entries.length} sources. Ingredients below are marked with the letter of the source they came from.`
      : 'From a single source.',
  )
  out.push('')

  for (const [key, src] of entries) {
    const letter = slotFor(r, key)
    out.push(`**${letter} — ${src.name}**`)
    if (src.url) out.push(`<${src.url}>`)
    if (src.role) out.push(`*${src.role}*`)
    if (src.scan) out.push(`Scan: \`${src.scan.replace(/^\//, 'public/')}\``)
    out.push('')
  }

  return out
}

function ingredientsSection(r: LoadedRecipe): string[] {
  const out: string[] = ['## Ingredients', '']
  out.push('*Quantities are 1× — one batch, exactly as the source wrote them.*')
  out.push('')

  // Marking every line "A" on a single-source recipe is noise, not information.
  const isBlend = Object.keys(r.sources ?? {}).length > 1

  let currentGroup: string | undefined
  let started = false

  for (const ing of r.ingredients) {
    if (ing.group !== currentGroup) {
      currentGroup = ing.group
      if (currentGroup) {
        if (started) out.push('')
        out.push(`### ${currentGroup}`, '')
      }
    }
    started = true

    // Same fraction rendering the site uses — ½ rather than 0.5. This is the
    // human-readable artifact, so it should read the way a recipe is written.
    const qty = scaleQty(ing.qty, 1, ing.discrete)
    const amount = [qty, ing.unit].filter(Boolean).join(' ').trim()
    const mark = isBlend && ing.from ? ` — *${slotFor(r, ing.from)}*` : ''

    out.push(amount ? `- **${amount}** ${inline(ing.item)}${mark}` : `- ${inline(ing.item)}${mark}`)

    // The note explains why this line differs from its source. A nested bullet
    // keeps it attached to its ingredient and reads cleanly as plain text.
    if (ing.note) out.push(`  - *${inline(ing.note)}*`)
  }

  out.push('')
  return out
}

export function recipeToMarkdown(r: LoadedRecipe): string {
  const out: string[] = [`# ${r.name}`, '']

  const meta = metaLine(r)
  if (meta) out.push(meta, '')
  if (r.tags?.length) out.push(`Tags: ${r.tags.join(', ')}`, '')

  out.push(...sourcesSection(r))
  out.push(...ingredientsSection(r))

  if (r.steps?.length) {
    out.push('## Method', '')
    r.steps.forEach((step, i) => out.push(`${i + 1}. ${inline(step)}`))
    out.push('')
  }

  if (r.notes) {
    out.push('## Notes', '')
    for (const para of r.notes.trim().split(/\n\s*\n/)) {
      out.push(inline(para), '')
    }
  }

  out.push('---', '', `Source file: \`recipes/${r.slug}.yaml\``, '')

  return out.join('\n')
}

/** The whole archive as one self-contained file. */
export function cookbookToMarkdown(recipes: LoadedRecipe[]): string {
  const out: string[] = [
    '# coopy',
    '',
    'The Nixon family recipes.',
    '',
    'Every quantity is recorded at 1× — one batch, exactly as its source wrote',
    'it — so nothing is lost to rounding. Recipes blended from more than one',
    'source mark each ingredient with the letter of the source it came from, and',
    'note why that source won.',
    '',
    `${recipes.length} recipe${recipes.length === 1 ? '' : 's'}.`,
    '',
  ]

  if (recipes.length > 1) {
    out.push('## Contents', '')
    for (const r of recipes) {
      const meta = metaLine(r)
      out.push(`- **${r.name}**${meta ? ` — ${meta}` : ''}`)
    }
    out.push('')
  }

  for (const r of recipes) {
    out.push('', recipeToMarkdown(r))
  }

  return out.join('\n')
}
