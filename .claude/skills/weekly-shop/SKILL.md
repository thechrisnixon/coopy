---
name: weekly-shop
description: Plan the week's meals from the coopy recipe archive (plus one-offs and recipe URLs), build the Whole Foods order on Amazon in Chrome, iterate on it in conversation until it's explicitly approved, then place it and record it on the Orders page. Use when the user says "weekly shop", "plan meals", "grocery order", "Whole Foods order", asks to add groceries/recipes to an order, or says the groceries arrived / asks to check a delivery.
---

# Weekly shop

A conversation, not a pipeline. You build the order with the user, show it,
adjust it, and only buy when they explicitly say so. Ask instead of guessing
whenever an answer changes what lands in the cart.

## Where things live

This skill runs in two places: inside the coopy repo (a checkout with
`recipes/` and `vite/data-plugin.ts` in the current directory) or anywhere
else. Check which first — it decides every local path below.

| What | In the coopy repo | Anywhere else |
| --- | --- | --- |
| Recipes | The public API (below), plus `recipes/*.yaml` for recipes not deployed yet | The public API only |
| Household profile | `shopping/household.yaml` | `~/.coopy/household.yaml` |
| Orders | `orders/<date>.yaml` | `~/.coopy/orders/<date>.yaml` (create the folder if needed) |

Orders and the household profile are also **synced to the site's private
storage**, so everyone in the family sees the same orders at
`https://coopy-nu.vercel.app/orders` and the skill works on any machine. The
local YAML is the working copy; the site is the shared copy.

**Recipes:** `https://coopy-nu.vercel.app/data/recipes.json` (all) or
`https://coopy-nu.vercel.app/data/recipes/<slug>.json` (one). Fetch with
`curl -s`. Quantities are 1X as written; `serves` is how many 1X feeds.

### The family passcode

The private endpoints need the family passcode in an `x-coopy-passcode`
header. It lives in `~/.coopy/passcode` (one line). If that file is missing,
ask the user for the passcode once, then save it without echoing it:

```sh
mkdir -p ~/.coopy && umask 077 && printf '%s\n' 'PASSCODE' > ~/.coopy/passcode && chmod 600 ~/.coopy/passcode
```

(substituting what they gave you for PASSCODE). Never repeat it back, never
put it in a URL, a log entry, an order file or a commit — always read it from
the file with `"$(cat ~/.coopy/passcode)"` inside the header. A `401` means
the passcode is wrong: ask for it again and overwrite the file.

### Household profile

The file called household.yaml everywhere below: people, dietary needs,
heat, portions, staples, brand rules, tip, what "cheaper" may do, farmers
market items. It is private and never in the repo or the public site.

Find it in this order:

1. `shopping/household.yaml` (in the repo), else `~/.coopy/household.yaml`.
2. If neither exists, fetch it from the site and cache it. JSON is valid
   YAML, so the response can be saved as-is (tidy it into block YAML the
   first time you edit it):

   ```sh
   mkdir -p ~/.coopy && curl -fsS https://coopy-nu.vercel.app/api/household \
     -H "x-coopy-passcode: $(cat ~/.coopy/passcode)" > ~/.coopy/household.yaml
   ```

   A `404` means no profile has been stored yet (delete the empty file).
3. Still nothing: walk them through creating one now — ask the key questions
   (who eats, dietary needs, heat tolerance, portions, staples, brands, tip),
   write it locally, and push it (below) before building anything.

**Whenever you change the profile** (a new brand, a new staple, portions),
write the local file AND push it so the other machine sees it:

```sh
npx -y yaml --json --single --strict < PATH/TO/household.yaml \
  | curl -fsS -X PUT https://coopy-nu.vercel.app/api/household \
    -H "x-coopy-passcode: $(cat ~/.coopy/passcode)" \
    -H 'content-type: application/json' --data-binary @- > /dev/null
```

### Orders

