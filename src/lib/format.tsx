import type { ReactNode } from 'react'

/**
 * Splits a step into readable sub-paragraphs when a single YAML step packs
 * multiple labeled branches together (e.g. "If Using a Mortar and Pestle: ...
 * If Not Using a Mortar and Pestle: ..."), and bolds short lead-in labels at
 * the start of a paragraph ("Cake:", "Assemble:", "If marinating your own:").
 */
export function formatStepParagraphs(step: string): ReactNode[] {
  // Split inline conditional branches that start after a sentence period,
  // e.g. "...here). If Not Using a Mortar and Pestle: Mince..."
  const clauses = step
    .trim()
    .split(/(?<=[.!?])\s+(?=If\s+[A-Z][^:.!?]{1,48}:\s)/)

  return clauses.map((clause, i) => {
    const match = clause.match(/^([A-Z][^:.!?]{1,48}:)\s+(.*)$/s)
    if (match) {
      return (
        <span key={i} className="step__clause">
          <strong className="step__lead">{match[1]}</strong> {match[2]}
        </span>
      )
    }
    return (
      <span key={i} className="step__clause">
        {clause}
      </span>
    )
  })
}

/**
 * De-emphasises parenthetical weight/volume equivalents and trailing optional
 * qualifiers inside an ingredient line so the core ingredient name stands out
 * when scanning at arm's length.
 */
export function formatIngredientItem(item: string): ReactNode {
  // Match parentheticals like "(30 ml)" or "(about 2 tablespoons/16 g)" and
  // trailing qualifiers like ", optional" or ", plus more to taste".
  const parts = item.split(
    /(\([^)]+\)|,\s*(?:optional|to taste|plus more[^,)]*|more or less to taste))/gi,
  )

  if (parts.length === 1) return item

  return parts.map((part, i) => {
    if (!part) return null
    const isDetail =
      part.startsWith('(') ||
      /^,\s*(?:optional|to taste|plus more|more or less)/i.test(part)
    return isDetail ? (
      <span key={i} className="ingredients__detail">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  })
}
