import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function source(path: string) {
  return readFileSync(join(root, path), 'utf8')
}

const apiSource = source('src/features/product-keywords/api.ts')
const typesSource = source('src/features/product-keywords/types.ts')
const menuSource = source('src/features/app-shell/WorkspaceMenuRegistry.ts')
const lazySource = source('src/features/app-shell/ShellWorkspaceLazyComponents.tsx')
const contentSource = source('src/features/app-shell/ShellWorkspaceContent.tsx')
const routingSource = source('src/features/app-shell/WorkspaceRouting.ts')

assert.match(apiSource, /\/api\/product-keywords/)
assert.match(apiSource, /fetchProductKeywords/)
assert.match(apiSource, /fetchProductKeywordProduct/)
assert.match(apiSource, /addProductKeyword/)
assert.match(apiSource, /updateProductKeyword/)
assert.match(typesSource, /ProductKeywordListRequest/)
assert.match(typesSource, /ProductKeywordCommand/)
assert.match(menuSource, /'operations-product-keywords'/)
assert.match(menuSource, /\/operations\/product-keywords/)
assert.match(lazySource, /ProductKeywordDataPage/)
assert.match(contentSource, /ProductKeywordDataPage/)
assert.match(routingSource, /OPERATIONS_PRODUCT_KEYWORDS_PATH/)
