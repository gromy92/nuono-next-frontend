import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname

function read(path) {
  const filePath = join(root, path)
  if (!existsSync(filePath)) {
    throw new Error(`Expected file to exist: ${path}`)
  }
  return readFileSync(filePath, 'utf8')
}

function assertIncludes(source, needle, label) {
  if (!source.includes(needle)) {
    throw new Error(`${label} should include: ${needle}`)
  }
}

function assertNotIncludes(source, needle, label) {
  if (source.includes(needle)) {
    throw new Error(`${label} should not include: ${needle}`)
  }
}

const sizesTab = read('src/features/product-management/components/ProductSizesTab.tsx')
const specTable = read('src/features/product-management/components/ProductVariantSpecTable.tsx')
const productApi = read('src/features/product-management/api.ts')
const listCells = read('src/features/product-management/components/ProductListIdentityCells.tsx')
const workspace = read('src/features/product-management/useProductManagementWorkspace.tsx')
const modals = read('src/features/product-management/ProductManagementWorkspaceModals.tsx')
const workbenchTypes = read('src/features/product-management/types/workbench.ts')

assertNotIncludes(sizesTab, 'ProductVariantSpecTable', 'ProductSizesTab')
assertNotIncludes(sizesTab, '规格 / 箱规', 'ProductSizesTab')

assertIncludes(listCells, 'openProductVariantSpecModal', 'Product list spec action')
assertIncludes(listCells, '规格', 'Product list spec action')
assertIncludes(workspace, 'openProductVariantSpecModal', 'Product management workspace')
assertIncludes(modals, 'ProductVariantSpecModal', 'Product management modals')

assertIncludes(specTable, '规格已保存', 'ProductVariantSpecTable')
assertIncludes(specTable, 'fetchProductVariantSpecs', 'ProductVariantSpecTable')
assertIncludes(specTable, 'saveProductVariantSpec', 'ProductVariantSpecTable')
assertIncludes(specTable, 'setLoading(false)', 'ProductVariantSpecTable loading reset')
assertNotIncludes(specTable, 'publish-current', 'ProductVariantSpecTable')
assertIncludes(specTable, 'product-spec-layout-row', 'ProductVariantSpecTable compact layout')
assertIncludes(specTable, '产品规格', 'ProductVariantSpecTable compact layout')
assertIncludes(specTable, '箱规', 'ProductVariantSpecTable compact layout')
assertIncludes(specTable, '物流属性', 'ProductVariantSpecTable compact layout')
assertIncludes(specTable, 'savedKey', 'ProductVariantSpecTable save feedback')
assertIncludes(specTable, '已保存', 'ProductVariantSpecTable save feedback')
assertNotIncludes(specTable, '<Table', 'ProductVariantSpecTable compact layout')
assertNotIncludes(specTable, "title: 'SKU'", 'ProductVariantSpecTable compact layout')

assertIncludes(productApi, '/api/product-variant-specs', 'product management API')
assertIncludes(productApi, 'export async function fetchProductVariantSpecs', 'product management API')
assertIncludes(productApi, 'export async function saveProductVariantSpec', 'product management API')
assertIncludes(productApi, "import { apiFetch } from '../../shared/api'", 'product management API auth headers')
assertIncludes(productApi, 'const response = await apiFetch(`/api/product-variant-specs?', 'product management API auth headers')
assertIncludes(productApi, 'const response = await apiFetch(url, {', 'product management API auth headers')
assertNotIncludes(productApi, '/api/product-master/variant-specs', 'product management API')
assertNotIncludes(productApi, 'variant-specs/publish', 'product management API')

assertIncludes(workbenchTypes, 'ProductVariantSpecPayload', 'product management workbench types')
assertIncludes(workbenchTypes, 'batteryMagneticType', 'product management workbench types')
assertIncludes(workbenchTypes, 'liquidPowderType', 'product management workbench types')

console.log('product variant spec contract check passed')
