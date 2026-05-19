import type {
  LogisticsQuoteBundleDetailDto,
  LogisticsQuoteSourceFileDto,
  LogisticsQuoteSourceNoteDto
} from './types'

export function bundleStatusColor(status?: string): string {
  switch (status) {
    case 'PUBLISHED':
      return 'success'
    case 'DRAFT':
      return 'warning'
    case 'READY_FOR_REVIEW':
    case 'ANALYZED':
      return 'processing'
    default:
      return 'default'
  }
}

export function recommendationColor(level?: string): string {
  switch (level) {
    case 'A':
      return 'success'
    case 'B':
      return 'processing'
    case 'C':
      return 'warning'
    case 'D':
      return 'error'
    default:
      return 'default'
  }
}

export function transportModeColor(mode?: string): string {
  switch (mode) {
    case 'AIR':
      return 'geekblue'
    case 'SEA':
      return 'cyan'
    case 'WAREHOUSE':
      return 'geekblue'
    default:
      return 'default'
  }
}

export function transportModeLabel(mode?: string): string {
  switch (mode) {
    case 'AIR':
      return '空运'
    case 'SEA':
      return '海运'
    case 'WAREHOUSE':
      return '海外仓'
    default:
      return mode || '-'
  }
}

export function operationPriceTargetTypeLabel(targetType?: string): string {
  switch (targetType) {
    case 'BASE_PRICE':
      return '基础价'
    case 'TRANSPORT_FEE':
      return '附加费'
    case 'WAREHOUSE_PROCESSING_FEE':
      return '商品处理费'
    default:
      return targetType || '-'
  }
}

export function operationPriceStatusColor(status?: string): string {
  switch (status) {
    case 'NORMAL':
      return 'success'
    case 'INQUIRY':
      return 'warning'
    case 'FREE':
    case 'INCLUDED':
      return 'processing'
    default:
      return 'default'
  }
}

export function formatOperationPrice(value?: number | null, currency?: string, billingUnit?: string): string {
  if (typeof value !== 'number') {
    return '-'
  }
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(2)
  return `${currency || 'RMB'} ${formatted}${billingUnit ? ` / ${billingUnit}` : ''}`
}

export function polarityColor(polarity?: string): string {
  switch (polarity) {
    case 'POSITIVE':
      return 'success'
    case 'NEGATIVE':
      return 'error'
    case 'NEUTRAL':
      return 'default'
    default:
      return 'default'
  }
}

export function severityColor(severity?: string): string {
  switch (severity) {
    case 'HARD':
    case 'CRITICAL':
      return 'error'
    case 'SOFT':
    case 'MEDIUM':
      return 'warning'
    case 'LOW':
      return 'default'
    default:
      return 'default'
  }
}

export function formatUnitPrice(value?: number | null, currency?: string): string {
  if (typeof value !== 'number') {
    return '-'
  }
  return `${value}${currency ? ` ${currency}` : ''}`
}

export function extractPreferredNote(
  bundle?: LogisticsQuoteBundleDetailDto | null,
  selectedNoteId?: number | null
): string {
  if (!bundle) {
    return ''
  }
  if (typeof selectedNoteId === 'number') {
    const explicitMatch = bundle.notes.find((item) => item.id === selectedNoteId)
    if (explicitMatch) {
      return explicitMatch.content
    }
  }
  return (
    bundle.notes.find((item) => item.noteType === 'manual_note')?.content ??
    bundle.notes.find((item) => item.sourceChannel === 'wechat')?.content ??
    bundle.notes[0]?.content ??
    ''
  )
}

export function selectEditableNote(
  bundle?: LogisticsQuoteBundleDetailDto | null,
  selectedNoteId?: number | null
): LogisticsQuoteSourceNoteDto | null {
  if (!bundle) {
    return null
  }
  if (typeof selectedNoteId === 'number') {
    const explicitMatch = bundle.notes.find((item) => item.id === selectedNoteId)
    if (explicitMatch) {
      return explicitMatch
    }
  }
  return (
    bundle.notes.find((item) => item.noteType === 'manual_note') ??
    bundle.notes.find((item) => item.sourceChannel === 'wechat') ??
    bundle.notes[0] ??
    null
  )
}

export function resolveCurrentSelectedNoteId(
  bundle?: LogisticsQuoteBundleDetailDto | null,
  rememberedNoteId?: number | null
): number | null {
  if (!bundle) {
    return null
  }
  const noteIds = new Set(
    bundle.notes.map((item) => item.id).filter((value): value is number => typeof value === 'number')
  )
  if (typeof rememberedNoteId === 'number' && noteIds.has(rememberedNoteId)) {
    return rememberedNoteId
  }
  if (typeof bundle.selectedNoteId === 'number' && noteIds.has(bundle.selectedNoteId)) {
    return bundle.selectedNoteId
  }
  return (
    bundle.notes.find((item) => item.noteType === 'manual_note')?.id ??
    bundle.notes.find((item) => item.sourceChannel === 'wechat')?.id ??
    bundle.notes[0]?.id ??
    null
  )
}

export function selectEditableFile(
  bundle?: LogisticsQuoteBundleDetailDto | null,
  fileId?: number | null
): LogisticsQuoteSourceFileDto | null {
  if (!bundle) {
    return null
  }
  if (typeof fileId === 'number') {
    const explicitMatch = bundle.files.find((item) => item.id === fileId)
    if (explicitMatch) {
      return explicitMatch
    }
  }
  return bundle.files[bundle.files.length - 1] ?? bundle.files[0] ?? null
}

export function resolveCurrentSelectedFileId(
  bundle?: LogisticsQuoteBundleDetailDto | null,
  localSelectedFileId?: number | null,
  rememberedFileId?: number | null
): number | null {
  if (!bundle) {
    return null
  }
  const fileIds = new Set(
    bundle.files.map((item) => item.id).filter((value): value is number => typeof value === 'number')
  )
  if (typeof localSelectedFileId === 'number' && fileIds.has(localSelectedFileId)) {
    return localSelectedFileId
  }
  if (typeof rememberedFileId === 'number' && fileIds.has(rememberedFileId)) {
    return rememberedFileId
  }
  if (typeof bundle.selectedFileId === 'number' && fileIds.has(bundle.selectedFileId)) {
    return bundle.selectedFileId
  }
  return bundle.files[bundle.files.length - 1]?.id ?? bundle.files[0]?.id ?? null
}
