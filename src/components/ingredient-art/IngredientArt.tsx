import { useMemo } from 'react'
import { DRAWINGS } from './drawings'
import { artForRecipe, type ArtInput, type ArtKey } from './match'
import { INK, STROKE } from './palette'
import './IngredientArt.css'

/** One ingredient cartoon as an inline SVG. Decorative by design. */
export function IngredientArt({ art }: { art: ArtKey }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className="ingredient-art"
      aria-hidden="true"
      focusable="false"
    >
      <g
        stroke={INK}
        strokeWidth={STROKE}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {DRAWINGS[art]}
      </g>
    </svg>
  )
}

/**
 * A small overlapping cluster of a recipe's signature ingredients — a visual
 * fingerprint for scanning the index. Hidden from assistive tech: the recipe
 * name next to it is the real label, and "chicken, pasta, tomato" read aloud
 * before every title would just be noise.
 */
export default function IngredientCluster({
  recipe,
  size = 'md',
}: {
  recipe: ArtInput
  size?: 'md' | 'lg'
}) {
  const art = useMemo(() => artForRecipe(recipe), [recipe])

  return (
    <span
      className={`ingredient-cluster ingredient-cluster--${size}`}
      aria-hidden="true"
    >
      {art.map((key) => (
        <span key={key} className="ingredient-cluster__item">
          <IngredientArt art={key} />
        </span>
      ))}
    </span>
  )
}
