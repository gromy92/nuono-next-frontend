import assert from 'node:assert/strict'
import {
  ensureProductListingEditorDraftPsku,
  mergeProductListingPrefillDraft,
  productListingEditorDraftToPayload,
  type ProductListingEditorDraft
} from './productDetailAdapter'

const draft: ProductListingEditorDraft = {
  storeCode: 'STR245027-NSA',
  sourceType: 'manual_selection_group',
  sourceRefId: 91001,
  psku: 'CASE-NEW-001',
  productFullType: 'electronic_accessories-mobile_accessories-phone_cases',
  productBrand: 'Generic',
  productBrandCode: 'generic',
  productTitleCn: '防摔手机壳',
  productTitleEn: 'Rugged phone case with kickstand',
  productTitleAr: 'Arabic phone case title',
  productDescriptionCn: '中文描述草稿',
  productDescriptionEn: 'English product description for Noon.',
  productDescriptionAr: 'Arabic product description for Noon.',
  productHighlightsCn: ['中文卖点'],
  productHighlightsEn: ['Raised bezel protects the screen'],
  productHighlightsAr: ['Arabic bullet'],
  sizeEn: 'One Size',
  sizeAr: 'مقاس واحد',
  imageUrls: ['https://images.example.test/case-main.jpg', 'https://images.example.test/case-size.jpg'],
  imageRoleAssignments: [
    { imageUrl: 'https://images.example.test/case-main.jpg', imageRole: 'MAIN', sortOrder: 0 },
    { imageUrl: 'https://images.example.test/case-size.jpg', imageRole: 'SIZE', sortOrder: 1 }
  ],
  imageAssetMetadata: [
    { imageUrl: 'https://images.example.test/case-main.jpg', width: 1247, height: 1706 },
    { imageUrl: 'https://images.example.test/case-size.jpg', width: 660, height: 904 },
    { imageUrl: 'https://images.example.test/unused.jpg', width: 320, height: 320 }
  ],
  price: 49.9,
  priceMin: 45,
  priceMax: 59,
  salePrice: 47.5,
  saleStart: '2026-07-06',
  saleEnd: '2026-07-16',
  purchasePrice: 18.5,
  supplyEvidenceType: 'OTHER',
  supplyEvidenceRefId: 91001,
  fbp: true,
  warehouseId: 'W00752151SA',
  warehouseCode: 'Riyadh-FBP',
  quantity: 120,
  idWarranty: 24,
  isActive: false,
  offerNote: '选品组 PSG-91001 已完成利润测算',
  barcode: '6290000000001',
  competitorMaterials: [
    {
      id: 'noon-zsku-1',
      url: 'https://www.noon.com/saudi-en/noon-zsku-1/p/',
      sourceHost: 'Noon',
      externalSku: 'ZCOMPETITOR1',
      categoryName: 'Phone Cases',
      categoryPath: 'Electronics / Mobiles / Cases',
      categoryUrl: 'https://www.noon.com/saudi-en/mobiles-accessories/c/',
      categoryLinks: [
        {
          name: 'Mobile Accessories',
          path: 'Electronics / Mobiles / Accessories',
          url: 'https://www.noon.com/saudi-en/electronics-and-mobiles/mobiles-and-accessories/c/'
        }
      ],
      titleEn: 'Competitor rugged case',
      descriptionEn: 'Competitor English content',
      sellingPointsEn: ['Competitor selling point']
    }
  ]
}

const payload = productListingEditorDraftToPayload(draft) as Record<string, unknown>

