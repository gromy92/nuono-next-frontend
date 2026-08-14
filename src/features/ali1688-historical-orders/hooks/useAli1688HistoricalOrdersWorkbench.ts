import { message } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  loadAli1688HistoricalOrderWorkbench,
  saveAli1688EnterpriseSelfUseToken,
  syncAli1688HistoricalOrdersNow
} from '../api'
import type {
  Ali1688EnterpriseSelfUseTokenRequest,
  Ali1688HistoricalOrderQuery,
  Ali1688HistoricalOrderWorkbench
} from '../types'
import {
  assignmentFilterQuery,
  buildProductLineRows,
  filterProductLineRowsByAssignment,
  filterProductLineRowsByProductLink,
  productLinkFilterQuery
} from '../model/productLineRows'
import {
  buildAssignmentTargetOptions
} from '../model/assignmentTargets'
import {
  canRoleMutateProductLinks
} from '../model/productLinkModel'
import {
  isSelectableProductLine
} from '../model/productLineEligibility'
import type {
  AssignmentTargetStore,
  OrderFilterState
} from '../model/pageTypes'

const EMPTY_WORKBENCH: Ali1688HistoricalOrderWorkbench = {
  ready: false,
  authorization: { status: 'loading' },
  roleCapabilities: {
    canAuthorize: false,
    canViewOrders: false
  },
  orders: [],
  storeScope: {
    status: 'owner_scope',
    message: '当前按老板全部 1688 授权账号查看。'
  },
  pagination: { page: 1, pageSize: 20, total: 0 }
}

export function useAli1688HistoricalOrdersWorkbench({
  storeCode,
  siteCode,
  operatorRoleName,
  availableStores
}: {
  storeCode?: string
  siteCode?: string
  operatorRoleName?: string
  availableStores?: AssignmentTargetStore[]
}) {
  const [workbench, setWorkbench] =
    useState<Ali1688HistoricalOrderWorkbench>(EMPTY_WORKBENCH)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<OrderFilterState>({
    placedRange: null,
    supplierKeyword: '',
    keyword: ''
  })
  const [query, setQuery] = useState<Ali1688HistoricalOrderQuery>({
    page: 1,
    pageSize: 20
  })
  const [authorizationModalOpen, setAuthorizationModalOpen] = useState(false)
  const [excelImportModalOpen, setExcelImportModalOpen] = useState(false)
  const [authorizationSubmitting, setAuthorizationSubmitting] = useState(false)
  const [authorizationErrorMessage, setAuthorizationErrorMessage] =
    useState<string>()
  const [selectedLineKeys, setSelectedLineKeys] = useState<string[]>([])
  const didMountFilters = useRef(false)
  const productLineRows = useMemo(
    () => buildProductLineRows(workbench.orders || []),
    [workbench.orders]
  )
  const assignmentFilteredRows = useMemo(
    () =>
      filterProductLineRowsByAssignment(
        productLineRows,
        filters.assignmentFilter
      ),
    [filters.assignmentFilter, productLineRows]
  )
  const visibleProductLineRows = useMemo(
    () =>
      filterProductLineRowsByProductLink(
        assignmentFilteredRows,
        filters.productLinkFilter
      ),
    [assignmentFilteredRows, filters.productLinkFilter]
  )
  const selectedProductLineRows = useMemo(
    () =>
      visibleProductLineRows.filter((row) =>
        selectedLineKeys.includes(row.lineKey)
      ),
    [selectedLineKeys, visibleProductLineRows]
  )
  const assignmentTargetOptions = useMemo(
    () => buildAssignmentTargetOptions(availableStores, storeCode, siteCode),
    [availableStores, siteCode, storeCode]
  )
  const canMutateProductLinks = canRoleMutateProductLinks(operatorRoleName)
  const canBatchActOnSelectedLines =
    selectedProductLineRows.length > 0 &&
    selectedProductLineRows.every(isSelectableProductLine)
  const showAuthorizeButton = workbench.roleCapabilities?.canAuthorize
  const paginationCurrent = workbench.pagination?.page || 1
  const paginationPageSize = workbench.pagination?.pageSize || 20
  const paginationTotal = Math.max(
    workbench.pagination?.total || 0,
    visibleProductLineRows.length
  )

  useEffect(() => {
    void loadWorkbench({ page: 1, pageSize: query.pageSize || 20 })
  }, [])

  useEffect(() => {
    if (!didMountFilters.current) {
      didMountFilters.current = true
      return
    }
    const timeoutId = window.setTimeout(() => {
      setSelectedLineKeys([])
      void loadWorkbench(buildQueryFromFilters())
    }, 250)
    return () => window.clearTimeout(timeoutId)
  }, [filters])

  async function loadWorkbench(
    nextQuery: Ali1688HistoricalOrderQuery = query
  ) {
    setLoading(true)
    try {
      setQuery(nextQuery)
      const next = await loadAli1688HistoricalOrderWorkbench(nextQuery)
      setWorkbench(next)
      return next
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : '读取 1688 历史订单失败'
      )
      setWorkbench(EMPTY_WORKBENCH)
      return EMPTY_WORKBENCH
    } finally {
      setLoading(false)
    }
  }

  function buildQueryFromFilters(): Ali1688HistoricalOrderQuery {
    const [placedStart, placedEnd] = filters.placedRange || []
    return {
      placedTimeFrom: placedStart
        ? `${placedStart.format('YYYY-MM-DD')} 00:00:00`
        : undefined,
      placedTimeTo: placedEnd
        ? `${placedEnd.format('YYYY-MM-DD')} 23:59:59`
        : undefined,
      orderStatus: filters.orderStatus,
      supplierKeyword: filters.supplierKeyword.trim() || undefined,
      keyword: filters.keyword.trim() || undefined,
      ...assignmentFilterQuery(filters.assignmentFilter),
      ...productLinkFilterQuery(filters.productLinkFilter),
      page: 1,
      pageSize: workbench.pagination?.pageSize || 20
    }
  }

  async function confirmOpenApiAuthorization(request: Ali1688EnterpriseSelfUseTokenRequest) {
    setAuthorizationSubmitting(true)
    setAuthorizationErrorMessage(undefined)
    try {
      await saveAli1688EnterpriseSelfUseToken(request)
      setAuthorizationModalOpen(false)
      await loadWorkbench({ ...query, page: 1 })
      message.success('1688 企业自用 Token 已保存，系统每日自动拉取历史订单')
    } catch (error) {
      const text =
        error instanceof Error ? error.message : '授权 1688 历史订单失败'
      setAuthorizationErrorMessage(text)
      message.error(text)
    } finally {
      setAuthorizationSubmitting(false)
    }
  }

  async function syncNow() {
    setLoading(true)
    try {
      await syncAli1688HistoricalOrdersNow()
      message.success('已开始补拉当前 1688 授权账号的历史订单，请稍后刷新查看。')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '立即补拉 1688 历史订单失败')
    } finally {
      setLoading(false)
    }
  }

  return {
    workbench, loading, filters, setFilters, query, authorizationModalOpen,
    setAuthorizationModalOpen, excelImportModalOpen, setExcelImportModalOpen,
    authorizationSubmitting, authorizationErrorMessage,
    setAuthorizationErrorMessage, selectedLineKeys,
    setSelectedLineKeys, visibleProductLineRows, selectedProductLineRows,
    assignmentTargetOptions, canMutateProductLinks,
    canBatchActOnSelectedLines, showAuthorizeButton,
    paginationCurrent, paginationPageSize, paginationTotal, loadWorkbench,
    confirmOpenApiAuthorization, syncNow
  }
}
