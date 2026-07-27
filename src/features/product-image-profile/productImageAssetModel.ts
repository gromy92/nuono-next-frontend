import type { ProductImageAssetRemoveItem, ProductImageAssetRoleUpdateItem } from './api'
import { buildDefaultProductFactText } from './aiCopyText'
import { noonImageDimensionCompliance } from './noonImageDimensionCompliance'
import type { ImageRole, ProductImageProfile, ProfileAsset } from './productImageProfileTypes'
import { optionalText } from './productImageProfileConstants'
import type { ProductImageProfileMissingField, ProductImageProfileReadinessStatus } from './profileSummaryStatus'

export function activeAssets(profile: ProductImageProfile) {
  return profile.assets
    .filter((asset) => asset.assetStatus === 'ACTIVE')
    .sort((current, next) => current.sortOrder - next.sortOrder)
}

export function isSelectableAsset(asset: ProfileAsset) {
  return Boolean(asset.backendId || asset.imageUrl)
}

export function assetRemoveItem(asset: ProfileAsset): ProductImageAssetRemoveItem {
  return {
    assetId: asset.backendId,
    imageUrl: asset.imageUrl
  }
}

export function assetRoleUpdateItem(asset: ProfileAsset, imageRole: ImageRole): ProductImageAssetRoleUpdateItem {
  return {
    assetId: asset.backendId,
    imageUrl: asset.imageUrl,
    imageRole
  }
}

export function assetIdentity(asset: ProfileAsset) {
  return asset.backendId
    ? `${asset.removable ? 'profile' : 'current'}:${asset.backendId}`
    : `url:${optionalText(asset.imageUrl)}`
}

export function samePhysicalAsset(left: ProfileAsset, right: ProfileAsset) {
  const leftIdentity = assetIdentity(left)
  return leftIdentity !== 'url:' && leftIdentity === assetIdentity(right)
}

export function uniquePhysicalAssets(assets: ProfileAsset[]) {
  return Array.from(new Map(assets.map((asset) => [assetIdentity(asset), asset])).values())
}

export function assetDimensionText(asset: ProfileAsset) {
  return asset.widthPx && asset.heightPx ? `${asset.widthPx} × ${asset.heightPx} px` : '尺寸待读取'
}

export function assetComplianceMeta(asset: ProfileAsset) {
  const status = asset.noonTechnicalCompliance?.status || 'UNKNOWN'
  const checks = asset.noonTechnicalCompliance?.checks ?? []
  const messages = checks
    .filter((check) => check.status !== 'PASS')
    .map((check) => optionalText(check.message))
    .filter(Boolean)
  if (status === 'PASS') return { color: 'success' as const, label: 'Noon 技术合格', detail: '可读取的技术指标均符合 Noon 要求；画面内容仍需人工确认。' }
  if (status === 'FAIL') return { color: 'error' as const, label: 'Noon 技术不合格', detail: messages.join('；') || '至少一项技术指标不符合 Noon 要求。' }
  const dimensionCompliance = noonImageDimensionCompliance(asset.widthPx, asset.heightPx)
  if (dimensionCompliance.status === 'PASS') {
    return { color: 'processing' as const, label: 'Noon 尺寸合格', detail: dimensionCompliance.detail }
  }
  if (dimensionCompliance.status === 'FAIL') {
    return { color: 'error' as const, label: 'Noon 尺寸不合格', detail: dimensionCompliance.detail }
  }
  return { color: 'warning' as const, label: 'Noon 技术待确认', detail: messages.join('；') || '图片元数据不足，暂时无法完成技术校验。' }
}

export function profileCoverAsset(profile: ProductImageProfile) {
  const assets = activeAssets(profile)
  return assets.find((asset) => asset.imageUrl) || assets[0]
}

export const missingProfileFieldLabel: Record<ProductImageProfileMissingField, string> = {
  BRAND: '品牌',
  BILINGUAL_TITLE: '英文或阿语标题',
  SPEC_SUMMARY: '规格摘要',
  PRODUCT_FACTS: '商品事实资料',
  BASE_IMAGE: '基础图片'
}

export function profileMissingFields(profile: ProductImageProfile): ProductImageProfileMissingField[] {
  if (!profile.detailLoaded && profile.missingProfileFields) return profile.missingProfileFields
  const missing: ProductImageProfileMissingField[] = []
  if (!profile.brand.trim()) missing.push('BRAND')
  if (!profile.titleAr.trim() && !profile.titleEn.trim()) missing.push('BILINGUAL_TITLE')
  if (!profile.specSummary.trim()) missing.push('SPEC_SUMMARY')
  if (!profile.productFactText.trim() && !buildDefaultProductFactText(profile).trim()) missing.push('PRODUCT_FACTS')
  if (!activeAssets(profile).length) missing.push('BASE_IMAGE')
  return missing
}

export function profileReadinessStatus(profile: ProductImageProfile): ProductImageProfileReadinessStatus {
  if (!profile.detailLoaded && profile.profileReadinessStatus) return profile.profileReadinessStatus
  return profileMissingFields(profile).length ? 'INCOMPLETE' : 'COMPLETE'
}

export function profileCompleteness(profile: ProductImageProfile) {
  return profileReadinessStatus(profile) === 'COMPLETE'
    ? { label: '资料完整', color: 'success' as const }
    : { label: '待补充', color: 'warning' as const }
}

export function missingGenerationProfileFields(profile: ProductImageProfile) {
  return profileMissingFields(profile).map((field) => missingProfileFieldLabel[field])
}

export function profileDisplayTitle(profile: ProductImageProfile) {
  return profile.productTitle.trim()
    || profile.titleEn.trim()
    || profile.brand.trim()
    || profile.pskuCode
}

export function isManagedAssetUrl(imageUrl?: string) {
  return Boolean(imageUrl?.startsWith('/api/product-images/assets/'))
}

export function formatImageSize(sizeBytes?: number) {
  if (typeof sizeBytes !== 'number') return '-'
  if (sizeBytes < 1024) return `${sizeBytes} B`
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`
  return `${(sizeBytes / 1024 / 1024).toFixed(2)} MB`
}

export function isCompleteImageMetadata(detail: { height?: number; sizeBytes?: number; width?: number }) {
  return Boolean(detail.width && detail.height && typeof detail.sizeBytes === 'number')
}

export function metadataFallbackText(loading: boolean) {
  return loading ? '读取中' : '待补全'
}
