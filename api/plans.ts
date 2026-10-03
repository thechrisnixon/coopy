import { Plan } from '../src/lib/plan.js'
import { guard, json, listPathnames, message, readBlob, readJsonBody, writeBlob } from './_lib/private.js'

/**
 * Weekly shopping plans, written by the /weekly-shop skill and read by the
 * /plans page. Private: every request needs the family passcode in
 * `x-coopy-passcode`, and the data lives in a private Blob store.
 *
 *   GET            → every plan, newest first, each `{ id, ...plan }`
 *   GET ?id=DATE   → one plan
 *   PUT ?id=DATE   → validate against the Plan schema, store, return it
 */

const ID = /^\d{4}-\d{2}-\d{2}$/
const pathFor = (id: string) => `plans/${id}.json`

export default async function handler(request: Request): Promise<Response> {
  const denied = guard(request)
  if (denied) return denied

  const id = new URL(request.url).searchParams.get('id')
  if (id !== null && !ID.test(id)) {
    return json({ error: 'id must be a date, YYYY-MM-DD.' }, 400)
  }

  try {
    if (request.method === 'GET') {
      if (id) {
        const plan = await readBlob(pathFor(id))
        return plan ? json({ id, ...(plan as object) }) : json({ error: 'No plan with that id.' }, 404)
      }

      const ids = (await listPathnames('plans/'))
        .map((p) => p.match(/^plans\/(\d{4}-\d{2}-\d{2})\.json$/)?.[1])
        .filter((x): x is string => !!x)
        .sort()
        .reverse()
      const plans = await Promise.all(
        ids.map(async (pid) => {
          const plan = await readBlob(pathFor(pid))
          return plan ? { id: pid, ...(plan as object) } : null
        }),
      )
      return json(plans.filter(Boolean))
    }

    if (request.method === 'PUT') {
      if (!id) return json({ error: 'PUT needs ?id=YYYY-MM-DD.' }, 400)

      const body = await readJsonBody(request, 1024 * 1024)
      if (!body.ok) return body.response

      // An `id` in the body is redundant with the query string; drop it so
      // the stored document is just the plan.
      const raw = body.value
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        delete (raw as Record<string, unknown>).id
      }
      const parsed = Plan.safeParse(raw)
      if (!parsed.success) {
        return json({ error: 'Not a valid plan.', issues: parsed.error.issues }, 400)
      }

      await writeBlob(pathFor(id), parsed.data)
      return json({ id, ...parsed.data })
    }

    return json({ error: 'GET or PUT only' }, 405)
  } catch (err) {
    return json({ error: message(err) }, 502)
  }
}
