import { strict as assert } from 'node:assert'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

function productionSources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      return productionSources(path)
    }
    return /\.(?:ts|tsx)$/u.test(path) && !/(?:\.test|\.spec|\.contract)\.(?:ts|tsx)$/u.test(path)
      ? [path]
      : []
  })
}

assert.equal(
  existsSync('src/features/product-management/utils.ts'),
  false,
  'the shallow product-management utility barrel must stay deleted'
)

for (const path of productionSources('src/features/product-management')) {
  const source = readFileSync(path, 'utf8')
  assert.doesNotMatch(
    source,
    /from ['"](?:\.\/|\.\.\/)utils['"]/,
    `${path} must import the owning Module directly`
  )
}
