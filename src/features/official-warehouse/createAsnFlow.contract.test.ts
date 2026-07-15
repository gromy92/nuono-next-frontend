import { strict as assert } from 'node:assert'
import { parseCandidateSearch } from './createAsnFlow'

assert.deepEqual(parseCandidateSearch('PSKU-A\npsku-b，PSKU-A'), {
  partnerSkus: ['PSKU-A', 'PSKU-B']
})
assert.deepEqual(parseCandidateSearch('收纳盒'), { keyword: '收纳盒' })
assert.deepEqual(parseCandidateSearch('storage box'), { keyword: 'storage box' })
assert.deepEqual(parseCandidateSearch(''), {})
