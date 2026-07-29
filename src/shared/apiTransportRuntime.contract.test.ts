import assert from 'node:assert/strict'
import {
  prefixTransportInputForBase,
  prefixTransportUrlForBase,
  shouldAttachSessionContextForUrl
} from './apiTransportRuntime'

const origin = 'https://www.nuoon.com'

assert.equal(
  prefixTransportUrlForBase('/api/products', '/ai', origin),
  '/ai/api/products'
)
assert.equal(
  prefixTransportUrlForBase('/actuator/health', '/ai', origin),
  '/ai/actuator/health'
)
assert.equal(
  prefixTransportUrlForBase('/templates/import.xlsx', '/ai', origin),
  '/ai/templates/import.xlsx'
)
assert.equal(
  prefixTransportUrlForBase('/images/product.png', '/ai', origin),
  '/images/product.png'
)
assert.equal(
  prefixTransportUrlForBase('https://www.nuoon.com/api/products', '/ai', origin),
  'https://www.nuoon.com/ai/api/products'
)
assert.equal(
  prefixTransportUrlForBase('https://uploads.example.net/api/products', '/ai', origin),
  'https://uploads.example.net/api/products'
)
assert.equal(
  prefixTransportUrlForBase('/ai/api/products', '/ai', origin),
  '/ai/api/products'
)
assert.equal(
  prefixTransportUrlForBase('/api?health=full#result', '/ai', origin),
  '/ai/api?health=full#result'
)

const urlInput = new URL(`${origin}/api/products`)
const prefixedUrlInput = prefixTransportInputForBase(urlInput, '/ai', origin)
assert.ok(prefixedUrlInput instanceof URL)
assert.equal(prefixedUrlInput.toString(), `${origin}/ai/api/products`)

const requestInput = new Request(`${origin}/api/products`, {
  method: 'POST',
  headers: { 'X-Custom': 'kept' },
  body: '{"value":1}'
})
const prefixedRequestInput = prefixTransportInputForBase(requestInput, '/ai', origin)
assert.ok(prefixedRequestInput instanceof Request)
assert.equal(prefixedRequestInput.url, `${origin}/ai/api/products`)
assert.equal(prefixedRequestInput.method, 'POST')
assert.equal(prefixedRequestInput.headers.get('X-Custom'), 'kept')
assert.equal(await prefixedRequestInput.text(), '{"value":1}')

assert.equal(shouldAttachSessionContextForUrl('/api/products', '/ai', origin), true)
assert.equal(shouldAttachSessionContextForUrl('/api/products', '/ai', ''), true)
assert.equal(shouldAttachSessionContextForUrl('/api?health=full', '/ai', origin), true)
assert.equal(shouldAttachSessionContextForUrl('/ai/api/products', '/ai', origin), true)
assert.equal(
  shouldAttachSessionContextForUrl('https://www.nuoon.com/ai/api/products', '/ai', origin),
  true
)
assert.equal(
  shouldAttachSessionContextForUrl('https://uploads.example.net/api/products', '/ai', origin),
  false
)
assert.equal(shouldAttachSessionContextForUrl('/images/product.png', '/ai', origin), false)
