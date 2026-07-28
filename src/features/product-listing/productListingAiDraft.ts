import type { ProductCompetitorContentMaterial } from '../product-domain/productCompetitorContent'
import type { ProductListingEditorDraft } from './productDetailAdapter'
import type { ProductListingAiListingData, ProductListingAiListingDraft } from './types'

export function hasListingAiInput(
  draft: ProductListingEditorDraft,
  competitorMaterials: ProductCompetitorContentMaterial[]
) {
  const draftFacts = [
    draft.productTitleCn,
    draft.productTitleEn,
    draft.productTitleAr,
    draft.productDescriptionCn,
    draft.productDescriptionEn,
    draft.productDescriptionAr,
    ...stringList(draft.productHighlightsCn),
    ...stringList(draft.productHighlightsEn),
    ...stringList(draft.productHighlightsAr)
  ]
  return (
    draftFacts.some((item) => text(item).trim()) ||
    hasVerifiedAttributeFacts(draft.keyAttributes) ||
    competitorMaterials.some(hasCompetitorMaterialContent)
  )
}

export function aiListingDraftPatch(
  uploadDraft?: ProductListingAiListingDraft,
  keywords?: ProductListingAiListingData['keywords']
): Partial<ProductListingEditorDraft> {
  if (!uploadDraft) {
    return {}
  }
  const patch: Partial<ProductListingEditorDraft> = {}
  const titleEn = cleanUploadText(uploadDraft.productTitleEn)
  const titleAr = cleanUploadText(uploadDraft.productTitleAr)
  const descriptionEn = cleanUploadText(uploadDraft.productDescriptionEn)
  const descriptionAr = cleanUploadText(uploadDraft.productDescriptionAr)
  const highlightsEn = cleanUploadList(uploadDraft.productHighlightsEn)
  const highlightsAr = cleanUploadList(uploadDraft.productHighlightsAr)
  if (titleEn) {
    patch.productTitleEn = titleEn
  }
  if (titleAr) {
    patch.productTitleAr = titleAr
  }
  if (descriptionEn) {
    patch.productDescriptionEn = descriptionEn
  }
  if (descriptionAr) {
    patch.productDescriptionAr = descriptionAr
  }
  if (highlightsEn.length) {
    patch.productHighlightsEn = highlightsEn
  }
  if (highlightsAr.length) {
    patch.productHighlightsAr = highlightsAr
  }
  if (keywords) {
    patch.listingKeywordSuggestionsEn = cleanKeywordList(keywords.english)
    patch.listingKeywordSuggestionsAr = cleanKeywordList(keywords.arabic)
  }
  return patch
}

function hasVerifiedAttributeFacts(attributes?: Array<Record<string, unknown>>) {
  return Boolean(
    attributes?.some((attribute) =>
      ['commonValue', 'enValue', 'arValue'].some((field) => text(attribute[field]).trim())
    )
  )
}

function hasCompetitorMaterialContent(material: ProductCompetitorContentMaterial) {
  return Boolean(
    text(material.titleEn).trim() ||
      text(material.titleAr).trim() ||
      text(material.descriptionEn).trim() ||
      text(material.descriptionAr).trim() ||
      stringList(material.sellingPointsEn).length ||
      stringList(material.sellingPointsAr).length
  )
}

function cleanUploadList(values?: string[]) {
  return stringList(values).map(cleanUploadText).filter(Boolean).slice(0, 5)
}

function cleanKeywordList(values?: string[]) {
  const seen = new Set<string>()
  return stringList(values).map(cleanUploadText).filter((keyword) => {
    const key = keyword.normalize('NFKC').toLocaleLowerCase()
    if (!key || seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  }).slice(0, 6)
}

function cleanUploadText(value: unknown) {
  return text(value).replace(/\*\*/g, '').trim()
}

function text(value: unknown) {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value)
}

function stringList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => text(item).trim()).filter(Boolean)
  }
  return []
}
