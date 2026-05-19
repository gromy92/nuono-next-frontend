import type { Dispatch, MutableRefObject, SetStateAction } from 'react'
import { useCallback } from 'react'
import {
  appendLogisticsQuoteSourceBundleFile,
  appendLogisticsQuoteSourceBundleNote,
  archiveLogisticsQuoteSourceBundleFile,
  createLogisticsQuoteSourceBundle,
  updateLogisticsQuoteSourceBundleAnalysisSummary,
  updateLogisticsQuoteSourceBundleFile,
  updateLogisticsQuoteSourceBundleNote
} from '../api'
import { emptyAppendFileDraft, emptyCreateDraft } from '../defaults'
import { buildSourceBundleCreateRequest } from '../requestMappers'
import type {
  AppendFileDraft,
  AsyncActionState,
  FileEditDraft,
  SourceBundleCreateDraft
} from '../state'
import type {
  LogisticsQuoteBundleDetailDto,
  LogisticsQuoteSourceNoteDto,
  LogisticsQuoteWorkbenchResponse
} from '../types'

type UseLogisticsQuoteBoardActionsParams = {
  selectedBundle: LogisticsQuoteBundleDetailDto | null
  currentSelectedNoteId: number | null
  currentSelectedFileId: number | null
  editableNote: LogisticsQuoteSourceNoteDto | null
  createDraft: SourceBundleCreateDraft
  createArchiveFiles: File[]
  noteEditDraft: string
  appendNoteDraft: string
  appendFileDraft: AppendFileDraft
  fileEditDraft: FileEditDraft
  analysisSummaryDraft: string
  beginWorkbenchRequest: () => number
  commitWorkbenchData: (data: LogisticsQuoteWorkbenchResponse, requestId?: number) => boolean
  workbenchRequestIdRef: MutableRefObject<number>
  setCreateDraft: Dispatch<SetStateAction<SourceBundleCreateDraft>>
  setCreateArchiveFiles: Dispatch<SetStateAction<File[]>>
  setCreateState: Dispatch<SetStateAction<AsyncActionState>>
  setNoteEditState: Dispatch<SetStateAction<AsyncActionState>>
  setAppendNoteDraft: Dispatch<SetStateAction<string>>
  setAppendNoteState: Dispatch<SetStateAction<AsyncActionState>>
  setAppendFileDraft: Dispatch<SetStateAction<AppendFileDraft>>
  setAppendFileState: Dispatch<SetStateAction<AsyncActionState>>
  setArchiveFileState: Dispatch<SetStateAction<AsyncActionState>>
  setFileEditState: Dispatch<SetStateAction<AsyncActionState>>
  setAnalysisSummaryState: Dispatch<SetStateAction<AsyncActionState>>
}

