import { App } from 'antd'
import { normalizeError } from '../../../shared/api'
import {
  confirmCompetitorCandidate,
  ignoreCompetitorCandidate,
  removeCompetitorCandidate
} from '../api'
import type { CompetitorWatchProduct } from '../types'

export function useCompetitorCandidateActions({
  mergeProduct,
  setActionLoading
}: {
  mergeProduct: (product: CompetitorWatchProduct) => void
  setActionLoading: (value: string | null) => void
}) {
  const { message } = App.useApp()
  const handleCandidateStatusChange = async (
    keywordId: string,
    candidateId: string,
    status: 'confirmed' | 'ignored' | 'removed'
  ) => {
    setActionLoading(`candidate-${status}-${keywordId}-${candidateId}`)
    try {
      const detail =
        status === 'confirmed'
          ? await confirmCompetitorCandidate(keywordId, candidateId)
          : status === 'ignored'
            ? await ignoreCompetitorCandidate(keywordId, candidateId)
            : await removeCompetitorCandidate(keywordId, candidateId)
      mergeProduct(detail)
      message.success(
        status === 'confirmed'
          ? '竞品已确认'
          : status === 'ignored'
            ? '竞品已忽略'
            : '竞品已移除'
      )
    } catch (error) {
      const fallback =
        status === 'confirmed'
          ? '确认竞品失败'
          : status === 'ignored'
            ? '忽略竞品失败'
            : '移除竞品失败'
      message.error(normalizeError(error, fallback))
    } finally {
      setActionLoading(null)
    }
  }

  const handleCandidateBatchStatusChange = async (
    keywordId: string,
    candidateIds: string[],
    status: 'confirmed' | 'ignored'
  ) => {
    const uniqueIds = Array.from(new Set(candidateIds.filter(Boolean)))
    if (!uniqueIds.length) return
    setActionLoading(`candidate-batch-${status}-${keywordId}`)
    let latestDetail: CompetitorWatchProduct | undefined
    let processedCount = 0
    try {
      for (const candidateId of uniqueIds) {
        latestDetail =
          status === 'confirmed'
            ? await confirmCompetitorCandidate(keywordId, candidateId)
            : await ignoreCompetitorCandidate(keywordId, candidateId)
        processedCount += 1
      }
      if (latestDetail) mergeProduct(latestDetail)
      message.success(
        status === 'confirmed'
          ? `已加入 ${processedCount} 个竞品`
          : `已忽略 ${processedCount} 个竞品`
      )
    } catch (error) {
      if (latestDetail) mergeProduct(latestDetail)
      const prefix = processedCount > 0 ? `已处理 ${processedCount} 个，` : ''
      message.error(
        prefix +
          normalizeError(
            error,
            status === 'confirmed' ? '批量加入竞品失败' : '批量忽略竞品失败'
          )
      )
    } finally {
      setActionLoading(null)
    }
  }

  return { handleCandidateStatusChange, handleCandidateBatchStatusChange }
}
