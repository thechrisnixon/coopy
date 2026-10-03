/**
 * Picks the few ingredient illustrations that make a recipe recognisable at
 * a glance. Pure and deterministic — no React, so scripts can import it too.
 *
 * How it works:
 *  1. Each ingredient line is normalised: parentheticals dropped, and
 *     compound phrases that would fool a keyword ("chicken broth", "peanut
 *     butter", "chili powder", "egg noodles") rewritten to what they really
 *     are, or blanked when they're seasoning.
 *  2. Rules match keywords. There are deliberately no rules for salt, pepper,
 *     oil, water, flour, sugar, vanilla or spices — they're in everything and
 *     tell you nothing.
 *  3. Each hit scores its rule's weight, plus a bonus when the recipe's name
 *     mentions it (the name is the best signal for what the dish is "about"),
 *     minus a little for appearing late in the list or as a garnish.
 *  4. The top few distinct illustrations win; ties break on rule order.
 */

export const ART_KEYS = [
  'drumstick',
  'groundMeat',
  'steak',
  'porkChop',
  'sausage',
  'egg',
  'cheese',
  'milk',
  'butter',
  'tomato',
  'cherryTomatoes',
  'avocado',
  'lime',
  'lemon',
  'onion',
  'garlic',
  'carrot',
  'potato',
  'sweetPotato',
  'zucchini',
  'broccoli',
  'cauliflower',
  'greens',
  'cabbage',
  'bellPepper',
  'chili',
  'mushroom',
  'corn',
  'beans',
  'peas',
  'rice',
  'pasta',
  'bread',
  'muffin',
  'pancakes',
  'cinnamonRoll',
  'dumpling',
  'banana',
  'berries',
  'strawberry',
  'apple',
  'pumpkin',
  'oats',
  'peanut',
  'honey',
  'herbs',
  'ginger',
  'chocolate',
  'pot',
  'whisk',
] as const

export type ArtKey = (typeof ART_KEYS)[number]

/** Just the fields the matcher reads, so it works on any recipe-shaped value. */
export type ArtInput = {
  name: string
  tags?: string[]
  ingredients: { item: string }[]
}

type Rule = {
  key: ArtKey
  /** Matched against each normalised ingredient line and the recipe name. */
  match: RegExp
  /** Importance: proteins highest, then signature produce, aromatics last. */
  weight: number
  /** Set for dish-shape art (muffin, pancakes) that only the name can imply. */
  nameOnly?: boolean
}

