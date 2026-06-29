import { useEffect, useMemo, useState } from 'react'
import { message } from 'antd'
import { fetchInTransitGoodsLines } from './api'
import type { InTransitBatch, InTransitGoodsLine } from './types'
import type { BoxDetailTabKey, InTransitGoodsPageProps } from './InTransitGoodsPage.models'
import { buildBoxGroups, buildProductGroups } from './InTransitGoodsPage.selectors'

export function useInTransitBoxDetail({
  isBoxDetailTab,
  boxDetailRequest,
  onOpenBoxDetailTab,
  onCloseBoxDetailTab
}: Required<Pick<InTransitGoodsPageProps, 'isBoxDetailTab'>> & Omit<InTransitGoodsPageProps, 'isBoxDetailTab'>) {
  const [boxDetailTab, setBoxDetailTab] = useState<BoxDetailTabKey>('box')
  const [boxLines, setBoxLines] = useState<InTransitGoodsLine[]>([])
  const [loadingBoxLines, setLoadingBoxLines] = useState(false)

  useEffect(() => {
    if (!isBoxDetailTab || !boxDetailRequest?.batchId) {
      return
    }
    setBoxDetailTab(boxDetailRequest.initialTab ?? 'box')
    setBoxLines([])
    setLoadingBoxLines(true)
    fetchInTransitGoodsLines(boxDetailRequest.batchId)
      .then((nextLines) => {
        setBoxLines(nextLines.items ?? [])
      })
      .catch((error) => {
        message.error(error instanceof Error ? error.message : '箱子明细加载失败')
        setBoxLines([])
      })
      .finally(() => {
        setLoadingBoxLines(false)
      })
  }, [boxDetailRequest?.batchId, boxDetailRequest?.initialTab, isBoxDetailTab])

  const boxGroups = useMemo(() => buildBoxGroups(boxLines), [boxLines])
  const productGroups = useMemo(() => buildProductGroups(boxLines), [boxLines])

  const openBoxDetail = (row: InTransitBatch, initialTab: BoxDetailTabKey = 'box') => {
    onOpenBoxDetailTab?.({
      batchId: row.batchId,
      batchReferenceNo: row.batchReferenceNo,
      batch: row,
      initialTab
    })
  }

  const closeBoxDetail = () => {
    setBoxLines([])
    setBoxDetailTab('box')
    void onCloseBoxDetailTab?.()
  }

  return {
    boxDetailTab,
    setBoxDetailTab,
    boxLines,
    boxGroups,
    productGroups,
    loadingBoxLines,
    openBoxDetail,
    closeBoxDetail
  }
}
