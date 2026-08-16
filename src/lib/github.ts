/**
 * Commits recipe files straight to the repo from the browser.
 *
 * The token is a fine-grained PAT scoped to this one repo with contents:write
 * and nothing else, held in localStorage on your own device. That's a
 * deliberately small blast radius — the worst case is someone writing to a
 * public recipe repo whose entire history is recoverable from git.
 */

const REPO = 'thechrisnixon/coopy'
const BRANCH = 'main'
const TOKEN_KEY = 'coopy.github-token'

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? ''
}

export function setToken(token: string): void {
  if (token) localStorage.setItem(TOKEN_KEY, token.trim())
  else localStorage.removeItem(TOKEN_KEY)
}

type GitHubError = { message?: string }

async function gh(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    ...init,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'x-github-api-version': '2022-11-28',
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
    },
  })
  return res
}

/**
 * Base64 for a UTF-8 string. `btoa` alone throws on any non-Latin-1 character,
 * and recipes are full of them — ½, °, é, —.
 */
function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

export async function commitRecipe(
  slug: string,
  yaml: string,
  token: string,
): Promise<{ url: string }> {
  if (!token) throw new Error('No GitHub token saved.')

  const path = `recipes/${slug}.yaml`

  // An existing file needs its blob sha to overwrite; a new one must not send
  // one at all. A 404 here is the normal case, not a failure.
  let sha: string | undefined
  const existing = await gh(`/contents/${path}?ref=${BRANCH}`, token)
  if (existing.ok) {
    sha = ((await existing.json()) as { sha: string }).sha
  } else if (existing.status !== 404) {
    throw new Error(await describe(existing))
  }

  const res = await gh(`/contents/${path}`, token, {
    method: 'PUT',
    body: JSON.stringify({
      message: sha ? `Update ${slug}` : `Add ${slug}`,
      content: toBase64(yaml),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  })

  if (!res.ok) throw new Error(await describe(res))

  const body = (await res.json()) as { content?: { html_url?: string } }
  return { url: body.content?.html_url ?? `https://github.com/${REPO}/blob/${BRANCH}/${path}` }
}

async function describe(res: Response): Promise<string> {
  let detail = ''
  try {
    detail = ((await res.json()) as GitHubError).message ?? ''
  } catch {
    /* non-JSON error body */
  }

  if (res.status === 401) return 'GitHub rejected the token (401). Is it expired?'
  if (res.status === 403) return `GitHub denied the write (403). Does the token have contents:write on ${REPO}? ${detail}`
  if (res.status === 409) return 'Someone else changed this file first (409). Reload and try again.'
  return `GitHub returned ${res.status}. ${detail}`
}
