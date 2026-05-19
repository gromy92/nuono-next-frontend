import type { ProductSelectionSourceCollection } from '../../source-collection/types'

const EMPTY_TEXT = '未采集到'

type ParsedSpec = {
  label: string
  normalizedLabel: string
  value: string
}

type FieldValue = {
  value: string
  source: string
}

export type LogisticsAssessment = {
  riskLevel: 'low' | 'medium' | 'high'
  riskText: string
  statusTag: string
  routeSuggestion: string
  recommendation: string
  completenessCount: number
  completenessTotal: number
  fields: Array<{ label: string; value: string; source: string; missing?: boolean }>
  riskTags: string[]
  missingFields: string[]
  sources: string[]
}

export function buildLogisticsAssessment(record: ProductSelectionSourceCollection): LogisticsAssessment {
  const specs = parseSpecs(record.specHints)
  const productDimensions = firstSpec(specs, ['product dimensions', 'item dimensions', 'item dimension', 'dimensions', 'dimension'])
  const packageDimensions = firstSpec(specs, ['package dimensions', 'package dimension', 'packaging dimensions', 'shipping dimensions'])
  const productWeight = findSpec(specs, (label) => label.includes('weight') && !isPackageWeightLabel(label))
  const packageWeight = findSpec(specs, isPackageWeightLabel)
  const material = firstSpec(specs, ['material', 'material type', 'base material', 'secondary material', 'fabric type'])
  const unitCount = fieldFromValue(
    record.unitCount || firstSpec(specs, ['unit count', 'item quantity', 'number of pieces', 'package quantity', 'set includes'])?.value,
    record.unitCount ? '固定字段' : '采集规格'
  )

  const dimensionForVolume = packageDimensions || productDimensions
  const dimensionText = dimensionForVolume?.value || ''
  const dimensionSource = packageDimensions ? sourceLabel(packageDimensions) : productDimensions ? `${sourceLabel(productDimensions)}，非包装尺寸` : ''
  const volumetricWeight = formatVolumetricWeight(dimensionText)
  const grossWeight = packageWeight || productWeight
  const chargeableWeight = formatChargeableWeight(grossWeight?.value, volumetricWeight)
  const riskTags = inferRiskTags(record, specs, dimensionText, grossWeight?.value, volumetricWeight)
  const missingFields = [
    !productDimensions ? '商品尺寸' : '',
    !packageDimensions ? '包装尺寸' : '',
    !productWeight ? '商品重量' : '',
    !packageWeight ? '包装重量' : '',
    !material ? '材质' : ''
  ].filter(Boolean)

  const riskLevel = inferRiskLevel(missingFields, riskTags)
  const routeSuggestion = inferRouteSuggestion(chargeableWeight, volumetricWeight, riskTags)
  const completenessItems = [
    productDimensions,
    packageDimensions,
    productWeight,
    packageWeight,
    material,
    unitCount.value ? unitCount : null,
    record.sourceTitle || record.sourceDescriptionEn || record.sourceDescriptionAr ? { value: 'yes' } : null,
    record.sourceImageUrl || record.imageUrls?.length ? { value: 'yes' } : null
  ]
  const completenessCount = completenessItems.filter(Boolean).length
  const statusTag = missingFields.length ? '需补信息' : '信息较完整'

  return {
    riskLevel,
    riskText: riskLevel === 'high' ? '高风险' : riskLevel === 'medium' ? '中风险' : '低风险',
    statusTag,
    routeSuggestion,
    recommendation: recommendationText(riskLevel, missingFields, routeSuggestion),
    completenessCount,
    completenessTotal: 8,
    fields: [
      field('商品尺寸', productDimensions?.value, productDimensions ? sourceLabel(productDimensions) : ''),
      field('包装尺寸', packageDimensions?.value, packageDimensions ? sourceLabel(packageDimensions) : ''),
      field('商品重量', productWeight?.value, productWeight ? sourceLabel(productWeight) : ''),
      field('包装重量', packageWeight?.value, packageWeight ? sourceLabel(packageWeight) : ''),
      field('体积重', volumetricWeight, dimensionSource || ''),
      field('计费重', chargeableWeight, chargeableWeight === '待确认' ? '' : '按当前尺寸/重量初算'),
      field('材质', material?.value, material ? sourceLabel(material) : ''),
      field('件数/套装', unitCount.value, unitCount.source)
    ],
    riskTags,
    missingFields,
    sources: buildSources(productDimensions, packageDimensions, productWeight, packageWeight, material, unitCount)
  }
}

