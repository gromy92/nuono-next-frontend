import { message } from 'antd'
import { useEffect, useRef, useState } from 'react'
import {
  loadAli1688SkuPurchaseHistory,
  saveAli1688SkuPurchaseBatches
} from '../../ali1688-historical-orders/api'
import type {
  Ali1688SkuPurchaseHistoryItem,
  Ali1688SkuPurchaseHistoryQuery
} from '../../ali1688-historical-orders/types'
import { EMPTY_VIEW, type FilterState, type PurchaseBatch } from '../model/pageTypes'
import {
  clonePurchaseBatches,
  relabelPurchaseBatches
} from '../model/purchaseBatchMetrics'
import {
  buildPurchaseBatchesFromRecord,
  buildQuery,
  skuPurchaseHistoryRowKey
} from '../model/purchaseBatchSources'

export function useSkuPurchaseHistoryWorkbench({
  storeCode,
  siteCode
}: {
  storeCode?: string
  siteCode?: string
}) {
  const initialStoreCode = storeCode?.trim()
  const initialSiteCode = siteCode?.trim()
  const [filters, setFilters] = useState<FilterState>({
    storeCode: initialStoreCode,
    siteCode: initialSiteCode,
    keyword: '',
    linkStatus: 'all',
    purchaseRange: null
  })
  const [query, setQuery] = useState<Ali1688SkuPurchaseHistoryQuery>({
    storeCode: initialStoreCode,
    siteCode: initialSiteCode,
    page: 1,
    pageSize: 20
  })
  const [view, setView] = useState(EMPTY_VIEW)
  const [loading, setLoading] = useState(false)
  const [trendRecord, setTrendRecord] = useState<Ali1688SkuPurchaseHistoryItem | null>(null)
  const [batchRecord, setBatchRecord] = useState<Ali1688SkuPurchaseHistoryItem | null>(null)
  const [batchDraftsBySku, setBatchDraftsBySku] = useState<Record<string, PurchaseBatch[]>>({})
  const historyRequestSeqRef = useRef(0)

  async function loadHistory(nextQuery: Ali1688SkuPurchaseHistoryQuery = query) {
    const requestSeq = historyRequestSeqRef.current + 1
    historyRequestSeqRef.current = requestSeq
    setLoading(true)
    try {
      setQuery(nextQuery)
      const nextView = await loadAli1688SkuPurchaseHistory(nextQuery)
      if (requestSeq !== historyRequestSeqRef.current) return
      setView(nextView)
    } catch (error) {
      if (requestSeq !== historyRequestSeqRef.current) return
      message.error(error instanceof Error ? error.message : '读取 SKU 采购历史失败')
      setView(EMPTY_VIEW)
    } finally {
      if (requestSeq === historyRequestSeqRef.current) setLoading(false)
    }
  }

  useEffect(() => {
    const nextFilters: FilterState = {
      storeCode: storeCode?.trim(),
      siteCode: siteCode?.trim(),
      keyword: '',
      linkStatus: 'all',
      purchaseRange: null
    }
    setFilters(nextFilters)
    void loadHistory(buildQuery(nextFilters, 1, query.pageSize || 20))
  }, [siteCode, storeCode])

  function batchesForRecord(record: Ali1688SkuPurchaseHistoryItem) {
    return batchDraftsBySku[skuPurchaseHistoryRowKey(record)]
      || buildPurchaseBatchesFromRecord(record)
  }

  async function savePurchaseBatches(
    record: Ali1688SkuPurchaseHistoryItem,
    batches: PurchaseBatch[]
  ) {
    await saveAli1688SkuPurchaseBatches({
      storeCode: record.storeCode,
      siteCode: record.siteCode,
      skuParent: record.skuParent,
      partnerSku: record.partnerSku,
      pskuCode: record.pskuCode,
      batches: batches.map((batch) => ({
        label: batch.label,
        countedQuantity: batch.countedQuantity,
        countedCost: batch.countedCost,
        note: batch.note,
        sources: batch.sources.map((source) => ({
          orderId: source.orderId,
          itemId: source.itemId,
          assignmentId: source.assignmentId,
          orderNo: source.orderNo,
          orderTime: source.orderTime,
          supplierName: source.supplierName
        }))
      }))
    })
    const rowKey = skuPurchaseHistoryRowKey(record)
    setBatchDraftsBySku((current) => ({
      ...current,
      [rowKey]: relabelPurchaseBatches(clonePurchaseBatches(batches))
    }))
    message.success('采购批次已保存')
  }

  function submitSearch() {
    void loadHistory(buildQuery(filters, 1, query.pageSize || 20))
  }

  return {
    filters, setFilters, query, view, loading,
    trendRecord, setTrendRecord, batchRecord, setBatchRecord,
    loadHistory, batchesForRecord, savePurchaseBatches, submitSearch
  }
}
