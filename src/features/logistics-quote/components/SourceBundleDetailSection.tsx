import type { Dispatch, SetStateAction } from 'react'
import { Space } from 'antd'
import type { AppendFileDraft, AsyncActionState, FileEditDraft } from '../state'
import type { LogisticsQuoteBundleDetailDto, LogisticsQuoteSourceFileDto } from '../types'
import { AnalysisSummaryCard } from './AnalysisSummaryCard'
import { BundleHeaderCard } from './BundleHeaderCard'
import { SourceFilesCard } from './SourceFilesCard'

type SourceBundleDetailSectionProps = {
  bundle: LogisticsQuoteBundleDetailDto
  workbenchMode: string
  currentSelectedNoteId: number | null
  currentSelectedFileId: number | null
  editableFile: LogisticsQuoteSourceFileDto | null
  fileEditDraft: FileEditDraft
  fileEditState: AsyncActionState
  appendFileDraft: AppendFileDraft
  appendFileState: AsyncActionState
  archiveFileState: AsyncActionState
  analysisSummaryDraft: string
  analysisSummaryState: AsyncActionState
  setSelectedFileId: Dispatch<SetStateAction<number | null>>
  setFileEditDraft: Dispatch<SetStateAction<FileEditDraft>>
  setAppendFileDraft: Dispatch<SetStateAction<AppendFileDraft>>
  setAnalysisSummaryDraft: Dispatch<SetStateAction<string>>
  rememberBundleSelection: (bundleId?: number | null, noteId?: number | null, fileId?: number | null) => void
  onSaveAnalysisSummary: () => void
  onUpdateFile: () => void
  onAppendFile: () => void
  onArchiveFileUpload: (file: File) => void
}

export function SourceBundleDetailSection({
  bundle,
  workbenchMode,
  currentSelectedNoteId,
  currentSelectedFileId,
  editableFile,
  fileEditDraft,
  fileEditState,
  appendFileDraft,
  appendFileState,
  archiveFileState,
  analysisSummaryDraft,
  analysisSummaryState,
  setSelectedFileId,
  setFileEditDraft,
  setAppendFileDraft,
  setAnalysisSummaryDraft,
  rememberBundleSelection,
  onSaveAnalysisSummary,
  onUpdateFile,
  onAppendFile,
  onArchiveFileUpload
}: SourceBundleDetailSectionProps) {
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <BundleHeaderCard bundle={bundle} workbenchMode={workbenchMode} />
      <AnalysisSummaryCard
        bundle={bundle}
        workbenchMode={workbenchMode}
        analysisSummaryDraft={analysisSummaryDraft}
        analysisSummaryState={analysisSummaryState}
        setAnalysisSummaryDraft={setAnalysisSummaryDraft}
        onSaveAnalysisSummary={onSaveAnalysisSummary}
      />
      <SourceFilesCard
        bundle={bundle}
        workbenchMode={workbenchMode}
        currentSelectedNoteId={currentSelectedNoteId}
        currentSelectedFileId={currentSelectedFileId}
        editableFile={editableFile}
        fileEditDraft={fileEditDraft}
        fileEditState={fileEditState}
        appendFileDraft={appendFileDraft}
        appendFileState={appendFileState}
        archiveFileState={archiveFileState}
        setSelectedFileId={setSelectedFileId}
        setFileEditDraft={setFileEditDraft}
        setAppendFileDraft={setAppendFileDraft}
        rememberBundleSelection={rememberBundleSelection}
        onUpdateFile={onUpdateFile}
        onAppendFile={onAppendFile}
        onArchiveFileUpload={onArchiveFileUpload}
      />
    </Space>
  )
}
