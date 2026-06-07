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

const registry = read('src/features/app-shell/WorkspaceMenuRegistry.ts')
const specsPage = read('src/features/product-specs/ProductSpecsPage.tsx')
const operationsConfigVersionsDefinition = registry.match(
  /'operations-config-versions': \{[\s\S]*?\n  \},/
)?.[0]

assertIncludes(registry, "{ type: 'workspace', key: 'operations-config-versions' }", 'operation config sidebar')
if (!operationsConfigVersionsDefinition) {
  throw new Error('operations config versions definition should exist')
}
assertNotIncludes(
  operationsConfigVersionsDefinition,
  "visibleInSidebar: false",
  'operations config versions definition'
)
assertIncludes(registry, "'operations-config-versions',", 'boss operator menu keys')

assertNotIncludes(specsPage, 'const [storeCode, setStoreCode]', 'ProductSpecsPage local store state')
assertNotIncludes(specsPage, 'buildSpecStoreOptions', 'ProductSpecsPage page-level store selector')
assertNotIncludes(specsPage, 'placeholder="店铺"', 'ProductSpecsPage page-level store selector')

console.log('workspace menu contract check passed')
