import type { AuthSession } from '../auth/session'
import type { ImageRole, ImageRoleOption, SuiteAssetRole, SuiteStatus } from './productImageProfileTypes'

export const imageRoleOptions: ImageRoleOption[] = [
  { label: '主图', value: 'MAIN' },
  { label: '尺寸图', value: 'SIZE' },
  { label: '细节', value: 'DETAIL' },
  { label: '场景', value: 'SCENE' },
  { label: '包装', value: 'PACKAGE' }
]

export const imageRoleLabel: Record<ImageRole, string> = {
  MAIN: '主图',
  SIZE: '尺寸图',
  DETAIL: '细节',
  SCENE: '场景',
  PACKAGE: '包装',
  OTHER: '未分类'
}

export function imageRoleSelectOptions(value: ImageRole): ImageRoleOption[] {
  return value === 'OTHER'
    ? [{ label: imageRoleLabel.OTHER, value: 'OTHER' as ImageRole, disabled: true }, ...imageRoleOptions]
    : imageRoleOptions
}

export const suiteStatusMeta: Record<SuiteStatus, { label: string; color: string }> = {
  DRAFT: { label: '候选', color: 'blue' },
  ADOPTED: { label: '当前采用', color: 'green' },
  HISTORICAL: { label: '历史采用', color: 'default' },
  DISCARDED: { label: '废弃', color: 'red' },
  PENDING_GENERATION: { label: '待做图', color: 'default' },
  GENERATING: { label: '做图中', color: 'processing' },
  PENDING_REVIEW: { label: '待审核', color: 'warning' },
  REGENERATING: { label: '重新做图中', color: 'processing' },
  PUBLISHING: { label: '发布中', color: 'processing' },
  ONLINE: { label: '已上线', color: 'success' },
  FAILED: { label: '失败', color: 'error' }
}

export const suiteAssetRoleLabel: Record<SuiteAssetRole, string> = {
  MAIN: '头图',
  SIZE: '尺寸',
  CORE_FEATURE: '卖点',
  MATERIAL_DETAIL: '细节',
  USAGE_SCENE: '场景',
  PACKAGE_LIST: '包装'
}

export const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
export const maxImageBytes = 8 * 1024 * 1024
export const fallbackAccentColors = ['#f6d44b', '#0f766e', '#7c3aed', '#f97316', '#2563eb', '#14b8a6']

export function optionalText(value?: string | null) {
  return value?.trim() || ''
}

export function optionalNumber(value?: number | null) {
  return typeof value === 'number' ? value : undefined
}

export function currentStoreCode(session: AuthSession) {
  return session.currentStore?.storeCode || ''
}

export function currentStoreName(session: AuthSession) {
  return session.currentStore?.projectName
    || session.currentStore?.orgName
    || session.currentStore?.storeCode
    || '当前店铺'
}

export function currentOperatorName(session: AuthSession) {
  return session.realName || session.accountNo || String(session.userId)
}

export function splitImportUrls(value: string) {
  const seen = new Set<string>()
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter((item) => {
      if (!item || seen.has(item)) {
        return false
      }
      seen.add(item)
      return true
    })
}

export function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export function inferMarketplacePlatform(rawUrl: string): 'Amazon' | 'Noon' | undefined {
  try {
    const host = new URL(rawUrl.trim()).hostname.toLowerCase()
    if (host.includes('amazon.') || host.includes('amzn.')) {
      return 'Amazon'
    }
    if (host.includes('noon.')) {
      return 'Noon'
    }
    return undefined
  } catch {
    return undefined
  }
}

export function accentAt(index: number) {
  return fallbackAccentColors[index % fallbackAccentColors.length]
}
