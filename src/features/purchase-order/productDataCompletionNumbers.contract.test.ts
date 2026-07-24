import { strict as assert } from 'node:assert'

import { normalizeProductDataNumber } from './productDataCompletionNumbers'

assert.equal(
  normalizeProductDataNumber(null),
  undefined,
  'an optional null carton value must be omitted instead of being saved as zero'
)

assert.equal(
  normalizeProductDataNumber(''),
  undefined,
  'an optional blank carton value must be omitted instead of being saved as zero'
)

assert.equal(
  normalizeProductDataNumber('   '),
  undefined,
  'an optional whitespace-only carton value must be omitted instead of being saved as zero'
)

assert.equal(normalizeProductDataNumber(undefined), undefined)
assert.equal(normalizeProductDataNumber('20.5'), 20.5)
assert.equal(normalizeProductDataNumber(545), 545)
assert.equal(normalizeProductDataNumber(0), 0, 'an explicitly entered zero must still reach normal field validation')
assert.equal(normalizeProductDataNumber('invalid'), undefined)

assert.deepEqual(
  JSON.parse(JSON.stringify({
    productLengthCm: normalizeProductDataNumber(20),
    cartonLengthCm: normalizeProductDataNumber(null)
  })),
  { productLengthCm: 20 },
  'a PAPERSAYSB374-shaped payload must omit the empty carton value while preserving product dimensions'
)
