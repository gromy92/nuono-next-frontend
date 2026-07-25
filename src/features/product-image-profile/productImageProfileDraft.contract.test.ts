import assert from 'node:assert/strict'
import { preserveProductImageProfileDraft } from './productImageProfileDraft'
import type { ProductImageProfile } from './productImageProfileTypes'

const emptySection = {
  titleAr: '',
  titleEn: '',
  descriptionAr: '',
  descriptionEn: '',
  attributesText: ''
}

const current = {
  id: 'profile-1',
  pskuCode: 'PAPERSAYSB044',
  productTitle: 'Hook',
  brand: 'PAPERSAY',
  titleAr: '',
  titleEn: 'Hook and Loop Tape Strips',
  specSummary: '12 Strips',
  productFactText: 'manual facts',
  heroSellingPoints: ['Strong hold'],
  sizeSection: { ...emptySection, attributesText: '10 × 2 cm' },
  coreFeatures: [],
  materialDetails: [],
  usageScene: { ...emptySection, attributesText: 'Home and office' },
  packageList: { ...emptySection, attributesText: '12 strips' },
  assets: [],
  suites: [],
  updatedAt: ''
} as ProductImageProfile

const serverProfile = {
  ...current,
  titleEn: 'Hook',
  specSummary: 'server value',
  productFactText: 'server facts',
  assets: [{ id: 'asset-1' }],
  suites: [{ id: 'suite-1' }]
} as ProductImageProfile

const merged = preserveProductImageProfileDraft(current, serverProfile)

assert.equal(merged.titleEn, 'Hook and Loop Tape Strips')
assert.equal(merged.specSummary, '12 Strips')
assert.equal(merged.assets[0]?.id, 'asset-1')
assert.equal(merged.suites[0]?.id, 'suite-1')
