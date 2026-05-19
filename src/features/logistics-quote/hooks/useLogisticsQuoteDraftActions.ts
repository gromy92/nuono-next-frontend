import type { Dispatch, MutableRefObject, SetStateAction } from 'react'
import { useCallback } from 'react'
import {
  previewLogisticsQuoteNote,
  saveLogisticsQuoteDraftFromNote
} from '../api'
import { buildQuoteDraftFromNoteRequest } from '../requestMappers'
import type { AsyncActionState, NotePreviewState, QuoteDraftConfig } from '../state'
import type { LogisticsQuoteBundleDetailDto, LogisticsQuoteWorkbenchResponse } from '../types'

type UseLogisticsQuoteDraftActionsParams = {
  selectedBundle: LogisticsQuoteBundleDetailDto | null
  currentSelectedNoteId: number | null
  currentSelectedFileId: number | null
  noteDraft: string
  quoteDraftConfig: QuoteDraftConfig
  beginWorkbenchRequest: () => number
  commitWorkbenchData: (data: LogisticsQuoteWorkbenchResponse, requestId?: number) => boolean
  workbenchRequestIdRef: MutableRefObject<number>
  setNotePreviewState: Dispatch<SetStateAction<NotePreviewState>>
  setQuoteDraftState: Dispatch<SetStateAction<AsyncActionState>>
}

export function useLogisticsQuoteDraftActions({
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
}: UseLogisticsQuoteDraftActionsParams) {
  const handlePreviewNote = useCallback(async () => {
    setNotePreviewState({ status: 'loading' })
    try {
      const data = await previewLogisticsQuoteNote({ noteText: noteDraft })
      setNotePreviewState({ status: 'success', data })
    } catch (error) {
      setNotePreviewState({
        status: 'error',
        message: error instanceof Error ? error.message : '补充文案预览失败'
      })
    }
  }, [noteDraft, setNotePreviewState])

  const handleSaveQuoteDraftFromNote = useCallback(async () => {
    if (!selectedBundle?.id || typeof currentSelectedNoteId !== 'number') {
      setQuoteDraftState({ status: 'error', message: '当前没有可保存为报价草稿的已保存补充文案。' })
      return
    }

    setQuoteDraftState({ status: 'loading' })
    const requestId = beginWorkbenchRequest()
    try {
      const data = await saveLogisticsQuoteDraftFromNote(
        selectedBundle.id,
        buildQuoteDraftFromNoteRequest(currentSelectedNoteId, quoteDraftConfig),
        currentSelectedFileId ?? undefined
      )
      if (!commitWorkbenchData(data, requestId)) {
        setQuoteDraftState({ status: 'idle' })
        return
      }
      setQuoteDraftState({ status: 'idle' })
    } catch (error) {
      if (requestId !== workbenchRequestIdRef.current) {
        setQuoteDraftState({ status: 'idle' })
        return
      }
      setQuoteDraftState({
        status: 'error',
        message: error instanceof Error ? error.message : '报价草稿保存失败'
      })
    }
  }, [
    beginWorkbenchRequest,
    commitWorkbenchData,
    currentSelectedFileId,
    currentSelectedNoteId,
    quoteDraftConfig,
    selectedBundle?.id,
    setQuoteDraftState,
    workbenchRequestIdRef
  ])

  return {
    handlePreviewNote,
    handleSaveQuoteDraftFromNote
  }
}
