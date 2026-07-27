import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  consumeProductListingReturnNotice,
  PRODUCT_LISTING_PUBLISHED_NOTICE,
  saveProductListingReturnNotice,
  type ProductListingReturnNotice
} from './productListingReturnNotice'
import {
  buildProductListingReturnNotice,
  canOpenPublishedProductDetail
} from './productListingSuccessNavigation'
import type { ProductListingWorkflowView } from './types'

const sessionStorage = new Map<string, string>()
;(globalThis as Record<string, unknown>).window = {
  sessionStorage: {
    getItem: (key: string) => sessionStorage.get(key) ?? null,
    setItem: (key: string, value: string) => sessionStorage.set(key, value),
    removeItem: (key: string) => sessionStorage.delete(key)
  }
}

const notice: ProductListingReturnNotice = {
  version: 1,
  mode: 'detail',
  message: PRODUCT_LISTING_PUBLISHED_NOTICE,
  draftId: 7001,
  storeCode: 'STR108065-NSA',
  partnerSku: 'PAPERSAY-7001'
}
assert.equal(saveProductListingReturnNotice(notice), true)
assert.deepEqual(consumeProductListingReturnNotice(), notice)
assert.equal(consumeProductListingReturnNotice(), undefined)
delete (globalThis as Record<string, unknown>).window

const publishedWorkflow: ProductListingWorkflowView = {
  phase: 'PUBLISHED',
  writeCertainty: 'VERIFIED',
  nextAction: 'NONE',
  draft: {
    draftId: 7001,
    storeCode: 'STR108065-NSA',
    status: 'published',
    validationIssues: [],
    draft: {
      draftId: 7001,
      storeCode: 'STR108065-NSA',
      psku: 'PAPERSAY-7001',
      imageUrls: []
    }
  },
  realRunTask: {
    taskId: 8101,
    draftId: 7001,
    storeCode: 'STR108065-NSA',
    partnerSku: 'PAPERSAY-7001',
    skuParent: 'N7001',
    mode: 'REAL_RUN',
    status: 'succeeded',
    validationIssues: []
  }
}
assert.deepEqual(
  buildProductListingReturnNotice(publishedWorkflow, 'detail'),
  {
    ...notice,
    skuParent: 'N7001'
  }
)
assert.equal(canOpenPublishedProductDetail(publishedWorkflow), true)
assert.equal(
  buildProductListingReturnNotice(
    { ...publishedWorkflow, writeCertainty: 'WRITTEN' },
    'list'
  ),
  undefined,
  'return navigation must be available only after verified publication'
)

const returnHookSource = readFileSync(
  new URL('../product-management/hooks/useProductListingReturnNavigation.ts', import.meta.url),
  'utf8'
)
const publishedActionsSource = readFileSync(
  new URL('./ProductListingPublishedActions.tsx', import.meta.url),
  'utf8'
)
assert.ok(
  returnHookSource.includes('{ force: true }') &&
    returnHookSource.includes('openProductWorkbenchInCurrentPage') &&
    publishedActionsSource.includes('返回商品列表') &&
    publishedActionsSource.includes('查看商品'),
  'published return must force-refresh the product list and optionally open the product detail'
)