Write the local YAML as described in "Order file format", and **after every
meaningful change** (list agreed, cart built, each round of iteration, order
placed) push it, using the order's date as the id:

```sh
npx -y yaml --json --single --strict < PATH/TO/orders/2026-10-03.yaml \
  | curl -fsS -X PUT 'https://coopy-nu.vercel.app/api/orders?id=2026-10-03' \
    -H "x-coopy-passcode: $(cat ~/.coopy/passcode)" \
    -H 'content-type: application/json' --data-binary @-
```

The server validates the order against the schema; a `400` lists what's wrong
— fix the YAML and push again. An order that isn't pushed won't appear on the
site.

**Past orders:** last week's order, what got swapped, what ran out. Read the
most recent one or two before building a new list — from the local folder,
or from the site if the local folder is empty or behind (the site has
everyone's orders):

```sh
curl -fsS https://coopy-nu.vercel.app/api/orders -H "x-coopy-passcode: $(cat ~/.coopy/passcode)"
```

(newest first; add `?id=<date>` for one).

### Order file format

One YAML file per week, named for the date it was built (`2026-10-03.yaml`).
Amounts are plain numbers in USD.

```yaml
status: draft        # draft | carted (in cart, waiting for a yes) | ordered | delivered | cancelled
week: Oct 5–11       # the week the food is for
budget: 250          # optional
meals:
  - name: Skyline chili
    recipe: skyline-chili   # coopy slug, when it's an archive recipe
    url: https://…          # source link, when it isn't
    scale: 1.5              # multiplier against the recipe's 1X
    day: Tue
    notes: leftovers for lunch
items:
  - name: 365 Organic Yellow Onion   # product title as Whole Foods lists it
    qty: 2
    price: 1.29                      # unit price when carted
    for: [Skyline chili]             # meal names, "staple", "requested"
    category: produce   # produce|meat|dairy|pantry|frozen|bakery|snacks|drinks|household|other
    replaced: Diestel ground turkey (out of stock)   # only when swapped
    note: optional
    delivered:          # filled in after delivery, from the final invoice
      status: as-ordered   # as-ordered | substituted | short | missing
      as: 365 Organic Yellow Onion, 3 lb bag   # what came, when substituted
      qty: 2            # what arrived (pounds for weighted items)
      price: 1.29       # final unit price (per lb for weighted items)
      total: 2.58       # final line amount from the invoice
checkout:            # filled in once placed
  order_id: 113-…
  delivery: Sun Oct 4 10am–12pm
  subtotal: 263.40
  fees: 0
  tip: 10
  tax: 1.78
  total: 275.18
  placed_at: 2026-10-03T14:05:00-04:00
  charged: 271.02    # final charge after delivery
  delivered_at: 2026-10-04
log:                 # every decision, in order
  - Swapped 4 items to 365, −11.20 USD
```

Only `status` is required; `meals`, `items` and `log` default to empty.

## 1. Gather the week

Ask what they want. They'll mix three kinds of meal — handle each:

- **coopy recipe** — "the bolognese", "skyline". Match against names/tags in
  the API; if more than one fits, ask. Respect the recipe's own notes (e.g.
  "triple and freeze", "start at 3:15").
- **A URL** — fetch it (WebFetch; if blocked, read it in Chrome with
  `get_page_text`). Extract ingredients at 1X. At the end, offer to save it to
  coopy — only if they want it:
  - **In the coopy repo:** write `recipes/<slug>.yaml` following README.md and
    `recipes/skyline-chili.yaml` (source attribution, `from: us` for our
    changes), then run `pnpm validate`.
  - **Anywhere else:** give them the recipe as YAML in that same format (or
    just the URL) to paste into `https://coopy-nu.vercel.app/add`, which
    parses and commits it.
- **One-off** — "tacos Thursday", "creatine", "stuff for the kids' lunches".
  Propose a short ingredient list and confirm it.

When asking what's already on hand, **list every ingredient separately** —
one option per ingredient, never "soy sauce & rice vinegar". More than four
ingredients? Split across questions.