// Order matters only as a tie-breaker. Weights: 100 protein, 70 signature
// produce/dish, 55–60 carbs & cheese, 40–50 supporting, ≤30 background.
const RULES: Rule[] = [
  { key: 'drumstick', match: /\bchicken\b|\bturkey breast\b/, weight: 100 },
  { key: 'groundMeat', match: /\bmince\b|meatball|kofta/, weight: 100 },
  { key: 'steak', match: /\bbeef\b|steak|short ribs?|chuck|pot roast/, weight: 100 },
  { key: 'porkChop', match: /\bpork\b|\bham\b|bacon/, weight: 100 },
  { key: 'sausage', match: /sausage/, weight: 100 },

  { key: 'pancakes', match: /pancake|waffle/, weight: 75, nameOnly: true },
  { key: 'muffin', match: /muffins?\b|\bcake\b|cupcake/, weight: 75, nameOnly: true },
  { key: 'cinnamonRoll', match: /cinnamon rolls?/, weight: 75, nameOnly: true },
  { key: 'dumpling', match: /dumpling|gyoza/, weight: 75 },

  { key: 'banana', match: /banana/, weight: 70 },
  { key: 'pumpkin', match: /pumpkin|butternut|squash/, weight: 70 },
  { key: 'broccoli', match: /broccoli/, weight: 70 },
  { key: 'cauliflower', match: /cauliflower/, weight: 70 },
  { key: 'zucchini', match: /zucchini|courgette/, weight: 70 },
  { key: 'strawberry', match: /strawberr/, weight: 70 },
  { key: 'berries', match: /blueberr|raspberr|\bberries\b/, weight: 70 },
  { key: 'apple', match: /\bapples?\b|applesauce/, weight: 65 },
  { key: 'avocado', match: /avocado/, weight: 65 },
  { key: 'cherryTomatoes', match: /cherrytomato/, weight: 70 },
  { key: 'sweetPotato', match: /sweetpotato/, weight: 70 },
  { key: 'mushroom', match: /mushroom|cremini|shiitake/, weight: 65 },
  { key: 'greens', match: /\bkale\b|chard|spinach|lettuce|escarole|arugula|\bgreens\b/, weight: 65 },
  { key: 'peanut', match: /peanut|nutbutter|cashew/, weight: 60 },
  { key: 'potato', match: /potato/, weight: 60 },
  { key: 'corn', match: /\bcorn\b/, weight: 60 },
  { key: 'beans', match: /\bbeans?\b|chickpea|cannellini|lentil/, weight: 60 },
  { key: 'peas', match: /\bpeas?\b|edamame|greenbean/, weight: 50 },
  { key: 'cabbage', match: /cabbage|brussels/, weight: 50 },

  { key: 'pasta', match: /pasta|spaghetti|noodle|rigatoni|pappardelle|ditalini|gnocchi|macaroni|elbow|penne/, weight: 60 },
  { key: 'rice', match: /\brice\b|quinoa/, weight: 55 },
  { key: 'bread', match: /bread|baguette|english muffin|biscuit|dough/, weight: 55 },
  { key: 'cheese', match: /cheese|cheddar|parmesan|parmigiano|mozzarella|mascarpone/, weight: 55 },
  { key: 'oats', match: /\boats?\b|oatmeal|granola/, weight: 50 },

  { key: 'tomato', match: /tomato|passata|pizza sauce/, weight: 50 },
  { key: 'chocolate', match: /chocolate/, weight: 45 },
  { key: 'egg', match: /\beggs?\b|egg yolk/, weight: 45 },
  { key: 'carrot', match: /carrot/, weight: 45 },
  { key: 'bellPepper', match: /bell pepper/, weight: 45 },
  { key: 'chili', match: /jalape|\bchiles?\b|\bchilis\b|calabrian|serrano/, weight: 40 },
  { key: 'honey', match: /honey/, weight: 40 },
  { key: 'lime', match: /\blimes?\b/, weight: 35 },
  { key: 'lemon', match: /lemon/, weight: 30 },
  { key: 'ginger', match: /ginger/, weight: 25 },
  { key: 'milk', match: /\bmilk\b|\bcream\b/, weight: 25 },
  { key: 'butter', match: /\bbutter\b/, weight: 25 },
  { key: 'onion', match: /onion|shallot|leek/, weight: 20 },
  { key: 'garlic', match: /garlic/, weight: 20 },
  { key: 'herbs', match: /parsley|cilantro|basil|rosemary|thyme|\bdill\b|\bsage\b|scallion|herb/, weight: 15 },
]

/**
 * Phrase rewrites applied before matching, in order. Seasoning and pantry
 * phrases become '' so their nouns don't trigger the real ingredient.
 */
type Replacement = string | ((match: string) => string)

const LINE_TRIMS: [RegExp, Replacement][] = [
  [/\([^)]*\)/g, ' '],
  // Prep notes and alternatives follow the first comma ("garlic, minced",
  // "brown rice, quinoa, noodles, or vegetables") — only the lead counts.
  [/,.*$/, ''],
]

const REWRITES: [RegExp, Replacement][] = [
  [/\bcauliflower gnocchi\b/g, 'gnocchi'],
  [/\bmixed vegetables\b/g, 'peas carrot'],
  [/\b(chicken|beef|vegetable) (broth|stock|powder|bouillon)\b/g, ' '],
  [/\bchicken sausage\b/g, 'sausage'],
  // Poultry mince still reads as "chicken"; red-meat mince gets the mince art.
  [/\b(ground|lean ground) (chicken|turkey)( breast)?\b/g, 'chicken'],
  [/\bground (beef|pork|lamb)\b|\blamb\b/g, 'mince'],
  [/\b(bread|cake|all-purpose|all purpose|whole wheat|whole-wheat) flour\b/g, ' '],
  [/\b(peanut|almond|nut|seed) butter\b/g, (m) => (m.startsWith('peanut') ? 'peanut' : 'nutbutter')],
  [/\bbutter lettuce\b/g, 'lettuce'],
  [/\begg noodles\b/g, 'noodles'],
  [/\bcream cheese\b/g, 'cheese'],
  [/\b(cherry|grape) tomato(es)?\b/g, 'cherrytomato'],
  [/\bsweet potato(es)?\b/g, 'sweetpotato'],
  [/\bgreen beans?\b/g, 'greenbean'],
  [/\b(green onions?|scallions?)\b/g, 'scallion'],
  [/\b(garlic|onion|chili|chicken) (powder|paste|flakes)\b/g, ' '],
  [/\b(black|cayenne|ground|cracked) pepper\b|\bred pepper flakes\b/g, ' '],
  [/\bpumpkin (pie )?spice\b/g, ' '],
  [/\bground ginger\b/g, ' '],
  [/\b(rice|cider|apple cider) vinegar\b/g, ' '],
  [/\bcorn ?(starch|flour)\b/g, ' '],
  [/\b(coconut|almond|evaporated) milk\b/g, ' '],
  [/\b(avocado|coconut|olive|sesame) oil\b/g, ' '],
  [/\bbread ?crumbs?\b|\bpanko\b/g, ' '],
  [/\bparmesan rind\b/g, ' '],
  [/\bdried (thyme|parsley|oregano|herbs?)\b/g, ' '],
]

