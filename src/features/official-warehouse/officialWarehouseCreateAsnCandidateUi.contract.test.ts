import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const currentDir = dirname(fileURLToPath(import.meta.url))
const pageSource = readFileSync(join(currentDir, 'OfficialWarehousePage.tsx'), 'utf8')
const styleSource = readFileSync(join(currentDir, 'OfficialWarehousePage.css'), 'utf8')

const candidateColumnsSource = pageSource.slice(
  pageSource.indexOf('const candidateColumns'),
  pageSource.indexOf('const lineColumns')
)

const candidateTableSource = pageSource.slice(
  pageSource.indexOf('<Table\n            rowKey="productVariantId"'),
  pageSource.indexOf('locale={{\n              emptyText:', pageSource.indexOf('<Table\n            rowKey="productVariantId"'))
)

assert.match(
  candidateColumnsSource,
  /className="official-warehouse-product-cell official-warehouse-product-cell--candidate"/,
  'candidate rows should use the larger candidate product image layout'
)

assert.match(candidateColumnsSource, /width=\{60\}/, 'candidate product images should render at 60px')
assert.match(candidateColumnsSource, /height=\{60\}/, 'candidate product images should render at 60px')
assert.match(candidateColumnsSource, /preview=\{\{ mask: '查看大图' \}\}/, 'candidate product images should open preview on click')
assert.doesNotMatch(
  candidateColumnsSource,
  /<Text type="secondary">\{row\.partnerSku \|\| row\.skuParent\}<\/Text>/,
  'candidate product details should not repeat the raw product code above PSKU'
)

assert.match(candidateColumnsSource, /title: 'Noon SKU'[\s\S]*?width: 260/, 'Noon SKU column should be wider')
assert.match(candidateColumnsSource, /批次可用 \{batchLimit\}/, 'batch available quantity should be shown in Noon SKU column')
assert.doesNotMatch(
  candidateColumnsSource,
  /maxQuantity \? <Text type="secondary">批次可用/,
  'quantity column should not show batch available quantity'
)
assert.match(candidateTableSource, /pagination=\{false\}/, 'candidate table should not paginate')

assert.match(
  styleSource,
  /\.official-warehouse-product-cell--candidate \{[\s\S]*?grid-template-columns: 60px minmax\(0, 1fr\);/,
  'candidate product cell should reserve 60px for product image'
)
assert.match(
  styleSource,
  /\.official-warehouse-product-cell--candidate \.official-warehouse-image-placeholder \{[\s\S]*?width: 60px;[\s\S]*?height: 60px;/,
  'candidate product placeholder should match 60px image size'
)
