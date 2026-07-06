import {
  App,
  Button,
  Card,
  Checkbox,
  Drawer,
  Empty,
  Input,
  Modal,
  Segmented,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  CheckOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  EditOutlined,
  ExportOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  LineChartOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  StarFilled
} from '@ant-design/icons'
import { useEffect, useMemo, useState } from 'react'
import type { EChartsCoreOption } from 'echarts/core'
import type { AuthSession, AuthSessionStore } from '../auth/session'
import { ProductBaselineIdentity, normalizeProductImageUrl } from '../product-baseline'
import { ProductKeywordDetailDrawer, type ProductKeywordDetailKeyword } from '../product-keywords/ProductKeywordDetailDrawer'
import { EChartPanel } from '../../shared/charts'
import {
  addCompetitorKeyword,
  addManualCompetitor,
  confirmCompetitorCandidate,
  createCompetitorWatchProduct,
  deleteCompetitorKeyword,
  fetchCompetitorProductBaselines,
  fetchCompetitorProductChanges,
  fetchCompetitorRankHistory,
  fetchCompetitorRefreshRun,
  fetchCompetitorTask,
  fetchCompetitorWatchProductDetail,
  ignoreCompetitorCandidate,
  removeCompetitorCandidate,
  requestCompetitorMonitoring,
  requestCompetitorRefresh,
  updateCompetitorKeyword,
  type CompetitorTask
} from './api'
import { CompetitorDashboardTab } from './CompetitorDashboardTab'
import { CompetitorPriceChangeTab } from './CompetitorPriceChangeTab'
import { summarizeRanks } from './domain'
import { buildRankReportSummary, type RankReportSummary } from './rankReportSummary'
import { normalizeError } from '../../shared/api'
import type {
  CompetitorCandidate,
  CompetitorDashboardDrill,
  CompetitorKeyword,
  CompetitorProductChangeBaselineSummary,
  CompetitorProductChangeField,
  CompetitorProductChangeGroup,
  CompetitorRankPoint,
  CompetitorWatchProduct
} from './types'
import './CompetitorAnalysisPage.css'

const { Link, Text } = Typography
const DEFAULT_RANK_SCAN_DEPTH = 100

type CompetitorAnalysisPageProps = {
  session: AuthSession
}

type CompetitorAnalysisTabKey = 'dashboard' | 'detail' | 'priceChanges'

type HistoryRange = '7' | '30' | '90' | '180' | '365'

const SELF_RANK_REPORT_CHANGE_LABEL = '近15日变化'
const ZERO_COUNT_FILTER_OPTIONS = [
  { label: '监控为0', value: 'monitorZero' },
  { label: '候选为0', value: 'candidateZero' }
] as const
type ZeroCountFilterValue = (typeof ZERO_COUNT_FILTER_OPTIONS)[number]['value']
const PRODUCT_SORT_OPTIONS = [
  { label: '候选数↓', value: 'candidateCountDesc' },
  { label: '候选数↑', value: 'candidateCountAsc' },
  { label: '监控数↓', value: 'monitoredCountDesc' },
  { label: '监控数↑', value: 'monitoredCountAsc' },
  { label: '7日变化次数↓', value: 'recent7dChangeCountDesc' },
  { label: '7日变化次数↑', value: 'recent7dChangeCountAsc' }
] as const
type ProductSortValue = (typeof PRODUCT_SORT_OPTIONS)[number]['value']
type ProductFilterValue = ZeroCountFilterValue | ProductSortValue

const DEFAULT_PRODUCT_SORT_BY: ProductSortValue = 'candidateCountDesc'
const PRODUCT_SORT_VALUE_SET = new Set<string>(PRODUCT_SORT_OPTIONS.map((option) => option.value))

function isProductSortValue(value: string): value is ProductSortValue {
  return PRODUCT_SORT_VALUE_SET.has(value)
}

function siteCodeFromStoreCode(storeCode?: string) {
  const normalized = (storeCode || '').toUpperCase()
  if (normalized.endsWith('-NSA') || normalized.endsWith('-SAU') || normalized.endsWith('-SA')) return 'SA'
  if (normalized.endsWith('-NAE') || normalized.endsWith('-UAE') || normalized.endsWith('-AE')) return 'AE'
  if (normalized.endsWith('-NEG') || normalized.endsWith('-EG')) return 'EG'
  return ''
}

function storeKey(store?: AuthSessionStore | null) {
  if (!store?.storeCode) return ''
  return `${store.storeCode}|${store.site || siteCodeFromStoreCode(store.storeCode)}`
}

function uniqueStores(stores?: AuthSessionStore[], currentStore?: AuthSessionStore | null) {
  const result: AuthSessionStore[] = []
  const seen = new Set<string>()
  const addStore = (store?: AuthSessionStore | null) => {
    const key = storeKey(store)
    if (!store?.storeCode || !key || seen.has(key)) return
    seen.add(key)
    result.push(store)
  }
  ;(stores || []).forEach(addStore)
  addStore(currentStore)
  return result
}

function storeDisplayName(store?: AuthSessionStore | null) {
  return (
    store?.projectName ||
    store?.projectCode ||
    store?.orgName ||
    store?.orgCode ||
    store?.storeCode ||
    ''
  )
}

function sameProductLine(left: CompetitorWatchProduct, right: CompetitorWatchProduct) {
  if (left.id && right.id && left.id === right.id) {
    return true
  }
  const leftIdentity = productIdentityKey(left)
  const rightIdentity = productIdentityKey(right)
  if (leftIdentity && rightIdentity) {
    return leftIdentity === rightIdentity
  }
  return Boolean(
    left.productSiteOfferId &&
      right.productSiteOfferId &&
      left.productSiteOfferId === right.productSiteOfferId
  )
}

function productIdentityKey(product?: Pick<CompetitorWatchProduct, 'storeCode' | 'siteCode' | 'partnerSku'> | null) {
  const storeCode = product?.storeCode?.trim().toUpperCase()
  const siteCode = product?.siteCode?.trim().toUpperCase()
  const partnerSku = product?.partnerSku?.trim().toUpperCase()
  return storeCode && siteCode && partnerSku ? `${storeCode}::${siteCode}::${partnerSku}` : ''
}

function productRowKey(product: CompetitorWatchProduct) {
  return product.id || productIdentityKey(product) || product.productSiteOfferId || product.partnerSku || ''
}

function productActionKey(prefix: string, product: CompetitorWatchProduct) {
  return `${prefix}-${productRowKey(product) || 'product'}`
}

function hasValidSelfNoonCode(product: CompetitorWatchProduct) {
  return /^[ZN][A-Z0-9]{4,79}$/i.test(product.selfNoonProductCode || '')
}

function extractNoonProductCode(input: string) {
  return input.match(/[ZN][A-Z0-9]{7,79}/i)?.[0].toUpperCase() || ''
}

