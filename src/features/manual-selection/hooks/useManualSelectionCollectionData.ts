import { message } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ProductSelectionSourceCollection } from '../../source-collection/types'
import { loadManualSelectionCollectionPage } from '../api'
import type {
  ManualSelectionLoadOptions,
  ManualSelectionPageProps,
  ManualSelectionPagination,
  ManualSelectionSearchValues
} from '../types'

const DEFAULT_PAGINATION: ManualSelectionPagination = {
  current: 1,
  pageSize: 50,
  total: 0
}

const COLLECTING_STATUSES = new Set(['queued', 'running'])

export function useManualSelectionCollectionData(props: ManualSelectionPageProps) {
  const { storeName, storeCode } = props
  const [collections, setCollections] = useState<ProductSelectionSourceCollection[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState<ManualSelectionPagination>(DEFAULT_PAGINATION)
  const paginationRef = useRef(DEFAULT_PAGINATION)
  const lastLoadOptionsRef = useRef<ManualSelectionLoadOptions>({
    page: DEFAULT_PAGINATION.current,
    pageSize: DEFAULT_PAGINATION.pageSize,
    filters: {}
  })

  useEffect(() => {
    paginationRef.current = pagination
  }, [pagination])

  const loadCollections = useCallback(async (options?: ManualSelectionLoadOptions) => {
    const currentPagination = paginationRef.current
    const previousOptions = lastLoadOptionsRef.current
    const nextPage = options?.page || previousOptions.page || currentPagination.current
    const nextPageSize = options?.pageSize || previousOptions.pageSize || currentPagination.pageSize
    const filters = options?.filters || previousOptions.filters || {}
    const silent = options?.silent === true
    const mergeCollectingOnly = options?.mergeCollectingOnly === true
    lastLoadOptionsRef.current = {
      page: nextPage,
      pageSize: nextPageSize,
      filters
    }
    if (!silent) {
      setLoading(true)
    }
    try {
      const page = await loadManualSelectionCollectionPage(storeName, storeCode, toSourceCollectionQuery(
        nextPage,
        nextPageSize,
        filters
      ))
      if (mergeCollectingOnly) {
        setCollections((current) => mergeCollectingRows(current, page.items))
      } else {
        setCollections(page.items)
        setPagination({
          current: page.page,
          pageSize: page.pageSize,
          total: page.total
        })
      }
    } catch (error) {
      if (!silent) {
        message.error(error instanceof Error ? error.message : '读取人工选品采集列表失败')
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [storeCode, storeName])

  useEffect(() => {
    void loadCollections()
  }, [loadCollections])

  useEffect(() => {
    if (!collections.some(isCollectingCollection)) {
      return undefined
    }
    const timer = window.setInterval(() => {
      void loadCollections({
        silent: true,
        mergeCollectingOnly: true
      })
    }, 5000)
    return () => window.clearInterval(timer)
  }, [collections, loadCollections])

  return {
    collections,
    setCollections,
    loading,
    pagination,
    loadCollections
  }
}

function toSourceCollectionQuery(page: number, pageSize: number, filters: ManualSelectionSearchValues) {
  return {
    page,
    pageSize,
    sourcePlatform: trimToUndefined(filters.channel),
    sourceTitle: trimToUndefined(filters.productTitleEn),
    sourceTitleCn: trimToUndefined(filters.productTitleCn),
    status: filters.collectStatus
  }
}

function trimToUndefined(value?: string) {
  const text = value?.trim()
  return text || undefined
}

function isCollectingCollection(collection: ProductSelectionSourceCollection) {
  return COLLECTING_STATUSES.has(collection.status)
}

function mergeCollectingRows(
  currentItems: ProductSelectionSourceCollection[],
  nextItems: ProductSelectionSourceCollection[]
) {
  const nextById = new Map(nextItems.map((item) => [item.id, item]))
  return currentItems.map((item) => {
    if (!isCollectingCollection(item)) {
      return item
    }
    return nextById.get(item.id) ?? item
  })
}
