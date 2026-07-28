import { App } from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AuthSession } from '../../auth/session'
import { normalizeProductImageUrl } from '../../product-baseline'
import {
  fetchNoonAdvertisingDashboard,
  fetchNoonAdvertisingLatestReportWindow
} from '../api'
import { buildNoonAdvertisingAdviceGroups, type NoonAdvertisingAdviceGroupKey } from '../advice'
import type {
  NoonAdvertisingCampaignRow,
  NoonAdvertisingDashboardQuery,
  NoonAdvertisingDashboardView,
  NoonAdvertisingLatestReportWindowQuery,
  NoonAdvertisingQueryRow
} from '../types'
import {
  dateRangeFromLatestWindow,
  emptyDashboard,
  initialDateRange,
  trendQueryFromDashboardQuery,
  type ProductFilterKey
} from '../model/pageModel'
import {
  advertisingIdentityKeyOf,
  campaignExportColumns,
  displaySkuOf,
  downloadNoonAdsRowsAsExcel,
  formatNumber,
  productMatchesFilter,
  queryExportColumns,
  sanitizeFilePart,
  searchableProductTextOf,
  siteCodeFromStoreCode
} from '../presentation/formatters'
import {
  buildCampaignColumns,
  buildQueryColumns
} from '../presentation/tableColumns'

