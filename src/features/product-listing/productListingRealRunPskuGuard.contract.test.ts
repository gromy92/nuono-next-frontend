import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const pageSource = readFileSync(new URL('./ProductListingPage.tsx', import.meta.url), 'utf8')

assert(
  pageSource.includes('PRODUCT_LISTING_REAL_RUN_PSKU_REQUIRED_MESSAGE'),
  'real listing entry should use an explicit PSKU-required guard message'
)
assert(
  pageSource.includes('setListingPreparationError(PRODUCT_LISTING_REAL_RUN_PSKU_REQUIRED_MESSAGE)') &&
    pageSource.includes('message.warning(PRODUCT_LISTING_REAL_RUN_PSKU_REQUIRED_MESSAGE)'),
  'real listing entry should stop and show feedback when PSKU is empty'
)
assert(
  !pageSource.includes('ensureProductListingEditorDraftPsku(baseDraft)'),
  'real listing entry must not auto-generate a test PSKU before saving and dry-running'
)
assert(
  !pageSource.includes('已自动生成测试 PSKU'),
  'real listing entry must not suggest that an auto-generated test PSKU can be used for Noon writes'
)
