import { z } from 'zod'

/**
 * A week's shopping plan, written by the /weekly-shop skill to
 * `plans/<YYYY-MM-DD>.yaml` (the date the order was built). Plans are local
 * only — see .gitignore — and the /plans page reads them through the dev
 * server, never the public build.
 *
 * The file is the record of what was decided, not just what was bought: the
 * `log` keeps the back-and-forth ("swapped to 365 to get under $250") so a
 * later week can learn from it.
 */

export const PlanStatus = z.enum([
  'draft', // still talking about it
  'carted', // cart built on Whole Foods, waiting for a yes
  'ordered', // placed after an explicit yes
  'cancelled',
])

export const Meal = z.object({
  name: z.string().min(1),
  /** coopy slug, when the meal is an archive recipe. */
  recipe: z.string().optional(),
  /** Source link for a meal that isn't in coopy (yet). */
  url: z.url().optional(),
  /** Batch multiplier against the recipe's 1X. */
  scale: z.number().positive().optional(),
  day: z.string().optional(),
  /** Leftovers, freezer portions, Coop's portion, heat on the side. */
  notes: z.string().optional(),
})

export const Item = z.object({
  /** Product title as Whole Foods lists it. */
  name: z.string().min(1),
  qty: z.number().positive().default(1),
  /** Unit price in dollars at the time it was carted. */
  price: z.number().nonnegative().optional(),
  /** Why it's in the cart: meal names, "staple", "requested". */
  for: z.array(z.string()).optional(),
  category: z
    .enum(['produce', 'meat', 'dairy', 'pantry', 'frozen', 'bakery', 'snacks', 'drinks', 'household', 'other'])
    .optional(),
  /** Set when a cheaper swap or an out-of-stock substitution replaced something. */
  replaced: z.string().optional(),
  note: z.string().optional(),
})

export const Order = z.object({
  store: z.string().default('Whole Foods via Amazon'),
  order_id: z.string().optional(),
  delivery: z.string().optional(),
  subtotal: z.number().optional(),
  fees: z.number().optional(),
  tip: z.number().optional(),
  tax: z.number().optional(),
  total: z.number().optional(),
  placed_at: z.string().optional(),
})

export const Plan = z.object({
  status: PlanStatus,
  /** The week the food is for, e.g. "Oct 5–11". */
  week: z.string().optional(),
  budget: z.number().optional(),
  meals: z.array(Meal).default([]),
  items: z.array(Item).default([]),
  order: Order.optional(),
  log: z.array(z.string()).default([]),
})

export type Plan = z.infer<typeof Plan>
export type LoadedPlan = Plan & { id: string }