function field(label: string, value?: string, source?: string) {
  const hasValue = Boolean(value && value.trim() && value.trim() !== '待确认')
  return {
    label,
    value: value?.trim() === '待确认' ? '待确认' : hasValue ? value || '' : EMPTY_TEXT,
    source: hasValue ? source || '采集字段' : '待补充',
    missing: !hasValue
  }
}

function fieldFromValue(value?: string, source = '采集字段'): FieldValue {
  return {
    value: value?.trim() || '',
    source
  }
}

function parseSpecs(specHints: string[] = []): ParsedSpec[] {
  return specHints
    .map((item) => {
      const separatorIndex = item.search(/[:：]/)
      if (separatorIndex <= 0) return null
      const label = item.slice(0, separatorIndex).trim()
      const value = item.slice(separatorIndex + 1).trim()
      if (!label || !value) return null
      return { label, normalizedLabel: normalizeLabel(label), value }
    })
    .filter((item): item is ParsedSpec => Boolean(item))
}

function firstSpec(specs: ParsedSpec[], labels: string[]) {
  return findSpec(specs, (label) => labels.some((target) => label === target || label.includes(target)))
}

function findSpec(specs: ParsedSpec[], predicate: (normalizedLabel: string) => boolean) {
  return specs.find((spec) => predicate(spec.normalizedLabel))
}

function isPackageWeightLabel(label: string) {
  return label.includes('package weight') || label.includes('shipping weight') || label.includes('gross weight') || label.includes('packing weight')
}

