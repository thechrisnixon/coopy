import { createHash, timingSafeEqual } from 'node:crypto'
import { get, list, put } from '@vercel/blob'

/**
 * Shared plumbing for the passcode-gated private data: weekly orders and the
 * household profile. The repo and the site are public, so this data lives in
 * a PRIVATE Vercel Blob store and is only ever read server-side — blob URLs
 * are never handed to a client, and private blobs can't be fetched without
 * the store token anyway.
 *
 * Lives under `api/_lib/` so Vercel doesn't deploy it as a function of its
 * own (underscore-prefixed paths are skipped, and it's outside `api/*.ts`).
 */

/** Max accepted request body, in bytes. */
export const MAX_BODY = 100 * 1024

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      // Private data: never let a CDN or browser cache hold on to it.
      'cache-control': 'no-store',
    },
  })
}

export function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/**
 * Returns an error Response when the request may not proceed, or null when
 * it's authorised. Checks configuration first so a misconfigured deploy says
 * so plainly instead of rejecting every passcode.
 */
export function guard(request: Request): Response | null {
  const expected = process.env.COOPY_PASSCODE
  if (!expected) {
    return json({ error: 'COOPY_PASSCODE is not configured on the server.' }, 500)
  }
  // Either a classic read-write token (set when a Blob store is connected to
  // the project) or an OIDC store id — the SDK resolves both.
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
    return json(
      { error: 'Blob storage is not configured on the server (connect a Blob store to set BLOB_READ_WRITE_TOKEN).' },
      500,
    )
  }
  const given = request.headers.get('x-coopy-passcode') ?? ''
  if (!passcodeMatches(given, expected)) {
    return json({ error: 'Wrong or missing passcode.' }, 401)
  }
  return null
}

/**
 * Constant-time comparison. Hashing both sides first gives equal-length
 * buffers, so a length mismatch neither throws in timingSafeEqual nor leaks
 * the passcode's length through an early return.
 */
function passcodeMatches(given: string, expected: string): boolean {
  const a = createHash('sha256').update(given).digest()
  const b = createHash('sha256').update(expected).digest()
  return timingSafeEqual(a, b)
}

/** Read a JSON body with a hard size cap. */
export async function readJsonBody(
  request: Request,
  max = MAX_BODY,
): Promise<{ ok: true; value: unknown } | { ok: false; response: Response }> {
  const declared = Number(request.headers.get('content-length') ?? 0)
  if (declared > max) {
    return { ok: false, response: json({ error: `Body is larger than ${max} bytes.` }, 413) }
  }
  const text = await request.text()
  if (new TextEncoder().encode(text).length > max) {
    return { ok: false, response: json({ error: `Body is larger than ${max} bytes.` }, 413) }
  }
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch {
    return { ok: false, response: json({ error: 'Body must be JSON.' }, 400) }
  }
}

/** Read one JSON blob by pathname; null when it doesn't exist. */
export async function readBlob(pathname: string): Promise<unknown> {
  // useCache: false — a spouse's edit should show up on the next load, not
  // whenever the CDN copy expires.
  const res = await get(pathname, { access: 'private', useCache: false })
  if (!res || res.statusCode !== 200) return null
  return JSON.parse(await new Response(res.stream).text())
}

export async function writeBlob(pathname: string, value: unknown): Promise<void> {
  await put(pathname, JSON.stringify(value, null, 1), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  })
}

/** Every pathname under a prefix, following pagination. */
export async function listPathnames(prefix: string): Promise<string[]> {
  const out: string[] = []
  let cursor: string | undefined
  do {
    const page = await list({ prefix, cursor })
    out.push(...page.blobs.map((b) => b.pathname))
    cursor = page.hasMore ? page.cursor : undefined
  } while (cursor)
  return out
}
