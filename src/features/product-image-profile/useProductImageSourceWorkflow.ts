import { useEffect, useState } from 'react'
import { createSourceCollection, loadSourceCollections } from '../source-collection/api'
import type { ProductSelectionSourceCollection } from '../source-collection/types'
import { importProductImageProfileAssetUrls } from './api'
import {
  inferMarketplacePlatform,
  splitImportUrls,
  wait
} from './productImageProfileConstants'
import { mapBackendProfile } from './productImageProfileMapper'
import type { ProductImageProfile } from './productImageProfileTypes'

type Feedback = {
  error: (content: string) => void
  info: (content: string) => void
  success: (content: string) => void
  warning: (content: string) => void
}

type SourceWorkflowOptions = {
  ensureProfileReadyForAssets: () => Promise<ProductImageProfile | undefined>
  feedback: Feedback
  operatorName: string
  replaceSelectedProfile: (currentId: string, nextProfile: ProductImageProfile) => void
  requestOwnerId: number
  selectedProfileId: string
  storeCode: string
  storeName: string
}

export function useProductImageSourceWorkflow({
  ensureProfileReadyForAssets,
  feedback,
  operatorName,
  replaceSelectedProfile,
  requestOwnerId,
  selectedProfileId,
  storeCode,
  storeName
}: SourceWorkflowOptions) {
  const [assetImportOpen, setAssetImportOpen] = useState(false)
  const [assetImportTab, setAssetImportTab] = useState<'url' | 'link' | 'upload'>('url')
  const [assetUrlText, setAssetUrlText] = useState('')
  const [sourceLinkUrl, setSourceLinkUrl] = useState('')
  const [sourceCollectionId, setSourceCollectionId] = useState<string>()
  const [sourceCollectionStatus, setSourceCollectionStatus] = useState<string>()
  const [sourceCandidates, setSourceCandidates] = useState<string[]>([])
  const [selectedSourceCandidates, setSelectedSourceCandidates] =
    useState<Set<string>>(() => new Set())
  const [importingAssetUrls, setImportingAssetUrls] = useState(false)
  const [collectingSourceLink, setCollectingSourceLink] = useState(false)

  useEffect(() => {
    setSourceLinkUrl('')
    setSourceCollectionId(undefined)
    setSourceCollectionStatus(undefined)
    setSourceCandidates([])
    setSelectedSourceCandidates(new Set())
  }, [selectedProfileId])

  const importAssetUrls = async (imageUrls: string[], successText: string) => {
    const normalizedUrls = imageUrls.map((item) => item.trim()).filter(Boolean)
    if (!normalizedUrls.length) {
      feedback.warning('请先填写图片链接')
      return
    }
    setImportingAssetUrls(true)
    try {
      const profile = await ensureProfileReadyForAssets()
      if (!profile?.backendId) return
      const saved = await importProductImageProfileAssetUrls(
        profile.backendId,
        requestOwnerId,
        storeCode,
        normalizedUrls,
        'MAIN'
      )
      replaceSelectedProfile(profile.id, mapBackendProfile(saved))
      feedback.success(successText)
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : '基础图导入失败')
    } finally {
      setImportingAssetUrls(false)
    }
  }

  const importAssetUrlText = async () => {
    const imageUrls = splitImportUrls(assetUrlText)
    await importAssetUrls(imageUrls, `已加入 ${imageUrls.length} 张基础图`)
    if (imageUrls.length) setAssetUrlText('')
  }

  const applyCandidates = (record: {
    id?: string
    imageUrls?: string[]
    sourceImageUrl?: string
    status?: string
    statusText?: string
  }) => {
    const imageUrls = splitImportUrls(
      [record.sourceImageUrl || '', ...(record.imageUrls || [])].join('\n')
    )
    setSourceCollectionId(record.id)
    setSourceCollectionStatus(record.statusText || record.status)
    setSourceCandidates(imageUrls)
    setSelectedSourceCandidates(new Set())
    return imageUrls
  }

  const findRecord = (
    records: ProductSelectionSourceCollection[],
    collectionId?: string,
    pageUrl?: string
  ) => records.find((item) => collectionId && item.id === collectionId)
    || records.find((item) => pageUrl && (item.pageUrl === pageUrl || item.sourceUrl === pageUrl))

  const waitForCandidates = async (collectionId: string | undefined, pageUrl: string) => {
    for (let attempt = 0; attempt < 24; attempt += 1) {
      await wait(2500)
      const record = findRecord(
        await loadSourceCollections(storeName, storeCode),
        collectionId,
        pageUrl
      )
      if (!record) continue
      const imageUrls = applyCandidates(record)
      if (imageUrls.length || record.status === 'success' || record.status === 'failed') {
        return { imageUrls, record }
      }
    }
    return undefined
  }

  const collectSourceLink = async () => {
    const pageUrl = sourceLinkUrl.trim()
    const sourcePlatform = inferMarketplacePlatform(pageUrl)
    if (!sourcePlatform) {
      feedback.warning('商品链接仅支持 Amazon 或 noon')
      return
    }
    setCollectingSourceLink(true)
    try {
      const record = await createSourceCollection({
        pageUrl,
        sourcePlatform,
        sourceType: 'marketplace-url',
        sourceUrl: pageUrl
      }, storeName, storeCode, operatorName)
      const imageUrls = applyCandidates(record)
      if (imageUrls.length) {
        feedback.success(`已读取 ${imageUrls.length} 张候选图`)
      } else {
        feedback.info('已提交采集，正在读取候选图')
        const result = await waitForCandidates(record.id, pageUrl)
        if (!result) feedback.info('采集还在处理中，稍后点刷新查看候选图')
        else if (result.imageUrls.length) feedback.success(`已读取 ${result.imageUrls.length} 张候选图`)
        else if (result.record.status === 'failed') {
          feedback.error(result.record.failureMessage || '商品链接采集失败')
        } else feedback.info('采集完成，但没有返回商品图片')
      }
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : '商品链接采集失败')
    } finally {
      setCollectingSourceLink(false)
    }
  }

  const refreshSourceCandidates = async () => {
    const pageUrl = sourceLinkUrl.trim()
    if (!sourceCollectionId && !pageUrl) {
      feedback.warning('请先提交商品链接')
      return
    }
    setCollectingSourceLink(true)
    try {
      const record = findRecord(
        await loadSourceCollections(storeName, storeCode),
        sourceCollectionId,
        pageUrl
      )
      if (!record) {
        feedback.warning('暂未找到采集记录')
        return
      }
      const imageUrls = applyCandidates(record)
      if (imageUrls.length) feedback.success(`已读取 ${imageUrls.length} 张候选图`)
      else feedback.info('采集还没有返回候选图')
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : '候选图刷新失败')
    } finally {
      setCollectingSourceLink(false)
    }
  }

  const toggleSourceCandidate = (imageUrl: string, checked: boolean) => {
    setSelectedSourceCandidates((current) => {
      const next = new Set(current)
      if (checked) next.add(imageUrl)
      else next.delete(imageUrl)
      return next
    })
  }

  const updateSourceLink = (value: string) => {
    setSourceLinkUrl(value)
    setSourceCollectionId(undefined)
    setSourceCollectionStatus(undefined)
    setSourceCandidates([])
    setSelectedSourceCandidates(new Set())
  }

  const importSelectedSourceCandidates = async () => {
    const imageUrls = Array.from(selectedSourceCandidates)
    if (!imageUrls.length) {
      feedback.warning('请先勾选候选图')
      return
    }
    await importAssetUrls(imageUrls, `已加入 ${imageUrls.length} 张候选图`)
    setSelectedSourceCandidates(new Set())
  }

  return {
    assetImportOpen,
    assetImportTab,
    assetUrlText,
    collectSourceLink,
    collectingSourceLink,
    importAssetUrlText,
    importSelectedSourceCandidates,
    importingAssetUrls,
    refreshSourceCandidates,
    selectedSourceCandidates,
    setAssetImportOpen,
    setAssetImportTab,
    setAssetUrlText,
    sourceCandidates,
    sourceCollectionStatus,
    sourceLinkUrl,
    toggleSourceCandidate,
    updateSourceLink
  }
}
