import { App } from 'antd'
import { useCallback, useState } from 'react'
import {
  fetchSalesProductDetail,
  requestSalesHistoryBackfill
} from '../api'
import type {
  SalesAnalyticsQuery,
  SalesProductDetail,
  SalesProductRow
} from '../types'
import {
  detailRangeForPreset,
  initialDateRange,
  type DateRangeValue,
  type DetailRangePreset
} from '../model/pageTypes'

export function useSalesProductDetail(query: SalesAnalyticsQuery | null) {
  const { message } = App.useApp()
  const [detailLoading, setDetailLoading] = useState(false)
  const [detail, setDetail] = useState<SalesProductDetail | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailContext, setDetailContext] = useState<SalesProductRow | null>(null)
  const [detailRangePreset, setDetailRangePreset] =
    useState<DetailRangePreset>('month')
  const [detailDateRange, setDetailDateRange] =
    useState<DateRangeValue>(initialDateRange)
  const [historyBackfillLoading, setHistoryBackfillLoading] = useState(false)

  const loadProductDetail = useCallback(async (
    row: SalesProductRow,
    range: DateRangeValue
  ) => {
    if (!query) return
    setDetailLoading(true)
    try {
      setDetail(await fetchSalesProductDetail({
        ...query,
        dateFrom: range[0].format('YYYY-MM-DD'),
        dateTo: range[1].format('YYYY-MM-DD')
      }, row.partnerSku))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '销量详情加载失败')
    } finally {
      setDetailLoading(false)
    }
  }, [message, query])

  async function openDetail(row: SalesProductRow) {
    const nextRange = detailRangeForPreset('month')
    setDetailContext(row)
    setDetail(null)
    setDetailRangePreset('month')
    setDetailDateRange(nextRange)
    setDetailOpen(true)
    await loadProductDetail(row, nextRange)
  }

  function changeDetailRangePreset(preset: DetailRangePreset) {
    setDetailRangePreset(preset)
    if (preset === 'custom') return
    const nextRange = detailRangeForPreset(preset)
    setDetailDateRange(nextRange)
    if (detailContext) void loadProductDetail(detailContext, nextRange)
  }

  function changeDetailDateRange(range: DateRangeValue) {
    setDetailRangePreset('custom')
    setDetailDateRange(range)
    if (detailContext) void loadProductDetail(detailContext, range)
  }

  const requestDetailHistoryBackfill = useCallback(async () => {
    if (!query || !detailContext) return
    setHistoryBackfillLoading(true)
    try {
      const result = await requestSalesHistoryBackfill({
        storeCode: query.storeCode,
        siteCode: query.siteCode,
        dateFrom: detailDateRange[0].format('YYYY-MM-DD'),
        dateTo: detailDateRange[1].format('YYYY-MM-DD')
      })
      message.success(result.message || '已提交历史补全任务')
      await loadProductDetail(detailContext, detailDateRange)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '历史补全提交失败')
    } finally {
      setHistoryBackfillLoading(false)
    }
  }, [detailContext, detailDateRange, loadProductDetail, message, query])

  return {
    detailLoading,
    detail,
    detailOpen,
    setDetailOpen,
    detailContext,
    detailRangePreset,
    detailDateRange,
    historyBackfillLoading,
    openDetail,
    changeDetailRangePreset,
    changeDetailDateRange,
    requestDetailHistoryBackfill
  }
}