Also ask, briefly and only if not already said: **are they going to the
farmers market this week?** If yes, drop everything under
`farmers_market.items` in household.yaml from the order, including recipe
lines it covers (guac avocados, a pasta sauce), and list those items for the
market so nothing falls through. Then: nights eating out, what's
already in the fridge/pantry, anything running low, any budget this week.

## 2. Build the list

1. **Scale** each meal to the household (`portions` in household.yaml),
   including planned leftovers. Say the multiplier you chose ("1.5× for
   leftovers") rather than burying it.
2. **Apply each person's rules from household.yaml `people`, per person, not
   per meal.** Never drop a meal because of one person's restriction:
   - A dietary restriction means a swap or a side (e.g. the lactose-free
     version from `brands`), not skipping the meal.
   - Heat: follow the heat note at the top of household.yaml. **Shared
     meals** are cooked to the mildest person's level unless the user asks
     for heat on that meal; one person's **own** snacks and sauces follow
     their own tolerance. Keep their spicy items separate in the list you
     show.
   - Personal dislikes mean that person doesn't need a version of that item.
3. **Merge** duplicate ingredients across meals and convert to purchasable
   units (2 cups chopped onion → 2 onions; 1/3 cup hot honey → 1 jar unless
   the pantry has it). Skip pantry basics (salt, pepper, oil, common spices)
   unless they say they're out.
4. **Add staples** from household.yaml unless told to skip; check the last order
   so you don't double-buy something bought last week that lasts (cereal,
   granola, protein powder).
5. **Pick brands** from household.yaml `brands`; 365 by Whole Foods Market when
   there's no rule. If `organic: preferred`, choose the organic version
   whenever one exists.

Show the list grouped by category with which meal each line is for, and ask
for changes **before** touching the browser. Write `<today>.yaml` in the orders
folder (see "Where things live") with `status: draft` now, push it to the
site, and keep both updated as things change.

## 3. Build the cart (Chrome)

Load the `claude-in-chrome` skill first. Use the browser that's signed in to
the family Amazon account; if Amazon shows a sign-in page, stop and ask the
user to sign in — never enter credentials.

- Whole Foods storefront: `https://www.amazon.com/alm/storefront?almBrandId=VUZHIFdob2xlIEZvb2Rz`.
  Search inside the Whole Foods store (not all of Amazon), pick the exact
  product the list names, set the quantity, add to cart.
