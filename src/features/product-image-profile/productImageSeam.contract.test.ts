import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const oldRolePath = 'src/features/product-management/types/productImageRole.ts'
const oldRequirementsPath = 'src/features/product-management/utils/noonImageRequirements.ts'

assert.equal(existsSync(oldRolePath), false, 'product-management must not retain a product image role Adapter')
assert.equal(
  existsSync(oldRequirementsPath),
  false,
  'product-management must not retain a Noon listing image requirements Adapter'
)

const callers = [
  'src/features/product-listing/productDetailAdapter.ts',
  'src/features/product-listing/types.ts',
  'src/features/product-editor/productDetailEditorTypes.ts',
  'src/features/product-management/components/ProductImageManagerDrawer.tsx',
  'src/features/product-management/components/ProductImagesPanel.tsx',
  'src/features/product-management/components/productImageManagerState.ts'
]

callers.forEach((filePath) => {
  const source = readFileSync(filePath, 'utf8')
  assert.doesNotMatch(
    source,
    /product-management\/(?:types\/productImageRole|utils\/noonImageRequirements)|\.\.\/(?:types\/productImageRole|utils\/noonImageRequirements)/,
    `${filePath} must use the product-image-profile Seam`
  )
})
