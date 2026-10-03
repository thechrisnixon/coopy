import { guard, json, message, readBlob, readJsonBody, writeBlob } from './_lib/private.js'

/**
 * The household profile the /weekly-shop skill shops from (who eats, dietary
 * needs, staples, brands, tip). Private: passcode-gated, stored in a private
 * Blob store, never in the repo or the build.
 *
 *   GET → the profile JSON
 *   PUT → store any JSON object (capped at ~100 KB)
 */

const PATH = 'household.json'

export default async function handler(request: Request): Promise<Response> {
  const denied = guard(request)
  if (denied) return denied

  try {
    if (request.method === 'GET') {
      const profile = await readBlob(PATH)
      return profile ? json(profile) : json({ error: 'No household profile stored yet.' }, 404)
    }

    if (request.method === 'PUT') {
      const body = await readJsonBody(request)
      if (!body.ok) return body.response
      const value = body.value
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return json({ error: 'The profile must be a JSON object.' }, 400)
      }
      await writeBlob(PATH, value)
      return json(value)
    }

    return json({ error: 'GET or PUT only' }, 405)
  } catch (err) {
    return json({ error: message(err) }, 502)
  }
}
