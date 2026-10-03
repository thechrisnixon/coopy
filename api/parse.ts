import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'

/**
 * Parses a recipe out of a photo, a link, or pasted text.
 *
 * This runs server-side specifically so the Anthropic key stays in a Vercel
 * env var — it is never shipped to the browser and never committed. The
 * browser posts the source material here and gets structured JSON back.
 */

/**
 * Constructed lazily, inside the handler. The SDK constructor throws when no
 * API key resolves, and at module scope that throw happens at import time —
 * crashing the whole function before any of our error handling runs, so the
 * caller gets Vercel's HTML error page instead of a usable message.
 */
function getClient(): Anthropic {
  return new Anthropic()
}

/**
 * Sources are returned as an array with an explicit `key` rather than a keyed
 * object: structured outputs don't support open-ended record schemas, and the
 * client turns this back into the `sources:` map when it writes the YAML.
 */
const ParsedRecipe = z.object({
  name: z.string(),
  serves: z.number().nullable(),
  tags: z.array(z.string()),
  time: z.object({
    prep: z.string().nullable(),
    cook: z.string().nullable(),
    total: z.string().nullable(),
  }),
  sources: z.array(
    z.object({
      key: z.string(),
      name: z.string(),
      url: z.string().nullable(),
      role: z.string().nullable(),
    }),
  ),
  ingredients: z.array(
    z.object({
      qty: z.string().nullable(),
      unit: z.string().nullable(),
      item: z.string(),
      from: z.string().nullable(),
      note: z.string().nullable(),
      group: z.string().nullable(),
      discrete: z.boolean(),
    }),
  ),
  steps: z.array(z.string()),
  notes: z.string().nullable(),
})

const SYSTEM = `You extract recipes into structured data for a family recipe archive.

Rules that matter:

- Record quantities EXACTLY as the source writes them, at 1X — one batch, as
  written. Never convert, never scale, never normalize to per-serving. If the
  source says "1 lb", return qty "1" and unit "lb".
- Fractions stay as written: "1 1/2" or "1½", not 1.5.
- Set "discrete": true for things that cannot be halved — eggs, bay leaves,
  whole onions, garlic cloves, cans. Everything else is false.
- "serves" is how many people one batch feeds. Null if the source doesn't say.
  Never guess a number the source doesn't support.
- Use "group" only when the source itself separates sections ("For the sauce",
  "To serve"). Otherwise null.
- Put method in "steps", one step per array entry, in order. Preserve any
  technique detail that sounds deliberate or unusual — that detail is usually
  the whole reason the recipe is worth keeping.
- "notes" is for storage, make-ahead, substitutions, and any handwritten
  marginalia visible on a photographed card. Null if there's nothing.
- Return exactly one source, keyed "a", describing where this came from.

Transcribe only what is actually present. Do not invent ingredients, times, or
steps to fill out the shape. If a quantity is genuinely illegible, use null for
qty and say so in the item text.`

async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'POST only' }, 405)
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return json({ error: 'ANTHROPIC_API_KEY is not configured on the server.' }, 500)
  }

  let body: { image?: string; mediaType?: string; url?: string; text?: string }
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Body must be JSON.' }, 400)
  }

  let content: Anthropic.ContentBlockParam[]

  try {
    if (body.image) {
      // Accept either a bare base64 payload or a full data: URL.
      const data = body.image.includes(',') ? body.image.split(',')[1] : body.image
      const mediaType = (body.mediaType ?? 'image/jpeg') as
        | 'image/jpeg'
        | 'image/png'
        | 'image/gif'
        | 'image/webp'

      content = [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
        {
          type: 'text',
          text: 'Transcribe the recipe in this image. Name the source after whatever the card or page identifies itself as; if nothing identifies it, call it "Photographed recipe".',
        },
      ]
    } else if (body.url) {
      const page = await fetchReadable(body.url)
      content = [
        {
          type: 'text',
          text: `Extract the recipe from this page. Source url is ${body.url} — use it, and name the source after the site or author.\n\n${page}`,
        },
      ]
    } else if (body.text) {
      content = [
        {
          type: 'text',
          text: `Extract the recipe from this text. Name the source "Pasted text" unless the text identifies itself.\n\n${body.text}`,
        },
      ]
    } else {
      return json({ error: 'Provide one of: image, url, text.' }, 400)
    }
  } catch (err) {
    return json({ error: `Could not read the source: ${message(err)}` }, 400)
  }

  try {
    const response = await getClient().messages.parse({
      model: 'claude-opus-5',
      max_tokens: 16000,
      system: SYSTEM,
      messages: [{ role: 'user', content }],
      output_config: {
        format: zodOutputFormat(ParsedRecipe),
        // Transcription against an explicit schema isn't a deep-reasoning
        // task, and this runs inside a serverless request budget — medium
        // keeps it comfortably inside the function's time limit.
        effort: 'medium',
      },
    })

    if (response.stop_reason === 'refusal') {
      return json({ error: 'The request was declined.' }, 422)
    }

    // parsed_output is null when the model couldn't satisfy the schema — for a
    // photo that usually means it isn't a recipe at all.
    if (!response.parsed_output) {
      return json(
        { error: "Couldn't read a recipe out of that. Try a clearer photo?" },
        422,
      )
    }

    return json({ recipe: response.parsed_output })
  } catch (err) {
    return json({ error: message(err) }, 502)
  }
}

