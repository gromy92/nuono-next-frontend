import { App } from 'antd'
import { useCallback, useState } from 'react'
import { fetchSalesProductDetail } from '../api'
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

  return {
    detailLoading,
    detail,
    detailOpen,
    setDetailOpen,
    detailContext,
    detailRangePreset,
    detailDateRange,
    openDetail,
    changeDetailRangePreset,
    changeDetailDateRange
  }
}
