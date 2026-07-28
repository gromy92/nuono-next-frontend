import { App } from 'antd'
import type { Key } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AuthSession } from '../../auth/session'
import {
  fetchProductClassificationOptions,
  type ProductClassificationOptionPayload
} from '../../product-domain/productClassificationApi'
import type { SalesForecastQuery } from '../../sales-forecast/types'
import {
  exportSalesAnalyticsCsv,
  fetchSalesAnalyticsProducts,
  fetchSalesAnalyticsSummary,
  fetchSalesAnalyticsTrends
} from '../api'
import type {
  SalesAnalyticsQuery,
  SalesAnalyticsSummary,
  SalesProductRow,
  SalesTrendBucket
} from '../types'
import { initialDateRange } from '../model/pageTypes'
import {
  parsePartnerSkuText,
  siteCodeFromStoreCode
} from '../presentation/formatters'

const emptySummary: SalesAnalyticsSummary = {
  netUnits: 0,
  grossUnits: 0,
  shippedUnits: 0,
  cancelledUnits: 0,
  revenueShipped: 0,
  yourVisitors: 0,
  totalVisitors: 0,
  conversionVisitorsPercentage: null,
  buyBoxVisitorPercentage: null
}

export function useSalesAnalyticsDataset(
  session: AuthSession,
  isActivityConfigMode: boolean
) {
  const { message } = App.useApp()
  const currentStore = session.currentStore
  const [dateRange, setDateRange] = useState(initialDateRange)
  const [search, setSearch] = useState('')
  const [partnerSkuText, setPartnerSkuText] = useState('')
  const [categoryKeyword, setCategoryKeyword] = useState('')
  const [brand, setBrand] = useState('')
  const [productFulltype, setProductFulltype] = useState('')
  const [dataQualityCode, setDataQualityCode] = useState<string>()
  const [classificationOptions, setClassificationOptions] = useState<{
    brands: ProductClassificationOptionPayload[]
    fulltypes: ProductClassificationOptionPayload[]
    loading: boolean
  }>({ brands: [], fulltypes: [], loading: false })
  const [granularity] = useState('week')
  const [summary, setSummary] = useState<SalesAnalyticsSummary>(emptySummary)
  const [trends, setTrends] = useState<SalesTrendBucket[]>([])
  const [products, setProducts] = useState<SalesProductRow[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [selectedProducts, setSelectedProducts] = useState<SalesProductRow[]>([])
  const [compareOpen, setCompareOpen] = useState(false)

  const query = useMemo<SalesAnalyticsQuery | null>(() => {
    if (!currentStore?.storeCode) return null
    const combinedSearch = [search, categoryKeyword]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(' ')
    return {
      storeCode: currentStore.storeCode,
      siteCode: currentStore.site || siteCodeFromStoreCode(currentStore.storeCode),
      dateFrom: dateRange[0].format('YYYY-MM-DD'),
      dateTo: dateRange[1].format('YYYY-MM-DD'),
      search: combinedSearch,
      partnerSkuList: parsePartnerSkuText(partnerSkuText),
      brand,
      productFulltype,
      dataQualityCode
    }
  }, [
    brand,
    categoryKeyword,
    currentStore,
    dataQualityCode,
    dateRange,
    partnerSkuText,
    productFulltype,
    search
  ])
  const forecastQuery = useMemo<SalesForecastQuery | null>(() => (
    query ? { storeCode: query.storeCode, siteCode: query.siteCode } : null
  ), [query])

  const loadData = useCallback(async () => {
    if (!query) return
    setLoading(true)
    try {
      const [nextSummary, nextTrends, nextProducts] = await Promise.all([
        fetchSalesAnalyticsSummary(query),
        fetchSalesAnalyticsTrends(query, granularity),
        fetchSalesAnalyticsProducts(query)
      ])
      setSummary(nextSummary)
      setTrends(nextTrends)
      setProducts(nextProducts)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '销量分析数据加载失败')
    } finally {
      setLoading(false)
    }
  }, [granularity, message, query])

  const loadClassificationOptions = useCallback(async (
    filter?: { brandQuery?: string; fulltypeQuery?: string }
  ) => {
    if (!currentStore?.storeCode) {
      setClassificationOptions({ brands: [], fulltypes: [], loading: false })
      return
    }
    setClassificationOptions((current) => ({ ...current, loading: true }))
    try {
      const payload = await fetchProductClassificationOptions({
        ownerUserId: session.defaultOwnerUserId ?? session.userId,
        storeCode: currentStore.storeCode,
        brandQuery: filter?.brandQuery,
        fulltypeQuery: filter?.fulltypeQuery,
        limit: 50
      })
      setClassificationOptions({
        brands: payload.brands || [],
        fulltypes: payload.fulltypes || [],
        loading: false
      })
    } catch (error) {
      setClassificationOptions((current) => ({ ...current, loading: false }))
      message.warning(error instanceof Error ? error.message : '品牌和后台类目候选加载失败')
    }
  }, [currentStore?.storeCode, message, session.defaultOwnerUserId, session.userId])

  useEffect(() => {
    if (!isActivityConfigMode) void loadData()
  }, [isActivityConfigMode, loadData])

  useEffect(() => {
    if (!isActivityConfigMode) void loadClassificationOptions()
  }, [isActivityConfigMode, loadClassificationOptions])

  async function requestExport() {
    if (!query) return
    try {
      await exportSalesAnalyticsCsv(query)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '销量导出失败')
    }
  }

  function clearFilters() {
    setSearch('')
    setPartnerSkuText('')
    setCategoryKeyword('')
    setBrand('')
    setProductFulltype('')
    setDataQualityCode(undefined)
    setSelectedRowKeys([])
    setSelectedProducts([])
  }

  const productRowKey = (row: SalesProductRow) => row.partnerSku || row.sku || ''
  const rowSelection = {
    fixed: true as const,
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    getCheckboxProps: (record: SalesProductRow) => ({
      disabled: selectedRowKeys.length >= 5 && !selectedRowKeys.includes(productRowKey(record))
    }),
    onChange: (keys: Key[], rows: SalesProductRow[]) => {
      if (keys.length > 5) {
        message.warning('最多选择 5 个商品进行对比')
        return
      }
      setSelectedRowKeys(keys.map(String))
      setSelectedProducts(rows)
    }
  }

  return {
    currentStore,
    dateRange,
    setDateRange,
    search,
    setSearch,
    partnerSkuText,
    setPartnerSkuText,
    categoryKeyword,
    setCategoryKeyword,
    brand,
    setBrand,
    productFulltype,
    setProductFulltype,
    dataQualityCode,
    setDataQualityCode,
    classificationOptions,
    summary,
    trends,
    products,
    loading,
    selectedProducts,
    compareOpen,
    setCompareOpen,
    query,
    forecastQuery,
    granularity,
    loadData,
    loadClassificationOptions,
    requestExport,
    clearFilters,
    productRowKey,
    rowSelection
  }
}