/** Ingredient lines get the full treatment, including the trimming rules. */
function normalise(text: string): string {
  return rewrite(text, [...LINE_TRIMS, ...REWRITES])
}

/** Names keep their parentheticals and commas ("Sausage, Potato & Kale"). */
function normaliseName(text: string): string {
  return rewrite(text, REWRITES)
}

function rewrite(text: string, rules: [RegExp, Replacement][]): string {
  let s = text.toLowerCase()
  for (const [re, to] of rules) {
    s = typeof to === 'string' ? s.replace(re, to) : s.replace(re, to)
  }
  return s
}

/** Garnish and serving lines say less about the dish than the base ones. */
const GARNISH = /^(to serve|for serving|for garnish)|optional|garnish|for serving|to serve/

const PROTEINS = new Set<ArtKey>(['drumstick', 'groundMeat', 'steak', 'porkChop', 'sausage'])

/** Near-duplicate art: when the first is shown, the second adds nothing. */
const SUPERSEDES: [ArtKey, ArtKey][] = [
  ['cherryTomatoes', 'tomato'],
  ['strawberry', 'berries'],
  ['lime', 'lemon'],
]

export const DEFAULT_ART_COUNT = 4

export function artForRecipe(recipe: ArtInput, count = DEFAULT_ART_COUNT): ArtKey[] {
  const name = normaliseName(recipe.name)
  const scores = new Map<ArtKey, number>()
  const order = new Map<ArtKey, number>(RULES.map((r, i) => [r.key, i]))

  const bump = (key: ArtKey, score: number) => {
    if (score > (scores.get(key) ?? -Infinity)) scores.set(key, score)
  }

  recipe.ingredients.forEach((ing, index) => {
    const line = normalise(ing.item)
    const garnish = GARNISH.test(ing.item.toLowerCase()) ? 15 : 0
    for (const rule of RULES) {
      if (rule.nameOnly || !rule.match.test(line)) continue
      // Earlier lines are usually the backbone of the dish.
      bump(rule.key, rule.weight - garnish - Math.min(index, 20) * 0.25)
    }
  })

  const hasProtein = [...scores.keys()].some((k) => PROTEINS.has(k))
  for (const rule of RULES) {
    if (!rule.match.test(name)) continue
    const existing = scores.get(rule.key)
    if (existing !== undefined || rule.nameOnly) {
      // A name mention lifts an ingredient that's already there; for dish
      // shapes (muffins, pancakes) the name is the only evidence.
      bump(rule.key, (existing ?? rule.weight) + 60)
    } else if (!(PROTEINS.has(rule.key) && hasProtein)) {
      // Named but not listed (e.g. "Strawberry" over "fresh berries"). Don't
      // let a name invent a second protein the ingredients don't have.
      bump(rule.key, rule.weight)
    }
  }

  for (const [winner, loser] of SUPERSEDES) {
    if (scores.has(winner)) scores.delete(loser)
  }

  const ranked = [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || order.get(a[0])! - order.get(b[0])!)
    .map(([key]) => key)
    .slice(0, count)

  if (ranked.length) return ranked

  const savoury = recipe.tags?.some((t) => /dinner|soup|stew|chili|lunch/.test(t))
  return [savoury ? 'pot' : 'whisk']
}
