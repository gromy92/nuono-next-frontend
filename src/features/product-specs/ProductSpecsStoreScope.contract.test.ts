import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const productSpecsPage = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'ProductSpecsPage.tsx'),
  'utf8'
)

assert.doesNotMatch(productSpecsPage, /const \[storeCode, setStoreCode\]/)
assert.doesNotMatch(productSpecsPage, /buildSpecStoreOptions/)
assert.doesNotMatch(productSpecsPage, /placeholder="店铺"/)
