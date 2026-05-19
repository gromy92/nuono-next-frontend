import type {
  AppendFileDraft,
  AsyncActionState,
  QuoteDraftConfig,
  SourceBundleCreateDraft
} from './state'

export const emptyCreateDraft: SourceBundleCreateDraft = {
  forwarderName: '',
  forwarderAlias: '',
  bundleName: '',
  analysisSummary: '',
  filesText: '',
  notesText: ''
}

export const emptyAppendFileDraft: AppendFileDraft = {
  fileName: '',
  fileType: '',
  filePath: ''
}

export const initialQuoteDraftConfig: QuoteDraftConfig = {
  serviceName: '',
  countryCode: 'SA',
  routeCode: 'CN-SA',
  transportMode: 'SEA',
  businessType: 'B2B',
  serviceScope: 'FIRST_LEG',
  currency: 'CNY',
  versionNo: '',
  effectiveFrom: '',
  summary: ''
}

export const idleActionState: AsyncActionState = { status: 'idle' }
