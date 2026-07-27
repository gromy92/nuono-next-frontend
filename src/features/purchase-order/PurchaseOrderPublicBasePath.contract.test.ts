import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const pageSource = readFileSync(new URL('./PurchaseOrderPage.tsx', import.meta.url), 'utf8')

assert.match(
  pageSource,
  /import \{ withPublicBasePath \} from '\.\.\/\.\.\/runtimePaths'/,
  'purchase-order internal navigations must use the shared public-base-path helper'
)

assert.match(
  pageSource,
  /window\.location\.href = withPublicBasePath\('\/warehouse\/dispatch\?devSession=1&grantPurchase=1&grantWarehouse=1'\)/,
  'shipping-order creation must preserve the deployed /ai public base path'
)

assert.match(
  pageSource,
  /window\.location\.href = withPublicBasePath\(`\/purchase\/1688-collection\?\$\{params\.toString\(\)\}#top5`\)/,
  'Top5 navigation must preserve the deployed /ai public base path'
)

assert.doesNotMatch(
  pageSource,
  /window\.location\.href = ['"`]\/(?:warehouse|purchase)\//,
  'purchase-order page must not assign app-root routes directly to window.location'
)
