import type { ProductImageAiExtractionSuggestionView } from './api'
import { buildProductImageShortTitleAr, buildProductImageShortTitleEn } from './aiCopyText'

export const productImageAiSuggestionFields = [
  { key: 'titleEn', label: '英文短标题' },
  { key: 'titleAr', label: '阿语短标题' },
  { key: 'specSummary', label: '规格' },
  { key: 'sizeText', label: '尺寸数据' },
  { key: 'heroSellingPoints', label: '英文卖点' },
  { key: 'packageText', label: '包装数据' }
] as const

export type ProductImageAiSuggestionFieldKey = typeof productImageAiSuggestionFields[number]['key']

export type ProductImageAiExtractionTarget = {
  titleEn: string
  titleAr: string
  specSummary: string
  heroSellingPoints: string[]
  sizeSection: { attributesText?: string }
  packageList: { attributesText?: string }
}

function text(value?: string | null) {
  return value?.trim() || ''
}

export function normalizeProductImageAiSuggestion(
  suggestion: ProductImageAiExtractionSuggestionView
): ProductImageAiExtractionSuggestionView {
  return {
    ...suggestion,
    titleEn: buildProductImageShortTitleEn(suggestion.titleEn),
    titleAr: buildProductImageShortTitleAr(suggestion.titleAr),
    specSummary: text(suggestion.specSummary),
    sizeText: text(suggestion.sizeText),
    packageText: text(suggestion.packageText),
    heroSellingPoints: (suggestion.heroSellingPoints ?? []).map(text).filter(Boolean).slice(0, 5)
  }
}

export function currentProductImageAiFieldValue(
  profile: ProductImageAiExtractionTarget,
  field: ProductImageAiSuggestionFieldKey
) {
  if (field === 'sizeText') return text(profile.sizeSection.attributesText)
  if (field === 'packageText') return text(profile.packageList.attributesText)
  if (field === 'heroSellingPoints') return profile.heroSellingPoints.map(text).filter(Boolean).join('\n')
  return text(profile[field])
}

export function suggestedProductImageAiFieldValue(
  suggestion: ProductImageAiExtractionSuggestionView,
  field: ProductImageAiSuggestionFieldKey
) {
  if (field === 'heroSellingPoints') return (suggestion.heroSellingPoints ?? []).map(text).filter(Boolean).join('\n')
  return text(suggestion[field])
}

export function applyProductImageAiSuggestionField<T extends ProductImageAiExtractionTarget>(
  profile: T,
  suggestion: ProductImageAiExtractionSuggestionView,
  field: ProductImageAiSuggestionFieldKey
): T {
  if (field === 'sizeText') {
    return {
      ...profile,
      sizeSection: { ...profile.sizeSection, attributesText: text(suggestion.sizeText) }
    }
  }
  if (field === 'packageText') {
    return {
      ...profile,
      packageList: { ...profile.packageList, attributesText: text(suggestion.packageText) }
    }
  }
  if (field === 'heroSellingPoints') {
    return {
      ...profile,
      heroSellingPoints: (suggestion.heroSellingPoints ?? []).map(text).filter(Boolean).slice(0, 5)
    }
  }
  return { ...profile, [field]: text(suggestion[field]) }
}

export function applyAllProductImageAiSuggestions<T extends ProductImageAiExtractionTarget>(
  profile: T,
  suggestion: ProductImageAiExtractionSuggestionView
) {
  return productImageAiSuggestionFields.reduce(
    (current, item) => suggestedProductImageAiFieldValue(suggestion, item.key)
      ? applyProductImageAiSuggestionField(current, suggestion, item.key)
      : current,
    profile
  )
}
