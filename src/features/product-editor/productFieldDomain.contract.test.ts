import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  productFieldDomainStatusMeta,
  type ProductFieldDomainKey,
  type ProductFieldDomainStatus
} from './productFieldDomain'

const domainKeys = ['main', 'content', 'grouping', 'attributes', 'site'] satisfies ProductFieldDomainKey[]
assert.deepEqual(domainKeys, ['main', 'content', 'grouping', 'attributes', 'site'])

const statusMeta = Object.fromEntries(
  (['synced', 'draft', 'attention', 'blocked'] satisfies ProductFieldDomainStatus[])
    .map((status) => [status, productFieldDomainStatusMeta(status)])
)
assert.deepEqual(statusMeta, {
  synced: { color: 'success', label: '已跟随基线' },
  draft: { color: 'processing', label: '本地已改' },
  attention: { color: 'warning', label: '仍需补齐' },
  blocked: { color: 'error', label: '当前不可发布' }
})

const moduleSource = readFileSync('src/features/product-editor/productFieldDomain.ts', 'utf8')
assert.doesNotMatch(
  moduleSource,
  /product-management|product-listing/,
  'product field domains must remain a leaf editor Module'
)
assert.doesNotMatch(
  readFileSync('src/features/product-management/types/workbench.ts', 'utf8'),
  /export type ProductFieldDomain|export type ProductWorkbenchFieldSurface/,
  'Workbench must consume rather than redefine editor field domains'
)
assert.doesNotMatch(
  readFileSync('src/features/product-management/utils/status.ts', 'utf8'),
  /productFieldDomainStatusMeta/,
  'product-management status utilities must not retain an editor status Adapter'
)
assert.equal(
  existsSync('src/features/product-management/components/ProductFieldDomainSectionHeader.tsx'),
  false,
  'the unused field domain header must remain deleted'
)

for (const filePath of sourceFiles('src/features/product-management').concat(sourceFiles('src/features/product-listing'))) {
  const source = readFileSync(filePath, 'utf8')
  if (!/\b(?:ProductFieldDomain(?:Key|Status|Surface)|ProductWorkbenchFieldSurface|productFieldDomainStatusMeta)\b/.test(source)) {
    continue
  }
  assert.match(
    source,
    /product-editor\/productFieldDomain/,
    `${filePath} must use the product editor field-domain Seam`
  )
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = join(directory, entry.name)
    if (entry.isDirectory()) {
      return sourceFiles(filePath)
    }
    return /\.(?:ts|tsx)$/.test(entry.name) ? [filePath] : []
  })
}
