import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  consumeProductListingReturnNotice,
  PRODUCT_LISTING_REAL_RUN_SUBMITTED_NOTICE,
  saveProductListingReturnNotice
} from './productListingReturnNotice'

const sessionStorage = new Map<string, string>()
;(globalThis as Record<string, unknown>).window = {
  sessionStorage: {
    getItem: (key: string) => sessionStorage.get(key) ?? null,
    setItem: (key: string, value: string) => sessionStorage.set(key, value),
    removeItem: (key: string) => sessionStorage.delete(key)
  }
}

saveProductListingReturnNotice(PRODUCT_LISTING_REAL_RUN_SUBMITTED_NOTICE)

assert.equal(
  consumeProductListingReturnNotice(),
  PRODUCT_LISTING_REAL_RUN_SUBMITTED_NOTICE,
  'product list should display the one-shot listing return notice'
)
assert.equal(
  consumeProductListingReturnNotice(),
  undefined,
  'listing return notice should be removed after the first read'
)

delete (globalThis as Record<string, unknown>).window

const productManagementWorkspaceSource = readFileSync(
  new URL('../product-management/useProductManagementWorkspace.tsx', import.meta.url),
  'utf8'
)
assert(
  productManagementWorkspaceSource.includes('consumeProductListingReturnNotice') &&
    productManagementWorkspaceSource.includes('message.info(notice)'),
  'product management workspace should show the one-shot listing return notice after redirect'
)
