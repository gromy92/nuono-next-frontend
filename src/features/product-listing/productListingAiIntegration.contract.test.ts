import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const apiSource = readFileSync(new URL('./api.ts', import.meta.url), 'utf8')
const detailEditorSource = readFileSync(new URL('./ProductListingDetailEditor.tsx', import.meta.url), 'utf8')
const listingPageSource = readFileSync(new URL('./ProductListingPage.tsx', import.meta.url), 'utf8')
const adapterSource = readFileSync(new URL('./productDetailAdapter.ts', import.meta.url), 'utf8')

assert.ok(
  apiSource.includes("'/api/product-listing/ai/noon-listing'"),
  'listing AI integration must call the product-listing scoped AI endpoint'
)

assert.ok(
  detailEditorSource.includes('AI整合') &&
    detailEditorSource.includes('Noon 双语 v3.2') &&
    detailEditorSource.includes('noonUploadDraft') &&
    detailEditorSource.includes('ProductListingAiListingData'),
  'listing detail editor must expose the v3.2 AI integration panel and consume structured upload draft output'
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
