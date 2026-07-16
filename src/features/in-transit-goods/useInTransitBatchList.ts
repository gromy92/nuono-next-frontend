import { useEffect, useMemo, useRef, useState } from 'react'
import { message } from 'antd'
import type { FilterValue, SorterResult, TablePaginationConfig } from 'antd/es/table/interface'
import {
  fetchInTransitBatches,
  fetchInTransitContract,
  fetchInTransitForwarders
} from './api'
import type {
  InTransitBatch,
  InTransitBatchFilters,
  InTransitContract,
  InTransitForwarder
} from './types'
import { DEFAULT_BATCH_PAGE_SIZE, DEFAULT_CONTRACT, DEFAULT_FILTERS } from './InTransitGoodsPage.constants'
import type { BatchListMeta, PageState } from './InTransitGoodsPage.models'
import { createLatestRequestGuard } from './latestRequestGuard'

export function useInTransitBatchList(isBoxDetailTab: boolean) {
  const requestGuard = useRef(createLatestRequestGuard())
  const [state, setState] = useState<PageState>({ status: 'idle' })
  const [contract, setContract] = useState<InTransitContract>(DEFAULT_CONTRACT)
  const [forwarders, setForwarders] = useState<InTransitForwarder[]>([])
  const [filters, setFilters] = useState<InTransitBatchFilters>(() => initialFiltersFromUrl())
  const [batchListMeta, setBatchListMeta] = useState<BatchListMeta>({
    totalCount: 0,
    page: 1,
    pageSize: DEFAULT_BATCH_PAGE_SIZE
  })

  const transportOptions = useMemo(
    () => contract.transportModes.map((item) => ({ label: item.label, value: item.code })),
    [contract.transportModes]
  )
  const destinationOptions = useMemo(
    () => (contract.destinations ?? DEFAULT_CONTRACT.destinations).map((item) => ({ label: `${item.code} ${item.label}`, value: item.code })),
    [contract.destinations]
  )
  const statusOptions = useMemo(
    () => contract.batchStatuses.map((item) => ({ label: item.label, value: item.code })),
    [contract.batchStatuses]
  )
  const nodeOptions = useMemo(
    () => contract.nodeStatuses.map((item) => ({ label: item.label, value: item.code })),
    [contract.nodeStatuses]
  )
  const forwarderOptions = useMemo(
    () => forwarders.map((item) => ({
      label: item.forwarderName || item.forwarderCode || `#${item.id}`,
      value: item.id
    })),
    [forwarders]
  )

  const statusLabel = useMemo(
    () => new Map(contract.batchStatuses.map((item) => [item.code, item.label])),
    [contract.batchStatuses]
  )
  const transportLabel = useMemo(
    () => new Map(contract.transportModes.map((item) => [item.code, item.label])),
    [contract.transportModes]
  )
  const destinationLabel = useMemo(
    () => new Map((contract.destinations ?? DEFAULT_CONTRACT.destinations).map((item) => [item.code, item.label])),
    [contract.destinations]
  )
  const nodeStatusLabel = useMemo(
    () => new Map(contract.nodeStatuses.map((item) => [item.code, item.label])),
    [contract.nodeStatuses]
  )

  const forwarderFilterValue = filters.standardForwarderId ? `standard:${filters.standardForwarderId}` : undefined
  const forwarderFilterOptions = useMemo(() => {
    return forwarders.map((item) => ({
      label: item.forwarderName || item.forwarderCode || `#${item.id}`,
      value: `standard:${item.id}`
    }))
  }, [forwarders])

  const load = async (nextFilters: InTransitBatchFilters = filters) => {
    const requestToken = requestGuard.current.begin()
    setState((current) => ({ status: 'loading', data: current.data }))
    try {
      const [nextContract, nextForwarders, list] = await Promise.all([
        fetchInTransitContract(),
        fetchInTransitForwarders(),
        fetchInTransitBatches(nextFilters)
      ])
      if (!requestGuard.current.isCurrent(requestToken)) {
        return
      }
      const nextItems = list.items ?? []
      setContract(nextContract)
      setForwarders(nextForwarders)
      setBatchListMeta({
        totalCount: list.totalCount ?? nextItems.length,
        page: list.page ?? nextFilters.page ?? 1,
        pageSize: list.pageSize ?? nextFilters.pageSize ?? DEFAULT_BATCH_PAGE_SIZE
      })
      setState({ status: 'success', data: nextItems })
    } catch (error) {
      if (!requestGuard.current.isCurrent(requestToken)) {
        return
      }
      const errorMessage = error instanceof Error ? error.message : '在途批次加载失败'
      setState((current) => ({ status: 'error', data: current.data, message: errorMessage }))
      message.error(errorMessage)
    }
  }

  useEffect(() => {
    if (isBoxDetailTab) {
      requestGuard.current.invalidate()
      return
    }
    const timer = window.setTimeout(() => {
      void load(filters)
    }, 250)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, isBoxDetailTab])

  useEffect(() => () => requestGuard.current.invalidate(), [])

  const updateFilters = (patch: Partial<InTransitBatchFilters>) => {
    setFilters((current) => ({ ...current, ...patch, page: 1 }))
  }

  const updateForwarderFilter = (value?: string) => {
    if (!value) {
      updateFilters({ standardForwarderId: undefined, rawForwarderName: undefined })
      return
    }
    if (value.startsWith('standard:')) {
      const standardForwarderId = Number(value.slice('standard:'.length))
      updateFilters({
        standardForwarderId: Number.isFinite(standardForwarderId) ? standardForwarderId : undefined,
        rawForwarderName: undefined
      })
    }
  }

  const batchSortOrder = (field: NonNullable<InTransitBatchFilters['sortField']>) => {
    if (filters.sortField !== field) {
      return null
    }
    return filters.sortDirection === 'desc' ? 'descend' : 'ascend'
  }

  const handleBatchTableChange = (
    pagination: TablePaginationConfig,
    _tableFilters: Record<string, FilterValue | null>,
    sorter: SorterResult<InTransitBatch> | SorterResult<InTransitBatch>[]
  ) => {
    const primarySorter = Array.isArray(sorter) ? sorter[0] : sorter
    const sorterKey = typeof primarySorter?.field === 'string'
      ? primarySorter.field
      : typeof primarySorter?.columnKey === 'string'
        ? primarySorter.columnKey
        : undefined
    const sortField: InTransitBatchFilters['sortField'] =
      sorterKey === 'createdAt' || sorterKey === 'etaDate' || sorterKey === 'latestNodeHappenedAt' || sorterKey === 'gmtUpdated'
        ? sorterKey
        : undefined
    setFilters((current) => ({
      ...current,
      page: pagination.current ?? current.page ?? 1,
      pageSize: pagination.pageSize ?? current.pageSize ?? DEFAULT_BATCH_PAGE_SIZE,
      sortField: primarySorter?.order && sortField ? sortField : undefined,
      sortDirection: primarySorter?.order && sortField ? primarySorter.order === 'descend' ? 'desc' : 'asc' : undefined
    }))
  }

  const formatDestination = (code?: string | null) => {
    if (!code) {
      return '-'
    }
    const label = destinationLabel.get(code)
    return label ? `${code} ${label}` : code
  }

  return {
    state,
    rows: state.data ?? [],
    contract,
    forwarders,
    filters,
    batchListMeta,
    transportOptions,
    destinationOptions,
    statusOptions,
    nodeOptions,
    forwarderOptions,
    statusLabel,
    transportLabel,
    destinationLabel,
    nodeStatusLabel,
    forwarderFilterValue,
    forwarderFilterOptions,
    load,
    updateFilters,
    updateForwarderFilter,
    batchSortOrder,
    handleBatchTableChange,
    formatDestination
  }
}

function initialFiltersFromUrl(): InTransitBatchFilters {
  const filters: InTransitBatchFilters = { ...DEFAULT_FILTERS }
  if (typeof window === 'undefined') {
    return filters
  }
  const params = new URLSearchParams(window.location.search)
  const statusScope = params.get('statusScope')
  if (statusScope === 'active' || statusScope === 'completed' || statusScope === 'all') {
    filters.statusScope = statusScope
  }
  const todo = params.get('todo')
  if (todo === 'missingEstimatedArrival') {
    filters.todo = todo
  }
  const skuKeyword = params.get('skuKeyword')?.trim()
  if (skuKeyword) {
    filters.skuKeyword = skuKeyword
  }
  return filters
}