function changeCandidateStatus(
  keywordId: string,
  candidateId: string,
  status: 'confirmed' | 'ignored' | 'removed'
) {
  if (status === 'confirmed') {
    return confirmCompetitorCandidate(keywordId, candidateId)
  }
  if (status === 'ignored') {
    return ignoreCompetitorCandidate(keywordId, candidateId)
  }
  return removeCompetitorCandidate(keywordId, candidateId)
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function isTerminalRefreshStatus(status?: string) {
  const normalized = status?.toUpperCase()
  return normalized === 'SUCCEEDED' || normalized === 'PARTIAL_FAILED' || normalized === 'FAILED'
}

function isSuccessfulRefreshStatus(status?: string) {
  const normalized = status?.toUpperCase()
  return normalized === 'SUCCEEDED' || normalized === 'PARTIAL_FAILED'
}

function isTerminalTaskStatus(status?: string) {
  const normalized = status?.toUpperCase()
  return normalized === 'SUCCEEDED' || normalized === 'FAILED' || normalized === 'CANCELLED'
}

function isSuccessfulTaskStatus(status?: string) {
  return status?.toUpperCase() === 'SUCCEEDED'
}

function monitoringTaskSummary(task: CompetitorTask) {
  if (!task.resultJson) {
    return ''
  }
  try {
    const payload = JSON.parse(task.resultJson) as {
      watchProductTotal?: number
      submittedCount?: number
      failedCount?: number
    }
    if (typeof payload.submittedCount !== 'number') {
      return ''
    }
    const total = typeof payload.watchProductTotal === 'number' ? payload.watchProductTotal : payload.submittedCount
    const failed = typeof payload.failedCount === 'number' ? payload.failedCount : 0
    return failed > 0
      ? `已提交 ${payload.submittedCount}/${total} 个商品，${failed} 个提交失败`
      : `已提交 ${payload.submittedCount} 个商品抓取`
  } catch {
    return ''
  }
}

export function CompetitorAnalysisPage({ session }: CompetitorAnalysisPageProps) {
  const { message } = App.useApp()
  const [products, setProducts] = useState<CompetitorWatchProduct[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedProductDetail, setSelectedProductDetail] = useState<CompetitorWatchProduct>()
  const [keywordProduct, setKeywordProduct] = useState<CompetitorWatchProduct>()
  const [reportProduct, setReportProduct] = useState<CompetitorWatchProduct>()
  const [selectedKeywordDetail, setSelectedKeywordDetail] = useState<ProductKeywordDetailKeyword | null>(null)
  const [changeRows, setChangeRows] = useState<CompetitorProductChangeGroup[]>([])
  const [changeBaselineSummary, setChangeBaselineSummary] = useState<CompetitorProductChangeBaselineSummary>()
  const [detailOpen, setDetailOpen] = useState(false)
  const [keywordModalOpen, setKeywordModalOpen] = useState(false)
  const [manualModalOpen, setManualModalOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [reportRankLoading, setReportRankLoading] = useState(false)
  const [changeLoading, setChangeLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [openActionTooltip, setOpenActionTooltip] = useState<string | null>(null)
  const [productSearch, setProductSearch] = useState('')
  const [keywordSearch, setKeywordSearch] = useState('')
  const [competitorSearch, setCompetitorSearch] = useState('')
  const [monitorZeroOnly, setMonitorZeroOnly] = useState(false)
  const [candidateZeroOnly, setCandidateZeroOnly] = useState(false)
  const [productSortBy, setProductSortBy] = useState<ProductSortValue>(DEFAULT_PRODUCT_SORT_BY)
  const [keywordInput, setKeywordInput] = useState('')
  const [manualInput, setManualInput] = useState('')
  const [manualKeywordId, setManualKeywordId] = useState('')
  const [historyRange, setHistoryRange] = useState<HistoryRange>('30')
  const [productPage, setProductPage] = useState(1)
  const [productPageSize, setProductPageSize] = useState(50)
  const [productTotal, setProductTotal] = useState(0)
  const [activeTab, setActiveTab] = useState<CompetitorAnalysisTabKey>('dashboard')
  const productFilterValues: ProductFilterValue[] = [
    ...(monitorZeroOnly ? (['monitorZero'] as const) : []),
    ...(candidateZeroOnly ? (['candidateZero'] as const) : []),
    productSortBy
  ]

  const selectedProduct =
    selectedProductDetail &&
    (selectedProductDetail.id === selectedProductId || productRowKey(selectedProductDetail) === selectedProductId)
      ? selectedProductDetail
      : products.find((product) => product.id === selectedProductId || productRowKey(product) === selectedProductId) ?? products[0]
  const allowedStores = useMemo(
    () => uniqueStores(session.userStores, session.currentStore),
    [session.currentStore, session.userStores]
  )
  const currentStoreKey = storeKey(session.currentStore)
  const selectedStore = useMemo(
    () => allowedStores.find((store) => storeKey(store) === currentStoreKey) || allowedStores[0] || null,
    [allowedStores, currentStoreKey]
  )
  const selectedSiteCode = selectedStore?.site || siteCodeFromStoreCode(selectedStore?.storeCode)
  const selectedStoreLabel = storeDisplayName(selectedStore)
  const dashboardStoreCode = selectedStore?.storeCode || ''
  const dashboardSiteCode = selectedSiteCode
  const ownedNoonProductCodes = useMemo(
    () =>
      new Set(
        products
          .map((product) => normalizeNoonProductCode(product.selfNoonProductCode))
          .filter(Boolean)
      ),
    [products]
  )

  useEffect(() => {
    setProductPage(1)
  }, [selectedStore?.storeCode, selectedSiteCode])

  useEffect(() => {
    if (!selectedStore?.storeCode || !selectedSiteCode) {
      setProducts([])
      setProductTotal(0)
      setSelectedProductId('')
      return undefined
    }
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setListLoading(true)
      fetchCompetitorProductBaselines(
        {
          storeCode: selectedStore.storeCode,
          siteCode: selectedSiteCode,
          productSearch,
          keywordSearch,
          competitorSearch,
          confirmedCompetitorCountZero: monitorZeroOnly,
          pendingCandidateCountZero: candidateZeroOnly,
          sortBy: productSortBy,
          page: productPage,
          pageSize: productPageSize
        },
        controller.signal
      )
        .then((result) => {
          setProducts(result.items)
          setProductTotal(result.pagination?.total ?? result.items.length)
          setSelectedProductId((current) => {
            if (
              current &&
              result.items.some(
                (product) => product.id === current || productRowKey(product) === current
              )
            ) {
              return current
            }
            const first = result.items[0]
            return first ? productRowKey(first) : ''
          })
        })
        .catch((error) => {
          if (!isAbortError(error)) {
            message.error(normalizeError(error, '读取商品基线列表失败'))
          }
        })
        .finally(() => {
          setListLoading(false)
        })
    }, 180)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [
    competitorSearch,
    candidateZeroOnly,
    keywordSearch,
    message,
    monitorZeroOnly,
    productPage,
    productPageSize,
    productSearch,
    productSortBy,
    selectedSiteCode,
    selectedStore?.storeCode
  ])

  const mergeProduct = (product: CompetitorWatchProduct) => {
    const existingProduct = products.find((item) => sameProductLine(item, product))
    setSelectedProductDetail(existingProduct ? mergeProductTitleFields(existingProduct, product) : product)
    setProducts((current) =>
      current.some((item) => sameProductLine(item, product))
        ? current.map((item) =>
            sameProductLine(item, product)
              ? mergeProductTitleFields(item, product)
              : item
          )
        : [product, ...current]
    )
  }

  const loadProductDetail = async (productId: string, options?: { showLoading?: boolean }) => {
    if (options?.showLoading !== false) {
      setDetailLoading(true)
    }
    try {
      const detail = await fetchCompetitorWatchProductDetail(productId)
      mergeProduct(detail)
      return detail
    } catch (error) {
      message.error(normalizeError(error, '读取竞品监控详情失败'))
      return undefined
    } finally {
      if (options?.showLoading !== false) {
        setDetailLoading(false)
      }
    }
  }

  const ensureWatchProduct = async (product: CompetitorWatchProduct) => {
    if (product.id) {
      return product
    }
    if (!selectedStore?.storeCode || !selectedSiteCode) {
      message.warning('请先选择店铺和站点')
      return undefined
    }
    if (!product.productSiteOfferId || !hasValidSelfNoonCode(product)) {
      message.warning('当前商品缺少 Noon Z/N 码，暂不能做竞品分析')
      return undefined
    }
    try {
      const detail = await createCompetitorWatchProduct({
        storeCode: selectedStore.storeCode,
        siteCode: selectedSiteCode,
        productSiteOfferId: product.productSiteOfferId,
        selfNoonProductCode: product.selfNoonProductCode
      })
      mergeProduct(detail)
      return detail
    } catch (error) {
      message.error(normalizeError(error, '启用竞品分析失败'))
      return undefined
    }
  }

  const openDetail = async (product: CompetitorWatchProduct) => {
    setActionLoading(productActionKey('ensure', product))
    const readyProduct = await ensureWatchProduct(product)
    setActionLoading(null)
    if (!readyProduct?.id) {
      return
    }
    setSelectedProductId(readyProduct.id)
    setDetailOpen(true)
    void loadProductDetail(readyProduct.id)
  }

  const openReport = async (product: CompetitorWatchProduct) => {
    setOpenActionTooltip(null)
    const loadingKey = productActionKey('report', product)
    setActionLoading(loadingKey)
    const readyProduct = await ensureWatchProduct(product)
    if (!readyProduct?.id) {
      setActionLoading(null)
      return
    }
    const detailProduct = await loadProductDetail(readyProduct.id, { showLoading: false })
    setActionLoading(null)
    if (!detailProduct?.id) {
      return
    }
    setSelectedProductId(detailProduct.id)
    setReportProduct(detailProduct)
    setChangeRows([])
    setChangeBaselineSummary(undefined)
    setReportOpen(true)
    setReportRankLoading(true)
    loadReportRankHistory(detailProduct)
      .then(({ product: reportReadyProduct, failedCount }) => {
        setReportProduct(reportReadyProduct)
        mergeProduct(reportReadyProduct)
        if (failedCount > 0) {
          message.warning(`有 ${failedCount} 个关键词历史排名读取失败`)
        }
      })
      .catch((error) => {
        message.error(normalizeError(error, '读取历史排名失败'))
      })
      .finally(() => {
        setReportRankLoading(false)
      })
    setChangeLoading(true)
    try {
      const result = await fetchCompetitorProductChanges(detailProduct.id)
      setChangeRows(result.items)
      setChangeBaselineSummary(result.baselineSummary)
    } catch {
      setChangeRows([])
      setChangeBaselineSummary(undefined)
    } finally {
      setChangeLoading(false)
    }
  }

  const openManualModal = async (product: CompetitorWatchProduct) => {
    setActionLoading(productActionKey('ensure', product))
    const readyProduct = await ensureWatchProduct(product)
    setActionLoading(null)
    if (!readyProduct?.id) {
      return
    }
    setSelectedProductId(readyProduct.id)
    setManualInput('')
    setManualKeywordId('')
    const detail = await loadProductDetail(readyProduct.id)
    if (!detail) {
      return
    }
    const activeKeywords = detail.keywords
      .filter((keyword) => keyword.status === 'active')
      .slice()
      .sort((left, right) => left.displayOrder - right.displayOrder)
    if (!activeKeywords.length) {
      message.warning('请先维护关键词')
      setKeywordInput('')
      setManualModalOpen(false)
      setKeywordModalOpen(true)
      return
    }
    setManualKeywordId(activeKeywords[0].id)
    setManualModalOpen(true)
  }

  const openKeywordModal = async (product: CompetitorWatchProduct) => {
    setActionLoading(productActionKey('ensure', product))
    const readyProduct = await ensureWatchProduct(product)
    setActionLoading(null)
    if (!readyProduct?.id) {
      return
    }
    setSelectedProductId(readyProduct.id)
    setKeywordProduct(readyProduct)
    setKeywordInput('')
    setKeywordModalOpen(true)
    const detail = await loadProductDetail(readyProduct.id)
    if (detail) {
      setKeywordProduct(detail)
    }
  }

  const handleAddKeyword = async () => {
    const targetProduct = keywordProduct || selectedProduct
    if (!targetProduct?.id) {
      message.warning('请先启用竞品分析')
      return
    }
    const keyword = keywordInput.trim()
    if (!keyword) {
      return
    }
    setActionLoading('add-keyword')
    try {
      const detail = await addCompetitorKeyword(targetProduct.id, keyword, `en-${targetProduct.siteCode}`)
      mergeProduct(detail)
      setKeywordProduct(detail)
      message.success('关键词已加入监控')
      setKeywordInput('')
    } catch (error) {
      message.error(normalizeError(error, '新增关键词失败'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleKeywordStatusChange = async (keyword: CompetitorKeyword, status: 'active' | 'paused') => {
    setActionLoading(`keyword-status-${keyword.id}`)
    try {
      const detail = await updateCompetitorKeyword(keyword.id, {
        keyword: keyword.keyword,
        locale: keyword.locale,
        displayOrder: keyword.displayOrder,
        status
      })
      mergeProduct(detail)
      setKeywordProduct(detail)
      message.success(status === 'active' ? '关键词已启用' : '关键词已暂停')
    } catch (error) {
      message.error(normalizeError(error, '更新关键词失败'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleKeywordDelete = async (keyword: CompetitorKeyword) => {
    setActionLoading(`keyword-delete-${keyword.id}`)
    try {
      const detail = await deleteCompetitorKeyword(keyword.id)
      mergeProduct(detail)
      setKeywordProduct(detail)
      message.success('关键词已从竞品监控移除')
    } catch (error) {
      message.error(normalizeError(error, '移除关键词失败'))
    } finally {
      setActionLoading(null)
    }
  }

  const openProductKeywordDetail = (product: CompetitorWatchProduct, keyword: CompetitorKeyword) => {
    setSelectedKeywordDetail({
      storeCode: product.storeCode,
      siteCode: product.siteCode,
      partnerSku: product.partnerSku,
      keyword: keyword.keyword,
      keywordNorm: keyword.keywordNorm || normalizeProductKeywordNorm(keyword.keyword),
      competitorEvidence: true
    })
  }

  const handleManualAdd = async () => {
    if (!selectedProduct) {
      return
    }
    const input = manualInput.trim()
    if (!input) {
      return
    }
    if (!manualKeywordId) {
      message.warning('请先选择关键词')
      return
    }
    const noonProductCode = extractNoonProductCode(input)
    if (
      noonProductCode &&
      selectedProduct.candidates.some(
        (candidate) =>
          candidate.noonProductCode.toUpperCase() === noonProductCode &&
          candidateStatusForKeyword(candidate, manualKeywordId) !== 'ignored'
      )
    ) {
      message.warning('竞品已存在')
      return
    }
    setActionLoading('manual-add')
    try {
      const detail = await addManualCompetitor(selectedProduct.id, input, manualKeywordId)
      mergeProduct(detail)
      message.success('手工竞品已加入确认池')
      setManualInput('')
    } catch (error) {
      message.error(normalizeError(error, '手工添加竞品失败'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleManualRefresh = async (product: CompetitorWatchProduct) => {
    if (!product.id) {
      message.warning('请先启用竞品分析')
      return
    }
    const activeKeywordCount =
      product.activeKeywordCount ??
      product.keywords.filter((keyword) => keyword.status === 'active').length
    if (activeKeywordCount <= 0) {
      message.warning('请先维护至少一个启用关键词')
      return
    }

    const loadingKey = `refresh-${product.id}`
    setActionLoading(loadingKey)
    try {
      const run = await requestCompetitorRefresh(product.id)
      const runId = run.runId
      setProducts((current) =>
        current.map((item) =>
          sameProductLine(item, product)
            ? {
                ...item,
                latestRunStatus: 'running',
                latestRunAt: item.latestRunAt || '-'
              }
            : item
        )
      )
      if (!runId) {
        message.success('抓取任务已提交')
        return
      }

      message.success(`抓取任务已提交：${runId}`)
      let latestRun = run
      for (let attempt = 0; attempt < 20; attempt += 1) {
        if (isTerminalRefreshStatus(latestRun.runStatus)) {
          break
        }
        await delay(900)
        latestRun = await fetchCompetitorRefreshRun(runId)
      }

      if (isSuccessfulRefreshStatus(latestRun.runStatus)) {
        await loadProductDetail(product.id, { showLoading: false })
        message.success('抓取完成，抓取结果已刷新')
        return
      }
      if (latestRun.runStatus && isTerminalRefreshStatus(latestRun.runStatus)) {
        message.error(latestRun.errorMessage || latestRun.errorCode || '抓取失败')
        return
      }
      message.info('抓取仍在运行，稍后重新打开详情可查看结果')
    } catch (error) {
      message.error(normalizeError(error, '提交竞品抓取失败'))
    } finally {
      setActionLoading(null)
    }
  }

  const reloadProductBaselines = async () => {
    if (!selectedStore?.storeCode || !selectedSiteCode) {
      return
    }
    setListLoading(true)
    try {
      const result = await fetchCompetitorProductBaselines({
        storeCode: selectedStore.storeCode,
        siteCode: selectedSiteCode,
        productSearch,
        keywordSearch,
        competitorSearch,
        confirmedCompetitorCountZero: monitorZeroOnly,
        pendingCandidateCountZero: candidateZeroOnly,
        sortBy: productSortBy,
        page: productPage,
        pageSize: productPageSize
      })
      setProducts(result.items)
      setProductTotal(result.pagination?.total ?? result.items.length)
    } catch (error) {
      message.error(normalizeError(error, '刷新商品基线列表失败'))
    } finally {
      setListLoading(false)
    }
  }

  const handleManualMonitoring = async () => {
    if (!selectedStore?.storeCode || !selectedSiteCode) {
      message.warning('请先选择店铺和站点')
      return
    }
    setActionLoading('store-monitoring')
    try {
      const task = await requestCompetitorMonitoring(selectedStore.storeCode, selectedSiteCode)
      const taskId = task.taskId
      message.success(taskId ? `手动监控任务已提交：${taskId}` : '手动监控任务已提交')
      if (!taskId) {
        await reloadProductBaselines()
        return
      }

      let latestTask = task
      for (let attempt = 0; attempt < 20; attempt += 1) {
        if (isTerminalTaskStatus(latestTask.status)) {
          break
        }
        await delay(900)
        latestTask = await fetchCompetitorTask(taskId)
      }

      if (isSuccessfulTaskStatus(latestTask.status)) {
        await reloadProductBaselines()
        message.success(monitoringTaskSummary(latestTask) || '手动监控批次已提交商品抓取')
        return
      }
      if (latestTask.status && isTerminalTaskStatus(latestTask.status)) {
        message.error(latestTask.message || latestTask.errorCode || '手动监控失败')
        return
      }
      message.info('手动监控批次仍在提交，稍后刷新列表查看各商品抓取状态')
    } catch (error) {
      message.error(normalizeError(error, '提交手动监控失败'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleCandidateStatusChange = async (
    keywordId: string,
    candidateId: string,
    status: 'confirmed' | 'ignored' | 'removed'
  ) => {
    setActionLoading(`candidate-${status}-${keywordId}-${candidateId}`)
    try {
      const detail = await changeCandidateStatus(keywordId, candidateId, status)
      mergeProduct(detail)
      message.success(status === 'confirmed' ? '竞品已确认' : status === 'ignored' ? '竞品已忽略' : '竞品已移除')
    } catch (error) {
      message.error(
        normalizeError(
          error,
          status === 'confirmed' ? '确认竞品失败' : status === 'ignored' ? '忽略竞品失败' : '移除竞品失败'
        )
      )
    } finally {
      setActionLoading(null)
    }
  }

  const handleCandidateBatchStatusChange = async (
    keywordId: string,
    candidateIds: string[],
    status: 'confirmed' | 'ignored'
  ) => {
    const uniqueCandidateIds = Array.from(new Set(candidateIds.filter(Boolean)))
    if (!uniqueCandidateIds.length) {
      return
    }

    setActionLoading(`candidate-batch-${status}-${keywordId}`)
    let latestDetail: CompetitorWatchProduct | undefined
    let processedCount = 0
    try {
      for (const candidateId of uniqueCandidateIds) {
        latestDetail =
          status === 'confirmed'
            ? await confirmCompetitorCandidate(keywordId, candidateId)
            : await ignoreCompetitorCandidate(keywordId, candidateId)
        processedCount += 1
      }
      if (latestDetail) {
        mergeProduct(latestDetail)
      }
      message.success(status === 'confirmed' ? `已加入 ${processedCount} 个竞品` : `已忽略 ${processedCount} 个竞品`)
    } catch (error) {
      if (latestDetail) {
        mergeProduct(latestDetail)
      }
      const prefix = processedCount > 0 ? `已处理 ${processedCount} 个，` : ''
      message.error(
        prefix + normalizeError(error, status === 'confirmed' ? '批量加入竞品失败' : '批量忽略竞品失败')
      )
    } finally {
      setActionLoading(null)
    }
  }

  const resetSearch = () => {
    setProductSearch('')
    setKeywordSearch('')
    setCompetitorSearch('')
    setMonitorZeroOnly(false)
    setCandidateZeroOnly(false)
    setProductSortBy(DEFAULT_PRODUCT_SORT_BY)
    setProductPage(1)
  }

  const candidateCounts = (product: CompetitorWatchProduct) => ({
    pending:
      product.pendingCandidateCount ??
      product.candidates.filter((candidate) => candidate.reviewStatus === 'pending').length,
    confirmed:
      product.confirmedCompetitorCount ??
      product.candidates.filter((candidate) => candidate.reviewStatus === 'confirmed').length
  })
  const keywordPanelProduct = keywordProduct || selectedProduct

  const handleDashboardDrill = async (drill: CompetitorDashboardDrill) => {
    if (!drill.watchProductId && !drill.productSiteOfferId && !drill.issueType && !drill.changeType && !drill.date) {
      return
    }
    setActiveTab('detail')
    if (drill.watchProductId) {
      setSelectedProductId(drill.watchProductId)
      const row = products.find((product) => product.id === drill.watchProductId)
      if (row) {
        await openDetail(row)
        return
      }
      const detail = await loadProductDetail(drill.watchProductId)
      if (detail) {
        setDetailOpen(true)
      }
      return
    }
    if (drill.productSiteOfferId) {
      const drillPartnerSku = 'partnerSku' in drill && typeof drill.partnerSku === 'string' ? drill.partnerSku : ''
      setProductSearch(drillPartnerSku || drill.productSiteOfferId)
      setProductPage(1)
    }
  }

  const productColumns: ColumnsType<CompetitorWatchProduct> = [
    {
      title: '商品基线',
      dataIndex: 'title',
      key: 'title',
      fixed: 'left',
      width: 310,
      render: (_value, product) => {
        const titleLines = productTitleLines(product)
        return (
          <ProductBaselineIdentity
            compact
            title={<ProductTitleStack titleLines={titleLines} />}
            fallbackTitle="未命名商品"
            imageUrl={product.imageUrl}
            imageAlt={titleLines.alt}
            imageWidth={70}
            titleMaxWidth={200}
            codes={productListIdentityCodes(product)}
            tags={!product.id ? <Tag style={{ marginInlineEnd: 0 }}>未监控</Tag> : undefined}
          />
        )
      }
    },
    {
      title: '关键词',
      key: 'keywords',
      width: 250,
      render: (_value, product) => {
        return (
          <ProductKeywordLinks
            product={product}
            onEdit={() => void openKeywordModal(product)}
          />
        )
      }
    },
    {
      title: '候选/监控中',
      key: 'candidates',
      width: 96,
      render: (_value, product) => {
        const { pending, confirmed } = candidateCounts(product)
        return (
          <div className="competitor-analysis-count-stack">
            <div className="competitor-analysis-count-row">
              <Text type="secondary">候选</Text>
              <Tag color={pending ? 'gold' : 'default'}>{pending}</Tag>
            </div>
            <div className="competitor-analysis-count-row">
              <Text type="secondary">监控中</Text>
              <Tag color="green">{confirmed}</Tag>
            </div>
          </div>
        )
      }
    },
    {
      title: '近7日竞品变化',
      key: 'recent-competitor-changes',
      width: 126,
      align: 'center',
      render: (_value, product) => {
        const changedProductCount = product.recent7dChangedCompetitorCount ?? 0
        const changeCount = product.recent7dCompetitorChangeCount ?? 0
        return (
          <Space direction="vertical" size={0}>
            <Text type={changedProductCount ? undefined : 'secondary'}>共 {changedProductCount} 个商品</Text>
            <Text type={changeCount ? undefined : 'secondary'}>共 {changeCount} 次</Text>
          </Space>
        )
      }
    },
    {
      title: '排名摘要',
      key: 'rank',
      width: 146,
      render: (_value, product) => {
        const summary = product.id ? summarizeRanks(product) : undefined
        return (
          <Space direction="vertical" size={2}>
            <Text>{summary?.label || '暂无排名'}</Text>
            <Text type="secondary">{summary?.notInScanDepthCount ?? 0} 次{formatNotInRankRangeText()}</Text>
          </Space>
        )
      }
    },
    {
      title: '最近抓取',
      key: 'run',
      width: 140,
      render: (_value, product) => (
        <Space direction="vertical" size={2}>
          {product.id ? <RunStatusTag status={product.latestRunStatus} /> : <Tag>未开始</Tag>}
          <Text type="secondary">{product.id ? product.latestRunAt : '-'}</Text>
        </Space>
      )
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 152,
      render: (_value, product) => {
        const activeKeywordCount =
          product.activeKeywordCount ??
          product.keywords.filter((keyword) => keyword.status === 'active').length
        const refreshDisabled = !product.id || activeKeywordCount <= 0
        const refreshTitle = activeKeywordCount <= 0 ? '维护启用关键词后可抓取' : ''
        return (
          <Space size={4} className="competitor-analysis-row-actions">
            <Tooltip title={refreshTitle || '抓取'}>
              <Button
                aria-label="抓取"
                size="small"
                icon={<ReloadOutlined />}
                shape="circle"
                disabled={refreshDisabled}
                loading={actionLoading === `refresh-${product.id}`}
                onClick={() => void handleManualRefresh(product)}
              />
            </Tooltip>
            <Tooltip title="添加竞品">
              <Button
                aria-label="添加竞品"
                size="small"
                icon={<PlusOutlined />}
                shape="circle"
                loading={actionLoading === productActionKey('ensure', product)}
                onClick={() => void openManualModal(product)}
              />
            </Tooltip>
            <Tooltip title="查看详情">
              <Button
                aria-label="查看详情"
                size="small"
                icon={<EyeOutlined />}
                shape="circle"
                loading={actionLoading === productActionKey('ensure', product)}
                onClick={() => void openDetail(product)}
              />
            </Tooltip>
            <Tooltip
              title="报表"
              open={openActionTooltip === productActionKey('report', product) && !reportOpen}
              onOpenChange={(open) =>
                setOpenActionTooltip(open ? productActionKey('report', product) : null)
              }
            >
              <Button
                aria-label="报表"
                size="small"
                icon={<LineChartOutlined />}
                shape="circle"
                loading={actionLoading === productActionKey('report', product)}
                onClick={() => void openReport(product)}
              />
            </Tooltip>
          </Space>
        )
      }
    }
  ]

  return (
    <div className="competitor-analysis-page" data-testid="competitor-analysis-workbench">
      <Tabs
        className="competitor-analysis-main-tabs"
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as CompetitorAnalysisTabKey)}
        items={[
          {
            key: 'dashboard',
            label: '数据看板',
            children: (
              <CompetitorDashboardTab
                storeCode={dashboardStoreCode}
                siteCode={dashboardSiteCode}
                onDrill={(drill) => void handleDashboardDrill(drill)}
              />
            )
          },
          {
            key: 'detail',
            label: '明细维护',
            children: (
              <>
                <Card size="small" className="competitor-analysis-search-card" variant="borderless">
                  <div className="competitor-analysis-search-grid">
                    <Input
                      allowClear
                      prefix={<SearchOutlined />}
                      placeholder="搜索我方SKU、商品标题、Noon码"
                      value={productSearch}
                      onChange={(event) => {
                        setProductSearch(event.target.value)
                        setProductPage(1)
                      }}
                    />
                    <Input
                      allowClear
                      prefix={<SearchOutlined />}
                      placeholder="搜索关键词"
                      value={keywordSearch}
                      onChange={(event) => {
                        setKeywordSearch(event.target.value)
                        setProductPage(1)
                      }}
                    />
                    <Input
                      allowClear
                      prefix={<SearchOutlined />}
                      placeholder="搜索竞品Z/N码、品牌、标题"
                      value={competitorSearch}
                      onChange={(event) => {
                        setCompetitorSearch(event.target.value)
                        setProductPage(1)
                      }}
                    />
                    <Select
                      allowClear
                      className="competitor-analysis-zero-filter-select"
                      data-testid="competitor-analysis-filter-select"
                      maxTagCount={2}
                      mode="multiple"
                      options={[...ZERO_COUNT_FILTER_OPTIONS, ...PRODUCT_SORT_OPTIONS]}
                      placeholder="筛选"
                      value={productFilterValues}
                      onChange={(values) => {
                        const nextValues = new Set(values as ProductFilterValue[])
                        const selectedSortValues = (values as ProductFilterValue[]).filter(isProductSortValue)
                        setMonitorZeroOnly(nextValues.has('monitorZero'))
                        setCandidateZeroOnly(nextValues.has('candidateZero'))
                        setProductSortBy(selectedSortValues[selectedSortValues.length - 1] || DEFAULT_PRODUCT_SORT_BY)
                        setProductPage(1)
                      }}
                    />
                    <Space wrap>
                      <Tooltip title="按当前店铺/站点提交已有确认竞品的监控商品">
                        <Button
                          icon={<ReloadOutlined />}
                          loading={actionLoading === 'store-monitoring'}
                          disabled={!selectedStore?.storeCode || !selectedSiteCode}
                          onClick={() => void handleManualMonitoring()}
                        >
                          手动监控
                        </Button>
                      </Tooltip>
                      <Button onClick={resetSearch}>重置</Button>
                    </Space>
                  </div>
                </Card>

                <Card size="small" className="competitor-analysis-list-card" variant="borderless">
                  <Table
                    className="competitor-analysis-table"
                    rowKey={productRowKey}
                    columns={productColumns}
                    dataSource={products}
                    loading={listLoading}
                    pagination={{
                      current: productPage,
                      pageSize: productPageSize,
                      total: productTotal,
                      showSizeChanger: true,
                      showTotal: (total) => `共 ${total} 个商品`,
                      onChange: (page, pageSize) => {
                        setProductPage(page)
                        setProductPageSize(pageSize)
                      }
                    }}
                    scroll={{ x: 1220 }}
                    size="middle"
                  />
                </Card>
              </>
            )
          },
          {
            key: 'priceChanges',
            label: '详情变化',
            children: (
              <CompetitorPriceChangeTab
                storeCode={dashboardStoreCode}
                siteCode={dashboardSiteCode}
                onDrill={(drill) => void handleDashboardDrill(drill)}
              />
            )
          }
        ]}
      />

      {selectedProduct ? (
        <>
          <Drawer
            width="min(1360px, calc(100vw - 96px))"
            open={detailOpen}
            onClose={() => setDetailOpen(false)}
            title="我方商品竞品详情"
            destroyOnClose={false}
          >
            <ProductDetail
              product={selectedProduct}
              storeLabel={selectedStoreLabel}
              ownedNoonProductCodes={ownedNoonProductCodes}
              historyRange={historyRange}
              onHistoryRangeChange={setHistoryRange}
              onCandidateStatusChange={(keywordId, candidateId, status) =>
                void handleCandidateStatusChange(keywordId, candidateId, status)
              }
              onCandidateBatchStatusChange={(keywordId, candidateIds, status) =>
                void handleCandidateBatchStatusChange(keywordId, candidateIds, status)
              }
              onManualRefresh={(product) => void handleManualRefresh(product)}
              actionLoading={actionLoading}
            />
          </Drawer>

          <Modal
            width={680}
            open={manualModalOpen}
            title="手工添加竞品"
            footer={null}
            onCancel={() => setManualModalOpen(false)}
            destroyOnClose={false}
          >
            <Spin spinning={detailLoading}>
              <ManualCompetitorPanel
                product={selectedProduct}
                manualInput={manualInput}
                selectedKeywordId={manualKeywordId}
                actionLoading={actionLoading}
                onManualInputChange={setManualInput}
                onManualKeywordChange={setManualKeywordId}
                onManualAdd={() => void handleManualAdd()}
              />
            </Spin>
          </Modal>
        </>
      ) : null}
      {keywordPanelProduct ? (
        <Modal
          width={640}
          open={keywordModalOpen}
          title="关键词维护"
          footer={null}
          onCancel={() => {
            setKeywordModalOpen(false)
            setKeywordProduct(undefined)
          }}
          destroyOnClose={false}
        >
          <Spin spinning={detailLoading}>
            <KeywordMaintenancePanel
              product={keywordPanelProduct}
              keywordInput={keywordInput}
              actionLoading={actionLoading}
              onKeywordInputChange={setKeywordInput}
              onAddKeyword={() => void handleAddKeyword()}
              onKeywordStatusChange={(keyword, status) => void handleKeywordStatusChange(keyword, status)}
              onKeywordDelete={(keyword) => void handleKeywordDelete(keyword)}
              onKeywordDetailOpen={(keyword) => openProductKeywordDetail(keywordPanelProduct, keyword)}
            />
          </Spin>
        </Modal>
      ) : null}
      <ProductKeywordDetailDrawer
        open={Boolean(selectedKeywordDetail)}
        onClose={() => setSelectedKeywordDetail(null)}
        keyword={selectedKeywordDetail}
      />
      {reportProduct ? (
        <Modal
          className="competitor-analysis-report-dialog"
          width="min(1180px, calc(100vw - 96px))"
          open={reportOpen}
          title={null}
          footer={null}
          style={{ top: 32 }}
          onCancel={() => setReportOpen(false)}
          destroyOnClose={false}
        >
          <SelfRankReportModal
            product={reportProduct}
            storeLabel={selectedStoreLabel}
            rankLoading={reportRankLoading}
            changeGroups={changeRows}
            changeBaselineSummary={changeBaselineSummary}
            changeLoading={changeLoading}
          />
        </Modal>
      ) : null}
    </div>
  )
}

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase()
}

function normalizeProductKeywordNorm(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

async function loadReportRankHistory(product: CompetitorWatchProduct, rangeDays = 15) {
  const activeKeywords = product.keywords.filter((keyword) => keyword.status === 'active' && keyword.id)
  if (!product.id || !activeKeywords.length) {
    return { product, failedCount: 0 }
  }

  const results = await Promise.allSettled(
    activeKeywords.map((keyword) =>
      fetchCompetitorRankHistory(product.id, {
        keywordId: keyword.id,
        rangeDays
      })
    )
  )
  const rankPoints = results.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
  const failedCount = results.filter((result) => result.status === 'rejected').length
  return {
    product: rankPoints.length ? mergeReportRankPoints(product, rankPoints) : product,
    failedCount
  }
}

function mergeReportRankPoints(product: CompetitorWatchProduct, rankPoints: CompetitorRankPoint[]) {
  const pointByKey = new Map<string, CompetitorRankPoint>()
  ;[...product.rankPoints, ...rankPoints].forEach((point) => {
    pointByKey.set(reportRankPointKey(point), point)
  })
  return {
    ...product,
    rankPoints: Array.from(pointByKey.values()).sort((left, right) => {
      const dateCompare = left.factDate.localeCompare(right.factDate)
      if (dateCompare !== 0) return dateCompare
      const keywordCompare = left.keywordId.localeCompare(right.keywordId)
      if (keywordCompare !== 0) return keywordCompare
      return left.noonProductCode.localeCompare(right.noonProductCode)
    })
  }
}

function reportRankPointKey(point: CompetitorRankPoint) {
  return [
    point.keywordId,
    normalizeNoonProductCode(point.noonProductCode),
    point.factDate,
    point.rankChannel || 'organic',
    point.isSponsored ? 'ad' : 'natural',
    point.isSelf ? 'self' : 'competitor'
  ].join(':')
}

function mergeProductTitleFields(existing: CompetitorWatchProduct, incoming: CompetitorWatchProduct) {
  return {
    ...existing,
    ...incoming,
    title: incoming.title || existing.title,
    titleCn: incoming.titleCn || existing.titleCn
  }
}

function productTitleLines(product: CompetitorWatchProduct) {
  const englishTitle = product.title?.trim() || ''
  const chineseTitle = product.titleCn?.trim() || ''
  const primary = chineseTitle || englishTitle || '未命名商品'
  const secondary =
    englishTitle && normalizeSearchText(englishTitle) !== normalizeSearchText(primary)
      ? englishTitle
      : ''
  return {
    primary,
    secondary,
    alt: chineseTitle || englishTitle || '商品图片'
  }
}

function ProductTitleStack({ titleLines }: { titleLines: ReturnType<typeof productTitleLines> }) {
  return (
    <span className="competitor-analysis-product-title-stack">
      <span className="competitor-analysis-product-title-cn">{titleLines.primary}</span>
      {titleLines.secondary ? (
        <Tooltip placement="topLeft" title={titleLines.secondary}>
          <span className="competitor-analysis-product-title-en">{titleLines.secondary}</span>
        </Tooltip>
      ) : null}
    </span>
  )
}

function productListIdentityCodes(product: CompetitorWatchProduct) {
  const psku = product.partnerSku || ''
  return [
    { value: psku || '-', copyText: psku || undefined },
    ...(product.selfNoonProductCode
      ? [
          {
            value: product.selfNoonProductCode,
            copyText: product.selfNoonProductCode
          }
        ]
      : [])
  ]
}

function ProductKeywordLinks({
  product,
  onEdit
}: {
  product: CompetitorWatchProduct
  onEdit: () => void
}) {
  const activeKeywords = product.keywords
    .filter((keyword) => keyword.status === 'active' && keyword.keyword.trim())
    .slice()
    .sort((left, right) => left.displayOrder - right.displayOrder)
  const visibleKeywords = activeKeywords.filter((keyword) => keyword.monitoredCount !== 0)
  const hiddenKeywordCount = activeKeywords.length - visibleKeywords.length

  return (
    <div className="competitor-analysis-keyword-cell">
      <div className="competitor-analysis-keyword-content">
        <div className="competitor-analysis-keyword-inline-list">
          {visibleKeywords.map((keyword) => {
            const rankChange = keywordRankChangeDisplay(keyword)
            return (
              <div className="competitor-analysis-keyword-row" key={keyword.id}>
                <a
                  className="competitor-analysis-keyword-link"
                  href={buildNoonSearchUrl(keyword.keyword, product.siteCode, product.id, keyword.id)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <SearchOutlined />
                  <span className="competitor-analysis-keyword-text">{keyword.keyword}</span>
                </a>
                <Tooltip title={rankChange.title}>
                  <Tag
                    className="competitor-analysis-keyword-rank-tag"
                    color={rankChange.color}
                  >
                    {rankChange.label}
                  </Tag>
                </Tooltip>
              </div>
            )
          })}
          {hiddenKeywordCount ? (
            <Tag className="competitor-analysis-keyword-other-tag">其他 {hiddenKeywordCount} 个</Tag>
          ) : null}
          {!visibleKeywords.length && !hiddenKeywordCount ? (
            <Text type="secondary">-</Text>
          ) : null}
        </div>
      </div>
      <Tooltip title="编辑关键词">
        <Button
          aria-label="编辑关键词"
          className="competitor-analysis-keyword-edit-button"
          icon={<EditOutlined />}
          size="small"
          type="text"
          onClick={onEdit}
        />
      </Tooltip>
    </div>
  )
}

function keywordRankChangeDisplay(keyword: CompetitorKeyword) {
  const change = keyword.selfRankChange
  const previousRankStatus = change?.previousRankStatus
  const rankStatus = change?.rankStatus
  if (!change || !previousRankStatus || !rankStatus) {
    return {
      label: '无数据',
      color: 'default' as const,
      title: '昨天到今天暂无可比本品排名'
    }
  }

  const title = `${change.previousDate || '昨天'} ${keywordRankValue(previousRankStatus, change.previousRankNo)} -> ${
    change.currentDate || '今天'
  } ${keywordRankValue(rankStatus, change.rankNo)}`

  if (previousRankStatus !== 'ranked' && rankStatus === 'ranked') {
    return { label: '进榜', color: 'green' as const, title }
  }
  if (previousRankStatus === 'ranked' && rankStatus !== 'ranked') {
    return { label: '出榜', color: 'red' as const, title }
  }
  if (previousRankStatus !== 'ranked' && rankStatus !== 'ranked') {
    return { label: '未进榜', color: 'default' as const, title }
  }

  const rankDelta = change.rankDelta
  if (typeof rankDelta === 'number' && Number.isFinite(rankDelta)) {
    if (rankDelta > 0) {
      return { label: `升${rankDelta}名`, color: 'green' as const, title }
    }
    if (rankDelta < 0) {
      return { label: `降${Math.abs(rankDelta)}名`, color: 'red' as const, title }
    }
  }
  return { label: '持平', color: 'default' as const, title }
}

function keywordRankValue(status: NonNullable<CompetitorKeyword['selfRankChange']>['rankStatus'], rankNo?: number) {
  if (status === 'ranked') {
    return rankNo ? `第${rankNo}名` : '已进榜'
  }
  return '未进榜'
}

function buildNoonSearchUrl(keyword: string, siteCode: string, watchProductId?: string, keywordId?: string) {
  const searchUrl = `https://www.noon.com/${noonMarketPath(siteCode)}/search/?q=${encodeURIComponent(keyword)}`
  const fragment = new URLSearchParams()
  if (watchProductId) {
    fragment.set('nuonoWatchProductId', watchProductId)
  }
  if (keywordId && /^\d+$/.test(keywordId)) {
    fragment.set('nuonoKeywordId', keywordId)
  }
  fragment.set('nuonoKeyword', keyword)
  const fragmentText = fragment.toString()
  return fragmentText ? `${searchUrl}#${fragmentText}` : searchUrl
}

function noonMarketPath(siteCode: string) {
  const normalized = siteCode.trim().toUpperCase()
  if (normalized === 'SA') return 'saudi-en'
  if (normalized === 'EG') return 'egypt-en'
  return 'uae-en'
}

function ProductChangeModal({
  product,
  storeLabel,
  groups,
  baselineSummary,
  showIdentity = true,
  showSummary = true
}: {
  product: CompetitorWatchProduct
  storeLabel?: string
  groups: CompetitorProductChangeGroup[]
  baselineSummary?: CompetitorProductChangeBaselineSummary
  showIdentity?: boolean
  showSummary?: boolean
}) {
  const summary = buildProductChangeSummary(groups)
  const competitorCards = buildProductChangeCompetitorCards(product, groups)
  const monitoredCompetitorCount = baselineSummary?.monitoredCompetitorCount ?? product.confirmedCompetitorCount ?? 0
  const titleLines = productTitleLines(product)
  const emptyDescription = baselineSummary?.snapshotCompetitorCount
    ? `已抓取 ${baselineSummary.snapshotCompetitorCount}/${baselineSummary.monitoredCompetitorCount || baselineSummary.snapshotCompetitorCount} 个监控竞品基线，最新 ${formatSnapshotDate(baselineSummary.latestSnapshotDate)}，暂无字段变化`
    : monitoredCompetitorCount
      ? `当前有 ${monitoredCompetitorCount} 个监控竞品，暂无字段变化`
    : '暂无商品详情变化'

  return (
    <div className="competitor-analysis-product-change-modal" data-testid="competitor-product-change-modal">
      {showIdentity ? (
        <ProductBaselineIdentity
          title={<ProductTitleStack titleLines={titleLines} />}
          fallbackTitle="未命名商品"
          imageUrl={product.imageUrl}
          imageAlt={titleLines.alt}
          imageWidth={72}
          titleMaxWidth={680}
          codes={[
            { label: '店铺', value: storeLabel || product.storeCode || '-' },
            {
              label: 'psku',
              value: product.partnerSku || '-',
              copyText: product.partnerSku || undefined
            },
            ...(product.selfNoonProductCode
              ? [
                  {
                    label: 'Noon',
                    value: product.selfNoonProductCode,
                    copyText: product.selfNoonProductCode
                  }
                ]
              : [])
          ]}
          tags={
            <>
              <Tag style={{ marginInlineEnd: 0 }}>{product.siteCode || '-'}</Tag>
              <Tag color="cyan" style={{ marginInlineEnd: 0 }}>商品详情变化</Tag>
            </>
          }
        />
      ) : null}

      {showSummary ? (
        <ProductChangeSummaryLine
          summary={summary}
          monitoredCompetitorCount={monitoredCompetitorCount}
          baselineSummary={baselineSummary}
        />
      ) : null}

      {competitorCards.length ? (
        <div className="competitor-analysis-product-change-competitor-list">
          {competitorCards.map((card) => (
            <ProductChangeCompetitorCard key={card.noonProductCode} product={product} card={card} />
          ))}
        </div>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyDescription} />
      )}
    </div>
  )
}

function ProductChangeSummaryLine({
  summary,
  monitoredCompetitorCount,
  baselineSummary
}: {
  summary: ReturnType<typeof buildProductChangeSummary>
  monitoredCompetitorCount: number
  baselineSummary?: CompetitorProductChangeBaselineSummary
}) {
  return (
    <div className="competitor-analysis-product-change-summary-line">
      <ProductChangeSummaryItem label="监控竞品" value={`${monitoredCompetitorCount} 个`} />
      <ProductChangeSummaryItem label="详情基线" value={`${baselineSummary?.snapshotCompetitorCount ?? 0} 个`} />
      <ProductChangeSummaryItem label="变化日期" value={`${summary.changedDays} 天`} />
      <ProductChangeSummaryItem label="变化字段" value={`${summary.fieldChanges} 项`} />
      <ProductChangeSummaryItem label="价格变化" value={`${summary.priceChanges} 次`} />
      <ProductChangeSummaryItem label="最新基线" value={formatSnapshotDate(baselineSummary?.latestSnapshotDate)} />
    </div>
  )
}

function ProductChangeSummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="competitor-analysis-product-change-summary-item">
      <Text type="secondary">{label}</Text>
      <Text strong>{value}</Text>
    </div>
  )
}

type ProductChangeDateGroup = {
  factDate: string
  changes: CompetitorProductChangeField[]
}

type ProductChangeCompetitorCardView = {
  noonProductCode: string
  productName: string
  imageUrl?: string
  canonicalUrl?: string
  subjectType: CompetitorProductChangeGroup['subjectType']
  dateGroups: ProductChangeDateGroup[]
}

function ProductChangeCompetitorCard({
  product,
  card
}: {
  product: CompetitorWatchProduct
  card: ProductChangeCompetitorCardView
}) {
  const placeholderText = card.productName.slice(0, 2).toUpperCase()
  const productLink = card.canonicalUrl || buildNoonProductDetailUrl(card.noonProductCode, product.siteCode)
  const productLinkLabel = `打开 Noon 商品 ${card.noonProductCode}`

  return (
    <article className="competitor-analysis-product-change-competitor-card">
      <div className="competitor-analysis-product-change-competitor-detail">
        {productLink ? (
          <a
            href={productLink}
            target="_blank"
            rel="noreferrer"
            className="competitor-analysis-product-change-competitor-media"
            aria-label={`${productLinkLabel} 图片`}
          >
            {card.imageUrl ? <img src={card.imageUrl} alt="" /> : null}
            <span>{placeholderText}</span>
          </a>
        ) : (
          <div className="competitor-analysis-product-change-competitor-media">
            {card.imageUrl ? <img src={card.imageUrl} alt="" /> : null}
            <span>{placeholderText}</span>
          </div>
        )}

        <div className="competitor-analysis-product-change-competitor-meta">
          {productLink ? (
            <Link
              copyable={{ text: card.noonProductCode }}
              href={productLink}
              target="_blank"
              rel="noreferrer"
              aria-label={productLinkLabel}
              className="competitor-analysis-product-change-competitor-code"
            >
              {card.noonProductCode}
            </Link>
          ) : (
            <Text copyable={{ text: card.noonProductCode }} className="competitor-analysis-product-change-competitor-code">
              {card.noonProductCode}
            </Text>
          )}
          <Text type="secondary" className="competitor-analysis-product-change-competitor-name">
            {card.productName}
          </Text>
        </div>
      </div>

      <div className="competitor-analysis-product-change-date-list">
        {card.dateGroups.map((dateGroup) => (
          <div key={`${card.noonProductCode}-${dateGroup.factDate}`} className="competitor-analysis-product-change-date-block">
            <div className="competitor-analysis-product-change-date-title">
              <Text strong>{dateGroup.factDate}</Text>
              <Tag color={card.subjectType === 'self' ? 'blue' : 'green'}>{card.subjectType === 'self' ? '本品' : '竞品'}</Tag>
            </div>
            <ProductChangeRankSection product={product} noonProductCode={card.noonProductCode} factDate={dateGroup.factDate} />
            <ProductChangeFieldSection changes={dateGroup.changes} />
          </div>
        ))}
      </div>
    </article>
  )
}

function ProductChangeRankSection({
  product,
  noonProductCode,
  factDate
}: {
  product: CompetitorWatchProduct
  noonProductCode: string
  factDate: string
}) {
  const rankItems = buildProductChangeRankItems(product, noonProductCode, factDate)

  return (
    <div className="competitor-analysis-product-change-rank-section">
      <Text type="secondary" className="competitor-analysis-product-change-section-label">
        排名
      </Text>
      <div className="competitor-analysis-product-change-rank-list">
        {rankItems.length ? (
          rankItems.map((item) => (
            <div
              key={`${item.keyword}-${item.channel}-${item.status}`}
              className="competitor-analysis-product-change-rank-row"
            >
              <Text className="competitor-analysis-product-change-rank-keyword">{item.keyword}</Text>
              <Text type="secondary" className="competitor-analysis-product-change-rank-channel">
                {item.channel}
              </Text>
              <Text strong className="competitor-analysis-product-change-rank-status">
                {item.status}
              </Text>
            </div>
          ))
        ) : (
          <Text type="secondary" className="competitor-analysis-product-change-rank-empty">
            暂无排名
          </Text>
        )}
      </div>
    </div>
  )
}

function ProductChangeFieldSection({ changes }: { changes: CompetitorProductChangeField[] }) {
  return (
    <div className="competitor-analysis-product-change-field-section">
      <Text type="secondary" className="competitor-analysis-product-change-section-label">
        变化
      </Text>
      <ul className="competitor-analysis-product-change-content-list">
        {changes.map((change, index) => (
          <li key={`${change.fieldKey}-${index}`} className="competitor-analysis-product-change-field-row">
            <Tag color={productChangeFieldColor(change.fieldKey)}>{change.fieldLabel}</Tag>
            <ProductChangeContent change={change} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function buildProductChangeCompetitorCards(
  product: CompetitorWatchProduct,
  groups: CompetitorProductChangeGroup[]
): ProductChangeCompetitorCardView[] {
  const candidateByCode = new Map(
    product.candidates.map((candidate) => [normalizeNoonProductCode(candidate.noonProductCode), candidate])
  )
  const cardByCode = new Map<string, ProductChangeCompetitorCardView>()

  groups.forEach((group) => {
    const normalizedCode = normalizeNoonProductCode(group.noonProductCode)
    if (!normalizedCode) return
    const candidate = candidateByCode.get(normalizedCode)
    const card =
      cardByCode.get(normalizedCode) ??
      {
        noonProductCode: group.noonProductCode,
        productName: candidate?.title || group.productName || group.noonProductCode,
        imageUrl: candidate?.imageUrl,
        canonicalUrl: candidate?.canonicalUrl || buildNoonProductDetailUrl(group.noonProductCode, product.siteCode),
        subjectType: group.subjectType,
        dateGroups: []
      }
    const visibleChanges = displayProductChanges(group.changes)
    if (!visibleChanges.length) {
      return
    }
    const dateGroup = card.dateGroups.find((item) => item.factDate === group.factDate)
    if (dateGroup) {
      dateGroup.changes.push(...visibleChanges)
    } else {
      card.dateGroups.push({ factDate: group.factDate, changes: visibleChanges })
    }
    cardByCode.set(normalizedCode, card)
  })

  return Array.from(cardByCode.values())
    .map((card) => ({
      ...card,
      dateGroups: card.dateGroups
        .map((dateGroup) => ({
          ...dateGroup,
          changes: dateGroup.changes.slice().sort(compareProductChangeFields)
        }))
        .sort((left, right) => right.factDate.localeCompare(left.factDate))
    }))
    .sort((left, right) => {
      const latestDateCompare = (right.dateGroups[0]?.factDate || '').localeCompare(left.dateGroups[0]?.factDate || '')
      if (latestDateCompare !== 0) return latestDateCompare
      return left.noonProductCode.localeCompare(right.noonProductCode)
    })
}

function buildProductChangeSummary(groups: CompetitorProductChangeGroup[]) {
  const groupsWithChanges = groups
    .map((group) => ({ ...group, changes: displayProductChanges(group.changes) }))
    .filter((group) => group.changes.length)
  const fieldChanges = groupsWithChanges.reduce((total, group) => total + group.changes.length, 0)
  const allChanges = groupsWithChanges.flatMap((group) => group.changes)
  return {
    changedDays: new Set(groupsWithChanges.map((group) => group.factDate)).size,
    fieldChanges,
    priceChanges: allChanges.filter((change) => change.fieldKey === 'price').length,
    imageChanges: allChanges.filter((change) => productChangeFieldKey(change.fieldKey) === 'mainImage').length
  }
}

function displayProductChanges(changes: CompetitorProductChangeField[]) {
  return changes.filter((change) => !isSameResolvedMainImageChange(change))
}

function isSameResolvedMainImageChange(change: CompetitorProductChangeField) {
  if (productChangeFieldKey(change.fieldKey) !== 'mainImage') {
    return false
  }
  const oldUrl = buildNoonImageAssetUrl(change.oldValue, change.newValue)
  const newUrl = buildNoonImageAssetUrl(change.newValue, change.oldValue)
  return Boolean(oldUrl && newUrl && oldUrl === newUrl)
}

function formatSnapshotDate(value?: string) {
  return value ? value.slice(0, 10) : '-'
}

function productChangeFieldColor(fieldKey: string) {
  const normalized = productChangeFieldKey(fieldKey)
  if (fieldKey === 'price') return 'orange'
  if (normalized === 'mainImage') return 'purple'
  if (normalized === 'supermallEnabled') return 'green'
  if (normalized === 'availabilityStatus') return 'red'
  return 'blue'
}

function productChangeFieldKey(fieldKey: string) {
  if (fieldKey === 'main_image' || fieldKey === 'mainImage') return 'mainImage'
  if (fieldKey === 'supermall_enabled' || fieldKey === 'supermallEnabled') return 'supermallEnabled'
  if (fieldKey === 'availability_status' || fieldKey === 'availabilityStatus') return 'availabilityStatus'
  return fieldKey
}

function compareProductChangeFields(left: CompetitorProductChangeField, right: CompetitorProductChangeField) {
  const order = ['mainImage', 'price', 'brand', 'rating', 'reviewCount']
  const leftOrder = order.indexOf(productChangeFieldKey(left.fieldKey))
  const rightOrder = order.indexOf(productChangeFieldKey(right.fieldKey))
  const normalizedLeftOrder = leftOrder >= 0 ? leftOrder : order.length
  const normalizedRightOrder = rightOrder >= 0 ? rightOrder : order.length
  if (normalizedLeftOrder !== normalizedRightOrder) {
    return normalizedLeftOrder - normalizedRightOrder
  }
  return left.fieldLabel.localeCompare(right.fieldLabel)
}

function ProductChangeContent({ change }: { change: CompetitorProductChangeField }) {
  if (productChangeFieldKey(change.fieldKey) === 'mainImage') {
    return <ProductChangeMainImageLinks change={change} />
  }
  return <Text>{formatProductChangeContent(change)}</Text>
}

function ProductChangeMainImageLinks({ change }: { change: CompetitorProductChangeField }) {
  const oldHref = buildNoonImageAssetUrl(change.oldValue, change.newValue)
  const newHref = buildNoonImageAssetUrl(change.newValue, change.oldValue)
  return (
    <span
      className="competitor-analysis-product-change-image-links"
      title={`${formatProductChangeValue(change.oldValue)} -> ${formatProductChangeValue(change.newValue)}`}
    >
      <ProductChangeImageAssetLink label="主图A" href={oldHref} />
      <span className="competitor-analysis-product-change-image-arrow">-&gt;</span>
      <ProductChangeImageAssetLink label="主图B" href={newHref} />
    </span>
  )
}

function ProductChangeImageAssetLink({ label, href }: { label: string; href: string }) {
  if (!href) {
    return <Text>{label}</Text>
  }
  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      className="competitor-analysis-product-change-image-link"
      aria-label={label}
    >
      {label}
    </Link>
  )
}

function formatProductChangeContent(change: CompetitorProductChangeField) {
  return `${formatProductChangeValue(change.oldValue)} → ${formatProductChangeValue(change.newValue)}`
}

function buildNoonImageAssetUrl(value: unknown, peerValue?: unknown) {
  const rawValue = productChangeAssetValue(value)
  if (!rawValue || rawValue === '-') {
    return ''
  }
  if (/^https?:\/\//i.test(rawValue)) {
    return rawValue
  }
  const normalized = normalizeNoonImageAssetPath(rawValue, productChangeAssetValue(peerValue))
  return normalized ? `https://f.nooncdn.com/p/${encodeURI(normalized)}` : ''
}

function normalizeNoonImageAssetPath(value: string, peerValue?: string) {
  const path = value.replace(/^\/+/, '').trim()
  if (!path) {
    return ''
  }
  const peerPath = (peerValue || '').replace(/^\/+/, '').trim()
  const extension = noonImageAssetExtension(path) || noonImageAssetExtension(peerPath) || '.jpg'
  if (path.includes('/')) {
    return noonImageAssetHasExtension(path) ? path : `${path}${extension}`
  }
  if (peerPath.includes('/')) {
    const peerBase = noonImageAssetBaseName(peerPath)
    if (assetStem(peerBase) === assetStem(path)) {
      return `${peerPath.slice(0, peerPath.lastIndexOf('/') + 1)}${noonImageAssetHasExtension(path) ? path : `${path}${extension}`}`
    }
  }
  return noonImageAssetHasExtension(path) ? path : `${path}${extension}`
}

function noonImageAssetBaseName(path: string) {
  return path.split(/[?#]/)[0].split('/').filter(Boolean).pop() || ''
}

function assetStem(value: string) {
  return noonImageAssetBaseName(value).replace(/\.(?:jpe?g|png|webp|gif|avif)$/i, '')
}

function noonImageAssetExtension(path: string) {
  return noonImageAssetBaseName(path).match(/\.(?:jpe?g|png|webp|gif|avif)$/i)?.[0] || ''
}

function noonImageAssetHasExtension(path: string) {
  return Boolean(noonImageAssetExtension(path))
}

function productChangeAssetValue(value: unknown): string {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>
    const candidate =
      record.url ??
      record.imageUrl ??
      record.assetUrl ??
      record.normalizedUrl ??
      record.assetKey ??
      record.path ??
      record.key
    if (candidate !== undefined && candidate !== null && candidate !== '') {
      return formatProductChangeValue(candidate).trim()
    }
  }
  return formatProductChangeValue(value).trim()
}

function buildProductChangeRankItems(product: CompetitorWatchProduct, noonProductCode: string, factDate: string) {
  const points = selectProductChangeRankPoints(product, noonProductCode, factDate)
  if (!points.length) {
    return []
  }
  const keywordById = new Map(product.keywords.map((keyword) => [keyword.id, keyword.keyword]))
  return points
    .map((point) => {
      const keyword = keywordById.get(point.keywordId) || '关键词'
      const channel = point.rankChannel === 'sponsored' ? '广告' : '自然'
      return {
        keyword,
        channel,
        status: formatRankStatus(point)
      }
    })
}

function selectProductChangeRankPoints(product: CompetitorWatchProduct, noonProductCode: string, factDate: string) {
  const normalizedCode = normalizeNoonProductCode(noonProductCode)
  const competitorPoints = product.rankPoints.filter(
    (point) => !point.isSelf && normalizeNoonProductCode(point.noonProductCode) === normalizedCode
  )
  const sameDayPoints = latestRankPointsByKeywordChannel(
    competitorPoints.filter((point) => point.factDate === factDate)
  )
  if (sameDayPoints.length) {
    return sameDayPoints
  }
  const earlierPoints = latestRankPointsByKeywordChannel(
    competitorPoints.filter((point) => point.factDate <= factDate)
  )
  if (earlierPoints.length) {
    return earlierPoints
  }
  return []
}

function latestRankPointsByKeywordChannel(points: CompetitorRankPoint[]) {
  const pointByKey = new Map<string, CompetitorRankPoint>()
  points.forEach((point) => {
    const key = `${point.keywordId}:${point.rankChannel || 'organic'}`
    const existing = pointByKey.get(key)
    if (!existing || point.factDate.localeCompare(existing.factDate) > 0) {
      pointByKey.set(key, point)
    }
  })
  return Array.from(pointByKey.values()).sort((left, right) => {
    const keywordCompare = left.keywordId.localeCompare(right.keywordId)
    if (keywordCompare !== 0) return keywordCompare
    return (left.rankChannel || 'organic').localeCompare(right.rankChannel || 'organic')
  })
}

function formatProductChangeValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  if (typeof value === 'boolean') {
    return value ? '是' : '否'
  }
  if (typeof value === 'number') {
    return String(value)
  }
  if (typeof value === 'string') {
    return value
  }
  if (Array.isArray(value)) {
    return value.length ? value.map(formatProductChangeValue).join('、') : '-'
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    if ('amount' in record || 'currency' in record) {
      return `${record.amount ?? '-'} ${record.currency ?? ''}`.trim()
    }
    if ('assetKey' in record) {
      return String(record.assetKey || '-')
    }
    if ('normalizedUrl' in record) {
      return String(record.normalizedUrl || '-')
    }
    return JSON.stringify(value)
  }
  return String(value)
}

type SelfRankReportStatus = 'ranked' | 'not_in_scan_depth' | 'missing'

type SelfRankReportPoint = {
  date: string
  adStatus: SelfRankReportStatus
  adRankNo?: number
  organicStatus: SelfRankReportStatus
  organicRankNo?: number
  scanDepth: number
  runStatus: string
}

type SelfRankKeywordReport = {
  keywordId: string
  keyword: string
  points: SelfRankReportPoint[]
  competitorSeries: KeywordCompetitorRankSeries[]
}

type KeywordCompetitorRankSeries = {
  productCode: string
  productUrl?: string
  name: string
  organicData: Array<number | null>
  adData: Array<number | null>
}

type RankChartProductSeries = {
  productCode: string
  productUrl?: string
  name: string
  organicData: Array<number | null>
  adData: Array<number | null>
}

type ReportChartLineSeries = {
  id: string
  name: string
  type: 'line'
  smooth: boolean
  symbolSize: number
  connectNulls: boolean
  itemStyle: { color: string }
  lineStyle: { color: string; width: number; type?: 'dashed' }
  data: Array<number | null>
}

type ReportChartLineMeta = {
  productName: string
  lineKind: '自然' | '广告'
  color: string
}

type RankHeatmapCell = {
  dateLabel: string
  rankNo?: number
  adRankNo?: number
  scanDepth: number
  band: 'top10' | 'top20' | 'top50' | 'top100' | 'missing'
}

type RankHeatmapRow = {
  productCode: string
  productUrl?: string
  name: string
  color: string
  isSelf: boolean
  cells: RankHeatmapCell[]
}

function SelfRankReportModal({
  product,
  storeLabel,
  rankLoading,
  changeGroups,
  changeBaselineSummary,
  changeLoading
}: {
  product: CompetitorWatchProduct
  storeLabel?: string
  rankLoading: boolean
  changeGroups: CompetitorProductChangeGroup[]
  changeBaselineSummary?: CompetitorProductChangeBaselineSummary
  changeLoading: boolean
}) {
  const reports = useMemo(() => buildSelfRankReport(product), [product])
  const [selectedReportId, setSelectedReportId] = useState('')
  const changeSummary = buildProductChangeSummary(changeGroups)
  const monitoredCompetitorCount = changeBaselineSummary?.monitoredCompetitorCount ?? product.confirmedCompetitorCount ?? 0
  const selectedReport = reports.find((report) => report.keywordId === selectedReportId) ?? reports[0]

  useEffect(() => {
    if (!reports.length) {
      if (selectedReportId) {
        setSelectedReportId('')
      }
      return
    }
    if (!reports.some((report) => report.keywordId === selectedReportId)) {
      setSelectedReportId(reports[0].keywordId)
    }
  }, [reports, selectedReportId])

  return (
    <div className="competitor-analysis-report-modal" data-testid="competitor-self-rank-report">
      <ReportProductHeader
        product={product}
        summary={changeSummary}
        monitoredCompetitorCount={monitoredCompetitorCount}
        baselineSummary={changeBaselineSummary}
      />

      <Tabs
        className="competitor-analysis-analysis-tabs"
        items={[
          {
            key: 'ranking',
            label: (
              <span className="competitor-analysis-report-tab-label">
                <LineChartOutlined />
                <span>排名分析</span>
                <Tag>{reports.length}</Tag>
              </span>
            ),
            children: (
              <Spin spinning={rankLoading}>
                {reports.length ? (
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <RankKeywordChips
                      product={product}
                      reports={reports}
                      selectedReportId={selectedReport?.keywordId || ''}
                      onSelect={setSelectedReportId}
                    />
                    {selectedReport ? <RankKeywordReportPanel product={product} report={selectedReport} /> : null}
                  </Space>
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无真实排名数据" />
                )}
              </Spin>
            )
          },
          {
            key: 'changes',
            label: (
              <span className="competitor-analysis-report-tab-label">
                <ClockCircleOutlined />
                <span>变化历史</span>
                <Tag color={changeSummary.fieldChanges ? 'orange' : undefined}>{changeSummary.fieldChanges}</Tag>
              </span>
            ),
            children: (
              <Spin spinning={changeLoading}>
                <ProductChangeModal
                  product={product}
                  storeLabel={storeLabel}
                  groups={changeGroups}
                  baselineSummary={changeBaselineSummary}
                  showIdentity={false}
                  showSummary={false}
                />
              </Spin>
            )
          }
        ]}
      />
    </div>
  )
}

function ReportProductHeader({
  product,
  summary,
  monitoredCompetitorCount,
  baselineSummary
}: {
  product: CompetitorWatchProduct
  summary: ReturnType<typeof buildProductChangeSummary>
  monitoredCompetitorCount: number
  baselineSummary?: CompetitorProductChangeBaselineSummary
}) {
  const titleLines = productTitleLines(product)
  const psku = product.partnerSku || '-'
  const chineseTitle = product.titleCn?.trim() || ''
  const englishTitle = product.title?.trim() || ''
  const fallbackTitle = chineseTitle || englishTitle ? '' : titleLines.primary
  return (
    <div className="competitor-analysis-report-header">
      <ReportProductThumb src={product.imageUrl} alt={titleLines.alt} />
      <div className="competitor-analysis-report-header-body">
        <Space size={6} wrap>
          <Text strong className="competitor-analysis-report-heading">商品分析</Text>
          <Tag color="blue" className="competitor-analysis-report-product-psku" style={{ marginInlineEnd: 0 }}>
            PSKU {psku}
          </Tag>
          {product.siteCode ? <Tag style={{ marginInlineEnd: 0 }}>{product.siteCode}</Tag> : null}
        </Space>
        <div className="competitor-analysis-report-product-titles">
          {chineseTitle || fallbackTitle ? (
            <Text
              strong
              className="competitor-analysis-report-product-title competitor-analysis-product-title-cn"
              ellipsis={{ tooltip: chineseTitle || fallbackTitle }}
            >
              {chineseTitle || fallbackTitle}
            </Text>
          ) : null}
          {englishTitle ? (
            <Text
              type="secondary"
              className="competitor-analysis-report-product-title competitor-analysis-report-product-title-en-full competitor-analysis-product-title-en"
            >
              {englishTitle}
            </Text>
          ) : null}
        </div>
        <ProductChangeSummaryLine
          summary={summary}
          monitoredCompetitorCount={monitoredCompetitorCount}
          baselineSummary={baselineSummary}
        />
      </div>
    </div>
  )
}

function ReportProductThumb({ src, alt }: { src?: string; alt: string }) {
  const [failedSrc, setFailedSrc] = useState('')
  const normalizedSrc = normalizeProductImageUrl(src)
  const visibleSrc = normalizedSrc && failedSrc !== normalizedSrc ? normalizedSrc : ''

  return (
    <span className="competitor-analysis-report-product-thumb">
      {visibleSrc ? (
        <>
          <img src={visibleSrc} alt={alt} onError={() => setFailedSrc(visibleSrc)} />
          <span className="competitor-analysis-report-product-thumb-count">1</span>
        </>
      ) : (
        <span className="competitor-analysis-report-product-thumb-empty">无图</span>
      )}
    </span>
  )
}

function RankKeywordChips({
  product,
  reports,
  selectedReportId,
  onSelect
}: {
  product: CompetitorWatchProduct
  reports: SelfRankKeywordReport[]
  selectedReportId: string
  onSelect: (keywordId: string) => void
}) {
  return (
    <div className="competitor-analysis-report-keyword-chip-list">
      {reports.map((report) => {
        const rankedCount = rankedMonitoredCompetitorCount(product, report.keywordId)
        const monitoredCount = reportMonitoredCount(product, report.keywordId)
        const selected = report.keywordId === selectedReportId
        const noonSearchUrl = buildNoonSearchUrl(report.keyword, product.siteCode, product.id)
        return (
          <div
            key={report.keywordId}
            className={`competitor-analysis-report-keyword-chip${selected ? ' competitor-analysis-report-keyword-chip-active' : ''}`}
          >
            <Tooltip title="打开 Noon 前台搜索">
              <a
                className="competitor-analysis-report-keyword-chip-search"
                href={noonSearchUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
              >
                <SearchOutlined />
              </a>
            </Tooltip>
            <button
              type="button"
              aria-pressed={selected}
              className="competitor-analysis-report-keyword-chip-select"
              onClick={() => onSelect(report.keywordId)}
            >
              <span>{report.keyword}</span>
              <Tag color={rankedCount ? 'blue' : undefined}>{`${rankedCount} in ${monitoredCount}`}</Tag>
            </button>
          </div>
        )
      })}
    </div>
  )
}

function RankKeywordReportPanel({ product, report }: { product: CompetitorWatchProduct; report: SelfRankKeywordReport }) {
  const summary = buildRankReportSummary({
    points: report.points,
    productSeries: buildRankChartProductSeries(report)
  })
  const hasRankChartData = hasRenderableRankData(report)
  const rankedCount = rankedMonitoredCompetitorCount(product, report.keywordId)
  const monitoredCount = reportMonitoredCount(product, report.keywordId)
  const latest = report.points[report.points.length - 1] ?? buildEmptySelfRankReportPoint('', [{ scanDepth: summary.scanDepth }])
  const heatmapRows = hasRankChartData ? buildRankHeatmapRows(report) : []

  return (
    <div className="competitor-analysis-rank-report-panel">
      <RankInsightStrip summary={summary} />
      {hasRankChartData ? (
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          <Card
            size="small"
            variant="borderless"
            className="competitor-analysis-report-keyword-card competitor-analysis-rank-race-card"
            title={
              <div className="competitor-analysis-race-card-title">
                <Space size={6} wrap>
                  <Tag color="blue">本品自然 {formatSelfRankReportText(latest.organicStatus, latest.organicRankNo, latest.scanDepth)}</Tag>
                  <Tag color="blue">本品广告 {formatSelfRankReportText(latest.adStatus, latest.adRankNo, latest.scanDepth)}</Tag>
                  <Tag color="green">竞品 {report.competitorSeries.length}</Tag>
                </Space>
                <div className="competitor-analysis-rank-zone-legend">
                  <span className="competitor-analysis-rank-zone competitor-analysis-rank-zone-top10">前10</span>
                  <span className="competitor-analysis-rank-zone competitor-analysis-rank-zone-top20">11-20</span>
                  <span className="competitor-analysis-rank-zone competitor-analysis-rank-zone-top50">21-50</span>
                  <span className="competitor-analysis-rank-zone competitor-analysis-rank-zone-top100">51-100</span>
                </div>
              </div>
            }
          >
            <div className="competitor-analysis-report-chart-only">
              <EChartPanel
                testId={`self-rank-chart-${report.keywordId}`}
                ariaLabel={`${report.keyword} 本品与竞品排名赛道图`}
                height={260}
                option={buildSelfRankChartOption(report)}
              />
            </div>
          </Card>
          <RankHeatmap rows={heatmapRows} dates={report.points.map((point) => point.date.slice(5))} />
        </Space>
      ) : (
        <RankCompactEmpty summary={summary} rankedCount={rankedCount} monitoredCount={monitoredCount} />
      )}
    </div>
  )
}

function RankInsightStrip({ summary }: { summary: RankReportSummary }) {
  return (
    <div className="competitor-analysis-rank-insight-strip">
      <RankInsightItem label="最新自然位" value={summary.latestOrganicText} tone={summary.latestOrganicRank ? 'strong' : 'muted'} />
      <RankInsightItem label="15日" value={summary.organicChangeText} tone={summary.organicChangeText === '暂无趋势' ? 'muted' : 'strong'} />
      <RankInsightItem label="广告" value={summary.adDaysText} tone={summary.adDaysText.startsWith('0/') ? 'muted' : 'strong'} />
      <RankInsightItem label="最强竞品" value={summary.bestCompetitorText} tone={summary.bestCompetitorText === '暂无竞品排名' ? 'muted' : 'strong'} />
    </div>
  )
}

function RankInsightItem({
  label,
  value,
  tone
}: {
  label: string
  value: string
  tone: 'strong' | 'muted'
}) {
  return (
    <div className={`competitor-analysis-rank-insight-item competitor-analysis-rank-insight-item-${tone}`}>
      <Text type="secondary">{label}</Text>
      <Text strong ellipsis={{ tooltip: value }}>{value}</Text>
    </div>
  )
}

function RankCompactEmpty({
  summary,
  rankedCount,
  monitoredCount
}: {
  summary: RankReportSummary
  rankedCount: number
  monitoredCount: number
}) {
  return (
    <div className="competitor-analysis-rank-empty-panel">
      <Text strong>本关键词暂无可绘制排名</Text>
      <Text type="secondary">
        本品最近无排名数据，监控竞品 {rankedCount} in {monitoredCount}
      </Text>
    </div>
  )
}

function RankHeatmap({ rows, dates }: { rows: RankHeatmapRow[]; dates: string[] }) {
  return (
    <Card
      size="small"
      variant="borderless"
      className="competitor-analysis-rank-heatmap-card"
      title={
        <Space size={8} wrap>
          <Text strong>排名热力矩阵</Text>
          <Text type="secondary">颜色越深代表排名越靠前，AD 表示当天出现广告位。</Text>
        </Space>
      }
    >
      <div
        className="competitor-analysis-rank-heatmap"
        style={{ gridTemplateColumns: `minmax(132px, 1.15fr) repeat(${dates.length}, minmax(58px, 1fr))` }}
      >
        <div className="competitor-analysis-rank-heatmap-corner">商品</div>
        {dates.map((date) => (
          <div key={date} className="competitor-analysis-rank-heatmap-date">
            {date}
          </div>
        ))}
        {rows.map((row) => (
          <RankHeatmapRowView key={row.productCode} row={row} />
        ))}
      </div>
    </Card>
  )
}

function RankHeatmapRowView({ row }: { row: RankHeatmapRow }) {
  return (
    <>
      <div className={`competitor-analysis-rank-heatmap-product${row.isSelf ? ' competitor-analysis-rank-heatmap-product-self' : ''}`}>
        <span style={{ background: row.color }} />
        <Text strong={row.isSelf} ellipsis={{ tooltip: row.name }}>
          {row.name}
        </Text>
        {!row.isSelf && row.productUrl ? (
          <Tooltip title="打开 Noon 商品详情">
            <Button
              aria-label={`打开 Noon 商品 ${row.productCode}`}
              className="competitor-analysis-competitor-link-button"
              href={row.productUrl}
              icon={<ExportOutlined />}
              size="small"
              target="_blank"
              type="text"
            />
          </Tooltip>
        ) : null}
      </div>
      {row.cells.map((cell) => (
        <div
          key={`${row.productCode}-${cell.dateLabel}`}
          className={`competitor-analysis-rank-heatmap-cell competitor-analysis-rank-heatmap-cell-${cell.band}`}
          title={`${row.name} ${cell.dateLabel} ${cell.rankNo ? `第 ${cell.rankNo} 名` : formatNotInRankRangeText(cell.scanDepth)}${cell.adRankNo ? `，广告第 ${cell.adRankNo} 名` : ''}`}
        >
          <span>{cell.rankNo ? cell.rankNo : '-'}</span>
          {cell.adRankNo ? <em>AD {cell.adRankNo}</em> : null}
        </div>
      ))}
    </>
  )
}

function buildSelfRankReport(product: CompetitorWatchProduct): SelfRankKeywordReport[] {
  const activeKeywords = product.keywords
    .filter((keyword) => keyword.status === 'active' && keyword.keyword.trim())
    .slice()
    .sort((left, right) => left.displayOrder - right.displayOrder)

  return activeKeywords.map((keyword) => {
    const confirmedCandidateCodes = new Set(
      product.candidates
        .filter((candidate) => candidateStatusForKeyword(candidate, keyword.id) === 'confirmed')
        .map((candidate) => normalizeNoonProductCode(candidate.noonProductCode))
        .filter(Boolean)
    )
    const relevantRankPoints = product.rankPoints.filter((point) => {
      if (point.keywordId !== keyword.id) {
        return false
      }
      const pointCode = normalizeNoonProductCode(point.noonProductCode)
      return (
        point.isSelf ||
        pointCode === normalizeNoonProductCode(product.selfNoonProductCode) ||
        confirmedCandidateCodes.has(pointCode)
      )
    })
    const pointsByDate = new Map(
      Array.from(new Set(relevantRankPoints.map((point) => point.factDate)))
        .sort((left, right) => left.localeCompare(right))
        .map((date) => [
          date,
          buildEmptySelfRankReportPoint(
            date,
            relevantRankPoints.filter((point) => point.factDate === date)
          )
        ] as const)
    )
    relevantRankPoints
      .filter(
        (point) =>
          (point.isSelf || normalizeNoonProductCode(point.noonProductCode) === normalizeNoonProductCode(product.selfNoonProductCode))
      )
      .forEach((point) => {
        const date = point.factDate
        const existing = pointsByDate.get(date) ?? buildEmptySelfRankReportPoint(date)
        const status: SelfRankReportStatus = point.rankStatus === 'ranked' ? 'ranked' : 'not_in_scan_depth'
        existing.scanDepth = Math.max(existing.scanDepth, reportScanDepth([point]))
        if (point.isSponsored) {
          existing.adStatus = status
          existing.adRankNo = point.rankNo
        } else {
          existing.organicStatus = status
          existing.organicRankNo = point.rankNo
        }
        existing.runStatus = '真实抓取'
        pointsByDate.set(date, existing)
      })

    const sortedPoints = Array.from(pointsByDate.values()).sort((left, right) => left.date.localeCompare(right.date))
    return {
      keywordId: keyword.id,
      keyword: keyword.keyword,
      points: sortedPoints,
      competitorSeries: buildKeywordCompetitorRankSeries(product, keyword, sortedPoints)
    }
  })
}

function hasRenderableRankData(report: SelfRankKeywordReport) {
  return buildRankChartProductSeries(report).some(
    (series) => hasRankValue(series.organicData) || hasRankValue(series.adData)
  )
}

function rankedMonitoredCompetitorCount(product: CompetitorWatchProduct, keywordId: string) {
  const monitoredCodes = new Set(
    product.candidates
      .filter((candidate) => candidateStatusForKeyword(candidate, keywordId) === 'confirmed')
      .map((candidate) => normalizeNoonProductCode(candidate.noonProductCode))
      .filter(Boolean)
  )
  return new Set(
    product.rankPoints
      .filter(
        (point) =>
          point.keywordId === keywordId &&
          !point.isSelf &&
          point.rankStatus === 'ranked' &&
          Boolean(point.rankNo) &&
          monitoredCodes.has(normalizeNoonProductCode(point.noonProductCode))
      )
      .map((point) => normalizeNoonProductCode(point.noonProductCode))
  ).size
}

function reportMonitoredCount(product: CompetitorWatchProduct, keywordId: string) {
  return product.candidates.filter((candidate) => candidateStatusForKeyword(candidate, keywordId) === 'confirmed').length
}

function buildEmptySelfRankReportPoint(date: string, points: Array<{ scanDepth?: number }> = []): SelfRankReportPoint {
  return {
    date,
    adStatus: 'missing',
    organicStatus: 'missing',
    scanDepth: reportScanDepth(points),
    runStatus: '真实抓取'
  }
}

function buildKeywordCompetitorRankSeries(
  product: CompetitorWatchProduct,
  keyword: CompetitorKeyword,
  points: SelfRankReportPoint[]
): KeywordCompetitorRankSeries[] {
  const dates = points.map((point) => point.date)
  const selfProductCode = normalizeNoonProductCode(product.selfNoonProductCode)
  const confirmedCandidates = product.candidates
    .filter((candidate) => candidateStatusForKeyword(candidate, keyword.id) === 'confirmed')
    .filter((candidate) => normalizeNoonProductCode(candidate.noonProductCode) !== selfProductCode)
    .slice()
    .sort((left, right) => {
      const leftRank = candidateVisibleRankNo(product, keyword.id, left) ?? Number.MAX_SAFE_INTEGER
      const rightRank = candidateVisibleRankNo(product, keyword.id, right) ?? Number.MAX_SAFE_INTEGER
      if (leftRank !== rightRank) return leftRank - rightRank
      return left.noonProductCode.localeCompare(right.noonProductCode)
    })
    .slice(0, 8)

  return confirmedCandidates.flatMap((candidate) => {
    const organicRankByDate = new Map<string, number>()
    const adRankByDate = new Map<string, number>()
    product.rankPoints
      .filter(
        (point) =>
          point.keywordId === keyword.id &&
          normalizeNoonProductCode(point.noonProductCode) === normalizeNoonProductCode(candidate.noonProductCode) &&
          point.rankStatus === 'ranked' &&
          Boolean(point.rankNo)
      )
      .forEach((point) => {
        if (!point.rankNo) {
          return
        }
        const rankByDate = point.isSponsored ? adRankByDate : organicRankByDate
        const existingRank = rankByDate.get(point.factDate)
        if (!existingRank || point.rankNo < existingRank) {
          rankByDate.set(point.factDate, point.rankNo)
        }
      })

    const realOrganicData = dates.map((date) => organicRankByDate.get(date) ?? null)
    const realAdData = dates.map((date) => adRankByDate.get(date) ?? null)
    if (!hasRankValue(realOrganicData) && !hasRankValue(realAdData)) {
      return []
    }
    return [{
      productCode: candidate.noonProductCode,
      productUrl: candidate.canonicalUrl || buildNoonProductDetailUrl(candidate.noonProductCode, product.siteCode),
      name: buildCompetitorSeriesName(candidate),
      organicData: realOrganicData,
      adData: realAdData
    }]
  })
}

function hasRankValue(values: Array<number | null>) {
  return values.some((rank) => typeof rank === 'number')
}

function buildCompetitorSeriesName(candidate: CompetitorCandidate) {
  return normalizeNoonProductCode(candidate.noonProductCode) || candidate.noonProductCode || '-'
}

function buildNoonProductDetailUrl(productCode: string, siteCode?: string) {
  const code = normalizeNoonProductCode(productCode)
  return code ? `https://www.noon.com/${noonMarketPath(siteCode || '')}/p/?o=${encodeURIComponent(code)}` : ''
}

function buildSelfRankChartOption(report: SelfRankKeywordReport): EChartsCoreOption {
  const dates = report.points.map((point) => point.date.slice(5))
  const productSeriesList = buildRankChartProductSeries(report)
  const seriesMeta: ReportChartLineMeta[] = []
  const series = productSeriesList.flatMap((productSeries, productIndex) => {
    const color = colorByProduct(productIndex)
    const isSelf = productIndex === 0
    const productName = isSelf ? '本品' : productSeries.name
    const lineWidth = isSelf ? 3 : 2
    const symbolSize = isSelf ? 7 : 5
    const lines: ReportChartLineSeries[] = [
      {
        id: `${productSeries.productCode}-organic`,
        name: productName,
        type: 'line',
        smooth: true,
        symbolSize,
        connectNulls: false,
        itemStyle: { color },
        lineStyle: {
          color,
          width: lineWidth
        },
        data: productSeries.organicData
      }
    ]
    seriesMeta.push({ productName, lineKind: '自然', color })
    if (productSeries.adData.some((rank) => typeof rank === 'number')) {
      lines.push({
        id: `${productSeries.productCode}-ad`,
        name: productName,
        type: 'line',
        smooth: true,
        symbolSize,
        connectNulls: false,
        itemStyle: { color },
        lineStyle: {
          color,
          type: 'dashed',
          width: Math.max(1.5, lineWidth - 0.4)
        },
        data: productSeries.adData
      })
      seriesMeta.push({ productName, lineKind: '广告', color })
    }
    return lines
  })
  const legendProductNames = productSeriesList.map((productSeries, index) =>
    index === 0 ? '本品' : productSeries.name
  )

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => formatRankChartTooltip(params, seriesMeta)
    },
    legend: {
      top: 0,
      left: 0,
      data: legendProductNames
    },
    grid: {
      top: 68,
      right: 20,
      bottom: 28,
      left: 42
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates
    },
    yAxis: {
      type: 'value',
      inverse: true,
      min: 1,
      max: 100,
      splitNumber: 5,
      axisLabel: {
        formatter: (value: number) => `${value}`
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(82, 196, 26, 0.10)', 'rgba(149, 222, 100, 0.08)', 'rgba(250, 219, 20, 0.08)', 'rgba(217, 217, 217, 0.12)']
        }
      }
    },
    series
  }
}

function formatRankChartTooltip(params: unknown, seriesMeta: ReportChartLineMeta[]) {
  const items = Array.isArray(params) ? params : [params]
  const validItems = items.filter(isTooltipParam)
  const axisLabel = validItems[0]?.axisValueLabel || validItems[0]?.name || ''
  const rows = validItems
    .map((item) => {
      const meta = seriesMeta[item.seriesIndex]
      if (!meta || typeof item.value !== 'number') {
        return ''
      }
      return `<div style="display:flex;align-items:center;gap:6px;line-height:20px;"><span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:${meta.color};"></span><span>${escapeHtml(meta.productName)} ${meta.lineKind}</span><strong>第 ${item.value} 名</strong></div>`
    })
    .filter(Boolean)
    .join('')
  return `<div style="min-width:140px;"><div style="font-weight:600;margin-bottom:4px;">${escapeHtml(String(axisLabel))}</div>${rows || '<span style="color:#8c8c8c;">暂无排名</span>'}</div>`
}

function isTooltipParam(value: unknown): value is {
  axisValueLabel?: string
  name?: string
  seriesIndex: number
  value: unknown
} {
  return Boolean(value && typeof value === 'object' && 'seriesIndex' in value && 'value' in value)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function reportScanDepth(points: Array<{ scanDepth?: number }>) {
  const depths = points
    .map((point) => point.scanDepth)
    .filter((depth): depth is number => typeof depth === 'number' && depth > 0)
  return depths.length ? Math.max(...depths) : DEFAULT_RANK_SCAN_DEPTH
}

function buildRankHeatmapRows(report: SelfRankKeywordReport): RankHeatmapRow[] {
  return buildRankChartProductSeries(report).map((series, productIndex) => ({
    productCode: series.productCode,
    productUrl: series.productUrl,
    name: series.name,
    color: colorByProduct(productIndex),
    isSelf: productIndex === 0,
    cells: report.points.map((point, dateIndex) => {
      const organicRankNo = series.organicData[dateIndex] ?? undefined
      const adRankNo = series.adData[dateIndex] ?? undefined
      const rankNo = bestRankValue(organicRankNo, adRankNo)
      return {
        dateLabel: point.date.slice(5),
        rankNo,
        adRankNo,
        scanDepth: point.scanDepth,
        band: rankBand(rankNo)
      }
    })
  }))
}

function buildRankChartProductSeries(report: SelfRankKeywordReport): RankChartProductSeries[] {
  return [
    {
      productCode: 'self',
      productUrl: undefined,
      name: '本品',
      organicData: report.points.map((point) => (point.organicStatus === 'ranked' ? point.organicRankNo ?? null : null)),
      adData: report.points.map((point) => (point.adStatus === 'ranked' ? point.adRankNo ?? null : null))
    },
    ...report.competitorSeries
  ]
}

const REPORT_PRODUCT_COLORS = [
  '#1677ff',
  '#13a8a8',
  '#fa8c16',
  '#52c41a',
  '#eb2f96',
  '#2f54eb',
  '#a0d911',
  '#fa541c',
  '#08979c'
]

function colorByProduct(productIndex: number) {
  return REPORT_PRODUCT_COLORS[productIndex % REPORT_PRODUCT_COLORS.length]
}

function bestRankValue(...values: Array<number | undefined>) {
  const rankedValues = values.filter((value): value is number => typeof value === 'number')
  return rankedValues.length ? Math.min(...rankedValues) : undefined
}

function rankBand(rankNo?: number): RankHeatmapCell['band'] {
  if (!rankNo) return 'missing'
  if (rankNo <= 10) return 'top10'
  if (rankNo <= 20) return 'top20'
  if (rankNo <= 50) return 'top50'
  return 'top100'
}

function formatSummaryRankText(rankNo?: number, scanDepth = DEFAULT_RANK_SCAN_DEPTH) {
  return rankNo ? `第 ${rankNo} 名` : formatNotInRankRangeText(scanDepth)
}

function formatSelfRankReportText(status: SelfRankReportStatus, rankNo?: number, scanDepth = DEFAULT_RANK_SCAN_DEPTH) {
  if (status === 'ranked' && rankNo) {
    return `第 ${rankNo} 名`
  }
  if (status === 'not_in_scan_depth') {
    return '无排名数据'
  }
  return '-'
}

type ProductDetailProps = {
  product: CompetitorWatchProduct
  storeLabel?: string
  ownedNoonProductCodes: ReadonlySet<string>
  historyRange: HistoryRange
  onHistoryRangeChange: (value: HistoryRange) => void
  onCandidateStatusChange: (keywordId: string, candidateId: string, status: 'confirmed' | 'ignored' | 'removed') => void
  onCandidateBatchStatusChange: (
    keywordId: string,
    candidateIds: string[],
    status: 'confirmed' | 'ignored'
  ) => void
  onManualRefresh: (product: CompetitorWatchProduct) => void
  actionLoading: string | null
}

function ProductDetail({
  product,
  storeLabel,
  ownedNoonProductCodes,
  historyRange,
  onHistoryRangeChange,
  onCandidateStatusChange,
  onCandidateBatchStatusChange,
  onManualRefresh,
  actionLoading
}: ProductDetailProps) {
  const { message } = App.useApp()
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyRows, setHistoryRows] = useState<CompetitorRankPoint[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const activeKeywords = useMemo(
    () =>
      product.keywords
        .filter((keyword) => keyword.status === 'active')
        .slice()
        .sort((left, right) => left.displayOrder - right.displayOrder),
    [product.keywords]
  )
  const [selectedKeywordId, setSelectedKeywordId] = useState(activeKeywords[0]?.id ?? '')
  const selectedKeyword =
    activeKeywords.find((keyword) => keyword.id === selectedKeywordId) ?? activeKeywords[0]
  const keywordCandidates = useMemo(
    () => (selectedKeyword ? getCandidatesForKeyword(product, selectedKeyword) : []),
    [product, selectedKeyword]
  )
  const selectedSelfRankPoint = selectedKeyword
    ? getLatestRankPoint(product, selectedKeyword.id, product.selfNoonProductCode)
    : undefined
  const selectedPendingCount = selectedKeyword
    ? keywordCandidates.filter((candidate) => candidateStatusForKeyword(candidate, selectedKeyword.id) === 'pending').length
    : 0
  const selectedConfirmedCount = selectedKeyword
    ? keywordCandidates.filter((candidate) => candidateStatusForKeyword(candidate, selectedKeyword.id) === 'confirmed').length
    : 0
  const latestRankRows = useMemo(
    () => (selectedKeyword ? buildRankRows(product).filter((point) => point.keywordId === selectedKeyword.id) : []),
    [product, selectedKeyword]
  )
  const activeKeywordCount = product.activeKeywordCount ?? activeKeywords.length
  const refreshDisabled = !product.id || activeKeywordCount <= 0
  const refreshTitle = activeKeywordCount <= 0 ? '维护启用关键词后可抓取' : ''
  const titleLines = productTitleLines(product)

  useEffect(() => {
    if (!activeKeywords.some((keyword) => keyword.id === selectedKeywordId)) {
      setSelectedKeywordId(activeKeywords[0]?.id ?? '')
    }
  }, [activeKeywords, selectedKeywordId])

  useEffect(() => {
    if (!historyOpen || !selectedKeyword) {
      return undefined
    }
    const controller = new AbortController()
    setHistoryLoading(true)
    fetchCompetitorRankHistory(
      product.id,
      {
        keywordId: selectedKeyword.id,
        rangeDays: Number(historyRange)
      },
      controller.signal
    )
      .then(setHistoryRows)
      .catch((error) => {
        if (!isAbortError(error)) {
          message.error(normalizeError(error, '读取排名历史失败'))
          setHistoryRows([])
        }
      })
      .finally(() => {
        setHistoryLoading(false)
      })
    return () => controller.abort()
  }, [historyOpen, historyRange, message, product.id, selectedKeyword])

  return (
    <div className="competitor-analysis-detail">
      <Card size="small" variant="borderless">
        <div className="competitor-analysis-toolbar">
          <ProductBaselineIdentity
            title={<ProductTitleStack titleLines={titleLines} />}
            fallbackTitle="未命名商品"
            imageUrl={product.imageUrl}
            imageAlt={titleLines.alt}
            imageWidth={80}
            titleMaxWidth={520}
            codes={[
              { label: '店铺', value: storeLabel || product.storeCode || '-' },
              {
                label: 'psku',
                value: product.partnerSku || '-',
                copyText: product.partnerSku || undefined
              },
              ...(product.selfNoonProductCode
                ? [
                    {
                      label: 'Noon',
                      value: product.selfNoonProductCode,
                      copyText: product.selfNoonProductCode
                    }
                  ]
                : [])
            ]}
            tags={product.siteCode ? <Tag style={{ marginInlineEnd: 0 }}>{product.siteCode}</Tag> : undefined}
          />
          <Tooltip title={refreshTitle}>
            <Button
              size="small"
              icon={<ReloadOutlined />}
              disabled={refreshDisabled}
              loading={actionLoading === `refresh-${product.id}`}
              onClick={() => onManualRefresh(product)}
            >
              抓取
            </Button>
          </Tooltip>
        </div>
      </Card>

      <Card size="small" variant="borderless">
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <div className="competitor-analysis-keyword-toolbar">
            <div className="competitor-analysis-keyword-list">
              {activeKeywords.map((keyword) => {
                const keywordCandidateCount = getCandidatesForKeyword(product, keyword).length
                return (
                  <Button
                    key={keyword.id}
                    type={keyword.id === selectedKeyword?.id ? 'primary' : 'default'}
                    icon={<SearchOutlined />}
                    onClick={() => setSelectedKeywordId(keyword.id)}
                  >
                    {keyword.keyword}
                    <Text className="competitor-analysis-keyword-count">{keywordCandidateCount}</Text>
                  </Button>
                )
              })}
            </div>
            <Space wrap size={6}>
              <Tag color="blue">本品 {formatRankStatus(selectedSelfRankPoint)}</Tag>
              <Tag color={selectedPendingCount ? 'gold' : 'default'}>{selectedPendingCount} 待选</Tag>
              <Tag color="green">{selectedConfirmedCount} 已选</Tag>
              <Button size="small" icon={<ClockCircleOutlined />} onClick={() => setHistoryOpen(true)}>
                排名历史
              </Button>
            </Space>
          </div>
          <KeywordBoard
            product={product}
            keyword={selectedKeyword}
            candidates={keywordCandidates}
            ownedNoonProductCodes={ownedNoonProductCodes}
            onCandidateStatusChange={onCandidateStatusChange}
            onCandidateBatchStatusChange={onCandidateBatchStatusChange}
            actionLoading={actionLoading}
          />
        </Space>
      </Card>

      <Modal
        width={960}
        open={historyOpen}
        title={selectedKeyword ? `排名历史：${selectedKeyword.keyword}` : '排名历史'}
        footer={null}
        onCancel={() => setHistoryOpen(false)}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Segmented
            value={historyRange}
            onChange={(value) => onHistoryRangeChange(value as HistoryRange)}
            options={[
              { label: '7天', value: '7' },
              { label: '30天', value: '30' },
              { label: '90天', value: '90' },
              { label: '180天', value: '180' },
              { label: '365天', value: '365' }
            ]}
          />
          <Table
            rowKey="id"
            dataSource={historyOpen ? buildHistoryRankRows(product, historyRows, selectedKeyword) : latestRankRows}
            columns={rankColumns(product)}
            pagination={false}
            loading={historyLoading}
            size="small"
            scroll={{ x: 920 }}
          />
        </Space>
      </Modal>
    </div>
  )
}

function KeywordMaintenancePanel({
  product,
  keywordInput,
  actionLoading,
  onKeywordInputChange,
  onAddKeyword,
  onKeywordStatusChange,
  onKeywordDelete,
  onKeywordDetailOpen
}: {
  product: CompetitorWatchProduct
  keywordInput: string
  actionLoading: string | null
  onKeywordInputChange: (value: string) => void
  onAddKeyword: () => void
  onKeywordStatusChange: (keyword: CompetitorKeyword, status: 'active' | 'paused') => void
  onKeywordDelete: (keyword: CompetitorKeyword) => void
  onKeywordDetailOpen: (keyword: CompetitorKeyword) => void
}) {
  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12} data-testid="competitor-keyword-panel">
      <ProductModalSummary product={product} />
      <div className="competitor-analysis-inline-form">
        <Input
          allowClear
          autoFocus
          placeholder="输入关键词"
          value={keywordInput}
          onChange={(event) => onKeywordInputChange(event.target.value)}
          onPressEnter={onAddKeyword}
        />
        <Button type="primary" icon={<PlusOutlined />} loading={actionLoading === 'add-keyword'} onClick={onAddKeyword}>
          新增关键词
        </Button>
      </div>
      <div className="competitor-analysis-keyword-maintenance-list">
        {product.keywords.map((keyword) => (
          <div key={keyword.id} className="competitor-analysis-keyword-maintenance-item">
            <KeywordTag keyword={keyword} />
            <Space size={6}>
              <Button
                size="small"
                icon={<InfoCircleOutlined />}
                onClick={() => onKeywordDetailOpen(keyword)}
              >
                关键词详情
              </Button>
              <Button
                size="small"
                loading={actionLoading === `keyword-status-${keyword.id}`}
                onClick={() => onKeywordStatusChange(keyword, keyword.status === 'active' ? 'paused' : 'active')}
              >
                {keyword.status === 'active' ? '暂停' : '启用'}
              </Button>
              <Button
                size="small"
                danger
                loading={actionLoading === `keyword-delete-${keyword.id}`}
                onClick={() => onKeywordDelete(keyword)}
              >
                移除
              </Button>
            </Space>
          </div>
        ))}
      </div>
    </Space>
  )
}

function ManualCompetitorPanel({
  product,
  manualInput,
  selectedKeywordId,
  actionLoading,
  onManualInputChange,
  onManualKeywordChange,
  onManualAdd
}: {
  product: CompetitorWatchProduct
  manualInput: string
  selectedKeywordId: string
  actionLoading: string | null
  onManualInputChange: (value: string) => void
  onManualKeywordChange: (value: string) => void
  onManualAdd: () => void
}) {
  const activeKeywords = product.keywords
    .filter((keyword) => keyword.status === 'active')
    .slice()
    .sort((left, right) => left.displayOrder - right.displayOrder)
  const confirmedCandidates = selectedKeywordId
    ? product.candidates.filter((candidate) => candidateStatusForKeyword(candidate, selectedKeywordId) === 'confirmed')
    : []

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12} data-testid="competitor-manual-panel">
      <ProductModalSummary product={product} />
      <Space direction="vertical" size={6} style={{ width: '100%' }}>
        <Text strong>添加到关键词</Text>
        <Select
          value={selectedKeywordId || undefined}
          placeholder="选择关键词"
          style={{ width: '100%' }}
          options={activeKeywords.map((keyword) => ({ label: keyword.keyword, value: keyword.id }))}
          onChange={onManualKeywordChange}
        />
      </Space>
      <div className="competitor-analysis-inline-form">
        <Input
          allowClear
          autoFocus
          placeholder="粘贴 Noon 链接、Z 码或 N 码"
          value={manualInput}
          onChange={(event) => onManualInputChange(event.target.value)}
          onPressEnter={onManualAdd}
        />
        <Button
          icon={<PlusOutlined />}
          disabled={!selectedKeywordId}
          loading={actionLoading === 'manual-add'}
          onClick={onManualAdd}
        >
          手工添加
        </Button>
      </div>
      <Text type="secondary">手工添加后直接进入所选关键词的已选竞品池。</Text>
      <div className="competitor-analysis-modal-summary">
        <Text strong>当前关键词已选竞品</Text>
        <Space wrap size={6}>
          {confirmedCandidates.map((candidate) => (
            <Tag key={candidate.id} color={candidate.sourceType === 'manual_add' ? 'cyan' : 'green'}>
              {candidate.noonProductCode}
            </Tag>
          ))}
        </Space>
      </div>
    </Space>
  )
}

function ProductModalSummary({ product }: { product: CompetitorWatchProduct }) {
  const titleLines = productTitleLines(product)
  return (
    <div className="competitor-analysis-modal-summary">
      <Text strong className="competitor-analysis-product-title-cn" ellipsis={{ tooltip: titleLines.primary }}>
        {titleLines.primary}
      </Text>
      {titleLines.secondary ? (
        <Text type="secondary" className="competitor-analysis-product-title-en" ellipsis={{ tooltip: titleLines.secondary }}>
          {titleLines.secondary}
        </Text>
      ) : null}
      <Space size={4} wrap>
        <Tag color="blue">我方SKU {product.partnerSku}</Tag>
        <Tag>{product.siteCode}</Tag>
        <Text type="secondary">Noon {product.selfNoonProductCode}</Text>
      </Space>
    </div>
  )
}

function KeywordTag({ keyword }: { keyword: CompetitorKeyword }) {
  return (
    <Tag color={keyword.status === 'active' ? 'blue' : 'default'} icon={<SearchOutlined />}>
      {keyword.keyword}
    </Tag>
  )
}

function KeywordBoard({
  product,
  keyword,
  candidates,
  ownedNoonProductCodes,
  onCandidateStatusChange,
  onCandidateBatchStatusChange,
  actionLoading
}: {
  product: CompetitorWatchProduct
  keyword?: CompetitorKeyword
  candidates: CompetitorCandidate[]
  ownedNoonProductCodes: ReadonlySet<string>
  onCandidateStatusChange: (keywordId: string, candidateId: string, status: 'confirmed' | 'ignored' | 'removed') => void
  onCandidateBatchStatusChange: (
    keywordId: string,
    candidateIds: string[],
    status: 'confirmed' | 'ignored'
  ) => void
  actionLoading: string | null
}) {
  const hasKeywordRunEvidence = useMemo(
    () => Boolean(keyword && candidates.some((candidate) => candidate.keywordLastSeenRunIds?.[keyword.id])),
    [candidates, keyword]
  )
  const resultCandidates = useMemo(
    () =>
      keyword
        ? sortCandidatesByRank(
            product,
            keyword.id,
            candidates.filter((candidate) =>
              isLatestFetchResultCandidate(product, keyword.id, candidate, hasKeywordRunEvidence)
            )
          )
        : [],
    [candidates, hasKeywordRunEvidence, keyword, product]
  )
  const resultPendingCandidates = useMemo(
    () =>
      keyword
        ? resultCandidates.filter((candidate) => candidateStatusForKeyword(candidate, keyword.id) === 'pending')
        : [],
    [keyword, resultCandidates]
  )
  const confirmedCandidates = useMemo(
    () =>
      keyword
        ? sortCandidatesByRank(
            product,
            keyword.id,
            candidates.filter((candidate) => candidateStatusForKeyword(candidate, keyword.id) === 'confirmed')
          )
        : [],
    [candidates, keyword, product]
  )
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([])
  const pendingCandidateIds = useMemo(
    () => resultPendingCandidates.map((candidate) => candidate.id),
    [resultPendingCandidates]
  )
  const pendingCandidateIdKey = pendingCandidateIds.join('|')
  const selectedPendingIdSet = useMemo(() => new Set(selectedPendingIds), [selectedPendingIds])
  const selectedPendingCount = selectedPendingIds.length
  const pendingBatchLoading = actionLoading?.startsWith(`candidate-batch-`) ?? false
  const allPendingSelected =
    resultPendingCandidates.length > 0 && selectedPendingCount === resultPendingCandidates.length
  const partialPendingSelected =
    selectedPendingCount > 0 && selectedPendingCount < resultPendingCandidates.length

  useEffect(() => {
    setSelectedPendingIds([])
  }, [keyword?.id])

  useEffect(() => {
    const pendingIds = new Set(pendingCandidateIds)
    setSelectedPendingIds((current) => current.filter((candidateId) => pendingIds.has(candidateId)))
  }, [pendingCandidateIdKey])

  if (!keyword) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有维护关键词" />
  }

  const handleTogglePendingCandidate = (candidateId: string, checked: boolean) => {
    setSelectedPendingIds((current) => {
      if (checked) {
        return current.includes(candidateId) ? current : [...current, candidateId]
      }
      return current.filter((item) => item !== candidateId)
    })
  }

  const handleToggleAllPending = (checked: boolean) => {
    setSelectedPendingIds(checked ? pendingCandidateIds : [])
  }

  const handleBatchStatusChange = (status: 'confirmed' | 'ignored') => {
    if (!selectedPendingIds.length) {
      return
    }
    onCandidateBatchStatusChange(keyword.id, selectedPendingIds, status)
  }

  return (
    <div className="competitor-analysis-keyword-board" data-testid="competitor-keyword-board">
      {resultPendingCandidates.length ? (
        <div className="competitor-analysis-board-pool">
          <div className="competitor-analysis-board-pool-header">
            <div className="competitor-analysis-board-pool-title">
              <Text strong>待选池 ({resultPendingCandidates.length})</Text>
              <Text type="secondary">运营可加入或忽略本次抓取的新候选。</Text>
            </div>
            <Space wrap size={8} className="competitor-analysis-board-pool-actions">
              <Checkbox
                checked={allPendingSelected}
                indeterminate={partialPendingSelected}
                onChange={(event) => handleToggleAllPending(event.target.checked)}
              >
                全选
              </Checkbox>
              <Button
                size="small"
                className="competitor-analysis-batch-confirm-button"
                icon={<CheckOutlined />}
                disabled={!selectedPendingCount || pendingBatchLoading}
                loading={actionLoading === `candidate-batch-confirmed-${keyword.id}`}
                onClick={() => handleBatchStatusChange('confirmed')}
              >
                {allPendingSelected ? '全选加入' : '加入选中'}
              </Button>
              <Button
                size="small"
                className="competitor-analysis-batch-ignore-button"
                icon={<CloseOutlined />}
                disabled={!selectedPendingCount || pendingBatchLoading}
                loading={actionLoading === `candidate-batch-ignored-${keyword.id}`}
                onClick={() => handleBatchStatusChange('ignored')}
              >
                {allPendingSelected ? '全选忽略' : '忽略选中'}
              </Button>
            </Space>
          </div>
          <CandidateGallery
            candidates={resultPendingCandidates}
            keyword={keyword}
            product={product}
            ownedNoonProductCodes={ownedNoonProductCodes}
            selectable
            selectedCandidateIds={selectedPendingIdSet}
            emptyText="当前关键词还没有抓取结果"
            onCandidateSelectionChange={handleTogglePendingCandidate}
            onCandidateStatusChange={onCandidateStatusChange}
            actionLoading={actionLoading}
          />
        </div>
      ) : null}

      <div className="competitor-analysis-board-pool">
        <div className="competitor-analysis-board-pool-header">
          <Text strong>已选竞品 ({confirmedCandidates.length})</Text>
          <Text type="secondary">已纳入当前关键词排名看板。</Text>
        </div>
        <CandidateGallery
          candidates={confirmedCandidates}
          keyword={keyword}
          product={product}
          ownedNoonProductCodes={ownedNoonProductCodes}
          readonly
          emptyText="当前关键词还没有已选竞品"
          onCandidateStatusChange={onCandidateStatusChange}
          actionLoading={actionLoading}
        />
      </div>
    </div>
  )
}

function CandidateGallery({
  product,
  keyword,
  candidates,
  ownedNoonProductCodes,
  readonly,
  selectable,
  selectedCandidateIds,
  emptyText,
  onCandidateSelectionChange,
  onCandidateStatusChange,
  actionLoading
}: {
  product: CompetitorWatchProduct
  keyword: CompetitorKeyword
  candidates: CompetitorCandidate[]
  ownedNoonProductCodes: ReadonlySet<string>
  readonly?: boolean
  selectable?: boolean
  selectedCandidateIds?: Set<string>
  emptyText: string
  onCandidateSelectionChange?: (candidateId: string, checked: boolean) => void
  onCandidateStatusChange: (keywordId: string, candidateId: string, status: 'confirmed' | 'ignored' | 'removed') => void
  actionLoading: string | null
}) {
  if (!candidates.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />
  }

  return (
    <div className="competitor-analysis-candidate-grid">
      {candidates.map((candidate) => {
        const rankPoint = getLatestRankPoint(product, keyword.id, candidate.noonProductCode)
        return (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            readonly={readonly}
            selectable={selectable}
            selected={selectedCandidateIds?.has(candidate.id) ?? false}
            keywordId={keyword.id}
            reviewStatus={candidateStatusForKeyword(candidate, keyword.id)}
            rankPoint={rankPoint}
            isOwnProduct={isOwnStoreCandidate(product, candidate, rankPoint, ownedNoonProductCodes)}
            onCandidateSelectionChange={onCandidateSelectionChange}
            onCandidateStatusChange={onCandidateStatusChange}
            actionLoading={actionLoading}
          />
        )
      })}
    </div>
  )
}

function CandidateCard({
  candidate,
  readonly,
  selectable,
  selected,
  keywordId,
  reviewStatus,
  rankPoint,
  isOwnProduct,
  onCandidateSelectionChange,
  onCandidateStatusChange,
  actionLoading
}: {
  candidate: CompetitorCandidate
  readonly?: boolean
  selectable?: boolean
  selected?: boolean
  keywordId: string
  reviewStatus: 'pending' | 'confirmed' | 'ignored'
  rankPoint?: CompetitorRankPoint
  isOwnProduct?: boolean
  onCandidateSelectionChange?: (candidateId: string, checked: boolean) => void
  onCandidateStatusChange: (keywordId: string, candidateId: string, status: 'confirmed' | 'ignored' | 'removed') => void
  actionLoading: string | null
}) {
  const isSponsored = rankPoint?.isSponsored ?? candidate.isSponsored
  const batchLoading = actionLoading?.startsWith('candidate-batch-') ?? false

  return (
    <article
      className={`competitor-analysis-candidate-card${reviewStatus === 'confirmed' ? ' competitor-analysis-candidate-card-confirmed' : ''}${selected ? ' competitor-analysis-candidate-card-selected' : ''}`}
      role="link"
      tabIndex={0}
      aria-label={`打开 Noon 商品 ${candidate.noonProductCode}`}
      onClick={() => openCandidateLink(candidate.canonicalUrl)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openCandidateLink(candidate.canonicalUrl)
        }
      }}
    >
      <div className="competitor-analysis-candidate-media">
        {readonly ? (
          <Tooltip title="从当前关键词移除">
            <Button
              aria-label="移除竞品"
              className="competitor-analysis-candidate-action-remove competitor-analysis-candidate-action-remove-top"
              icon={<CloseOutlined />}
              loading={actionLoading === `candidate-removed-${keywordId}-${candidate.id}`}
              shape="circle"
              size="small"
              type="text"
              onClick={(event) => {
                event.stopPropagation()
                onCandidateStatusChange(keywordId, candidate.id, 'removed')
              }}
            />
          </Tooltip>
        ) : selectable && reviewStatus === 'pending' ? (
          <Checkbox
            aria-label={`选择竞品 ${candidate.noonProductCode}`}
            className="competitor-analysis-candidate-select"
            checked={selected}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => onCandidateSelectionChange?.(candidate.id, event.target.checked)}
          />
        ) : null}
        <div className="competitor-analysis-candidate-badges">
          {isOwnProduct ? <Tag color="blue">我的</Tag> : null}
          {isSponsored ? <Tag color="purple">广告</Tag> : null}
          <Tag color={rankPoint && isNotInRankRange(rankPoint.rankStatus) ? 'default' : 'gold'}>
            {formatRankStatus(rankPoint, candidate.latestRankNo)}
          </Tag>
        </div>
        <img src={candidate.imageUrl} alt="" />
        <span className="competitor-analysis-candidate-placeholder">{candidate.brand.slice(0, 2).toUpperCase()}</span>
      </div>

      <div className="competitor-analysis-candidate-body">
        <div className="competitor-analysis-candidate-code-row">
          <Text strong className="competitor-analysis-candidate-code">
            {candidate.noonProductCode}
          </Text>
        </div>

        <Text className="competitor-analysis-candidate-title" ellipsis={{ tooltip: candidate.title }}>
          {candidate.title}
        </Text>
        <div className="competitor-analysis-candidate-meta">
          <Text type="secondary" className="competitor-analysis-candidate-brand">
            {candidate.brand}
          </Text>
          <Tag color={candidate.sourceType === 'manual_add' ? 'cyan' : 'geekblue'}>
            {candidate.sourceType === 'manual_add' ? '人工' : '搜索'}
          </Tag>
          <Space size={4} className="competitor-analysis-candidate-rating">
            {candidate.rating ? (
              <>
                <StarFilled />
                <Text>{candidate.rating}</Text>
                <Text type="secondary">({candidate.reviewCount || 0})</Text>
              </>
            ) : (
              <Text type="secondary">暂无评分</Text>
            )}
          </Space>
        </div>

        <div className="competitor-analysis-candidate-commerce">
          <Text strong className="competitor-analysis-candidate-price">
            {candidate.priceAmount ? (
              <>
                <span>{candidate.priceAmount}</span>
                {candidate.currencyCode ? (
                  <span className="competitor-analysis-candidate-price-currency">{candidate.currencyCode}</span>
                ) : null}
              </>
            ) : (
              '--'
            )}
          </Text>
          {!readonly && reviewStatus === 'pending' ? (
            <Space size={6} className="competitor-analysis-candidate-inline-actions">
              <Tooltip title="加入竞品">
                <Button
                  aria-label="加入竞品"
                  className="competitor-analysis-candidate-action-confirm"
                  disabled={batchLoading}
                  icon={<CheckOutlined />}
                  loading={actionLoading === `candidate-confirmed-${keywordId}-${candidate.id}`}
                  shape="circle"
                  size="small"
                  type="text"
                  onClick={(event) => {
                    event.stopPropagation()
                    onCandidateStatusChange(keywordId, candidate.id, 'confirmed')
                  }}
                />
              </Tooltip>
              <Tooltip title="忽略">
                <Button
                  aria-label="忽略竞品"
                  className="competitor-analysis-candidate-action-ignore"
                  disabled={batchLoading}
                  icon={<CloseOutlined />}
                  loading={actionLoading === `candidate-ignored-${keywordId}-${candidate.id}`}
                  shape="circle"
                  size="small"
                  type="text"
                  onClick={(event) => {
                    event.stopPropagation()
                    onCandidateStatusChange(keywordId, candidate.id, 'ignored')
                  }}
                />
              </Tooltip>
            </Space>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function openCandidateLink(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

function isNestedInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest('button, a, input, textarea, select, [role="button"]'))
}

function getCandidatesForKeyword(product: CompetitorWatchProduct, keyword: CompetitorKeyword) {
  return product.candidates.filter((candidate) => candidateStatusForKeyword(candidate, keyword.id) !== 'ignored')
}

function isLatestFetchResultCandidate(
  product: CompetitorWatchProduct,
  keywordId: string,
  candidate: CompetitorCandidate,
  hasKeywordRunEvidence: boolean
) {
  if (candidateStatusForKeyword(candidate, keywordId) === 'ignored') {
    return false
  }
  const relationRunId = candidate.keywordLastSeenRunIds?.[keywordId]
  if (!hasKeywordRunEvidence) {
    return true
  }
  if (product.latestRunId) {
    return relationRunId === product.latestRunId
  }
  return Boolean(relationRunId)
}

function candidateStatusForKeyword(candidate: CompetitorCandidate, keywordId: string) {
  return candidate.keywordReviewStatus?.[keywordId] ?? 'ignored'
}

function sortCandidatesByRank(
  product: CompetitorWatchProduct,
  keywordId: string,
  candidates: CompetitorCandidate[]
) {
  return candidates.slice().sort((left, right) => {
    const leftRank = candidateVisibleRankNo(product, keywordId, left)
    const rightRank = candidateVisibleRankNo(product, keywordId, right)
    const leftSortRank = leftRank ?? Number.MAX_SAFE_INTEGER
    const rightSortRank = rightRank ?? Number.MAX_SAFE_INTEGER
    if (leftSortRank !== rightSortRank) {
      return leftSortRank - rightSortRank
    }
    return left.noonProductCode.localeCompare(right.noonProductCode)
  })
}

function candidateVisibleRankNo(
  product: CompetitorWatchProduct,
  keywordId: string,
  candidate: CompetitorCandidate
) {
  const rankPoint = getLatestRankPoint(product, keywordId, candidate.noonProductCode)
  if (rankPoint?.rankStatus === 'ranked' && rankPoint.rankNo) {
    return rankPoint.rankNo
  }
  if (rankPoint && isNotInRankRange(rankPoint.rankStatus)) {
    return undefined
  }
  return candidate.latestRankNo
}

function getLatestRankPoint(product: CompetitorWatchProduct, keywordId: string, noonProductCode: string) {
  return product.rankPoints
    .filter((point) => point.keywordId === keywordId && point.noonProductCode === noonProductCode)
    .slice()
    .sort((left, right) => right.factDate.localeCompare(left.factDate))[0]
}

function isOwnStoreCandidate(
  product: CompetitorWatchProduct,
  candidate: CompetitorCandidate,
  rankPoint?: CompetitorRankPoint,
  ownedNoonProductCodes?: ReadonlySet<string>
) {
  if (candidate.ownedByCurrentStore) {
    return true
  }
  if (rankPoint?.isSelf) {
    return true
  }
  const candidateNoonProductCode = normalizeNoonProductCode(candidate.noonProductCode)
  if (candidateNoonProductCode && ownedNoonProductCodes?.has(candidateNoonProductCode)) {
    return true
  }
  const selfNoonProductCode = normalizeNoonProductCode(product.selfNoonProductCode)
  return Boolean(selfNoonProductCode && candidateNoonProductCode && selfNoonProductCode === candidateNoonProductCode)
}

function normalizeNoonProductCode(value?: string) {
  return (value || '').trim().toUpperCase()
}

function formatRankStatus(rankPoint?: CompetitorRankPoint, fallbackRankNo?: number) {
  if (rankPoint?.rankStatus === 'ranked' && rankPoint.rankNo) {
    return `第 ${rankPoint.rankNo} 名`
  }
  if (rankPoint && isNotInRankRange(rankPoint.rankStatus)) {
    return formatNotInRankRangeText(rankPoint.scanDepth)
  }
  if (fallbackRankNo) {
    return `第 ${fallbackRankNo} 名`
  }
  return '暂无排名'
}

function formatNotInRankRangeText(scanDepth = DEFAULT_RANK_SCAN_DEPTH) {
  const depth =
    Number.isFinite(scanDepth) && scanDepth > 0
      ? Math.max(DEFAULT_RANK_SCAN_DEPTH, scanDepth)
      : DEFAULT_RANK_SCAN_DEPTH
  return `未进前${depth}`
}

function formatRankPointStatusTag(point: CompetitorRankPoint) {
  return formatNotInRankRangeText(point.scanDepth)
}

function isNotInRankRange(rankStatus: CompetitorRankPoint['rankStatus']) {
  return rankStatus === 'not_in_top_20' || rankStatus === 'not_in_scan_depth'
}

function RunStatusTag({ status }: { status: string }) {
  if (status === 'succeeded') {
    return <Tag color="green">抓取成功</Tag>
  }
  if (status === 'running') {
    return <Tag color="blue">抓取中</Tag>
  }
  if (status === 'partial_failed') {
    return <Tag color="orange">部分失败</Tag>
  }
  if (status === 'captcha_required') {
    return <Tag color="orange">验证码</Tag>
  }
  return <Tag color="red">抓取受限</Tag>
}

function buildRankRows(product: CompetitorWatchProduct) {
  return product.rankPoints
    .slice()
    .sort((left, right) => right.factDate.localeCompare(left.factDate))
    .map((point) => ({
      ...point,
      keyword: product.keywords.find((keyword) => keyword.id === point.keywordId)?.keyword || '-',
      title: point.isSelf
        ? product.title
        : product.candidates.find((candidate) => candidate.noonProductCode === point.noonProductCode)?.title || point.noonProductCode
    }))
}

function buildHistoryRankRows(
  product: CompetitorWatchProduct,
  rankPoints: CompetitorRankPoint[],
  selectedKeyword?: CompetitorKeyword
) {
  return rankPoints
    .slice()
    .sort((left, right) => right.factDate.localeCompare(left.factDate))
    .map((point) => ({
      ...point,
      keyword: selectedKeyword?.id === point.keywordId
        ? selectedKeyword.keyword
        : product.keywords.find((keyword) => keyword.id === point.keywordId)?.keyword || '-',
      title: point.isSelf
        ? product.title
        : product.candidates.find((candidate) => candidate.noonProductCode === point.noonProductCode)?.title || point.noonProductCode
    }))
}

function rankColumns(product: CompetitorWatchProduct): ColumnsType<ReturnType<typeof buildRankRows>[number]> {
  return [
    {
      title: '日期',
      dataIndex: 'factDate',
      key: 'factDate',
      width: 110
    },
    {
      title: '关键词',
      dataIndex: 'keyword',
      key: 'keyword',
      width: 160
    },
    {
      title: '商品',
      dataIndex: 'title',
      key: 'title',
      width: 260,
      render: (value, point) => (
        <Space direction="vertical" size={2} style={{ maxWidth: 240 }}>
          <Text ellipsis={{ tooltip: value }}>{value}</Text>
          <Text type="secondary">{point.noonProductCode}</Text>
        </Space>
      )
    },
    {
      title: '类型',
      key: 'type',
      width: 120,
      render: (_value, point) => (
        <Space size={4} wrap>
          {point.isSelf ? <Tag color="blue">本品</Tag> : <Tag>竞品</Tag>}
          {point.isSponsored ? <Tag color="purple">广告</Tag> : null}
        </Space>
      )
    },
    {
      title: '排名',
      key: 'rank',
      width: 112,
      render: (_value, point) =>
        point.rankStatus === 'ranked' ? (
          <Text strong>第 {point.rankNo} 名</Text>
        ) : (
          <Tag icon={<ClockCircleOutlined />}>{formatRankPointStatusTag(point)}</Tag>
        )
    },
    {
      title: '价格',
      key: 'price',
      width: 110,
      render: (_value, point) =>
        point.priceAmount ? `${point.priceAmount} ${point.currencyCode || ''}` : product.siteCode === 'SA' ? 'SAR' : 'AED'
    }
  ]
}
