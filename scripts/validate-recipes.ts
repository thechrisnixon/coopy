/**
 * Validates every recipe file before the site builds.
 *
 * Wired into `pnpm build`, so a malformed recipe fails the deploy instead of
 * shipping a broken page — which matters because recipes get committed
 * straight from a phone with no local typecheck in the loop.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { Recipe, checkSourceRefs } from '../src/lib/schema'

const dir = join(import.meta.dirname, '..', 'recipes')
const files = readdirSync(dir).filter((f) => f.endsWith('.yaml'))

let failed = 0

for (const file of files) {
  const problems: string[] = []
  let parsed: unknown

  try {
    parsed = parseYaml(readFileSync(join(dir, file), 'utf8'))
  } catch (err) {
    problems.push(`YAML is malformed: ${err instanceof Error ? err.message : err}`)
  }

  if (!problems.length) {
    const result = Recipe.safeParse(parsed)
    if (!result.success) {
      for (const issue of result.error.issues) {
        problems.push(`${issue.path.join('.') || '(root)'}: ${issue.message}`)
      }
    } else {
      problems.push(...checkSourceRefs(result.data))
    }
  }

  if (problems.length) {
    failed++
    console.error(`\n✗ ${file}`)
    for (const p of problems) console.error(`    ${p}`)
  }
}

if (failed) {
  console.error(`\n${failed} of ${files.length} recipes failed validation.\n`)
  process.exit(1)
}

console.log(`✓ ${files.length} recipes valid`)