export function useNoonAdvertisingDashboard(session: AuthSession) {
  const { message } = App.useApp()
  const selectedStore = session.currentStore || session.userStores?.[0] || null
  const projectCode = selectedStore?.projectCode?.trim() || ''
  const [dateRange, setDateRange] = useState(initialDateRange)
  const [dashboard, setDashboard] =
    useState<NoonAdvertisingDashboardView>(emptyDashboard)
  const [trendDashboard, setTrendDashboard] =
    useState<NoonAdvertisingDashboardView>(emptyDashboard)
  const [loading, setLoading] = useState(false)
  const [latestWindowLoading, setLatestWindowLoading] = useState(false)
  const [resolvedScopeKey, setResolvedScopeKey] = useState('')
  const [expandedAdviceKey, setExpandedAdviceKey] =
    useState<NoonAdvertisingAdviceGroupKey | null>(null)
  const [selectedProductKey, setSelectedProductKey] = useState<string | null>(null)
  const [selectedCampaignCode, setSelectedCampaignCode] = useState<string | null>(null)
  const [productSearchText, setProductSearchText] = useState('')
  const [productFilter, setProductFilter] = useState<ProductFilterKey>('all')
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const loadRequestIdRef = useRef(0)
  const latestWindowRequestIdRef = useRef(0)

  const scopeQuery = useMemo<NoonAdvertisingLatestReportWindowQuery | null>(() => {
    if (!selectedStore?.storeCode || !projectCode) return null
    return {
      projectCode,
      storeCode: selectedStore.storeCode,
      siteCode: selectedStore.site || siteCodeFromStoreCode(selectedStore.storeCode)
    }
  }, [projectCode, selectedStore])
  const scopeKey = useMemo(
    () => scopeQuery
      ? `${scopeQuery.projectCode}|${scopeQuery.storeCode}|${scopeQuery.siteCode}`
      : '',
    [scopeQuery]
  )
  const query = useMemo<NoonAdvertisingDashboardQuery | null>(() => (
    scopeQuery && resolvedScopeKey === scopeKey
      ? {
          ...scopeQuery,
          dateFrom: dateRange[0].format('YYYY-MM-DD'),
          dateTo: dateRange[1].format('YYYY-MM-DD')
        }
      : null
  ), [dateRange, resolvedScopeKey, scopeKey, scopeQuery])

  const loadLatestReportWindow = useCallback(async (
    targetQuery: NoonAdvertisingLatestReportWindowQuery | null,
    targetScopeKey: string
  ) => {
    const requestId = ++latestWindowRequestIdRef.current
    setResolvedScopeKey('')
    setDashboard(emptyDashboard)
    setTrendDashboard(emptyDashboard)
    if (!targetQuery || !targetScopeKey) {
      setDateRange(initialDateRange())
      setLatestWindowLoading(false)
      return
    }
    setLatestWindowLoading(true)
    try {
      const latestWindow = await fetchNoonAdvertisingLatestReportWindow(targetQuery)
      if (latestWindowRequestIdRef.current === requestId) {
        setDateRange(dateRangeFromLatestWindow(latestWindow) || initialDateRange())
        setResolvedScopeKey(targetScopeKey)
      }
    } catch (error) {
      if (latestWindowRequestIdRef.current === requestId) {
        message.error(error instanceof Error ? error.message : '广告报表窗口加载失败')
        setDateRange(initialDateRange())
        setResolvedScopeKey(targetScopeKey)
      }
    } finally {
      if (latestWindowRequestIdRef.current === requestId) setLatestWindowLoading(false)
    }
  }, [message])

  const loadDashboard = useCallback(async (
    targetQuery: NoonAdvertisingDashboardQuery | null
  ) => {
    const requestId = ++loadRequestIdRef.current
    if (!targetQuery) {
      setDashboard(emptyDashboard)
      setTrendDashboard(emptyDashboard)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [payload, trendPayload] = await Promise.all([
        fetchNoonAdvertisingDashboard(targetQuery),
        fetchNoonAdvertisingDashboard(trendQueryFromDashboardQuery(targetQuery))
      ])
      if (loadRequestIdRef.current === requestId) {
        setDashboard(payload)
        setTrendDashboard(trendPayload)
      }
    } catch (error) {
      if (loadRequestIdRef.current === requestId) {
        message.error(error instanceof Error ? error.message : '广告数据加载失败')
      }
    } finally {
      if (loadRequestIdRef.current === requestId) setLoading(false)
    }
  }, [message])

  useEffect(() => {
    void loadLatestReportWindow(scopeQuery, scopeKey)
  }, [loadLatestReportWindow, scopeKey, scopeQuery])
  useEffect(() => {
    void loadDashboard(query)
  }, [loadDashboard, query])

  const productRows = dashboard.productRows || emptyDashboard.productRows
  const productDiagnosticsByKey = useMemo(() => new Map(
    (dashboard.productDiagnostics || []).map((row) => [
      advertisingIdentityKeyOf(row),
      row
    ])
  ), [dashboard.productDiagnostics])
  const filteredProductRows = useMemo(() => {
    const search = productSearchText.trim().toLowerCase()
    return productRows
      .filter((row) => {
        const diagnostic = productDiagnosticsByKey.get(advertisingIdentityKeyOf(row))
        return (!search || searchableProductTextOf(row).includes(search))
          && productMatchesFilter(diagnostic, productFilter)
      })
      .sort((left, right) => {
        const leftDiagnostic = productDiagnosticsByKey.get(advertisingIdentityKeyOf(left))
        const rightDiagnostic = productDiagnosticsByKey.get(advertisingIdentityKeyOf(right))
        return Number(rightDiagnostic?.priorityScore || 0) - Number(leftDiagnostic?.priorityScore || 0)
          || Number(right.spendAmount || 0) - Number(left.spendAmount || 0)
      })
  }, [productDiagnosticsByKey, productFilter, productRows, productSearchText])
  const selectedProduct = useMemo(
    () => filteredProductRows.find((row) => advertisingIdentityKeyOf(row) === selectedProductKey)
      || filteredProductRows[0]
      || null,
    [filteredProductRows, selectedProductKey]
  )
  const selectedProductKeyResolved = selectedProduct
    ? advertisingIdentityKeyOf(selectedProduct)
    : null
  const campaignDiagnosticsByCode = useMemo(() => new Map(
    (dashboard.campaignDiagnostics || []).map((row) => [row.campaignCode, row])
  ), [dashboard.campaignDiagnostics])
  const filterSelectedRows = useCallback(
    <T extends NoonAdvertisingCampaignRow | NoonAdvertisingQueryRow>(rows: T[]) => (
      selectedProductKeyResolved
        ? rows.filter((row) => advertisingIdentityKeyOf(row) === selectedProductKeyResolved)
        : []
    ),
    [selectedProductKeyResolved]
  )
  const selectedProductCampaignRows = useMemo(
    () => filterSelectedRows(dashboard.campaignRows),
    [dashboard.campaignRows, filterSelectedRows]
  )
  const selectedProductZeroOrderQueries = useMemo(
    () => filterSelectedRows(dashboard.zeroOrderQueries),
    [dashboard.zeroOrderQueries, filterSelectedRows]
  )
  const selectedProductWinningQueries = useMemo(
    () => filterSelectedRows(dashboard.winningQueries),
    [dashboard.winningQueries, filterSelectedRows]
  )
  const selectedCampaignCodeResolved = selectedProductCampaignRows.some(
    (row) => row.campaignCode === selectedCampaignCode
  ) ? selectedCampaignCode : null

  useEffect(() => {
    setSelectedProductKey((previous) => (
      previous && filteredProductRows.some((row) => advertisingIdentityKeyOf(row) === previous)
        ? previous
        : filteredProductRows[0]
          ? advertisingIdentityKeyOf(filteredProductRows[0])
          : null
    ))
  }, [filteredProductRows])
  useEffect(() => {
    setSelectedCampaignCode((previous) => (
      previous && selectedProductCampaignRows.some((row) => row.campaignCode === previous)
        ? previous
        : null
    ))
  }, [selectedProductCampaignRows])

  const exportFileSuffix = query
    ? `${query.storeCode}_${query.siteCode}_${query.dateFrom}_${query.dateTo}`
    : 'noon_ads'
  const exportRows = useCallback(<T,>(
    rows: T[],
    label: string,
    filePart: string,
    columns: Parameters<typeof downloadNoonAdsRowsAsExcel<T>>[0]['columns']
  ) => {
    const count = downloadNoonAdsRowsAsExcel({
      filename: `noon_ads_${sanitizeFilePart(filePart)}_${exportFileSuffix}.xls`,
      sheetName: label,
      columns,
      rows
    })
    count > 0
      ? message.success(`已导出 ${formatNumber(count)} 行`)
      : message.warning('当前没有可导出的数据')
  }, [exportFileSuffix, message])
  const onExportCampaignRows = useCallback((
    rows: NoonAdvertisingCampaignRow[],
    label: string,
    filePart: string
  ) => exportRows(rows, label, filePart, campaignExportColumns(campaignDiagnosticsByCode)), [
    campaignDiagnosticsByCode,
    exportRows
  ])
  const onExportQueryRows = useCallback((
    rows: NoonAdvertisingQueryRow[],
    label: string,
    filePart: string
  ) => exportRows(rows, label, filePart, queryExportColumns()), [exportRows])
  const openProductImagePreview = useCallback((rawImageUrl?: string | null) => {
    const url = normalizeProductImageUrl(rawImageUrl)
    if (url) setImagePreviewUrl(url)
  }, [])

  const adviceGroups = useMemo(
    () => buildNoonAdvertisingAdviceGroups(dashboard, trendDashboard),
    [dashboard, trendDashboard]
  )
  return {
    selectedStore, dateRange, setDateRange, dashboard, trendDashboard,
    loading, latestWindowLoading, query, expandedAdviceKey, setExpandedAdviceKey,
    selectedProductKeyResolved, setSelectedProductKey, selectedCampaignCodeResolved,
    setSelectedCampaignCode, productSearchText, setProductSearchText,
    productFilter, setProductFilter, imagePreviewUrl, setImagePreviewUrl,
    productRows, filteredProductRows, selectedProduct, productDiagnosticsByKey,
    campaignDiagnosticsByCode, selectedProductCampaignRows,
    selectedProductZeroOrderQueries, selectedProductWinningQueries,
    adviceGroups, campaignColumns: buildCampaignColumns(campaignDiagnosticsByCode),
    queryColumns: buildQueryColumns(), loadDashboard, onExportCampaignRows,
    onExportQueryRows, openProductImagePreview
  }
}
