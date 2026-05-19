import type { QuoteDraftConfig, SourceBundleCreateDraft } from './state'
import type {
  LogisticsQuoteDraftFromNoteRequest,
  LogisticsQuoteSourceBundleCreateRequest
} from './types'

export function buildSourceBundleCreateRequest(
  createDraft: SourceBundleCreateDraft,
  archiveFiles: File[] = []
): LogisticsQuoteSourceBundleCreateRequest {
  const files = createDraft.filesText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [fileName, fileType, filePath] = line.split('|').map((item) => item?.trim() ?? '')
      return { fileName, fileType: fileType || undefined, filePath: filePath || undefined }
    })
    .concat(
      archiveFiles.map((file) => ({
        fileName: file.name,
        fileType: inferCreateFileType(file.name),
        filePath: undefined
      }))
    )

  const notes = createDraft.notesText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('|').map((item) => item?.trim() ?? '')
      const sourceChannel = parts.length > 1 ? parts[0] : 'manual'
      const content = parts.length > 1 ? parts.slice(1).join('|').trim() : line
      return { noteType: 'manual_note', sourceChannel: sourceChannel || 'manual', content: content || line }
    })

  return {
    forwarderName: createDraft.forwarderName.trim(),
    forwarderAlias: createDraft.forwarderAlias.trim() || undefined,
    bundleName: createDraft.bundleName.trim(),
    analysisStatus: 'DRAFT',
    analysisSummary: createDraft.analysisSummary.trim() || undefined,
    files,
    notes
  }
}

function inferCreateFileType(fileName: string) {
  const normalized = fileName.trim().toLowerCase()
  if (normalized.endsWith('.pdf')) {
    return 'pdf'
  }
  if (normalized.endsWith('.xls') || normalized.endsWith('.xlsx') || normalized.endsWith('.csv')) {
    return 'excel'
  }
  if (normalized.endsWith('.png') || normalized.endsWith('.jpg') || normalized.endsWith('.jpeg') || normalized.endsWith('.webp')) {
    return 'image'
  }
  if (normalized.endsWith('.doc') || normalized.endsWith('.docx')) {
    return 'word'
  }
  if (normalized.endsWith('.txt')) {
    return 'text'
  }
  return 'unknown'
}

export function buildQuoteDraftFromNoteRequest(
  noteId: number,
  quoteDraftConfig: QuoteDraftConfig
): LogisticsQuoteDraftFromNoteRequest {
  return {
    noteId,
    serviceName: quoteDraftConfig.serviceName.trim(),
    countryCode: quoteDraftConfig.countryCode.trim() || undefined,
    routeCode: quoteDraftConfig.routeCode.trim() || undefined,
    transportMode: quoteDraftConfig.transportMode.trim() || undefined,
    businessType: quoteDraftConfig.businessType.trim() || undefined,
    serviceScope: quoteDraftConfig.serviceScope.trim() || undefined,
    currency: quoteDraftConfig.currency.trim() || undefined,
    versionNo: quoteDraftConfig.versionNo.trim() || undefined,
    effectiveFrom: quoteDraftConfig.effectiveFrom.trim() || undefined,
    summary: quoteDraftConfig.summary.trim() || undefined
  }
}
