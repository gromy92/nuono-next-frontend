import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { createProductMasterSnapshotPayload } from './productMasterSnapshot'

const moduleSource = readFileSync('src/features/product-domain/productMasterSnapshot.ts', 'utf8')
assert.doesNotMatch(moduleSource, /product-management/, 'product master snapshot must remain a leaf domain Module')

const sourceIdentity = {
  partnerSku: 'CASE-NEW-001',
  nested: { value: 'source' }
}
const snapshot = createProductMasterSnapshotPayload({
  mode: 'listing-draft',
  message: 'draft',
  identity: sourceIdentity,
  content: {
    titleEn: 'Rugged phone case'
  },
  group: {
    groupRef: 'GROUP-1'
  },
  missingOperationalKeys: [' pricing ', '']
})

assert.equal(snapshot.mode, 'listing-draft')
assert.equal(snapshot.ready, true)
assert.equal(snapshot.message, 'draft')
assert.equal(snapshot.identity.partnerSku, 'CASE-NEW-001')
assert.equal(snapshot.content.titleEn, 'Rugged phone case')
assert.deepEqual(snapshot.warnings, [])
assert.deepEqual(snapshot.missingCoreTables, [])
assert.deepEqual(snapshot.storeContext, {})
assert.deepEqual(snapshot.taxonomy, {})
assert.deepEqual(snapshot.platformSignals, {})
assert.deepEqual(snapshot.keyAttributes, [])
assert.deepEqual(snapshot.group, { axes: [], groupRef: 'GROUP-1' })
assert.deepEqual(snapshot.variants, [])
assert.deepEqual(snapshot.pricing, {})
assert.deepEqual(snapshot.stock, {})
assert.deepEqual(snapshot.siteOffers, [])
assert.deepEqual(snapshot.missingOperationalKeys, ['pricing'])

sourceIdentity.nested.value = 'mutated'
assert.deepEqual(snapshot.identity.nested, { value: 'source' }, 'snapshot records must be deeply cloned')

const defaults = createProductMasterSnapshotPayload()
assert.equal('degraded' in defaults, false)
assert.equal('missingOperationalKeys' in defaults, false)

const explicitOptionalValues = createProductMasterSnapshotPayload({
  degraded: false,
  group: { axes: ['colour'] },
  keyAttributes: [null, 'invalid', { code: 'base_material' }] as unknown as Array<Record<string, unknown>>
})
assert.equal(explicitOptionalValues.degraded, false)
assert.deepEqual(explicitOptionalValues.group.axes, ['colour'])
assert.deepEqual(explicitOptionalValues.keyAttributes, [{ code: 'base_material' }])

assert.equal(
  existsSync('src/features/product-management/utils/productMasterSnapshotFactory.ts'),
  false,
  'product-management must not retain a snapshot factory Adapter'
)
assert.doesNotMatch(
  readFileSync('src/features/product-management/types/workbench.ts', 'utf8'),
  /export type ProductMasterSnapshotPayload/,
  'workbench types must consume rather than redefine the snapshot Interface'
)
assert.doesNotMatch(
  readFileSync('src/features/product-management/utils.ts', 'utf8'),
  /productMasterSnapshotFactory/,
  'product-management utils barrel must not re-export the deleted factory'
)
assert.doesNotMatch(
  readFileSync('src/features/product-management/utils/common.ts', 'utf8'),
  /snapshotPayloadCore|cloneSnapshotPayload/,
  'product-management common utilities must not retain shallow snapshot Adapters'
)

for (const filePath of sourceFiles('src/features/product-management').concat(sourceFiles('src/features/product-listing'))) {
  const source = readFileSync(filePath, 'utf8')
  if (!source.includes('ProductMasterSnapshotPayload')) {
    continue
  }
  assert.match(
    source,
    /product-domain\/productMasterSnapshot/,
    `${filePath} must use the product master snapshot Seam`
  )
  assert.doesNotMatch(
    source,
    /productMasterSnapshotFactory/,
    `${filePath} must not use the deleted snapshot factory Module`
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
