import type {
  ProductCompetitorContentFieldType,
  ProductCompetitorContentMaterial,
  ProductCompetitorContentTargetLang
} from '../types/competitorContent'

export type ProductCompetitorContentSourceView = {
  label: string
  url?: string
  displayCode?: string
  platform: 'noon' | 'amazon' | 'other'
}

export type ProductCompetitorContentTextItem = {
  key: string
  text: string
  source: ProductCompetitorContentSourceView
}

export function buildProductCompetitorContentSourceView(
  material: ProductCompetitorContentMaterial,
  index: number
): ProductCompetitorContentSourceView {
  const url = text(material.url)
  const platform = competitorPlatform(material.sourceHost, url)
  return {
    label: text(material.sourceHost) || hostFromUrl(url) || `竞品 ${index + 1}`,
    url,
    displayCode: text(material.externalSku) || competitorExternalSku(platform, url),
    platform
  }
}

export function isNoonCompetitorContentSource(source: ProductCompetitorContentSourceView) {
  return source.platform === 'noon'
}

export function collectProductCompetitorContentTextItems(
  materials: ProductCompetitorContentMaterial[],
  fieldType: ProductCompetitorContentFieldType,
  targetLang: ProductCompetitorContentTargetLang
): ProductCompetitorContentTextItem[] {
  const items: ProductCompetitorContentTextItem[] = []
  materials.forEach((material, materialIndex) => {
    const seenTexts = new Set<string>()
    collectMaterialTexts(material, fieldType, targetLang)
      .map((item) => text(item))
      .filter(Boolean)
      .forEach((itemText, textIndex) => {
        if (seenTexts.has(itemText)) {
          return
        }
        seenTexts.add(itemText)
        items.push({
          key: `${text(material.id) || `competitor-${materialIndex + 1}`}-${fieldType}-${targetLang}-${textIndex}`,
          text: itemText,
          source: buildProductCompetitorContentSourceView(material, materialIndex)
        })
      })
  })
  return items
}

export function initialSelectedCompetitorContentKeys(items: ProductCompetitorContentTextItem[]) {
  return items.map((item) => item.key)
}

export function selectedCompetitorContentTexts(
  items: ProductCompetitorContentTextItem[],
  selectedKeys: string[]
) {
  const selectedKeySet = new Set(selectedKeys)
  return items.filter((item) => selectedKeySet.has(item.key)).map((item) => item.text)
}

export function competitorContentTranslationInputText(item: ProductCompetitorContentTextItem) {
  return item.text
}

function collectMaterialTexts(
  material: ProductCompetitorContentMaterial,
  fieldType: ProductCompetitorContentFieldType,
  targetLang: ProductCompetitorContentTargetLang
) {
  if (fieldType === 'title') {
    return targetLang === 'AR' ? [material.titleAr] : [material.titleEn]
  }
  if (fieldType === 'description') {
    return targetLang === 'AR' ? [material.descriptionAr] : [material.descriptionEn]
  }
  const sellingPoints = targetLang === 'AR' ? material.sellingPointsAr || [] : material.sellingPointsEn || []
  return [uniqueTexts(sellingPoints).join('\n')]
}

function hostFromUrl(url?: string) {
  if (!url) {
    return ''
  }
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function competitorPlatform(sourceHost?: string, url?: string): 'noon' | 'amazon' | 'other' {
  const value = `${text(sourceHost)} ${hostFromUrl(url)}`.toLowerCase()
  if (value.includes('noon')) {
    return 'noon'
  }
  if (value.includes('amazon')) {
    return 'amazon'
  }
  return 'other'
}

function competitorExternalSku(platform: 'noon' | 'amazon' | 'other', url?: string) {
  if (!url) {
    return ''
  }
  if (platform === 'amazon') {
    return amazonSkuFromUrl(url)
  }
  if (platform === 'noon') {
    return noonSkuFromUrl(url)
  }
  return ''
}

function amazonSkuFromUrl(url: string) {
  try {
    const parsed = new URL(url)
    const asinParam = text(parsed.searchParams.get('asin'))
    if (isAmazonAsin(asinParam)) {
      return asinParam.toUpperCase()
    }
    const segments = parsed.pathname.split('/').map(text).filter(Boolean)
    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index]
      if ((segment === 'dp' || (segment === 'product' && segments[index - 1] === 'gp')) && isAmazonAsin(segments[index + 1])) {
        return segments[index + 1].toUpperCase()
      }
      if (isAmazonAsin(segment)) {
        return segment.toUpperCase()
      }
    }
  } catch {
    return ''
  }
  return ''
}

function noonSkuFromUrl(url: string) {
  try {
    const parsed = new URL(url)
    const skuParam = text(parsed.searchParams.get('sku') || parsed.searchParams.get('zsku') || parsed.searchParams.get('noonSku'))
    if (isNoonSku(skuParam)) {
      return skuParam.toUpperCase()
    }
    const segments = parsed.pathname.split('/').map(text).filter(Boolean)
    for (const segment of segments.reverse()) {
      const normalized = decodeURIComponent(segment).replace(/^pzsku[/-]/i, '').replace(/^pnsku[/-]/i, '')
      if (isNoonSku(normalized)) {
        return normalized.toUpperCase()
      }
    }
  } catch {
    return ''
  }
  return ''
}

function isAmazonAsin(value?: string) {
  return Boolean(value && /^[A-Z0-9]{10}$/i.test(value))
}

function isNoonSku(value?: string) {
  return Boolean(value && /^[A-ZN][A-Z0-9]{6,}$/i.test(value))
}

function text(value?: string | null) {
  return (value || '').trim()
}

function uniqueTexts(values: string[]) {
  return values.map(text).filter((value, index, list) => value && list.indexOf(value) === index)
}