assert.equal(payload.productTitleCn, '防摔手机壳')
assert.equal(payload.productDescriptionCn, '中文描述草稿')
assert.equal(payload.productDescriptionEn, 'English product description for Noon.')
assert.equal(payload.productDescriptionAr, 'Arabic product description for Noon.')
assert.deepEqual(payload.productHighlightsCn, ['中文卖点'])
assert.deepEqual(payload.productHighlightsEn, ['Raised bezel protects the screen'])
assert.deepEqual(payload.productHighlightsAr, ['Arabic bullet'])
assert.equal(payload.sizeEn, 'One Size')
assert.equal(payload.sizeAr, 'مقاس واحد')
assert.deepEqual(payload.imageRoleAssignments, [
  { imageUrl: 'https://images.example.test/case-main.jpg', imageRole: 'MAIN', sortOrder: 0 },
  { imageUrl: 'https://images.example.test/case-size.jpg', imageRole: 'SIZE', sortOrder: 1 }
])
assert.deepEqual(payload.imageAssetMetadata, [
  {
    imageUrl: 'https://images.example.test/case-main.jpg',
    width: 1247,
    height: 1706,
    aspectRatio: 0.73,
    noonReady: true,
    sourceTooSmall: false
  },
  {
    imageUrl: 'https://images.example.test/case-size.jpg',
    width: 660,
    height: 904,
    aspectRatio: 0.73,
    noonReady: true,
    sourceTooSmall: false
  }
])
assert.equal(payload.priceMin, 45)
assert.equal(payload.priceMax, 59)
assert.equal(payload.salePrice, 47.5)
assert.equal(payload.saleStart, '2026-07-06')
assert.equal(payload.saleEnd, '2026-07-16')
assert.equal(payload.isActive, false)
assert.equal(payload.offerNote, '选品组 PSG-91001 已完成利润测算')
assert.deepEqual(payload.competitorMaterials, [
  {
    id: 'noon-zsku-1',
    url: 'https://www.noon.com/saudi-en/noon-zsku-1/p/',
    note: undefined,
    sourceHost: 'Noon',
    externalSku: 'ZCOMPETITOR1',
    fetchedAt: undefined,
    categoryName: 'Phone Cases',
    categoryPath: 'Electronics / Mobiles / Cases',
    categoryUrl: 'https://www.noon.com/saudi-en/mobiles-accessories/c/',
    categoryLinks: [
      {
        name: 'Mobile Accessories',
        path: 'Electronics / Mobiles / Accessories',
        url: 'https://www.noon.com/saudi-en/electronics-and-mobiles/mobiles-and-accessories/c/'
      }
    ],
    titleEn: 'Competitor rugged case',
    titleAr: undefined,
    descriptionEn: 'Competitor English content',
    descriptionAr: undefined,
    sellingPointsEn: ['Competitor selling point'],
    sellingPointsAr: []
  }
])

const generatedDraft = ensureProductListingEditorDraftPsku({
  storeCode: 'STR245027-NSA',
  sourceType: 'manual_selection_group',
  sourceRefId: 91015,
  psku: '',
  imageUrls: []
}, 1783512000000)

assert.equal(generatedDraft.psku, 'NUONO-TEST-91015-MRC0ZUO0')

const hydratedPrefill = mergeProductListingPrefillDraft(
  {
    ...draft,
    psku: 'CASE-EXISTING-001',
    productFullType: 'electronics-mobiles-accessories-phone_cases',
    productBrand: 'Yalla Pick',
    imageUrls: ['https://images.example.test/existing-main.jpg'],
    competitorMaterials: [
      {
        id: 'existing-noon-zsku',
        url: 'https://www.noon.com/saudi-en/existing-noon-zsku/p/',
        sourceHost: 'Noon',
        externalSku: 'ZEXISTING',
        titleEn: 'Existing Noon competitor'
      }
    ]
  },
  {
    psku: 'CASE-HYDRATED-001',
    productFullType: undefined,
    productBrand: '',
    productBrandCode: undefined,
    imageUrls: [],
    competitorMaterials: []
  }
)

assert.equal(hydratedPrefill.psku, 'CASE-HYDRATED-001')
assert.equal(hydratedPrefill.productFullType, 'electronics-mobiles-accessories-phone_cases')
assert.equal(hydratedPrefill.productBrand, 'Yalla Pick')
assert.deepEqual(hydratedPrefill.imageUrls, ['https://images.example.test/existing-main.jpg'])
assert.deepEqual(hydratedPrefill.competitorMaterials, [
  {
    id: 'existing-noon-zsku',
    url: 'https://www.noon.com/saudi-en/existing-noon-zsku/p/',
    sourceHost: 'Noon',
    externalSku: 'ZEXISTING',
    titleEn: 'Existing Noon competitor'
  }
])
