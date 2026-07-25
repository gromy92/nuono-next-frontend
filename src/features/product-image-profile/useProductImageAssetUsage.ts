import { useEffect, useState } from 'react'
import {
  addProductImageProfileAssetUsages,
  updateProductImageProfileAssetUsage,
  type ProductImageProcessingStatus
} from './api'
import { optionalText } from './productImageProfileConstants'
import { mapBackendProfile } from './productImageProfileMapper'
import type { ImageRole, ProductImageProfile, ProfileAsset } from './productImageProfileTypes'

type Feedback = {
  error: (content: string) => void
  success: (content: string) => void
  warning: (content: string) => void
}

type AssetUsageOptions = {
  feedback: Feedback
  persistProfile: (profile: ProductImageProfile, showSuccess?: boolean) => Promise<ProductImageProfile | undefined>
  replaceSelectedProfile: (currentId: string, nextProfile: ProductImageProfile) => void
  requestOwnerId: number
  selectedProfile?: ProductImageProfile
  storeCode: string
}

export function useProductImageAssetUsage({
  feedback,
  persistProfile,
  replaceSelectedProfile,
  requestOwnerId,
  selectedProfile,
  storeCode
}: AssetUsageOptions) {
  const [reuseAsset, setReuseAsset] = useState<ProfileAsset | null>(null)
  const [reuseRoles, setReuseRoles] = useState<ImageRole[]>([])
  const [processingAsset, setProcessingAsset] = useState<ProfileAsset | null>(null)
  const [processingNote, setProcessingNote] = useState('')
  const [processingStatus, setProcessingStatus] =
    useState<ProductImageProcessingStatus>('PENDING')
  const [savingAssetWorkflow, setSavingAssetWorkflow] = useState(false)

  useEffect(() => {
    setReuseAsset(null)
    setProcessingAsset(null)
  }, [selectedProfile?.id])

  const openReuseAsset = (asset: ProfileAsset) => {
    setReuseAsset(asset)
    setReuseRoles([])
  }

  const reuseAssetForRoles = async () => {
    if (!selectedProfile || !reuseAsset || !reuseRoles.length) return
    setSavingAssetWorkflow(true)
    try {
      const profile = selectedProfile.backendId
        ? selectedProfile
        : await persistProfile(selectedProfile, false)
      if (!profile?.backendId) {
        feedback.warning('请先保存商品图资料')
        return
      }
      const saved = await addProductImageProfileAssetUsages(
        profile.backendId,
        requestOwnerId,
        storeCode,
        {
          assetId: reuseAsset.backendId,
          imageRoles: reuseRoles,
          imageUrl: reuseAsset.imageUrl,
          sourceRole: reuseAsset.imageRole
        }
      )
      replaceSelectedProfile(profile.id, mapBackendProfile(saved))
      setReuseAsset(null)
      setReuseRoles([])
      feedback.success(`已复用到 ${reuseRoles.length} 个图片用途`)
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : '基础图复用失败')
    } finally {
      setSavingAssetWorkflow(false)
    }
  }

  const openProcessingAsset = (asset: ProfileAsset) => {
    setProcessingAsset(asset)
    setProcessingNote(asset.processingNote)
    setProcessingStatus(asset.processingStatus)
  }

  const saveAssetProcessing = async () => {
    if (!selectedProfile || !processingAsset) return
    setSavingAssetWorkflow(true)
    try {
      const profile = selectedProfile.backendId
        ? selectedProfile
        : await persistProfile(selectedProfile, false)
      if (!profile?.backendId) {
        feedback.warning('请先保存商品图资料')
        return
      }
      let target = profile.assets.find((asset) => asset.id === processingAsset.id)
        || profile.assets.find((asset) =>
          asset.imageRole === processingAsset.imageRole
          && optionalText(asset.imageUrl) === optionalText(processingAsset.imageUrl)
        )
      let readyProfile = profile
      if (!target?.usageId) {
        const withUsage = await addProductImageProfileAssetUsages(
          profile.backendId,
          requestOwnerId,
          storeCode,
          {
            assetId: processingAsset.backendId,
            imageRoles: [processingAsset.imageRole],
            imageUrl: processingAsset.imageUrl,
            sourceRole: processingAsset.imageRole
          }
        )
        readyProfile = mapBackendProfile(withUsage)
        target = readyProfile.assets.find((asset) =>
          asset.imageRole === processingAsset.imageRole
          && (asset.backendId === processingAsset.backendId
            || optionalText(asset.imageUrl) === optionalText(processingAsset.imageUrl))
        )
      }
      if (!target?.usageId) throw new Error('图片用途初始化失败，请刷新后重试')
      const saved = await updateProductImageProfileAssetUsage(
        readyProfile.backendId!,
        target.usageId,
        requestOwnerId,
        storeCode,
        {
          imageRole: target.imageRole,
          processingNote: processingNote.trim(),
          processingStatus
        }
      )
      replaceSelectedProfile(profile.id, mapBackendProfile(saved))
      setProcessingAsset(null)
      feedback.success('处理意见和状态已保存')
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : '图片处理信息保存失败')
    } finally {
      setSavingAssetWorkflow(false)
    }
  }

  return {
    openProcessingAsset,
    openReuseAsset,
    processingAsset,
    processingNote,
    processingStatus,
    reuseAsset,
    reuseAssetForRoles,
    reuseRoles,
    saveAssetProcessing,
    savingAssetWorkflow,
    setProcessingAsset,
    setProcessingNote,
    setProcessingStatus,
    setReuseAsset,
    setReuseRoles
  }
}
