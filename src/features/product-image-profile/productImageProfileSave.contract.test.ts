import assert from 'node:assert/strict'
import { buildSaveRequest, mapBackendProfile } from './productImageProfileMapper'

const savedDetail = {
  id: 44,
  ownerUserId: 308,
  storeCode: 'STR108065-NSA',
  pskuCode: 'PAPERSAYSB044',
  productIdentityKey: 'psku:PAPERSAYSB044',
  productTitle: 'Hook',
  brand: 'PAPERSAY',
  titleAr: '',
  titleEn: 'Hook and Loop Tape Strips',
  specSummary: '12 Strips',
  productFactText: 'Verified product facts',
  heroSellingPoints: ['Strong hold'],
  assets: [],
  sections: [],
  suites: []
}

const mapped = mapBackendProfile(savedDetail)
const request = buildSaveRequest(mapped, 308, 'STR108065-NSA')
const mappedResponse = mapBackendProfile({ ...savedDetail, titleEn: request.titleEn })

assert.equal(request.titleEn, 'Hook and Loop Tape Strips')
assert.equal(mappedResponse.titleEn, 'Hook and Loop Tape Strips')
