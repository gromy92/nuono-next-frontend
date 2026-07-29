import { App } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import type { AuthSession } from '../../auth/session'
import { normalizeError } from '../../../shared/api'
import {
  createCompetitorWatchProduct,
  fetchCompetitorProductBaselines,
  fetchCompetitorWatchProductDetail
} from '../api'
import { normalizeNoonProductCode } from '../competitorRankFormatting'
import {
  isAbortError,
  mergeProductTitleFields
} from '../competitorProductListModel'
import type { CompetitorWatchProduct } from '../types'
import {
  productRowKey,
  sameProductLine
} from './competitorProductIdentity'
import {
  siteCodeFromStoreCode,
  storeDisplayName,
  storeKey,
  uniqueStores
} from './competitorStoreModel'
import {
  DEFAULT_PRODUCT_SORT_BY,
  type ProductSortValue
} from './productListFilters'

export function useCompetitorProductCatalog(session: AuthSession) {
  const { message } = App.useApp()
  const [products, setProducts] = useState<CompetitorWatchProduct[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedProductDetail, setSelectedProductDetail] =
    useState<CompetitorWatchProduct>()
  const [listLoading, setListLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [keywordSearch, setKeywordSearch] = useState('')
  const [competitorSearch, setCompetitorSearch] = useState('')
  const [monitorZeroOnly, setMonitorZeroOnly] = useState(false)
  const [candidateZeroOnly, setCandidateZeroOnly] = useState(false)
  const [productSortBy, setProductSortBy] =
    useState<ProductSortValue>(DEFAULT_PRODUCT_SORT_BY)
  const [productPage, setProductPage] = useState(1)
  const [productPageSize, setProductPageSize] = useState(50)
  const [productTotal, setProductTotal] = useState(0)

  const selectedProduct =
    selectedProductDetail &&
    (selectedProductDetail.id === selectedProductId ||
      productRowKey(selectedProductDetail) === selectedProductId)
      ? selectedProductDetail
      : products.find(
          (product) =>
            product.id === selectedProductId ||
            productRowKey(product) === selectedProductId
        ) ?? products[0]
  const allowedStores = useMemo(
    () => uniqueStores(session.userStores, session.currentStore),
    [session.currentStore, session.userStores]
  )
  const currentStoreKey = storeKey(session.currentStore)
  const selectedStore = useMemo(
    () =>
      allowedStores.find((store) => storeKey(store) === currentStoreKey) ||
      allowedStores[0] ||
      null,
    [allowedStores, currentStoreKey]
  )
  const selectedSiteCode =
    selectedStore?.site || siteCodeFromStoreCode(selectedStore?.storeCode)
  const ownedNoonProductCodes = useMemo(
    () =>
      new Set(
        products
          .map((product) =>
            normalizeNoonProductCode(product.selfNoonProductCode)
          )
          .filter(Boolean)
      ),
    [products]
  )

  useEffect(() => setProductPage(1), [
    selectedStore?.storeCode,
    selectedSiteCode
  ])

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
                (product) =>
                  product.id === current || productRowKey(product) === current
              )
            ) {
              return current
            }
            return result.items[0] ? productRowKey(result.items[0]) : ''
          })
        })
        .catch((error) => {
          if (!isAbortError(error)) {
            message.error(normalizeError(error, '读取商品基线列表失败'))
          }
        })
        .finally(() => setListLoading(false))
    }, 180)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [
    candidateZeroOnly,
    competitorSearch,
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
    const existing = products.find((item) => sameProductLine(item, product))
    setSelectedProductDetail(
      existing ? mergeProductTitleFields(existing, product) : product
    )
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

  const loadProductDetail = async (
    productId: string,
    options?: { showLoading?: boolean }
  ) => {
    if (options?.showLoading !== false) setDetailLoading(true)
    try {
      const detail = await fetchCompetitorWatchProductDetail(productId)
      mergeProduct(detail)
      return detail
    } catch (error) {
      message.error(normalizeError(error, '读取竞品监控详情失败'))
      return undefined
    } finally {
      if (options?.showLoading !== false) setDetailLoading(false)
    }
  }

  const ensureWatchProduct = async (product: CompetitorWatchProduct) => {
    if (product.id) return product
    if (!selectedStore?.storeCode || !selectedSiteCode) {
      message.warning('请先选择店铺和站点')
      return undefined
    }
    if (!(product.partnerSku || product.productSiteOfferId)) {
      message.warning('当前商品缺少 PSKU，暂不能做竞品分析')
      return undefined
    }
    if (!/^[ZN][A-Z0-9]{4,79}$/i.test(product.selfNoonProductCode || '')) {
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

  const reloadProductBaselines = async () => {
    if (!selectedStore?.storeCode || !selectedSiteCode) return
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

  return {
    products, setProducts, selectedProduct, selectedProductId, setSelectedProductId,
    listLoading, detailLoading, productSearch, setProductSearch, keywordSearch,
    setKeywordSearch, competitorSearch, setCompetitorSearch, monitorZeroOnly,
    setMonitorZeroOnly, candidateZeroOnly, setCandidateZeroOnly, productSortBy,
    setProductSortBy, productPage, setProductPage, productPageSize,
    setProductPageSize, productTotal, selectedStore, selectedSiteCode,
    selectedStoreLabel: storeDisplayName(selectedStore), ownedNoonProductCodes,
    mergeProduct, loadProductDetail, ensureWatchProduct, reloadProductBaselines
  }
}
