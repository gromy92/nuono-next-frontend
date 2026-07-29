import { message } from 'antd'
import { useEffect, useState } from 'react'
import {
  previewAli1688SkuPurchaseBatchSourceMatch,
  saveAli1688SkuPurchaseBatchSourceMatch
} from '../../ali1688-historical-orders/api'
import type {
  Ali1688SkuPurchaseBatchSourceMatchPreviewResult,
  Ali1688SkuPurchaseHistoryItem
} from '../../ali1688-historical-orders/types'
import {
  EMPTY_SOURCE_MATCH_FORM,
  type PurchaseBatch,
  type SourceMatchFormState
} from '../model/pageTypes'
import {
  calculatePurchaseBatchMetrics,
  clonePurchaseBatches,
  displayOptionalText,
  purchaseBatchOrderNos,
  relabelPurchaseBatches,
  sourceMatchRejectionMessage
} from '../model/purchaseBatchMetrics'
import {
  buildPurchaseBatchSources,
  createPurchaseBatchFromSources,
  purchaseBatchSourceFromMatchCandidate,
  sourceMatchCandidateToBatchSource
} from '../model/purchaseBatchSources'

export function usePurchaseBatchEditor({
  record,
  batches,
  onClose,
  onSaveBatches
}: {
  record: Ali1688SkuPurchaseHistoryItem | null
  batches: PurchaseBatch[]
  onClose: () => void
  onSaveBatches: (
    record: Ali1688SkuPurchaseHistoryItem,
    batches: PurchaseBatch[]
  ) => Promise<void>
}) {
  const [selectedSourceKeys, setSelectedSourceKeys] = useState<string[]>([])
  const [draftBatches, setDraftBatches] = useState<PurchaseBatch[]>([])
  const [saving, setSaving] = useState(false)
  const [sourceMatchBatchKey, setSourceMatchBatchKey] = useState<string | null>(null)
  const [sourceMatchForm, setSourceMatchForm] =
    useState<SourceMatchFormState>(EMPTY_SOURCE_MATCH_FORM)
  const [sourceMatchPreview, setSourceMatchPreview] =
    useState<Ali1688SkuPurchaseBatchSourceMatchPreviewResult | null>(null)
  const [sourceMatchLoading, setSourceMatchLoading] = useState(false)
  const [sourceMatchSaving, setSourceMatchSaving] = useState(false)
  const sources = record ? buildPurchaseBatchSources(record) : []
  const selectedKeySet = new Set(selectedSourceKeys)
  const metrics = calculatePurchaseBatchMetrics(draftBatches)
  const sourceMatchBatch = sourceMatchBatchKey
    ? draftBatches.find((batch) => batch.id === sourceMatchBatchKey) || null
    : null
  const sourceMatchCandidate = sourceMatchPreview?.rejectionReason
    ? undefined
    : sourceMatchPreview?.candidates?.[0]

  useEffect(() => {
    setSelectedSourceKeys([])
    setDraftBatches(clonePurchaseBatches(batches))
    setSourceMatchBatchKey(null)
    setSourceMatchForm(EMPTY_SOURCE_MATCH_FORM)
    setSourceMatchPreview(null)
  }, [batches, record])

  function toggleSource(sourceKey: string, checked: boolean) {
    setSelectedSourceKeys((current) => (
      checked
        ? current.includes(sourceKey) ? current : [...current, sourceKey]
        : current.filter((key) => key !== sourceKey)
    ))
  }

  function mergeSelectedSources() {
    if (!record) return
    const selectedKeys = new Set(selectedSourceKeys)
    const selectedSources = sources.filter((source) => selectedKeys.has(source.key))
    if (!selectedSources.length) {
      message.warning('请先选择要合并的订单')
      return
    }
    setDraftBatches((current) => {
      const untouched = current.filter(
        (batch) => !batch.sources.some((source) => selectedKeys.has(source.key))
      )
      const merged = createPurchaseBatchFromSources(
        `merged-${selectedSourceKeys.join('-')}`,
        selectedSources
      )
      return relabelPurchaseBatches([merged, ...untouched])
    })
    setSelectedSourceKeys([])
  }

  function updateDraftBatch(
    batchId: string,
    patch: Partial<Pick<PurchaseBatch, 'countedQuantity' | 'countedCost' | 'note'>>
  ) {
    setDraftBatches((current) =>
      current.map((batch) => batch.id === batchId ? { ...batch, ...patch } : batch)
    )
  }

  function openSourceMatch(batch: PurchaseBatch) {
    if (!record) return
    if (!batch.batchId) {
      message.warning('请先保存批次并刷新后再匹配来源')
      return
    }
    setSourceMatchBatchKey(batch.id)
    setSourceMatchForm({
      orderNo: purchaseBatchOrderNos(batch)[0] || '',
      offerId: displayOptionalText(record.sourceOfferId) || '',
      skuId: displayOptionalText(record.sourceSkuId) || ''
    })
    setSourceMatchPreview(null)
  }

  function closeSourceMatch() {
    setSourceMatchBatchKey(null)
    setSourceMatchForm(EMPTY_SOURCE_MATCH_FORM)
    setSourceMatchPreview(null)
    setSourceMatchLoading(false)
    setSourceMatchSaving(false)
  }

  function updateSourceMatchForm(field: keyof SourceMatchFormState, value: string) {
    setSourceMatchForm((current) => ({ ...current, [field]: value }))
    setSourceMatchPreview(null)
  }

  async function previewSourceMatch() {
    if (!sourceMatchBatch?.batchId) return
    setSourceMatchLoading(true)
    try {
      const result = await previewAli1688SkuPurchaseBatchSourceMatch({
        batchId: sourceMatchBatch.batchId,
        orderNo: sourceMatchForm.orderNo.trim(),
        offerId: sourceMatchForm.offerId.trim(),
        skuId: sourceMatchForm.skuId.trim()
      })
      setSourceMatchPreview(result)
      result.rejectionReason
        ? message.warning(sourceMatchRejectionMessage(result.rejectionReason))
        : message.success('已找到唯一来源')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '匹配 1688 来源失败')
    } finally {
      setSourceMatchLoading(false)
    }
  }

  async function saveSourceMatch() {
    if (!sourceMatchBatch?.batchId || !sourceMatchCandidate) return
    const batchToUpdate = sourceMatchBatch
    setSourceMatchSaving(true)
    try {
      const result = await saveAli1688SkuPurchaseBatchSourceMatch({
        batchId: batchToUpdate.batchId,
        sources: [sourceMatchCandidateToBatchSource(sourceMatchCandidate)]
      })
      const nextSource = purchaseBatchSourceFromMatchCandidate(sourceMatchCandidate, 0)
      setDraftBatches((current) => current.map((batch) => (
        batch.id === batchToUpdate.id ? { ...batch, sources: [nextSource] } : batch
      )))
      message.success(`来源已保存，替换 ${result.replacedSourceCount} 条旧来源`)
      closeSourceMatch()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存 1688 来源失败')
    } finally {
      setSourceMatchSaving(false)
    }
  }

  async function saveDraftBatches() {
    if (!record) return
    setSaving(true)
    try {
      await onSaveBatches(record, draftBatches)
      onClose()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存 SKU 采购批次失败')
    } finally {
      setSaving(false)
    }
  }

  return {
    selectedSourceKeys, draftBatches, saving, sourceMatchForm,
    sourceMatchPreview, sourceMatchLoading, sourceMatchSaving, sources,
    selectedKeySet, metrics, sourceMatchBatch, sourceMatchCandidate,
    toggleSource, mergeSelectedSources, updateDraftBatch, openSourceMatch,
    closeSourceMatch, updateSourceMatchForm, previewSourceMatch,
    saveSourceMatch, saveDraftBatches
  }
}