function normalizeLabel(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function sourceLabel(spec: ParsedSpec) {
  return `采集规格：${spec.label}`
}

function formatVolumetricWeight(value?: string) {
  const dimensions = parseDimensionsToCm(value)
  if (!dimensions) return ''
  const volumetricWeight = (dimensions[0] * dimensions[1] * dimensions[2]) / 5000
  return `约 ${formatKg(volumetricWeight)} kg`
}

function formatChargeableWeight(weightText?: string, volumetricWeightText?: string) {
  const actualWeight = parseWeightToKg(weightText)
  const volumetricWeight = parseWeightToKg(volumetricWeightText)
  if (actualWeight == null || volumetricWeight == null) return '待确认'
  return `约 ${formatKg(Math.max(actualWeight, volumetricWeight))} kg`
}

function parseDimensionsToCm(value?: string): [number, number, number] | null {
  if (!value) return null
  const numbers = value.match(/\d+(?:\.\d+)?/g)?.map(Number) || []
  if (numbers.length < 3) return null
  const normalized = value.toLowerCase()
  const ratio = normalized.includes('"') || normalized.includes('inch') || normalized.includes('inches') ? 2.54 : 1
  return [numbers[0] * ratio, numbers[1] * ratio, numbers[2] * ratio]
}

function parseWeightToKg(value?: string) {
  if (!value) return null
  const match = value.match(/(\d+(?:\.\d+)?)\s*(kg|g|lb|lbs)?/i)
  if (!match) return null
  const amount = Number(match[1])
  const unit = (match[2] || 'kg').toLowerCase()
  if (unit === 'g') return amount / 1000
  if (unit === 'lb' || unit === 'lbs') return amount * 0.453592
  return amount
}

function formatKg(value: number) {
  return value < 1 ? value.toFixed(2) : value.toFixed(1)
}

function inferRiskTags(
  record: ProductSelectionSourceCollection,
  specs: ParsedSpec[],
  dimensionText?: string,
  weightText?: string,
  volumetricWeightText?: string
) {
  const text = [
    record.sourceTitle,
    record.sourceTitleCn,
    record.sourceDescriptionEn,
    record.selectedText,
    ...(record.sourceSellingPointsEn || []),
    ...specs.map((spec) => `${spec.label} ${spec.value}`)
  ].join(' ').toLowerCase()
  const tags = new Set<string>()

  if (/glass|ceramic|mirror|fragile|porcelain/.test(text)) tags.add('易碎')
  if (/battery|lithium|rechargeable|usb|electric/.test(text)) tags.add('带电待确认')
  if (/liquid|spray|oil|fragrance|perfume/.test(text)) tags.add('液体待确认')
  if (/powder/.test(text)) tags.add('粉末待确认')
  if (/magnet|magnetic/.test(text)) tags.add('磁性待确认')
  if (/knife|blade|sharp/.test(text)) tags.add('尖锐待确认')

  const dimensions = parseDimensionsToCm(dimensionText)
  if (dimensions && Math.max(...dimensions) >= 60) tags.add('超长关注')
  const actualWeight = parseWeightToKg(weightText)
  const volumetricWeight = parseWeightToKg(volumetricWeightText)
  if (actualWeight && volumetricWeight && volumetricWeight / actualWeight >= 2) tags.add('疑似抛货')
  if (dimensionText && !weightText) tags.add('需包装重量确认')

  return Array.from(tags)
}

function inferRiskLevel(missingFields: string[], riskTags: string[]): 'low' | 'medium' | 'high' {
  const hasSensitiveRisk = riskTags.some((tag) => tag.includes('液体') || tag.includes('粉末') || tag.includes('磁性') || tag.includes('尖锐') || tag.includes('带电'))
  if (hasSensitiveRisk && missingFields.length) return 'high'
  if (riskTags.includes('超长关注') || riskTags.includes('疑似抛货')) return 'medium'
  if (missingFields.includes('包装尺寸') || missingFields.includes('包装重量')) return 'medium'
  return riskTags.length ? 'medium' : 'low'
}

function inferRouteSuggestion(chargeableWeightText: string, volumetricWeightText?: string, riskTags: string[] = []) {
  const chargeableWeight = parseWeightToKg(chargeableWeightText)
  const volumetricWeight = parseWeightToKg(volumetricWeightText)
  if (riskTags.some((tag) => tag.includes('液体') || tag.includes('粉末') || tag.includes('磁性') || tag.includes('尖锐') || tag.includes('带电'))) {
    return '渠道待确认'
  }
  if (chargeableWeight == null) return '空运待确认'
  if (chargeableWeight >= 3 || (volumetricWeight && chargeableWeight / Math.max(volumetricWeight, 0.1) > 2.5)) return '海运更稳'
  return '空运可发'
}

function recommendationText(riskLevel: string, missingFields: string[], routeSuggestion: string) {
  if (riskLevel === 'high') return '建议先确认敏感属性和包装数据，再进入利润测算。'
  if (missingFields.length) return `建议补充${missingFields.slice(0, 3).join('、')}后再计算利润。`
  return `可进入利润评估，当前物流方式建议为${routeSuggestion}。`
}

function buildSources(
  productDimensions?: ParsedSpec,
  packageDimensions?: ParsedSpec,
  productWeight?: ParsedSpec,
  packageWeight?: ParsedSpec,
  material?: ParsedSpec,
  unitCount?: FieldValue
) {
  return [
    `商品尺寸：${productDimensions ? sourceLabel(productDimensions) : '待补充'}`,
    `包装尺寸：${packageDimensions ? sourceLabel(packageDimensions) : '待补充'}`,
    `商品重量：${productWeight ? sourceLabel(productWeight) : '待补充'}`,
    `包装重量：${packageWeight ? sourceLabel(packageWeight) : '待补充'}`,
    `材质：${material ? sourceLabel(material) : '待补充'}`,
    `件数/套装：${unitCount?.value ? unitCount.source : '待补充'}`
  ]
}
