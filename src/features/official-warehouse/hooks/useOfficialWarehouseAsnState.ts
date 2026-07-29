import { message } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  loadOfficialWarehouseAsnInboundDetail,
  loadOfficialWarehouseAsns,
  officialWarehouseError,
  syncOfficialWarehouseNoonAsnList,
  type OfficialWarehouseAsn,
  type OfficialWarehouseAsnInboundDetail
} from '../api'
import {
  DEFAULT_OFFICIAL_WAREHOUSE_APPOINTMENT_FILTER_STATUSES,
  matchesOfficialWarehouseAsnFilters,
  type OfficialWarehouseAppointmentFilterStatus,
  type OfficialWarehouseInboundFilterStatus
} from '../domain'
import {
  asnIsExpired,
  type InboundDiscrepancyFilter
} from '../officialWarehouseAsnPresentation'
import type { AppointmentSubmitFeedback } from '../officialWarehouseFormModel'

export function useOfficialWarehouseAsnState({
  storeCode,
  siteCode,
  reloadHistory
}: {
  storeCode: string
  siteCode: string
  reloadHistory: () => Promise<void>
}) {
  const [keyword, setKeyword] = useState('')
  const [asns, setAsns] = useState<OfficialWarehouseAsn[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string>()
  const [asnSyncing, setAsnSyncing] = useState(false)
  const [asnSyncFeedback, setAsnSyncFeedback] =
    useState<AppointmentSubmitFeedback>()
  const [selectedAsn, setSelectedAsn] = useState<OfficialWarehouseAsn>()
  const [selectedInboundDetail, setSelectedInboundDetail] =
    useState<OfficialWarehouseAsnInboundDetail>()
  const [selectedInboundLoading, setSelectedInboundLoading] = useState(false)
  const [selectedInboundError, setSelectedInboundError] = useState<string>()
  const [inboundDiscrepancyFilter, setInboundDiscrepancyFilter] =
    useState<InboundDiscrepancyFilter>()
  const [asnAppointmentStatusFilters, setAsnAppointmentStatusFilters] =
    useState<OfficialWarehouseAppointmentFilterStatus[]>(
      () => [...DEFAULT_OFFICIAL_WAREHOUSE_APPOINTMENT_FILTER_STATUSES]
    )
  const [asnInboundStatusFilters, setAsnInboundStatusFilters] = useState<
    OfficialWarehouseInboundFilterStatus[]
  >([])
  const inboundDetailRequestRef = useRef(0)

  const visibleAsns = useMemo(() => {
    const filtered = asns.filter((row) =>
      matchesOfficialWarehouseAsnFilters(
        row,
        asnAppointmentStatusFilters,
        asnInboundStatusFilters
      )
    )
    return keyword.trim()
      ? filtered
      : filtered.filter((row) => !asnIsExpired(row))
  }, [
    asns,
    keyword,
    asnAppointmentStatusFilters,
    asnInboundStatusFilters
  ])
  const visibleInboundLines = useMemo(() => {
    const lines = selectedInboundDetail?.lines || []
    if (inboundDiscrepancyFilter === 'SHORT') {
      return lines.filter((row) => Number(row.shortQuantity || 0) > 0)
    }
    if (inboundDiscrepancyFilter === 'OVER') {
      return lines.filter((row) => Number(row.overQuantity || 0) > 0)
    }
    return lines
  }, [selectedInboundDetail, inboundDiscrepancyFilter])

  useEffect(() => {
    void loadAsns()
  }, [storeCode, siteCode])

  async function loadAsns() {
    setLoading(true)
    setLoadError(undefined)
    try {
      setAsns(
        await loadOfficialWarehouseAsns({ storeCode, siteCode, keyword })
      )
    } catch (error) {
      const text = officialWarehouseError(
        error,
        '读取 Noon 官方仓 ASN 失败'
      )
      setLoadError(text)
      message.error(text)
    } finally {
      setLoading(false)
    }
  }

  async function syncNoonAsnList() {
    if (!storeCode || !siteCode) {
      message.warning('请选择店铺和站点')
      return
    }
    setAsnSyncing(true)
    setAsnSyncFeedback(undefined)
    try {
      const result = await syncOfficialWarehouseNoonAsnList({
        storeCode,
        siteCode
      })
      const feedbackMessage = [
        `同步完成：拉取 ${result.fetched || 0} 条`,
        `新增 ${result.created || 0} 条`,
        `更新 ${result.updated || 0} 条`,
        `约仓同步 ${result.scheduled || 0} 条`,
        `状态订正 ${result.corrected || 0} 条`,
        `跳过 ${result.skipped || 0} 条`
      ].join('，')
      const type: AppointmentSubmitFeedback['type'] =
        result.corrected || result.failed ? 'warning' : 'success'
      setAsnSyncFeedback({ type, message: feedbackMessage })
      if (type === 'warning') message.warning(feedbackMessage)
      else message.success(feedbackMessage)
      await loadAsns()
      await reloadHistory()
    } catch (error) {
      const errorMessage = officialWarehouseError(
        error,
        '同步 Noon ASN 列表失败'
      )
      setAsnSyncFeedback({ type: 'error', message: errorMessage })
      message.error(errorMessage)
    } finally {
      setAsnSyncing(false)
    }
  }

  async function openDetail(row: OfficialWarehouseAsn) {
    setSelectedAsn(row)
    setSelectedInboundDetail(undefined)
    setSelectedInboundError(undefined)
    setInboundDiscrepancyFilter(undefined)
    const requestId = inboundDetailRequestRef.current + 1
    inboundDetailRequestRef.current = requestId
    setSelectedInboundLoading(true)
    try {
      const view = await loadOfficialWarehouseAsnInboundDetail(row.id)
      if (inboundDetailRequestRef.current !== requestId) return
      setSelectedInboundDetail(view)
    } catch (error) {
      if (inboundDetailRequestRef.current === requestId) {
        const errorMessage = officialWarehouseError(
          error,
          '读取 ASN 入仓详情失败'
        )
        setSelectedInboundError(errorMessage)
        message.error(errorMessage)
      }
    } finally {
      if (inboundDetailRequestRef.current === requestId) {
        setSelectedInboundLoading(false)
      }
    }
  }

  function closeDetail() {
    inboundDetailRequestRef.current += 1
    setSelectedAsn(undefined)
    setSelectedInboundDetail(undefined)
    setSelectedInboundError(undefined)
    setSelectedInboundLoading(false)
    setInboundDiscrepancyFilter(undefined)
  }

  return {
    keyword, setKeyword, loading, loadError, asnSyncing, asnSyncFeedback,
    setAsnSyncFeedback, selectedAsn, selectedInboundDetail,
    selectedInboundLoading, selectedInboundError, inboundDiscrepancyFilter,
    setInboundDiscrepancyFilter, asnAppointmentStatusFilters,
    setAsnAppointmentStatusFilters, asnInboundStatusFilters,
    setAsnInboundStatusFilters, visibleAsns, visibleInboundLines, loadAsns,
    syncNoonAsnList, openDetail, closeDetail
  }
}
