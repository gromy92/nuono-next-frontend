import type {
  LogisticsQuoteNotePreviewResponse,
  LogisticsQuoteWorkbenchResponse
} from './types'

export type WorkbenchState =
  | { status: 'loading' }
  | { status: 'success'; data: LogisticsQuoteWorkbenchResponse }
  | { status: 'error'; message: string }

export type NotePreviewState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: LogisticsQuoteNotePreviewResponse }
  | { status: 'error'; message: string }

export type AsyncActionState = {
  status: 'idle' | 'loading' | 'error'
  message?: string
}

export type BundleSelectionState = Record<
  number,
  {
    noteId?: number | null
    fileId?: number | null
  }
>

export type SourceBundleCreateDraft = {
  forwarderName: string
  forwarderAlias: string
  bundleName: string
  analysisSummary: string
  filesText: string
  notesText: string
}

export type AppendFileDraft = {
  fileName: string
  fileType: string
  filePath: string
}

export type FileEditDraft = {
  fileId: number
  fileName: string
  fileType: string
  filePath: string
}

export type QuoteDraftConfig = {
  serviceName: string
  countryCode: string
  routeCode: string
  transportMode: string
  businessType: string
  serviceScope: string
  currency: string
  versionNo: string
  effectiveFrom: string
  summary: string
}
