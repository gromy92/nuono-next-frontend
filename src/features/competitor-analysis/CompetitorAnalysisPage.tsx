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
  EyeOutlined,
  InfoCircleOutlined,
  LineChartOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  StarFilled
} from '@ant-design/icons'
import { useEffect, useMemo, useState } from 'react'
import type { AuthSession, AuthSessionStore } from '../auth/session'
import { ProductBaselineIdentity } from '../product-baseline'
import { ProductKeywordDetailDrawer, type ProductKeywordDetailKeyword } from '../product-keywords/ProductKeywordDetailDrawer'
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
import { ProductKeywordLinks, ProductTitleStack } from './CompetitorProductListCells'
import { noonMarketPath } from './competitorNoonLinks'
import {
  formatNotInRankRangeText,
  formatRankStatus,
  isNotInRankRange,
  normalizeNoonProductCode
} from './competitorRankFormatting'
import {
  isAbortError,
  mergeProductTitleFields,
  normalizeProductKeywordNorm,
  productListIdentityCodes,
  productTitleLines
} from './competitorProductListModel'
import { loadReportRankHistory } from './competitorRankHistory'
import { SelfRankReportModal } from './rankReports/SelfRankReportModal'
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
    if (!(product.partnerSku || product.productSiteOfferId)) {
      message.warning('当前商品缺少 PSKU，暂不能做竞品分析')
      return undefined
    }
    if (!hasValidSelfNoonCode(product)) {
      message.warning('当前商品缺少 Noon Z/N 码，暂不能做竞品分析')
      return undefined
    }
    try {
      const detail = await createCompetitorWatchProduct({
        storeCode: selectedStore.storeCode,
        siteCode: selectedSiteCode,
        productSiteOfferId: product.productSiteOfferId || undefined,
        partnerSku: product.partnerSku,
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

function formatRankPointStatusTag(point: CompetitorRankPoint) {
  return formatNotInRankRangeText(point.scanDepth)
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
