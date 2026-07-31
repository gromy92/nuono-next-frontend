import { message } from 'antd'
import { useEffect, useMemo, useState, type Key } from 'react'
import {
  createOfficialWarehouseAsn,
  loadOfficialWarehouseCandidates,
  officialWarehouseError,
  officialWarehouseProblem,
  validateOfficialWarehouseAsn,
  type OfficialWarehouseProductCandidate,
  type OfficialWarehouseShippingBatchCandidate
} from '../api'
import { parseCandidateSearch } from '../createAsnFlow'
import {
  displayPsku,
  missingBatchesFromProblem,
  officialWarehouseCandidateKey,
  shippingBatchDisplayNo,
  shippingBatchOptionText,
  toNumber
} from '../officialWarehouseCandidatePresentation'
import type {
  CreateAsnConfirmation,
  CreateAsnSubmitFeedback
} from '../officialWarehouseFormModel'
import { useShippingBatchSearch } from '../useShippingBatchSearch'
import { useOfficialWarehouseBatchSummary } from './useOfficialWarehouseBatchSummary'

export function useOfficialWarehouseCreateAsn({
  storeCode,
  siteCode,
  reloadAll
}: {
  storeCode: string
  siteCode: string
  reloadAll: () => Promise<void>
}) {
  const [createOpen, setCreateOpen] = useState(false)
  const [candidateKeyword, setCandidateKeyword] = useState('')
  const [candidateLoading, setCandidateLoading] = useState(false)
  const [candidates, setCandidates] = useState<OfficialWarehouseProductCandidate[]>([])
  const [shippingBatches, setShippingBatches] = useState<OfficialWarehouseShippingBatchCandidate[]>([])
  const [selectedShippingBatchIds, setSelectedShippingBatchIds] = useState<string[]>([])
  const [selectedCandidateKeys, setSelectedCandidateKeys] = useState<Key[]>([])
  const [selectedCandidateByKey, setSelectedCandidateByKey] = useState<Record<string, OfficialWarehouseProductCandidate>>({})
  const [quantityByCandidateKey, setQuantityByCandidateKey] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [createSubmitFeedback, setCreateSubmitFeedback] = useState<CreateAsnSubmitFeedback>()
  const [createAsnConfirmation, setCreateAsnConfirmation] = useState<CreateAsnConfirmation>()

  const {
    shippingBatchKeyword,
    shippingBatchLoading,
    shippingBatchLoadError,
    loadShippingBatches,
    handleShippingBatchSearch,
    resetShippingBatchSearch
  } = useShippingBatchSearch({
    storeCode,
    siteCode,
    selectedShippingBatchIds,
    setShippingBatches,
    setSelectedShippingBatchIds
  })
  const {
    batchSummary,
    batchSummaryLoading,
    batchSummaryError,
    reloadBatchSummary
  } = useOfficialWarehouseBatchSummary({
    enabled: createOpen,
    storeCode,
    siteCode,
    shippingBatchIds: selectedShippingBatchIds
  })
  const batchSummaryBlocked = selectedShippingBatchIds.length > 0 &&
    Boolean(batchSummaryLoading || batchSummaryError || !batchSummary)


  const shippingBatchOptions = useMemo(
    () => shippingBatches.map((batch) => ({ label: shippingBatchOptionText(batch), value: batch.id })),
    [shippingBatches]
  )
  const selectedShippingBatches = useMemo(
    () => shippingBatches.filter((batch) => selectedShippingBatchIds.includes(batch.id)),
    [shippingBatches, selectedShippingBatchIds]
  )
  const selectedAlreadyAppointedBatches = useMemo(
    () => selectedShippingBatches.filter((batch) => batch.alreadyAppointed),
    [selectedShippingBatches]
  )
  const selectedShippingBatchesNoRemaining = selectedShippingBatchIds.length > 0 &&
    selectedShippingBatches.length > 0 &&
    selectedShippingBatches.every((batch) => !batch.alreadyAppointed && Number(batch.remainingQuantity ?? batch.storeSiteQuantity ?? 0) <= 0)
  const candidateEmptyDescription = selectedShippingBatchIds.length
    ? selectedShippingBatchesNoRemaining
      ? '所选物流批次已无剩余待约仓商品'
      : '所选物流批次没有匹配当前站点商品'
    : '暂无可创建 ASN 的商品'


  useEffect(() => {
    if (createOpen) {
      setCreateSubmitFeedback(undefined)
      setCreateAsnConfirmation(undefined)
      setCandidateKeyword('')
      resetShippingBatchSearch()
      setSelectedShippingBatchIds([])
      setSelectedCandidateKeys([])
      setSelectedCandidateByKey({})
      setQuantityByCandidateKey({})
      void loadCandidates([], '')
      void loadShippingBatches('', true)
    } else {
      resetShippingBatchSearch()
    }
  }, [createOpen])


  async function loadCandidates(
    batchIds: string[] = selectedShippingBatchIds,
    keywordValue: string = candidateKeyword
  ) {
    if (!storeCode || !siteCode) {
      message.warning('请选择店铺和站点')
      return
    }
    setCandidateLoading(true)
    try {
      const search = parseCandidateSearch(keywordValue)
      const rows = await loadOfficialWarehouseCandidates({
        storeCode,
        siteCode,
        keyword: search.keyword,
        partnerSkus: search.partnerSkus,
        shippingBatchIds: batchIds
      })
      setCandidates(rows)
      setQuantityByCandidateKey((current) =>
        rows.reduce<Record<string, number>>((next, row) => {
          const batchQuantity = Number(row.batchAvailableQuantity || 0)
          const key = officialWarehouseCandidateKey(row)
          if (next[key] == null) {
            next[key] = batchIds.length && batchQuantity > 0 ? batchQuantity : 1
          }
          return next
        }, { ...current })
      )
    } catch (error) {
      message.error(officialWarehouseError(error, '读取可创建 ASN 商品失败'))
    } finally {
      setCandidateLoading(false)
    }
  }

  function updateCandidateSelection(keys: Key[], rows: OfficialWarehouseProductCandidate[]) {
    const retainedKeys = new Set(keys.map(String))
    setSelectedCandidateKeys(keys)
    setSelectedCandidateByKey((current) => {
      const next = { ...current }
      Object.keys(next).forEach((key) => {
        if (!retainedKeys.has(key)) delete next[key]
      })
      rows.forEach((row) => {
        next[officialWarehouseCandidateKey(row)] = row
      })
      return next
    })
  }

  function clearCandidateSelection() {
    setSelectedCandidateKeys([])
    setSelectedCandidateByKey({})
  }


  async function submitCreateAsn() {
    if (batchSummaryBlocked) {
      message.warning('请等待物流批次商品汇总加载成功后再创建 ASN')
      return
    }
    const selectedRows = selectedCandidateKeys
      .map((key) => selectedCandidateByKey[String(key)])
      .filter((row): row is OfficialWarehouseProductCandidate => Boolean(row))
    if (!selectedRows.length) {
      message.warning('请选择至少一个商品')
      return
    }
    const invalid = selectedRows.find((row) => (quantityByCandidateKey[officialWarehouseCandidateKey(row)] || 0) <= 0)
    if (invalid) {
      message.warning(`${displayPsku(invalid)} 数量必须大于 0`)
      return
    }
    const overLimit = selectedRows.find((row) => {
      const batchLimit = selectedShippingBatchIds.length ? Number(row.batchAvailableQuantity || 0) : 0
      return batchLimit > 0 && (quantityByCandidateKey[officialWarehouseCandidateKey(row)] || 0) > batchLimit
    })
    if (overLimit) {
      message.warning(`${displayPsku(overLimit)} 数量超过所选物流批次可用数量`)
      return
    }
    setSubmitting(true)
    setCreateSubmitFeedback(undefined)
    try {
      const validation = await validateOfficialWarehouseAsn(createAsnPayload(selectedRows, false))
      const batchNos = selectedAlreadyAppointedBatches.map(shippingBatchDisplayNo)
      if (validation.missingBatches.length || batchNos.length) {
        setCreateAsnConfirmation({ selectedRows, batchNos, missingBatches: validation.missingBatches })
        return
      }
      await createAsnFromSelectedRows(selectedRows, false)
    } catch (error) {
      const errorMessage = officialWarehouseError(error, '校验 Noon ASN 商品失败')
      setCreateSubmitFeedback({ message: errorMessage, problem: officialWarehouseProblem(error) })
      message.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  function createAsnPayload(selectedRows: OfficialWarehouseProductCandidate[], partialBatchConfirmed: boolean) {
    return {
      storeCode,
      siteCode,
      sourceType: 'MANUAL',
      shippingBatchIds: selectedShippingBatchIds,
      partialBatchConfirmed,
      lines: selectedRows.map((row) => ({
        productVariantId: Number(row.productVariantId),
        productSiteOfferId: toNumber(row.productSiteOfferId),
        partnerSku: row.partnerSku,
        quantity: quantityByCandidateKey[officialWarehouseCandidateKey(row)] || 1
      }))
    }
  }

  async function createAsnFromSelectedRows(
    selectedRows: OfficialWarehouseProductCandidate[],
    partialBatchConfirmed: boolean
  ) {
    setSubmitting(true)
    setCreateSubmitFeedback(undefined)
    try {
      await createOfficialWarehouseAsn(createAsnPayload(selectedRows, partialBatchConfirmed))
      message.success('Noon ASN 已创建')
      setCreateOpen(false)
      setCreateAsnConfirmation(undefined)
      await reloadAll()
    } catch (error) {
      const errorMessage = officialWarehouseError(error, '创建 Noon ASN 失败')
      const problem = officialWarehouseProblem(error)
      const missingBatches = missingBatchesFromProblem(problem)
      if (problem?.code === 'OFFICIAL_WAREHOUSE_PARTIAL_BATCH_CONFIRM_REQUIRED' && missingBatches.length) {
        setCreateAsnConfirmation({
          selectedRows,
          batchNos: selectedAlreadyAppointedBatches.map(shippingBatchDisplayNo),
          missingBatches
        })
        return
      }
      setCreateSubmitFeedback({ message: errorMessage, problem })
      message.error(errorMessage)
      await reloadAll()
    } finally {
      setSubmitting(false)
    }
  }

  function confirmCreateAsn() {
    if (!createAsnConfirmation) return
    const selectedRows = createAsnConfirmation.selectedRows
    setCreateAsnConfirmation(undefined)
    void createAsnFromSelectedRows(selectedRows, true)
  }


  return {
    createOpen, setCreateOpen, candidateKeyword, setCandidateKeyword,
    candidateLoading, candidates, shippingBatches, selectedShippingBatchIds,
    setSelectedShippingBatchIds, selectedCandidateKeys, quantityByCandidateKey,
    setQuantityByCandidateKey, submitting, createSubmitFeedback,
    setCreateSubmitFeedback, createAsnConfirmation, setCreateAsnConfirmation,
    shippingBatchKeyword, shippingBatchLoading, shippingBatchLoadError,
    loadShippingBatches, handleShippingBatchSearch, shippingBatchOptions,
    selectedAlreadyAppointedBatches, candidateEmptyDescription, loadCandidates,
    updateCandidateSelection, clearCandidateSelection, submitCreateAsn,
    confirmCreateAsn, batchSummary, batchSummaryLoading, batchSummaryError,
    reloadBatchSummary, batchSummaryBlocked
  }
}
