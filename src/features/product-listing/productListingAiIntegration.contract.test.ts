import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { aiListingDraftPatch, hasListingAiInput } from './productListingAiDraft'
import type { ProductListingEditorDraft } from './productDetailAdapter'

const apiSource = readFileSync(new URL('./api.ts', import.meta.url), 'utf8')
const detailEditorSource = readFileSync(new URL('./ProductListingDetailEditor.tsx', import.meta.url), 'utf8')
const aiGenerationSource = readFileSync(
  new URL('./useProductListingAiGeneration.ts', import.meta.url),
  'utf8'
)
const aiFlowSource = `${detailEditorSource}\n${aiGenerationSource}`
const resultPreviewSource = readFileSync(new URL('./ProductListingAiResultPreview.tsx', import.meta.url), 'utf8')
const listingPageSource = readFileSync(new URL('./ProductListingPage.tsx', import.meta.url), 'utf8')
const adapterSource = [
  './productDetailAdapter.ts',
  './productDetailAdapterTypes.ts',
  './productDetailAdapterDraft.ts',
  './productDetailAdapterSnapshot.ts',
  './productDetailAdapterDomains.ts',
  './productDetailAdapterNormalization.ts'
].map((fileName) => readFileSync(new URL(fileName, import.meta.url), 'utf8')).join('\n')

assert.ok(
  apiSource.includes("'/api/product-listing/ai/noon-listing'"),
  'listing AI integration must call the product-listing scoped AI endpoint'
)

const emptyDraft = {
  storeCode: 'STR245027-NAE',
  psku: 'TEST-PSKU',
  imageUrls: [],
  keyAttributes: [],
  productFullType: 'Greeting Card Envelopes',
  family: 'Stationery',
  productType: 'Cards',
  productBrand: 'PAPERSAY'
} as ProductListingEditorDraft

assert.equal(
  hasListingAiInput(emptyDraft, []),
  false,
  'category and brand context alone must not be treated as product fact evidence'
)
assert.equal(
  hasListingAiInput({ ...emptyDraft, productTitleEn: 'Reusable Water Bottle' }, []),
  true,
  'a product title must enable generic Listing generation'
)
assert.equal(
  hasListingAiInput({
    ...emptyDraft,
    keyAttributes: [{ code: 'base_material', commonValue: 'metal' }]
  }, []),
  true,
  'a verified structured attribute must enable generic Listing generation'
)

assert.deepEqual(
  aiListingDraftPatch({
    productTitleEn: '**Reusable Water Bottle**',
    productTitleAr: 'زجاجة مياه قابلة لإعادة الاستخدام',
    productHighlightsEn: ['Keeps daily drinks easy to carry'],
    productHighlightsAr: ['تساعد على حمل المشروبات اليومية بسهولة'],
    productDescriptionEn: 'English description',
    productDescriptionAr: 'وصف عربي'
  }),
  {
    productTitleEn: 'Reusable Water Bottle',
    productTitleAr: 'زجاجة مياه قابلة لإعادة الاستخدام',
    productHighlightsEn: ['Keeps daily drinks easy to carry'],
    productHighlightsAr: ['تساعد على حمل المشروبات اليومية بسهولة'],
    productDescriptionEn: 'English description',
    productDescriptionAr: 'وصف عربي'
  },
  'apply action must produce a concrete bilingual draft patch'
)

assert.ok(
    !detailEditorSource.includes('AI 优化 Listing') &&
    !detailEditorSource.includes('Noon 双语 v3.3') &&
    detailEditorSource.includes('优化双语 Listing') &&
    detailEditorSource.includes('contentHeaderExtra={aiPanel}') &&
    aiGenerationSource.includes('noonUploadDraft') &&
    aiGenerationSource.includes('ProductListingAiListingData') &&
    detailEditorSource.includes('applied={ai.resultApplied}') &&
    aiGenerationSource.includes('setResultApplied(true)') &&
    aiGenerationSource.includes('inputFingerprintRef.current !== requestInputFingerprint') &&
    aiGenerationSource.includes('resultInputFingerprint !== inputFingerprintRef.current') &&
    aiGenerationSource.includes('本次 AI 结果已丢弃') &&
    resultPreviewSource.includes('const applyBlocked = generating || !ready') &&
    resultPreviewSource.includes('正在生成新结果') &&
    resultPreviewSource.includes('已填入当前草稿') &&
    !resultPreviewSource.includes('质检提示') &&
    !detailEditorSource.includes('商品上架 AI 整合补充要求') &&
    !aiFlowSource.includes('operatorRequirement: aiRequirement') &&
    !detailEditorSource.includes('enableCompetitorContentMerge'),
  'listing detail editor must expose the v3.3 flow without internal findings or operator free text'
)

assert.ok(
  detailEditorSource.includes('competitorMaterials?: ProductCompetitorContentMaterial[]') &&
    listingPageSource.includes('competitorMaterials={sourcePrefill?.competitorMaterials ?? listingDraft.competitorMaterials}'),
  'listing AI integration must receive competitor materials from manual-selection prefill'
)

assert.ok(
  adapterSource.includes('productDescriptionEn: optionalText(draft.productDescriptionEn)') &&
    adapterSource.includes('productHighlightsEn: normalizeStringList(draft.productHighlightsEn)') &&
    adapterSource.includes('productDescriptionAr: optionalText(draft.productDescriptionAr)') &&
    adapterSource.includes('productHighlightsAr: normalizeStringList(draft.productHighlightsAr)'),
  'listing save payload must preserve AI-generated bilingual descriptions and bullets'
)
