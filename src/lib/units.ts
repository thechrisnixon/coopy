/**
 * Quantity math for scaling recipes.
 *
 * Recipes are stored at 1X — one batch, as the source wrote it — so nothing is
 * divided on the way in and no precision is lost at rest. Scaling happens only
 * at display time, and we round to fractions cooks actually own measuring
 * spoons for rather than showing 0.333333 tsp.
 */

const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 1 / 2,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '¼': 1 / 4,
  '¾': 3 / 4,
  '⅕': 1 / 5,
  '⅖': 2 / 5,
  '⅗': 3 / 5,
  '⅘': 4 / 5,
  '⅙': 1 / 6,
  '⅚': 5 / 6,
  '⅛': 1 / 8,
  '⅜': 3 / 8,
  '⅝': 5 / 8,
  '⅞': 7 / 8,
}

/** Fractions a home kitchen can actually measure, best-first. */
const KITCHEN_FRACTIONS: [num: number, den: number][] = [
  [1, 8],
  [1, 4],
  [1, 3],
  [1, 2],
  [2, 3],
  [3, 4],
  [7, 8],
]

const VULGAR: Record<string, string> = {
  '1/8': '⅛',
  '1/4': '¼',
  '1/3': '⅓',
  '1/2': '½',
  '2/3': '⅔',
  '3/4': '¾',
  '7/8': '⅞',
}

/**
 * Turn a stored quantity into a number. Returns null for anything
 * unparseable (e.g. "a pinch"), which callers render verbatim and never scale.
 */
export function parseQty(raw: number | string | undefined): number | null {
  if (raw === undefined) return null
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null

  const s = raw.trim()
  if (!s) return null

  // Split off any trailing unicode fraction: "1½" or "1 ½"
  let total = 0
  let matched = false
  let rest = s

  for (const [glyph, value] of Object.entries(UNICODE_FRACTIONS)) {
    if (rest.includes(glyph)) {
      total += value
      matched = true
      rest = rest.replace(glyph, ' ').trim()
      break
    }
  }

  if (rest) {
    // "1 1/2" -> whole 1, fraction 1/2
    const mixed = rest.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/)
    const frac = rest.match(/^(\d+)\s*\/\s*(\d+)$/)
    const dec = rest.match(/^\d*\.?\d+$/)

    if (mixed) {
      const den = Number(mixed[3])
      if (den === 0) return null
      total += Number(mixed[1]) + Number(mixed[2]) / den
      matched = true
    } else if (frac) {
      const den = Number(frac[2])
      if (den === 0) return null
      total += Number(frac[1]) / den
      matched = true
    } else if (dec) {
      total += Number(rest)
      matched = true
    } else if (!matched) {
      // Leftover text we don't understand ("a pinch", "to taste").
      return null
    }
  }

  return matched ? total : null
}

/**
 * Render a number the way a recipe would write it: whole numbers plain,
 * everything else snapped to the nearest kitchen fraction. Falls back to one
 * decimal when no fraction is close enough (e.g. 2.7 oz).
 */
export function formatQty(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0'

  const whole = Math.floor(n)
  const remainder = n - whole

  if (remainder < 0.02) return String(whole)
  if (remainder > 0.98) return String(whole + 1)

  let best: { text: string; error: number } | null = null
  for (const [num, den] of KITCHEN_FRACTIONS) {
    const error = Math.abs(remainder - num / den)
    if (!best || error < best.error) {
      best = { text: VULGAR[`${num}/${den}`] ?? `${num}/${den}`, error }
    }
  }

  // 0.04 keeps 1/3 vs 3/8 honest without letting 2.7 masquerade as 2¾.
  if (best && best.error <= 0.04) {
    return whole > 0 ? `${whole}${best.text}` : best.text
  }

  return String(Math.round(n * 10) / 10)
}

/**
 * Scale one ingredient's quantity for display.
 *
 * `discrete` items (eggs, bay leaves) round up to a whole number — half an egg
 * is not a thing you can put in a pot, and rounding down loses the ingredient
 * entirely at small multipliers.
 */
export function scaleQty(
  raw: number | string | undefined,
  multiplier: number,
  discrete = false,
): string | null {
  const parsed = parseQty(raw)

  // Unparseable quantities ("a pinch") pass through untouched — scaling
  // something we couldn't read would be a lie.
  if (parsed === null) return raw === undefined ? null : String(raw)

  const scaled = parsed * multiplier
  return discrete ? String(Math.max(1, Math.round(scaled))) : formatQty(scaled)
}

/** Preset multipliers offered in the UI. */
export const MULTIPLIERS = [0.5, 1, 2, 3] as const

export function formatMultiplier(m: number): string {
  return m === 1 ? '1×' : `${formatQty(m)}×`
}
