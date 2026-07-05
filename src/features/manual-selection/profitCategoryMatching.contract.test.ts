import assert from 'node:assert/strict'
import {
  chooseSystemCategoryOption,
  systemCategoryDisplayLabel,
  systemCategorySearchTerms,
  type ManualSelectionSystemCategoryOption
} from './profitCategoryMatching'

const phoneCaseCategory: ManualSelectionSystemCategoryOption = {
  value: 'electronic_accessories-accessories-mobile_phone_cases',
  label: 'Mobile Phone Cases',
  family: 'electronic_accessories',
  productType: 'accessories',
  productSubtype: 'mobile_phone_cases',
  usageCount: 8
}

const stationeryCategory: ManualSelectionSystemCategoryOption = {
  value: 'stationery_office-products-writing_permanent_markers',
  label: 'Permanent Markers',
  family: 'stationery_office',
  productType: 'products',
  productSubtype: 'writing_permanent_markers',
  usageCount: 18
}

const homeDecorFulltypeCategory: ManualSelectionSystemCategoryOption = {
  value: 'home_decor-lighting-lighting_set',
  label: 'home_decor-lighting-lighting_set',
  family: 'home_decor',
  productType: 'lighting',
  productSubtype: 'lighting_set',
  usageCount: 5
}

assert.equal(
  chooseSystemCategoryOption(
    [stationeryCategory, phoneCaseCategory],
    'iPhone 17 Pro Max MagSafe anti yellow mobile phone case'
  )?.value,
  phoneCaseCategory.value
)

assert.equal(
  chooseSystemCategoryOption(
    [phoneCaseCategory, stationeryCategory],
    'Sharpie permanent markers fine point black 12 count'
  )?.value,
  stationeryCategory.value
)

assert.equal(
  chooseSystemCategoryOption(
    [stationeryCategory],
    'iPhone 15 transparent soft phone case'
  ),
  undefined
)

assert(systemCategorySearchTerms('iPhone 15 MagSafe Phone Case').includes('phone'))
assert.equal(systemCategoryDisplayLabel(phoneCaseCategory), 'Mobile Phone Cases')
assert.equal(systemCategoryDisplayLabel(homeDecorFulltypeCategory), '家居日用')
