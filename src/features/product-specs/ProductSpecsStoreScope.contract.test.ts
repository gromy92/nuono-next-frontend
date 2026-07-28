import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const productSpecsDir = dirname(fileURLToPath(import.meta.url))
const productSpecsPage = [
  'ProductSpecsPage.tsx',
  'components/ProductSpecsWorkbench.tsx',
  'hooks/useProductSpecsController.ts',
  'specDomain.ts'
].map((fileName) => readFileSync(join(productSpecsDir, fileName), 'utf8')).join('\n')

assert.doesNotMatch(productSpecsPage, /const \[storeCode, setStoreCode\]/)
assert.doesNotMatch(productSpecsPage, /buildSpecStoreOptions/)
assert.doesNotMatch(productSpecsPage, /placeholder="店铺"/)
