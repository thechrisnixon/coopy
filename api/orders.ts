import { Order } from '../src/lib/order.js'
import { guard, json, listPathnames, message, readBlob, readJsonBody, writeBlob } from './_lib/private.js'

/**
 * Weekly shopping orders, written by the /weekly-shop skill and read by the
 * /orders page. Private: every request needs the family passcode in
 * `x-coopy-passcode`, and the data lives in a private Blob store.
 *
 *   GET            → every order, newest first, each `{ id, ...order }`
 *   GET ?id=DATE   → one order
 *   PUT ?id=DATE   → validate against the Order schema, store, return it
 */

const ID = /^\d{4}-\d{2}-\d{2}$/
const pathFor = (id: string) => `orders/${id}.json`

async function handler(request: Request): Promise<Response> {
  const denied = guard(request)
  if (denied) return denied

  const id = new URL(request.url).searchParams.get('id')
  if (id !== null && !ID.test(id)) {
    return json({ error: 'id must be a date, YYYY-MM-DD.' }, 400)
  }

  try {
    if (request.method === 'GET') {
      if (id) {
        const order = await readBlob(pathFor(id))
        return order ? json({ id, ...(order as object) }) : json({ error: 'No order with that id.' }, 404)
      }

      const ids = (await listPathnames('orders/'))
        .map((p) => p.match(/^orders\/(\d{4}-\d{2}-\d{2})\.json$/)?.[1])
        .filter((x): x is string => !!x)
        .sort()
        .reverse()
      const orders = await Promise.all(
        ids.map(async (pid) => {
          const order = await readBlob(pathFor(pid))
          return order ? { id: pid, ...(order as object) } : null
        }),
      )
      return json(orders.filter(Boolean))
    }

    if (request.method === 'PUT') {
      if (!id) return json({ error: 'PUT needs ?id=YYYY-MM-DD.' }, 400)

      const body = await readJsonBody(request, 1024 * 1024)
      if (!body.ok) return body.response

      // An `id` in the body is redundant with the query string; drop it so
      // the stored document is just the order.
      const raw = body.value
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        delete (raw as Record<string, unknown>).id
      }
      const parsed = Order.safeParse(raw)
      if (!parsed.success) {
        return json({ error: 'Not a valid order.', issues: parsed.error.issues }, 400)
      }

      await writeBlob(pathFor(id), parsed.data)
      return json({ id, ...parsed.data })
    }

    return json({ error: 'GET or PUT only' }, 405)
  } catch (err) {
    return json({ error: message(err) }, 502)
  }
}

// Vercel's Node runtime only treats NAMED method exports as web-style
// (Request → Response) handlers; a default export is called as a Node
// (req, res) handler and never ends, which times the function out.
export const GET = handler
export const PUT = handler
