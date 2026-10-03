import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'

/**
 * One-time migration (safe to re-run): push local orders/*.yaml and
 * shopping/household.yaml to the private storage behind /api/orders and
 * /api/household.
 *
 *   pnpm push-private
 *
 * Passcode: env COOPY_PASSCODE, else ~/.coopy/passcode.
 * Target:   env COOPY_URL, else the live site.
 */

const BASE = (process.env.COOPY_URL ?? 'https://coopy-nu.vercel.app').replace(/\/$/, '')
const root = process.cwd()

function passcode(): string {
  const fromEnv = process.env.COOPY_PASSCODE?.trim()
  if (fromEnv) return fromEnv
  const file = join(homedir(), '.coopy', 'passcode')
  if (existsSync(file)) {
    const value = readFileSync(file, 'utf8').trim()
    if (value) return value
  }
  console.error('No passcode: set COOPY_PASSCODE or write it to ~/.coopy/passcode.')
  process.exit(1)
}

/**
 * Parse a YAML file, reporting only the location of a syntax error — the
 * parser's own message quotes the offending line, and these files are private.
 */
function readYaml(path: string, label: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: parseYaml(readFileSync(path, 'utf8')) }
  } catch (err) {
    const pos = (err as { linePos?: { line: number; col: number }[] }).linePos?.[0]
    const where = pos ? ` at line ${pos.line}, column ${pos.col}` : ''
    const code = (err as { code?: string }).code ?? 'parse error'
    console.error(`  FAIL ${label} is not valid YAML${where} (${code}). Quote any value containing ": ".`)
    return { ok: false }
  }
}

async function putJson(path: string, body: unknown, key: string): Promise<boolean> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', 'x-coopy-passcode': key },
      body: JSON.stringify(body),
    })
  } catch (err) {
    console.error(`  FAIL ${path} → ${err instanceof Error ? err.message : err}`)
    return false
  }
  if (res.ok) {
    console.log(`  ok   ${path}`)
    return true
  }
  // Print the server's error, never the body we sent (it's private).
  const text = await res.text()
  let detail = text.slice(0, 500)
  try {
    detail = JSON.stringify(JSON.parse(text))
  } catch {
    // not JSON — keep the raw slice
  }
  console.error(`  FAIL ${path} → ${res.status} ${detail}`)
  return false
}

async function main() {
  const key = passcode()
  let failed = 0
  console.log(`Pushing to ${BASE}`)

  const household = join(root, 'shopping', 'household.yaml')
  if (existsSync(household)) {
    const doc = readYaml(household, 'shopping/household.yaml')
    if (!doc.ok || !(await putJson('/api/household', doc.value, key))) failed++
  } else {
    console.log('  skip shopping/household.yaml (not found)')
  }

  const dir = join(root, 'orders')
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => /^\d{4}-\d{2}-\d{2}\.yaml$/.test(f)) : []
  if (!files.length) console.log('  skip orders/ (no YYYY-MM-DD.yaml files)')
  for (const file of files.sort()) {
    const id = file.replace(/\.yaml$/, '')
    const doc = readYaml(join(dir, file), `orders/${file}`)
    if (!doc.ok || !(await putJson(`/api/orders?id=${id}`, doc.value, key))) failed++
  }

  if (failed) {
    console.error(`${failed} upload(s) failed.`)
    process.exit(1)
  }
  console.log('Done.')
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