- Prefer "Buy Again" for staples — it's the exact product they always get.
- **Out of stock / not carried:** pick the closest match (same brand other
  size → 365 equivalent → other brand), and record `replaced:` on the item.
  Collect these and tell the user; don't silently substitute anything that
  matters (a protein, a recipe's key ingredient, a brand rule).
- Check what was already in the Whole Foods cart before you started and ask
  whether to keep it.
- Non-Whole-Foods items (e.g. supplements Whole Foods doesn't carry) go in the
  regular Amazon cart as a separate order — say so.

Then open the Whole Foods cart and read back the actual subtotal. Present:

```
Whole Foods — 47 items — 263.40 USD subtotal (+ 10 USD tip, est. tax) ≈ 275 USD
Meals: Skyline chili (1.5×), chicken bolognese (3×, freeze 2), …
Swaps: Diestel ground turkey → 365 ground turkey (out of stock)
Biggest lines: NY strip 40 USD, Mary's thighs 13 USD …
```

Set `status: carted`, fill `items` with real prices, and push the order.

## 4. Iterate until accepted

Stay in the conversation. Typical asks:

- **"Cheaper"** — follow household.yaml `cheaper`, in order: swap name brands
  to 365 where there's no brand rule. Show each swap and the savings.
- **"Under a number"** — trim using the same order until it fits; if it can't fit
  without dropping a meal or staple, say what it would take and ask.
- Adds, removes, quantity changes — do them in the cart and re-read the total.

Append every decision to the order's `log` ("Swapped 4 items to 365, −11.20 USD")
and push the order after each round.

## 5. Place the order — only on an explicit yes

**Never place an order without an explicit instruction from the user in this
conversation** ("place it", "yes, order it"). Approval of an earlier version
doesn't carry over after the cart changed. Before clicking the final
place-order button, state exactly:

> Placing: Whole Foods, 47 items, 275.18 USD total incl. 10 USD tip, delivery Sun
> Oct 4 10am–12pm, card on file ending XXXX. Go?

and wait for the yes. Use the delivery window they asked for (ask if they
didn't say). Tip: household.yaml `tip`. Never change the payment method,
address, or account settings, and never apply anything that commits to a
subscription.

After it's placed, record `checkout` (order id, delivery window, subtotal, fees,
tip, tax, total, placed_at), set `status: ordered`, and push the order.

## Refreshing the profile from order history

If the user asks to re-learn their habits (or household.yaml is stale), read
recent Whole Foods orders in Chrome: list them at
`https://www.amazon.com/your-orders/orders?timeFilter=year-<YYYY>` (Whole
Foods cards say "Whole Foods Market delivery"), and read each order's items
and prices from its invoice at
`https://www.amazon.com/gp/css/summary/print.html?orderID=<id>` with
`get_page_text` (wait ~3s after navigating, or you'll read the previous page).
Invoice quantities can undercount substituted items — treat them as
approximate. Update `staples` (bought in 3+ of the last 5) and `brands`,
push the profile (see "Household profile"), and tell the user what changed.

## 6. Wrap up

- Make sure the final order is pushed, then point them to
  `https://coopy-nu.vercel.app/orders` (it asks for the family passcode once
  per browser). Mention the local order file too.
- Offer to save any URL/one-off meals that worked into coopy (see step 1 for
  how, in or out of the repo).
- If they corrected a preference (new brand, new staple, "the kid eats more
  now"), update household.yaml and push it so next week starts smarter, on
  either machine.
- Close any browser tabs you opened.

## 7. After delivery — check what came

Run this when the user says the groceries arrived, asks to "check the
delivery", or opens /weekly-shop and the newest order is `ordered` with a
delivery date in the past (offer it first, before planning a new week).

1. Find the order id in the order's `checkout`. In Chrome, read the final
   invoice at `https://www.amazon.com/gp/css/summary/print.html?orderID=<id>`
   with `get_page_text` (wait ~3s after navigating). Then read the order
   details page `https://www.amazon.com/gp/your-account/order-details?orderID=<id>`
   — that's where substitutions ("Replaced with…"), items not delivered and
   refunds are listed; the invoice alone can hide them. If the invoice still
   shows estimated amounts, the order hasn't been finalized yet: say so and
   stop.
2. Match each invoice line to an item in the order (titles drift — match on
   brand + product, and ask if two lines could be the same thing). For every
   item, set `delivered`: `status`, `qty`, `price`, `total` from the invoice,
   and `as` for a substitution. An item that never came is `missing` with
   `total: 0`. Don't touch the carted `price`/`qty` — the difference is the
   point.
3. Set `checkout.charged` to the final amount charged and
   `checkout.delivered_at`, set `status: delivered`, append a log line ("Final
   271.02 USD vs 275.18 at checkout; 2 substituted, 1 missing"), and push the
   order.
4. Tell the user, briefly: final charge vs checkout total, each substitution
   (and whether it still works for the meal it was for), what's missing, and
   any refund Amazon shows. Ask whether a missing item needs replacing before
   the meal it was for.
5. Learn from it, with the user's OK: a substitution they didn't like or a
   product that went missing two weeks running → a `brands` note in
   household.yaml ("Mary's thighs often out — cart 365 Organic first"); a
   weighted item that came heavier/lighter than asked → adjust how much to
   cart next time. Push the profile.

When building a new list (step 2), use the last delivered `price` for each
product as the expected price, and skip carting a product that came
`missing` last week without asking.
