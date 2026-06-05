import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
/**
 * Extract OpenAPI spec without starting the full server.
 * This uses NestJS SwaggerModule to generate the document at build time.
 *
 * Usage:
 *   npx tsx scripts/extract-spec.ts
 *
 * Requires: prisma generate to have been run (for PrismaClient)
 *
 * If the database is not available, use the alternative:
 *   1. Start the server manually: pnpm dev:server
 *   2. Run: pnpm api:generate  (fetches from http://localhost:3000/api-docs-json)
 */
import process from 'node:process'

const SPEC_URL = 'http://localhost:3000/api-docs-json'
const SPEC_FILE = resolve(import.meta.dirname, '../openapi.json')
const OUTPUT_FILE = resolve(import.meta.dirname, '../generated/index.d.ts')

async function generate() {
  // Try fetching from running server
  try {
    const response = await fetch(SPEC_URL)
    if (!response.ok)
      throw new Error(`HTTP ${response.status}`)

    const spec = await response.json()
    writeFileSync(SPEC_FILE, JSON.stringify(spec, null, 2))
    console.log(`✓ Fetched OpenAPI spec from ${SPEC_URL}`)
  }
  catch {
    console.log(`⚠ Server not running at ${SPEC_URL}`)
    console.log(`  Please start the server first: pnpm dev:server`)
    console.log(`  Then re-run: pnpm api:generate`)
    process.exit(1)
  }

  // Generate types using openapi-typescript
  const openapiTS = await import('openapi-typescript')
  const source = new URL(`file://${SPEC_FILE}`)
  const output = await openapiTS.default(source)
  writeFileSync(OUTPUT_FILE, output)
  console.log(`✓ Generated types at ${OUTPUT_FILE}`)
}

generate().catch((err) => {
  console.error('Failed to generate API types:', err)
  process.exit(1)
})
