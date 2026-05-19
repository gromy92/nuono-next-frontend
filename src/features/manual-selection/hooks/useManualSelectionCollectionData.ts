import { message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import type { ProductSelectionSourceCollection } from '../../source-collection/types'
import { loadManualSelectionCollections } from '../api'
import type { ManualSelectionPageProps } from '../types'

export function useManualSelectionCollectionData(props: ManualSelectionPageProps) {
  const { storeName, storeCode } = props
  const [collections, setCollections] = useState<ProductSelectionSourceCollection[]>([])
  const [loading, setLoading] = useState(false)

  const loadCollections = useCallback(async () => {
    setLoading(true)
    try {
      const nextCollections = await loadManualSelectionCollections(storeName, storeCode)
      setCollections(nextCollections)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '读取人工选品采集列表失败')
    } finally {
      setLoading(false)
    }
  }, [storeCode, storeName])

  useEffect(() => {
    void loadCollections()
  }, [loadCollections])

  useEffect(() => {
    if (!collections.some((item) => item.status === 'running')) {
      return undefined
    }
    const timer = window.setInterval(() => {
      void loadCollections()
    }, 5000)
    return () => window.clearInterval(timer)
  }, [collections, loadCollections])

  return {
    collections,
    setCollections,
    loading,
    loadCollections
  }
}
