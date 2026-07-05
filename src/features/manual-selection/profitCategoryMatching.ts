import type { ManualSelectionProfitEstimateSeed } from './types'

export type ManualSelectionSystemCategoryOption = {
  value: string
  label?: string
  family?: string
  productType?: string
  productSubtype?: string
  usageCount?: number
}

const CATEGORY_QUERY_EXPANSIONS: Array<{ markers: string[]; terms: string[] }> = [
  {
    markers: ['iphone', 'phone', 'mobile', 'magsafe', 'case', '手机', '手机壳'],
    terms: ['phone', 'case', 'mobile', 'accessories']
  },
  {
    markers: ['nail', 'gel', 'manicure', '美甲', '指甲'],
    terms: ['nail', 'beauty']
  },
  {
    markers: ['marker', 'pen', 'pencil', 'notebook', 'paper', 'label', 'sticker', '文具', '纸', '笔'],
    terms: ['stationery', 'marker', 'paper', 'sticker']
  },
  {
    markers: ['home', 'kitchen', 'storage', 'organizer', 'decor', 'flower', '家居', '收纳', '装饰'],
    terms: ['home', 'decor', 'storage']
  }
]

const SYSTEM_CATEGORY_FAMILY_LABELS: Record<string, string> = {
  home_decor: '家居日用'
}

function normalizeText(value?: string) {
  return (value || '')
    .toLowerCase()
    .replace(/[_\-+/.,;:()[\]{}|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function textTokens(value?: string) {
  return Array.from(new Set(
    normalizeText(value)
      .split(' ')
      .map((token) => token.trim())
      .filter((token) => token.length >= 3)
  ))
}

function optionSearchText(option: ManualSelectionSystemCategoryOption) {
  return normalizeText([
    option.value,
    option.label,
    option.family,
    option.productType,
    option.productSubtype
  ].filter(Boolean).join(' '))
}

export function systemCategoryOptionSearchText(option: ManualSelectionSystemCategoryOption) {
  const baseText = optionSearchText(option)
  const aliases: string[] = []
  if (
    baseText.includes('phone accessories') ||
    baseText.includes('phone accessory') ||
    baseText.includes('mobile')
  ) {
    aliases.push('case cases cover covers phone mobile accessories 手机壳 手机套 保护壳')
  }
  if (baseText.includes('case') || baseText.includes('cover')) {
    aliases.push('case cases cover covers')
  }
  return normalizeText([baseText, ...aliases].join(' '))
}

export function systemCategoryHint(seed?: ManualSelectionProfitEstimateSeed | null) {
  return [
    seed?.categoryHint,
    seed?.title,
    seed?.ali1688Url
  ].filter(Boolean).join(' ')
}

export function systemCategorySearchTerms(value?: string | ManualSelectionProfitEstimateSeed | null) {
  const hint = typeof value === 'string' ? value : systemCategoryHint(value)
  const normalized = normalizeText(hint)
  const terms: string[] = []
  CATEGORY_QUERY_EXPANSIONS.forEach((group) => {
    if (group.markers.some((marker) => normalized.includes(marker.toLowerCase()))) {
      terms.push(...group.terms)
    }
  })
  terms.push(...textTokens(hint).slice(0, 8))
  return Array.from(new Set(terms)).slice(0, 10)
}

export function systemCategoryDisplayLabel(option: ManualSelectionSystemCategoryOption) {
  if (option.label && option.label !== option.value) {
    return option.label
  }
  return SYSTEM_CATEGORY_FAMILY_LABELS[option.family || ''] || option.label || option.value
}

export function chooseSystemCategoryOption(
  options: ManualSelectionSystemCategoryOption[],
  value?: string | ManualSelectionProfitEstimateSeed | null
) {
  const hint = typeof value === 'string' ? value : systemCategoryHint(value)
  const normalizedHint = normalizeText(hint)
  const hintTokens = new Set([...textTokens(hint), ...systemCategorySearchTerms(hint)])

  const scoredOptions = options
    .map((option) => {
      const text = systemCategoryOptionSearchText(option)
      let score = 0
      hintTokens.forEach((token) => {
        if (text.includes(token)) {
          score += token.length >= 5 ? 4 : 2
        }
      })
      CATEGORY_QUERY_EXPANSIONS.forEach((group) => {
        const hintMatchesGroup = group.markers.some((marker) => normalizedHint.includes(marker.toLowerCase()))
        const optionMatchesGroup = group.terms.some((term) => text.includes(term))
        if (hintMatchesGroup && optionMatchesGroup) {
          score += 8
        }
      })
      if (score > 0 && option.usageCount) {
        score += Math.min(option.usageCount, 20) / 20
      }
      return { option, score }
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)

  return scoredOptions[0]?.option
}
