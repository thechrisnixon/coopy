import type { Ingredient, Source } from '../lib/schema'
import { scaleQty } from '../lib/units'
import './IngredientList.css'

type Props = {
  ingredients: Ingredient[]
  sources?: Record<string, Source>
  /** Effective multiplier, already divided by `serves` if per-serving is on. */
  multiplier: number
  showSources: boolean
  /** Cook mode adds tap-to-check; the detail page doesn't. */
  checkable?: boolean
  checked?: Set<number>
  onToggle?: (index: number) => void
}

/** Stable slot per source key, so tints stay consistent across the page. */
function sourceSlot(sources: Record<string, Source> | undefined, key: string) {
  const order = Object.keys(sources ?? {})
  return order.indexOf(key) === 0 ? 'a' : 'b'
}

/**
 * Source names run long ("Chili Capital of the U.S.A." card), so rows carry a
 * one-letter marker instead. The blend panel above the list is the legend, and
 * the full name is still available on hover and to screen readers.
 */
function SourceMark({
  slot,
  name,
}: {
  slot: string
  name: string
}) {
  return (
    <span className="ingredients__from" title={name}>
      <span aria-hidden="true">{slot.toUpperCase()}</span>
      <span className="visually-hidden">from {name}</span>
    </span>
  )
}

export default function IngredientList({
  ingredients,
  sources,
  multiplier,
  showSources,
  checkable = false,
  checked,
  onToggle,
}: Props) {
  // Preserve file order while collecting groups — the author's sequencing
  // ("For the chili" before "To serve") is meaningful.
  const groups: { name: string | undefined; items: [Ingredient, number][] }[] = []
  for (const [i, ing] of ingredients.entries()) {
    const last = groups[groups.length - 1]
    if (last && last.name === ing.group) last.items.push([ing, i])
    else groups.push({ name: ing.group, items: [[ing, i]] })
  }

  return (
    <div className="ingredients">
      {groups.map((group, gi) => (
        <div key={gi} className="ingredients__group">
          {group.name && <h3 className="eyebrow ingredients__grouplabel">{group.name}</h3>}

          <ul className="ingredients__list">
            {group.items.map(([ing, index]) => {
              const qty = scaleQty(ing.qty, multiplier, ing.discrete)
              const slot = ing.from ? sourceSlot(sources, ing.from) : null
              const isChecked = checked?.has(index) ?? false

              const row = (
                <>
                  <span className="tabular ingredients__qty">
                    {qty}
                    {qty && ing.unit ? ' ' : ''}
                    {ing.unit}
                  </span>
                  <span className="ingredients__item">
                    {ing.item}
                    {/* The note is the reasoning behind a blend decision —
                        shown only when sources are on, so the default read
                        stays clean. */}
                    {showSources && ing.note && (
                      <span className="ingredients__note">{ing.note}</span>
                    )}
                  </span>
                  {showSources && ing.from && slot && (
                    <SourceMark
                      slot={slot}
                      name={sources?.[ing.from]?.name ?? ing.from}
                    />
                  )}
                </>
              )

              const className = [
                'ingredients__row',
                showSources && slot ? `is-source-${slot}` : '',
                isChecked ? 'is-checked' : '',
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <li key={index}>
                  {checkable ? (
                    <button
                      type="button"
                      className={`${className} is-checkable`}
                      onClick={() => onToggle?.(index)}
                      aria-pressed={isChecked}
                    >
                      {row}
                    </button>
                  ) : (
                    <div className={className}>{row}</div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