export function useLogisticsQuoteBoardActions({
  selectedBundle,
  currentSelectedNoteId,
  currentSelectedFileId,
  editableNote,
  createDraft,
  createArchiveFiles,
  noteEditDraft,
  appendNoteDraft,
  appendFileDraft,
  fileEditDraft,
  analysisSummaryDraft,
  beginWorkbenchRequest,
  commitWorkbenchData,
  workbenchRequestIdRef,
  setCreateDraft,
  setCreateArchiveFiles,
  setCreateState,
  setNoteEditState,
  setAppendNoteDraft,
  setAppendNoteState,
  setAppendFileDraft,
  setAppendFileState,
  setArchiveFileState,
  setFileEditState,
  setAnalysisSummaryState
}: UseLogisticsQuoteBoardActionsParams) {
  const handleCreateSourceBundle = useCallback(async () => {
    setCreateState({ status: 'loading' })
    const requestId = beginWorkbenchRequest()
    let latestData: LogisticsQuoteWorkbenchResponse | null = null
    try {
      let data = await createLogisticsQuoteSourceBundle(buildSourceBundleCreateRequest(createDraft, createArchiveFiles))
      latestData = data
      const usedFileIds = new Set<number>()
      for (const archiveFile of createArchiveFiles) {
        const targetFile = data.selectedBundle?.files.find((item) => {
          if (typeof item.id !== 'number' || usedFileIds.has(item.id)) {
            return false
          }
          return item.fileName === archiveFile.name
        })
        if (typeof targetFile?.id === 'number') {
          usedFileIds.add(targetFile.id)
        }
        data = await archiveLogisticsQuoteSourceBundleFile(
          data.selectedBundleId ?? data.selectedBundle?.id ?? 0,
          archiveFile,
          data.selectedBundle?.selectedNoteId ?? undefined,
          targetFile?.id
        )
        latestData = data
      }
      if (!commitWorkbenchData(data, requestId)) {
        setCreateState({ status: 'idle' })
        return
      }
      setCreateDraft(emptyCreateDraft)
      setCreateArchiveFiles([])
      setCreateState({ status: 'idle' })
    } catch (error) {
      if (requestId !== workbenchRequestIdRef.current) {
        setCreateState({ status: 'idle' })
        return
      }
      if (latestData) {
        commitWorkbenchData(latestData, requestId)
      }
      setCreateState({
        status: 'error',
        message: error instanceof Error ? error.message : '来源包保存或文件归档失败'
      })
    }
  }, [
    beginWorkbenchRequest,
    commitWorkbenchData,
    createArchiveFiles,
    createDraft,
    setCreateArchiveFiles,
    setCreateDraft,
    setCreateState,
    workbenchRequestIdRef
  ])

  const handleUpdateSelectedNote = useCallback(async () => {
    if (!selectedBundle?.id || !editableNote?.id) {
      setNoteEditState({ status: 'error', message: '当前没有可编辑的已保存补充文案。' })
      return
    }

    setNoteEditState({ status: 'loading' })
    const requestId = beginWorkbenchRequest()
    try {
      const data = await updateLogisticsQuoteSourceBundleNote(selectedBundle.id, {
        noteId: editableNote.id,
        content: noteEditDraft.trim()
      }, currentSelectedFileId ?? undefined)
      if (!commitWorkbenchData(data, requestId)) {
        setNoteEditState({ status: 'idle' })
        return
      }
      setNoteEditState({ status: 'idle' })
    } catch (error) {
      if (requestId !== workbenchRequestIdRef.current) {
        setNoteEditState({ status: 'idle' })
        return
      }
      setNoteEditState({
        status: 'error',
        message: error instanceof Error ? error.message : '补充文案更新失败'
      })
    }
  }, [beginWorkbenchRequest, commitWorkbenchData, currentSelectedFileId, editableNote?.id, noteEditDraft, selectedBundle?.id, setNoteEditState, workbenchRequestIdRef])

  const handleAppendNote = useCallback(async () => {
    if (!selectedBundle?.id) {
      setAppendNoteState({ status: 'error', message: '当前没有可追加文案的已保存来源包。' })
      return
    }

    setAppendNoteState({ status: 'loading' })
    const requestId = beginWorkbenchRequest()
    try {
      const data = await appendLogisticsQuoteSourceBundleNote(selectedBundle.id, {
        noteType: 'manual_note',
        sourceChannel: 'manual',
        content: appendNoteDraft.trim()
      }, currentSelectedFileId ?? undefined)
      if (!commitWorkbenchData(data, requestId)) {
        setAppendNoteState({ status: 'idle' })
        return
      }
      setAppendNoteDraft('')
      setAppendNoteState({ status: 'idle' })
    } catch (error) {
      if (requestId !== workbenchRequestIdRef.current) {
        setAppendNoteState({ status: 'idle' })
        return
      }
      setAppendNoteState({
        status: 'error',
        message: error instanceof Error ? error.message : '追加补充文案失败'
      })
    }
  }, [appendNoteDraft, beginWorkbenchRequest, commitWorkbenchData, currentSelectedFileId, selectedBundle?.id, setAppendNoteDraft, setAppendNoteState, workbenchRequestIdRef])

  const handleAppendFile = useCallback(async () => {
    if (!selectedBundle?.id) {
      setAppendFileState({ status: 'error', message: '当前没有可追加文件元数据的已保存来源包。' })
      return
    }

    setAppendFileState({ status: 'loading' })
    const requestId = beginWorkbenchRequest()
    try {
      const data = await appendLogisticsQuoteSourceBundleFile(selectedBundle.id, {
        fileName: appendFileDraft.fileName.trim(),
        fileType: appendFileDraft.fileType.trim() || undefined,
        filePath: appendFileDraft.filePath.trim() || undefined
      }, currentSelectedNoteId ?? undefined, currentSelectedFileId ?? undefined)
      if (!commitWorkbenchData(data, requestId)) {
        setAppendFileState({ status: 'idle' })
        return
      }
      setAppendFileDraft(emptyAppendFileDraft)
      setAppendFileState({ status: 'idle' })
    } catch (error) {
      if (requestId !== workbenchRequestIdRef.current) {
        setAppendFileState({ status: 'idle' })
        return
      }
      setAppendFileState({
        status: 'error',
        message: error instanceof Error ? error.message : '追加来源文件失败'
      })
    }
  }, [appendFileDraft, beginWorkbenchRequest, commitWorkbenchData, currentSelectedFileId, currentSelectedNoteId, selectedBundle?.id, setAppendFileDraft, setAppendFileState, workbenchRequestIdRef])

  const handleArchiveFileUpload = useCallback(async (file: File) => {
    if (!selectedBundle?.id) {
      setArchiveFileState({ status: 'error', message: '当前没有可归档文件的已保存来源包。' })
      return
    }

    setArchiveFileState({ status: 'loading' })
    const requestId = beginWorkbenchRequest()
    try {
      const data = await archiveLogisticsQuoteSourceBundleFile(
        selectedBundle.id,
        file,
        currentSelectedNoteId ?? undefined,
        currentSelectedFileId ?? undefined
      )
      if (!commitWorkbenchData(data, requestId)) {
        setArchiveFileState({ status: 'idle' })
        return
      }
      setArchiveFileState({ status: 'idle' })
    } catch (error) {
      if (requestId !== workbenchRequestIdRef.current) {
        setArchiveFileState({ status: 'idle' })
        return
      }
      setArchiveFileState({
        status: 'error',
        message: error instanceof Error ? error.message : '报价文件归档失败'
      })
    }
  }, [
    beginWorkbenchRequest,
    commitWorkbenchData,
    currentSelectedFileId,
    currentSelectedNoteId,
    selectedBundle?.id,
    setArchiveFileState,
    workbenchRequestIdRef
  ])

  const handleUpdateFile = useCallback(async () => {
    if (!selectedBundle?.id || !fileEditDraft.fileId) {
      setFileEditState({ status: 'error', message: '当前没有可编辑的已保存来源文件。' })
      return
    }

    setFileEditState({ status: 'loading' })
    const requestId = beginWorkbenchRequest()
    try {
      const data = await updateLogisticsQuoteSourceBundleFile(selectedBundle.id, {
        fileId: fileEditDraft.fileId,
        fileName: fileEditDraft.fileName.trim(),
        fileType: fileEditDraft.fileType.trim() || undefined,
        filePath: fileEditDraft.filePath.trim() || undefined
      }, currentSelectedNoteId ?? undefined, currentSelectedFileId ?? undefined)
      if (!commitWorkbenchData(data, requestId)) {
        setFileEditState({ status: 'idle' })
        return
      }
      setFileEditState({ status: 'idle' })
    } catch (error) {
      if (requestId !== workbenchRequestIdRef.current) {
        setFileEditState({ status: 'idle' })
        return
      }
      setFileEditState({
        status: 'error',
        message: error instanceof Error ? error.message : '更新来源文件失败'
      })
    }
  }, [beginWorkbenchRequest, commitWorkbenchData, currentSelectedFileId, currentSelectedNoteId, fileEditDraft, selectedBundle?.id, setFileEditState, workbenchRequestIdRef])

  const handleUpdateAnalysisSummary = useCallback(async () => {
    if (!selectedBundle?.id) {
      setAnalysisSummaryState({ status: 'error', message: '当前没有可编辑的已保存来源包。' })
      return
    }

    setAnalysisSummaryState({ status: 'loading' })
    const requestId = beginWorkbenchRequest()
    try {
      const data = await updateLogisticsQuoteSourceBundleAnalysisSummary(selectedBundle.id, {
        analysisSummary: analysisSummaryDraft.trim()
      }, currentSelectedNoteId ?? undefined, currentSelectedFileId ?? undefined)
      if (!commitWorkbenchData(data, requestId)) {
        setAnalysisSummaryState({ status: 'idle' })
        return
      }
      setAnalysisSummaryState({ status: 'idle' })
    } catch (error) {
      if (requestId !== workbenchRequestIdRef.current) {
        setAnalysisSummaryState({ status: 'idle' })
        return
      }
      setAnalysisSummaryState({
        status: 'error',
        message: error instanceof Error ? error.message : '来源摘要更新失败'
      })
    }
  }, [analysisSummaryDraft, beginWorkbenchRequest, commitWorkbenchData, currentSelectedFileId, currentSelectedNoteId, selectedBundle?.id, setAnalysisSummaryState, workbenchRequestIdRef])

  return {
    handleCreateSourceBundle,
    handleUpdateSelectedNote,
    handleAppendNote,
    handleAppendFile,
    handleArchiveFileUpload,
    handleUpdateFile,
    handleUpdateAnalysisSummary
  }
}
