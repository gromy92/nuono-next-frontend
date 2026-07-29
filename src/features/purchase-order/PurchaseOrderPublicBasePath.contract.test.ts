import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const pageSource = readFileSync(new URL('./PurchaseOrderPage.tsx', import.meta.url), 'utf8')
const navigationSource = readFileSync(new URL('./model/purchaseOrderNavigation.ts', import.meta.url), 'utf8')
const shippingMergeSource = readFileSync(new URL('./hooks/usePurchaseOrderShippingMerge.ts', import.meta.url), 'utf8')
const purchaseOrderNavigationSource = [pageSource, navigationSource, shippingMergeSource].join('\n')

assert.match(
  purchaseOrderNavigationSource,
  /import \{ withPublicBasePath \} from '\.\.\/\.\.\/\.\.\/runtimePaths'/,
  'purchase-order internal navigations must use the shared public-base-path helper'
)

assert.match(
  purchaseOrderNavigationSource,
  /window\.location\.href = withPublicBasePath\('\/warehouse\/dispatch\?devSession=1&grantPurchase=1&grantWarehouse=1'\)/,
  'shipping-order creation must preserve the deployed /ai public base path'
)

assert.match(
  purchaseOrderNavigationSource,
  /window\.location\.href = withPublicBasePath\([\s\S]*`\/purchase\/1688-collection\?\$\{params\.toString\(\)\}#top5`[\s\S]*\)/,
  'Top5 navigation must preserve the deployed /ai public base path'
)

assert.doesNotMatch(
  purchaseOrderNavigationSource,
  /window\.location\.href = ['"`]\/(?:warehouse|purchase)\//,
  'purchase-order page must not assign app-root routes directly to window.location'
)
