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

const client = new Anthropic() // reads ANTHROPIC_API_KEY from the environment

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

export default async function handler(request: Request): Promise<Response> {
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
    const response = await client.messages.parse({
      model: 'claude-opus-5',
      max_tokens: 16000,
      system: SYSTEM,
      messages: [{ role: 'user', content }],
      output_config: { format: zodOutputFormat(ParsedRecipe) },
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

/** Strip a page down to something worth spending tokens on. */
async function fetchReadable(url: string): Promise<string> {
  const parsed = new URL(url)
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Only http(s) URLs are supported.')
  }

  const res = await fetch(parsed, {
    headers: { 'user-agent': 'coopy-recipe-parser' },
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)

  const html = await res.text()
  const text = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()

  // Recipe pages bury the content in navigation and comments; a generous slice
  // from the top reliably contains the ingredients and method.
  return text.slice(0, 40_000)
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
