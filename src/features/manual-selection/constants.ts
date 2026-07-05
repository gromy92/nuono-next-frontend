import type { SourceCollectionStatus } from '../source-collection/types'

export const MANUAL_SELECTION_CHANNEL_OPTIONS = [
  { label: 'Noon', value: 'Noon' },
  { label: 'Amazon', value: 'Amazon' },
  { label: 'SHEIN', value: 'SHEIN' },
  { label: 'Temu', value: 'Temu' }
]

export const MANUAL_SELECTION_COLLECTION_SOURCE_OPTIONS = [
  { label: '浏览器', value: 'browser' },
  { label: '插件', value: 'plugin' }
]

export const MANUAL_SELECTION_ANALYSIS_LINKED_OPTIONS = [
  { label: '已入组', value: 'linked' },
  { label: '未入组', value: 'unlinked' }
]

export const MANUAL_SELECTION_STATUS_OPTIONS = [
  { label: '采集中', value: 'running' },
  { label: '采集成功', value: 'success' },
  { label: '采集失败', value: 'failed' }
]

export const MANUAL_SELECTION_STATUS_BADGE: Record<SourceCollectionStatus, 'success' | 'processing' | 'error'> = {
  success: 'success',
  running: 'processing',
  failed: 'error'
}

export const MANUAL_SELECTION_IMAGE_FALLBACK = 'https://placehold.co/128x128/F7F8FA/8A93A3?text=IMG'
