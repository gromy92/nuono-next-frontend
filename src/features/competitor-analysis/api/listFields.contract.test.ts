import { strict as assert } from 'node:assert'
import { mapDetail } from './watchProductMapper'

const detail = mapDetail({
  watchProduct: {
    id: 180123,
    siteCode: 'SA',
    selfNoonProductCode: 'NSELF0001'
  },
  candidates: [
    {
      id: 200001,
      noonProductCode: 'ZCOMP0001',
      codeType: 'Z_CODE',
      titleSnapshot: 'Legacy fallback',
      titleEnSnapshot: 'English list title',
      titleArSnapshot: 'عنوان القائمة',
      imageUrlSnapshot: 'https://f.nooncdn.com/p/list-main.jpg',
      priceAmountSnapshot: 32.95,
      currencyCodeSnapshot: 'SAR',
      tagsSnapshotJson: JSON.stringify({
        badges: [{ label: 'Best Seller' }],
        labels: [{ text: 'Free Delivery' }]
      }),
      sourceType: 'LIST_EXACT_SEARCH',
      reviewStatus: 'CONFIRMED'
    }
  ]
})

assert.equal(detail.candidates[0].title, 'English list title')
assert.equal(detail.candidates[0].titleEn, 'English list title')
assert.equal(detail.candidates[0].titleAr, 'عنوان القائمة')
assert.deepEqual(detail.candidates[0].tags, ['Best Seller', 'Free Delivery'])
assert.equal(detail.candidates[0].priceAmount, 32.95)
assert.equal(detail.candidates[0].currencyCode, 'SAR')
