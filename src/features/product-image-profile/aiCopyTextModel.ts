export type ProductImageAiCopySimpleSection = {
  titleAr?: string
  titleEn?: string
  descriptionAr?: string
  descriptionEn?: string
  attributesText?: string
}

export type ProductImageAiCopyRepeatableSection = ProductImageAiCopySimpleSection & {
  id?: string
  focusPart?: string
}

export type ProductImageAiCopyProfile = {
  pskuCode?: string
  productTitle?: string
  productFactText?: string
  brand?: string
  titleAr?: string
  titleEn?: string
  specSummary?: string
  heroSellingPoints?: string[]
  sizeSection?: ProductImageAiCopySimpleSection
  coreFeatures?: ProductImageAiCopyRepeatableSection[]
  materialDetails?: ProductImageAiCopyRepeatableSection[]
  usageScene?: ProductImageAiCopySimpleSection
  packageList?: ProductImageAiCopySimpleSection
}

export type ProductImageAiPromptSectionKey = 'MAIN' | 'SIZE' | 'DETAIL' | 'SCENE' | 'PACKAGE' | 'OVERALL'

export type ProductImageAiPromptSection = {
  key: ProductImageAiPromptSectionKey
  title: string
  subtitle: string
  copyTitle: string
  text: string
}

export function optionalProductImageCopyText(value?: string | null) {
  return value?.trim() || ''
}

export function nonEmptyProductImageCopyTexts(values: Array<string | undefined | null>) {
  return values.map(optionalProductImageCopyText).filter(Boolean)
}

function appendFactField(lines: string[], label: string, value?: string | null) {
  const text = optionalProductImageCopyText(value)
  if (text) {
    lines.push(`${label}：${text}`)
  }
}

function numbered(values?: string[]) {
  const lines = nonEmptyProductImageCopyTexts(values ?? [])
  return lines.length ? lines.map((item, index) => `${index + 1}. ${item}`).join('\n') : ''
}

function compactTitle(
  value: string | undefined | null,
  options: {
    maxWords: number
    maxChars: number
    breakPhrases?: string[]
  }
) {
  let text = optionalProductImageCopyText(value)
    .replace(/\([^)]*\)/g, '')
    .replace(/（[^）]*）/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return ''

  text = stripLeadingPackQuantity(text)
  if (!text) return ''

  const delimiterText = text.split(/[，,،؛;|]/).map((part) => part.trim()).find(Boolean)
  if (delimiterText) {
    text = delimiterText
  }

  const lowerText = text.toLowerCase()
  const breakIndex = (options.breakPhrases ?? [])
    .map((phrase) => lowerText.indexOf(phrase.toLowerCase()))
    .filter((index) => index > 0)
    .sort((left, right) => left - right)[0]
  if (breakIndex) {
    text = text.slice(0, breakIndex).trim()
  }

  const words = text.split(/\s+/).filter(Boolean)
  if (words.length > options.maxWords) {
    text = words.slice(0, options.maxWords).join(' ')
  }

  const chars = Array.from(text)
  return chars.length > options.maxChars
    ? chars.slice(0, options.maxChars).join('').trim()
    : text
}

function stripLeadingPackQuantity(value: string) {
  const numberPattern = '[0-9٠-٩۰-۹]+'
  return value
    .replace(new RegExp(`^\\s*${numberPattern}\\s*[- ]?\\s*(?:pcs?\\.?|pieces?|piece|packs?|pack)\\s+`, 'i'), '')
    .replace(new RegExp(`^\\s*${numberPattern}\\s*(?:قطع|قطعة)\\s+`, 'i'), '')
    .replace(new RegExp(`^\\s*${numberPattern}\\s+`), '')
    .trim()
}

export function buildProductImageShortTitleAr(value?: string | null) {
  return compactTitle(value, {
    maxWords: 7,
    maxChars: 58,
    breakPhrases: [' مع ']
  })
}

export function buildProductImageShortTitleEn(value?: string | null) {
  return compactTitle(value, {
    maxWords: 6,
    maxChars: 52,
    breakPhrases: [' with ', ' for ', ' and ', ' - ', ' – ']
  })
}

export function mainImageTitleAr(profile: ProductImageAiCopyProfile) {
  return optionalProductImageCopyText(profile.titleAr) || buildProductImageShortTitleAr(profile.productTitle)
}

export function mainImageTitleEn(profile: ProductImageAiCopyProfile) {
  return optionalProductImageCopyText(profile.titleEn) || buildProductImageShortTitleEn(profile.productTitle)
}

export function buildDefaultProductFactText(profile: ProductImageAiCopyProfile) {
  const lines: string[] = []
  appendFactField(lines, '商品', profile.productTitle)
  appendFactField(lines, 'PSKU', profile.pskuCode)
  appendFactField(lines, '品牌', profile.brand)
  appendFactField(lines, '阿语标题', profile.titleAr)
  appendFactField(lines, '英文标题', profile.titleEn)
  appendFactField(lines, '规格', profile.specSummary)
  const heroSellingPoints = numbered(profile.heroSellingPoints)
  if (heroSellingPoints) {
    lines.push(`核心卖点：\n${heroSellingPoints}`)
  }
  appendFactField(lines, '尺寸', profile.sizeSection?.attributesText)
  appendFactField(lines, '包装/数量', profile.packageList?.attributesText)
  appendFactField(lines, '使用场景', profile.usageScene?.descriptionEn || profile.usageScene?.descriptionAr)
  return lines.join('\n')
}
