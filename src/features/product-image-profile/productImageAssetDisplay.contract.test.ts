import { strict as assert } from 'node:assert'
import {
  isProductImageAssetUrl,
  resolveProductImageDisplayUrl
} from './productImageAssetDisplay'

const localAssetUrl = '/api/product-master/image-assets/91397529-69e7-4cb4-bec0-524d653996a3.jpg'

assert.equal(isProductImageAssetUrl(localAssetUrl), true)
assert.equal(isProductImageAssetUrl('https://storage.googleapis.com/slapi-production/psku_assets/a.jpg'), false)

let fetchedUrl = ''
let createdFromBlob = false
let revokedUrl = ''

const localDisplay = await resolveProductImageDisplayUrl(localAssetUrl, {
  fetcher: async (input) => {
    fetchedUrl = String(input)
    return new Response(new Blob(['image-binary'], { type: 'image/jpeg' }), { status: 200 })
  },
  createObjectURL: (blob) => {
    createdFromBlob = blob instanceof Blob
    return 'blob:local-product-image'
  },
  revokeObjectURL: (url) => {
    revokedUrl = url
  }
})

assert.equal(fetchedUrl, localAssetUrl)
assert.equal(createdFromBlob, true)
assert.equal(localDisplay.displayUrl, 'blob:local-product-image')
localDisplay.revoke()
assert.equal(revokedUrl, 'blob:local-product-image')

let externalFetched = false
const externalDisplay = await resolveProductImageDisplayUrl('https://example.test/product.jpg', {
  fetcher: async () => {
    externalFetched = true
    return new Response('', { status: 200 })
  }
})
assert.equal(externalFetched, false)
assert.equal(externalDisplay.displayUrl, 'https://example.test/product.jpg')
