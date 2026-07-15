import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const offerMetaSource = readFileSync(
  new URL('../product-management/components/ProductOfferMetaSection.tsx', import.meta.url),
  'utf8'
)

assert(
  offerMetaSource.includes("productSnapshotView?.mode === 'listing-draft'") &&
    offerMetaSource.includes('icon={<DeleteOutlined />}') &&
    offerMetaSource.includes("updateProductSectionField('identity', 'barcodes', nextBarcodes)") &&
    offerMetaSource.includes('Barcode 已从当前草稿删除，请保存草稿后生效。'),
  'listing draft Barcode tags should expose a delete action that clears draft identity state'
)
