import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchLogisticsQuoteWorkbench } from '../api'
import {
  emptyAppendFileDraft,
  emptyCreateDraft,
  idleActionState,
  initialQuoteDraftConfig
} from '../defaults'
import type {
  AppendFileDraft,
  AsyncActionState,
  BundleSelectionState,
  FileEditDraft,
  NotePreviewState,
  QuoteDraftConfig,
  SourceBundleCreateDraft,
  WorkbenchState
} from '../state'
import type { LogisticsQuoteWorkbenchResponse } from '../types'
import {
  extractPreferredNote,
  resolveCurrentSelectedFileId,
  resolveCurrentSelectedNoteId,
  selectEditableFile,
  selectEditableNote
} from '../utils'
import { useLogisticsQuoteBoardActions } from './useLogisticsQuoteBoardActions'
import { useLogisticsQuoteDraftActions } from './useLogisticsQuoteDraftActions'

export function useLogisticsQuoteBoardController() {
  const [workbenchState, setWorkbenchState] = useState<WorkbenchState>({ status: 'loading' })
  const bundleSelectionsRef = useRef<BundleSelectionState>({})
  const workbenchRequestIdRef = useRef(0)
  const [noteDraft, setNoteDraft] = useState('')
  const [notePreviewState, setNotePreviewState] = useState<NotePreviewState>({ status: 'idle' })
  const [createDraft, setCreateDraft] = useState<SourceBundleCreateDraft>(emptyCreateDraft)
  const [createArchiveFiles, setCreateArchiveFiles] = useState<File[]>([])
  const [createState, setCreateState] = useState<AsyncActionState>(idleActionState)
  const [noteEditDraft, setNoteEditDraft] = useState('')
  const [noteEditState, setNoteEditState] = useState<AsyncActionState>(idleActionState)
  const [appendNoteDraft, setAppendNoteDraft] = useState('')
  const [appendNoteState, setAppendNoteState] = useState<AsyncActionState>(idleActionState)
  const [appendFileDraft, setAppendFileDraft] = useState<AppendFileDraft>(emptyAppendFileDraft)
  const [appendFileState, setAppendFileState] = useState<AsyncActionState>(idleActionState)
  const [archiveFileState, setArchiveFileState] = useState<AsyncActionState>(idleActionState)
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null)
  const [fileEditDraft, setFileEditDraft] = useState<FileEditDraft>({
    fileId: 0,
    fileName: '',
    fileType: '',
    filePath: ''
  })
  const [fileEditState, setFileEditState] = useState<AsyncActionState>(idleActionState)
  const [analysisSummaryDraft, setAnalysisSummaryDraft] = useState('')
  const [analysisSummaryState, setAnalysisSummaryState] = useState<AsyncActionState>(idleActionState)
  const [quoteDraftConfig, setQuoteDraftConfig] = useState<QuoteDraftConfig>(initialQuoteDraftConfig)
  const [quoteDraftState, setQuoteDraftState] = useState<AsyncActionState>(idleActionState)

  const rememberBundleSelection = useCallback((bundleId?: number | null, noteId?: number | null, fileId?: number | null) => {
    if (typeof bundleId !== 'number') {
      return
    }
    const existing = bundleSelectionsRef.current[bundleId]
    if (existing?.noteId === noteId && existing?.fileId === fileId) {
      return
    }
    bundleSelectionsRef.current = {
      ...bundleSelectionsRef.current,
      [bundleId]: {
        noteId,
        fileId
      }
    }
  }, [])

  const beginWorkbenchRequest = useCallback(() => {
    const requestId = workbenchRequestIdRef.current + 1
    workbenchRequestIdRef.current = requestId
    return requestId
  }, [])

  const commitWorkbenchData = useCallback((data: LogisticsQuoteWorkbenchResponse, requestId?: number) => {
    if (typeof requestId === 'number' && requestId !== workbenchRequestIdRef.current) {
      return false
    }
    setWorkbenchState({ status: 'success', data })
    rememberBundleSelection(
      data.selectedBundleId ?? undefined,
      data.selectedBundle?.selectedNoteId ?? undefined,
      data.selectedBundle?.selectedFileId ?? undefined
    )
    return true
  }, [rememberBundleSelection])

  const loadWorkbench = useCallback(async (bundleId?: number, noteId?: number, fileId?: number) => {
    const requestId = beginWorkbenchRequest()
    setWorkbenchState({ status: 'loading' })
    try {
      const rememberedSelection = typeof bundleId === 'number' ? bundleSelectionsRef.current[bundleId] : undefined
      const data = await fetchLogisticsQuoteWorkbench(
        bundleId,
        typeof noteId === 'number' ? noteId : rememberedSelection?.noteId ?? undefined,
        typeof fileId === 'number' ? fileId : rememberedSelection?.fileId ?? undefined
      )
      if (requestId !== workbenchRequestIdRef.current) {
        return
      }
      commitWorkbenchData(data)
    } catch (error) {
      if (requestId !== workbenchRequestIdRef.current) {
        return
      }
      setWorkbenchState({
        status: 'error',
        message: error instanceof Error ? error.message : '货代管理工作台加载失败'
      })
    }
  }, [beginWorkbenchRequest, commitWorkbenchData])

  useEffect(() => {
    void loadWorkbench()
  }, [loadWorkbench])

  const selectedBundle = workbenchState.status === 'success' ? workbenchState.data.selectedBundle ?? null : null
  const rememberedSelection =
    typeof selectedBundle?.id === 'number' ? bundleSelectionsRef.current[selectedBundle.id] : undefined
  const currentSelectedNoteId = resolveCurrentSelectedNoteId(selectedBundle, rememberedSelection?.noteId ?? null)
  const editableNote = selectEditableNote(selectedBundle, currentSelectedNoteId)
  const currentSelectedFileId = resolveCurrentSelectedFileId(
    selectedBundle,
    selectedFileId,
    rememberedSelection?.fileId ?? null
  )
  const editableFile = selectEditableFile(selectedBundle, currentSelectedFileId)

  useEffect(() => {
    setNoteDraft(extractPreferredNote(selectedBundle, currentSelectedNoteId))
    setNoteEditDraft(editableNote?.content ?? '')
    setAnalysisSummaryDraft(selectedBundle?.analysisSummary ?? '')
    setNotePreviewState({ status: 'idle' })
    setNoteEditState({ status: 'idle' })
    setAppendNoteState({ status: 'idle' })
    setAppendFileState({ status: 'idle' })
    setArchiveFileState({ status: 'idle' })
    setFileEditState({ status: 'idle' })
    setAnalysisSummaryState({ status: 'idle' })
    setQuoteDraftState({ status: 'idle' })
  }, [currentSelectedNoteId, editableNote?.content, selectedBundle?.analysisSummary, selectedBundle?.id])

  useEffect(() => {
    setAppendFileDraft(emptyAppendFileDraft)
  }, [selectedBundle?.id])

  useEffect(() => {
    const firstService = selectedBundle?.services[0]
    setQuoteDraftConfig({
      serviceName: firstService?.serviceName ?? selectedBundle?.bundleName ?? '',
      countryCode: firstService?.countryCode ?? 'SA',
      routeCode: firstService?.routeCode ?? 'CN-SA',
      transportMode: firstService?.transportMode ?? 'SEA',
      businessType: firstService?.businessType ?? 'B2B',
      serviceScope: firstService?.serviceScope ?? 'FIRST_LEG',
      currency: selectedBundle?.rules[0]?.currency ?? 'CNY',
      versionNo: selectedBundle?.quoteVersion.status === 'SOURCE_ONLY' ? '' : selectedBundle?.quoteVersion.versionNo ?? '',
      effectiveFrom: selectedBundle?.quoteVersion.effectiveFrom ?? '',
      summary: selectedBundle?.quoteVersion.status === 'SOURCE_ONLY' ? '' : selectedBundle?.quoteVersion.summary ?? ''
    })
  }, [
    selectedBundle?.bundleName,
    selectedBundle?.id,
    selectedBundle?.quoteVersion.effectiveFrom,
    selectedBundle?.quoteVersion.status,
    selectedBundle?.quoteVersion.summary,
    selectedBundle?.quoteVersion.versionNo,
    selectedBundle?.rules,
    selectedBundle?.services
  ])

  useEffect(() => {
    setSelectedFileId(currentSelectedFileId)
    setFileEditDraft({
      fileId: editableFile?.id ?? 0,
      fileName: editableFile?.fileName ?? '',
      fileType: editableFile?.fileType ?? '',
      filePath: editableFile?.filePath ?? ''
    })
  }, [
    editableFile?.filePath,
    editableFile?.fileName,
    editableFile?.fileType,
    editableFile?.id,
    currentSelectedFileId,
    selectedBundle?.id
  ])

  useEffect(() => {
    rememberBundleSelection(selectedBundle?.id, currentSelectedNoteId, currentSelectedFileId ?? editableFile?.id ?? null)
  }, [currentSelectedFileId, currentSelectedNoteId, editableFile?.id, rememberBundleSelection, selectedBundle?.id])

  const actions = useLogisticsQuoteBoardActions({
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
  })

  const draftActions = useLogisticsQuoteDraftActions({
    selectedBundle,
    currentSelectedNoteId,
    currentSelectedFileId,
    noteDraft,
    quoteDraftConfig,
    beginWorkbenchRequest,
    commitWorkbenchData,
    workbenchRequestIdRef,
    setNotePreviewState,
    setQuoteDraftState
  })

  return {
    workbenchState,
    selectedBundle,
    currentSelectedNoteId,
    editableNote,
    currentSelectedFileId,
    editableFile,
    noteDraft,
    setNoteDraft,
    notePreviewState,
    createDraft,
    setCreateDraft,
    createArchiveFiles,
    setCreateArchiveFiles,
    createState,
    noteEditDraft,
    setNoteEditDraft,
    noteEditState,
    appendNoteDraft,
    setAppendNoteDraft,
    appendNoteState,
    appendFileDraft,
    setAppendFileDraft,
    appendFileState,
    archiveFileState,
    setSelectedFileId,
    fileEditDraft,
    setFileEditDraft,
    fileEditState,
    analysisSummaryDraft,
    setAnalysisSummaryDraft,
    analysisSummaryState,
    quoteDraftConfig,
    setQuoteDraftConfig,
    quoteDraftState,
    rememberBundleSelection,
    loadWorkbench,
    handlePreviewNote: draftActions.handlePreviewNote,
    handleSaveQuoteDraftFromNote: draftActions.handleSaveQuoteDraftFromNote,
    handleCreateSourceBundle: actions.handleCreateSourceBundle,
    handleUpdateSelectedNote: actions.handleUpdateSelectedNote,
    handleAppendNote: actions.handleAppendNote,
    handleAppendFile: actions.handleAppendFile,
    handleArchiveFileUpload: actions.handleArchiveFileUpload,
    handleUpdateFile: actions.handleUpdateFile,
    handleUpdateAnalysisSummary: actions.handleUpdateAnalysisSummary
  }
}