// Named method export: Vercel's Node runtime calls a default export as a
// Node (req, res) handler, which never ends when it returns a Response.
export const POST = handler

/** Strip a page down to something worth spending tokens on. */
async function fetchReadable(url: string): Promise<string> {
  const parsed = new URL(url)
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Only http(s) URLs are supported.')
  }

  const res = await fetch(parsed, {
    // Serious Eats and Allrecipes answer a bare user-agent with 402 and a
    // 612-byte stub; they only serve the page to something that looks like a
    // real navigation. Verified against both — the full set is load-bearing,
    // not cargo cult.
    headers: {
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'accept-language': 'en-US,en;q=0.9',
      'sec-ch-ua': '"Chromium";v="120", "Not(A:Brand";v="24"',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'upgrade-insecure-requests': '1',
    },
    signal: AbortSignal.timeout(15_000),
  })
  // Serious Eats and Allrecipes answer requests they judge non-human with 402
  // (and 403/429 elsewhere). Datacenter IPs — which is what this runs on —
  // get flagged readily, so say plainly what to do instead of leaking a
  // status code the reader can't act on.
  if (res.status === 402 || res.status === 403 || res.status === 429) {
    throw new Error(
      `${parsed.hostname} blocks automated requests (HTTP ${res.status}). ` +
        `Open the page, copy the recipe, and use the Text tab instead — that always works.`,
    )
  }
  if (!res.ok) throw new Error(`the site returned ${res.status} ${res.statusText}`)

  const html = await res.text()

  // Most recipe sites publish schema.org Recipe as JSON-LD. When it's there
  // it's already structured, an order of magnitude smaller than the page, and
  // free of navigation and comment noise — better input and a much faster call.
  const jsonLd = extractRecipeJsonLd(html)
  if (jsonLd) return `schema.org Recipe metadata from the page:\n\n${jsonLd}`

  const text = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()

  if (!text) throw new Error('the page had no readable text')

  // Recipe pages bury the content in navigation and comments; a generous slice
  // from the top reliably contains the ingredients and method.
  return text.slice(0, 40_000)
}

/** Pull a schema.org Recipe object out of a page's JSON-LD, if present. */
export function extractRecipeJsonLd(html: string): string | null {
  const blocks = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )

  for (const [, raw] of blocks) {
    let data: unknown
    try {
      data = JSON.parse(raw.trim())
    } catch {
      continue // one malformed block shouldn't abandon the whole page
    }

    // JSON-LD arrives as a bare object, an array, or wrapped in an @graph.
    const candidates: unknown[] = []
    const collect = (node: unknown) => {
      if (Array.isArray(node)) node.forEach(collect)
      else if (node && typeof node === 'object') {
        candidates.push(node)
        const graph = (node as { '@graph'?: unknown })['@graph']
        if (graph) collect(graph)
      }
    }
    collect(data)

    for (const node of candidates) {
      const type = (node as { '@type'?: unknown })['@type']
      const types = Array.isArray(type) ? type : [type]
      if (types.includes('Recipe')) {
        // Keep only the fields we map, so a page's unrelated metadata doesn't
        // ride along into the prompt.
        const r = node as Record<string, unknown>
        const picked = Object.fromEntries(
          [
            'name',
            'recipeYield',
            'prepTime',
            'cookTime',
            'totalTime',
            'recipeIngredient',
            'recipeInstructions',
            'recipeCategory',
            'recipeCuisine',
            'keywords',
            'description',
          ]
            .filter((k) => r[k] !== undefined)
            .map((k) => [k, r[k]]),
        )
        return JSON.stringify(picked, null, 1).slice(0, 40_000)
      }
    }
  }

  return null
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}
