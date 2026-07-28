import {
  App,
  Button,
  Card,
  Drawer,
  Input,
  Modal,
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
  EyeOutlined,
  LineChartOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined
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
import {
  KeywordMaintenancePanel,
  ManualCompetitorPanel
} from './productDetail/ProductMaintenancePanels'
import {
  ProductDetail,
  type HistoryRange
} from './productDetail/ProductDetail'
import { RunStatusTag } from './productDetail/RunStatusTag'
import { candidateStatusForKeyword } from './productDetail/candidateModel'
import { normalizeError } from '../../shared/api'
import type {
  CompetitorDashboardDrill,
  CompetitorKeyword,
  CompetitorProductChangeBaselineSummary,
  CompetitorProductChangeField,
  CompetitorProductChangeGroup,
  CompetitorWatchProduct
} from './types'
import './CompetitorAnalysisPage.css'

const { Link, Text } = Typography
type CompetitorAnalysisPageProps = {
  session: AuthSession
}

type CompetitorAnalysisTabKey = 'dashboard' | 'detail' | 'priceChanges'

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
