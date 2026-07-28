import { Tag } from 'antd'
import type { AuthSession } from '../auth/session'
import type { OperationsSkinGalleryRow } from './skinGalleryRows'
import {
  HERO_MAIN_COMPONENT_SLOTS,
  SUITE_IMAGE_COMPONENT_SLOT_GROUPS,
  countConfiguredSkinComponents
} from './skinDetailSuites'
import type { OperationsSkinSaveRequest, OperationsSkinStatus, OperationsSkinView } from './types'

export type OperationsSkinManagementPageProps = {
  session: AuthSession
}

export type StatusFilter = OperationsSkinStatus | 'ALL'

export type SkinFormValues = {
  skinName: string
  status: OperationsSkinStatus
  coverImageUrl?: string
  styleDescription?: string
  config?: SkinDesignConfig
  assets?: string[]
  remark?: string
}

export type SkinDesignConfig = {
  scenario?: string
  heroFramePng?: string
  heroBrandPng?: string
  heroSpecBackgroundPng?: string
  heroMainTitleBackgroundPng?: string
  detailTitleBar?: string
  detailTitleStyle?: string
  detailContentFrame?: string
  detailImageSafeArea?: string
  detailBodyText?: string
}

export type ScopedSkinRows = {
  scope: string
  rows: OperationsSkinView[]
}

export const STATUS_OPTIONS: Array<{ label: string; value: OperationsSkinStatus }> = [
  { label: '启用', value: 'ACTIVE' },
  { label: '停用', value: 'INACTIVE' }
]

export const STATUS_FILTER_OPTIONS: Array<{ label: string; value: StatusFilter }> = [
  { label: '全部状态', value: 'ALL' },
  ...STATUS_OPTIONS
]

export const ACCEPT_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif']
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024
export const SKIN_REMARK_PREFIX = 'SKIN_CONFIG_JSON:'

export const SCENARIO_OPTIONS = [
  { label: '通用', value: '通用' },
  { label: '礼品', value: '礼品' },
  { label: '办公', value: '办公' },
  { label: '母婴', value: '母婴' },
  { label: '家居', value: '家居' },
  { label: '促销', value: '促销' }
]

export const DEFAULT_SKIN_CONFIG: Required<SkinDesignConfig> = {
  scenario: '通用',
  heroFramePng: '透明 PNG，包含黄色外框和圆角，商品图生成时作为最上层框架',
  heroBrandPng: '透明 PNG，包含品牌黄色底和品牌名，不抠除 logo 白色背景',
  heroSpecBackgroundPng: '透明 PNG，深绿色圆角规格背景条，不包含规格文字',
  heroMainTitleBackgroundPng: '透明 PNG，底部主标题浅黄色背景，不包含标题文字',
  detailTitleBar: '标题背景跟主图规格条一致，深绿色圆角条',
  detailTitleStyle: '标题深绿色或白色按背景反差选择，字体与主图一致',
  detailContentFrame: '黄色外框，透明背景，内容区留白稳定',
  detailImageSafeArea: '副图商品或细节图占画面 68%-80%，不贴边',
  detailBodyText: '说明文字弱化，优先服务材质、尺寸、功能和场景信息'
}

export function normalizeSkinConfig(config?: SkinDesignConfig): Required<SkinDesignConfig> {
  return {
    ...DEFAULT_SKIN_CONFIG,
    ...Object.fromEntries(
      Object.entries(config ?? {})
        .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
        .filter(([, value]) => Boolean(value))
    )
  }
}

export function decodeSkinRemark(value?: string | null): { note: string; config: Required<SkinDesignConfig> } {
  const remark = (value ?? '').trim()
  if (!remark.startsWith(SKIN_REMARK_PREFIX)) {
    return { note: remark, config: normalizeSkinConfig() }
  }

  try {
    const payload = JSON.parse(remark.slice(SKIN_REMARK_PREFIX.length)) as {
      note?: string
      config?: SkinDesignConfig
    }
    return {
      note: (payload.note ?? '').trim(),
      config: normalizeSkinConfig(payload.config)
    }
  } catch {
    return { note: '', config: normalizeSkinConfig() }
  }
}

export function encodeSkinRemark(note?: string, config?: SkinDesignConfig) {
  const normalizedConfig = normalizeSkinConfig(config)
  const trimmedNote = note?.trim()
  if (!trimmedNote && JSON.stringify(normalizedConfig) === JSON.stringify(DEFAULT_SKIN_CONFIG)) {
    return undefined
  }
  return `${SKIN_REMARK_PREFIX}${JSON.stringify({
    note: trimmedNote || undefined,
    config: normalizedConfig
  })}`
}

export function statusTag(status: OperationsSkinStatus) {
  return status === 'ACTIVE' ? <Tag color="success">启用</Tag> : <Tag>停用</Tag>
}

export function formatTime(value?: string | null) {
  if (!value) return '-'
  return value.replace('T', ' ').slice(0, 19)
}

export function normalizeImageUrls(urls?: Array<string | null | undefined>) {
  const seen = new Set<string>()
  return (urls ?? [])
    .map((url) => (url ?? '').trim())
    .filter((url) => {
      if (!url || seen.has(url)) {
        return false
      }
      seen.add(url)
      return true
    })
}

export function skinAssets(row: OperationsSkinView) {
  return normalizeImageUrls(row.assets?.map((asset) => asset.imageUrl))
}

export function skinCover(row: OperationsSkinView) {
  return (row.coverImageUrl ?? '').trim() || skinAssets(row)[0] || ''
}

export function skinAssetCount(row: OperationsSkinView) {
  return skinAssets(row).length
}

export function skinHeroComponentCount(row: OperationsSkinView) {
  if (typeof row.heroComponentCount === 'number') {
    return row.heroComponentCount
  }
  return countConfiguredSkinComponents(row.components, HERO_MAIN_COMPONENT_SLOTS)
}

export function skinHeroComponentRequiredCount(row: OperationsSkinView) {
  return row.heroComponentRequiredCount ?? HERO_MAIN_COMPONENT_SLOTS.length
}

export function skinSuiteComponentCount(row: OperationsSkinView) {
  return countConfiguredSkinComponents(
    row.components,
    SUITE_IMAGE_COMPONENT_SLOT_GROUPS.flatMap((group) => group.slots.filter((slot) => slot.required))
  )
}

export function skinSuiteComponentRequiredCount() {
  return SUITE_IMAGE_COMPONENT_SLOT_GROUPS
    .flatMap((group) => group.slots.filter((slot) => slot.required))
    .length
}

export function skinScenario(row: OperationsSkinView) {
  return decodeSkinRemark(row.remark).config.scenario
}

export function skinNote(row: OperationsSkinView) {
  return decodeSkinRemark(row.remark).note
}

export function trimOptional(value?: string) {
  const nextValue = value?.trim()
  return nextValue || undefined
}

export function buildSaveRequest(storeCode: string, values: SkinFormValues): OperationsSkinSaveRequest {
  const assets = normalizeImageUrls(values.assets)
  const coverImageUrl = trimOptional(values.coverImageUrl) || assets[0]
  return {
    storeCode,
    skinName: values.skinName.trim(),
    status: values.status,
    coverImageUrl,
    styleDescription: trimOptional(values.styleDescription),
    remark: encodeSkinRemark(values.remark, values.config),
    assets: assets.map((imageUrl, index) => ({ imageUrl, sortOrder: index }))
  }
}

export function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

