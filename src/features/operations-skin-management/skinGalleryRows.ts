import type { OperationsSkinStatus, OperationsSkinView } from './types'

export type OperationsSkinGalleryStatus = OperationsSkinStatus | 'ALL'

export type OperationsSkinGalleryRow = OperationsSkinView & {
  source: 'store' | 'system-preview'
  previewTone: 'studio' | 'lifestyle' | 'texture' | 'festival'
}

type ResolveOperationsSkinGalleryRowsParams = {
  rows: OperationsSkinView[]
  storeCode?: string
  keyword?: string
  status: OperationsSkinGalleryStatus
}

const SYSTEM_PRESET_SKINS: Array<{
  skinName: string
  styleDescription: string
  remark: string
  coverImageUrl?: string
  previewTone: OperationsSkinGalleryRow['previewTone']
}> = [
  {
    skinName: 'PAPERSAY 黄框头图',
    styleDescription: '磁性白板笔头图模板',
    remark: '系统预设',
    coverImageUrl: '/operations-skins/papersay-whiteboard-main-clean-vector.png',
    previewTone: 'studio'
  },
  {
    skinName: '生活场景',
    styleDescription: '真实家居或户外使用氛围，突出商品尺寸、搭配和使用状态。',
    remark: '系统预设',
    previewTone: 'lifestyle'
  },
  {
    skinName: '质感特写',
    styleDescription: '近景构图、材质纹理、细节高光，适合强化卖点和品质感。',
    remark: '系统预设',
    previewTone: 'texture'
  },
  {
    skinName: '节日促销',
    styleDescription: '强活动氛围、明确信息层级，适合大促、上新和专题商品图。',
    remark: '系统预设',
    previewTone: 'festival'
  }
]

export function resolveOperationsSkinGalleryRows({
  rows,
  storeCode,
  keyword,
  status
}: ResolveOperationsSkinGalleryRowsParams): OperationsSkinGalleryRow[] {
  const sourceRows = rows.length ? rows.map(toStoreRow) : buildSystemPresetRows(storeCode)
  return sourceRows.filter((row) => matchesStatus(row, status) && matchesKeyword(row, keyword))
}

export function isSystemPreviewSkin(row: OperationsSkinView) {
  return row.id < 0
}

function buildSystemPresetRows(storeCode?: string): OperationsSkinGalleryRow[] {
  if (!storeCode) {
    return []
  }
  return SYSTEM_PRESET_SKINS.map((skin, index) => ({
    id: -1000 - index,
    storeCode,
    skinName: skin.skinName,
    status: 'ACTIVE',
    coverImageUrl: skin.coverImageUrl ?? null,
    styleDescription: skin.styleDescription,
    remark: skin.remark,
    assets: skin.coverImageUrl ? [{ imageUrl: skin.coverImageUrl, sortOrder: 0 }] : [],
    updatedAt: null,
    source: 'system-preview',
    previewTone: skin.previewTone
  }))
}

function toStoreRow(row: OperationsSkinView): OperationsSkinGalleryRow {
  return {
    ...row,
    source: 'store',
    previewTone: previewToneForStoreRow(row)
  }
}

function previewToneForStoreRow(row: OperationsSkinView): OperationsSkinGalleryRow['previewTone'] {
  const tones: Array<OperationsSkinGalleryRow['previewTone']> = ['studio', 'lifestyle', 'texture', 'festival']
  return tones[Math.abs(row.id) % tones.length]
}

function matchesStatus(row: OperationsSkinView, status: OperationsSkinGalleryStatus) {
  return status === 'ALL' || row.status === status
}

function matchesKeyword(row: OperationsSkinView, keyword?: string) {
  const normalizedKeyword = keyword?.trim().toLowerCase()
  if (!normalizedKeyword) {
    return true
  }
  return [row.skinName, row.styleDescription, row.remark]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedKeyword))
}
