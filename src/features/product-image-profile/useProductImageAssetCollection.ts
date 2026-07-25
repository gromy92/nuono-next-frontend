import { useEffect, useState } from 'react'
import {
  batchRemoveProductImageProfileAssets,
  removeProductImageProfileAssetUsage,
  updateProductImageProfileAssetRole,
  updateProductImageProfileAssetUsage,
  uploadProductImageProfileAsset,
  type ProductImageProfileDetailView
} from './api'
import {
  activeAssets,
  assetRemoveItem,
  assetRoleUpdateItem,
  isSelectableAsset,
  samePhysicalAsset,
  uniquePhysicalAssets
} from './productImageAssetModel'
import {
  acceptedImageTypes,
  maxImageBytes
} from './productImageProfileConstants'
import { mapBackendProfile } from './productImageProfileMapper'
import type { ImageRole, ProductImageProfile, ProfileAsset } from './productImageProfileTypes'

type Feedback = {
  error: (content: string) => void
  success: (content: string) => void
  warning: (content: string) => void
}

type AssetCollectionOptions = {
  ensureProfileReadyForAssets: () => Promise<ProductImageProfile | undefined>
  feedback: Feedback
  patchSelectedProfile: (updater: (profile: ProductImageProfile) => ProductImageProfile) => void
  persistProfile: (profile: ProductImageProfile, showSuccess?: boolean) => Promise<ProductImageProfile | undefined>
  replaceSelectedProfile: (currentId: string, nextProfile: ProductImageProfile) => void
  requestOwnerId: number
  selectedProfile?: ProductImageProfile
  storeCode: string
}

export function useProductImageAssetCollection({
  ensureProfileReadyForAssets,
  feedback,
  patchSelectedProfile,
  persistProfile,
  replaceSelectedProfile,
  requestOwnerId,
  selectedProfile,
  storeCode
}: AssetCollectionOptions) {
  const [uploading, setUploading] = useState(false)
  const [removingAssets, setRemovingAssets] = useState(false)
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(() => new Set())
  const [changingAssetRoleId, setChangingAssetRoleId] = useState<string>()

  useEffect(() => setSelectedAssetIds(new Set()), [selectedProfile?.id])

  const handleUpload = async (file: File) => {
    if (!acceptedImageTypes.includes(file.type)) {
      feedback.warning('仅支持 JPG、PNG、WEBP、GIF、AVIF 图片')
      return
    }
    if (file.size > maxImageBytes) {
      feedback.warning('基础图不能超过 8MB')
      return
    }
    setUploading(true)
    try {
      const profile = await ensureProfileReadyForAssets()
      if (!profile?.backendId) return
      const saved = await uploadProductImageProfileAsset(
        profile.backendId,
        requestOwnerId,
        storeCode,
        file,
        'MAIN'
      )
      replaceSelectedProfile(profile.id, mapBackendProfile(saved))
      feedback.success('基础图已加入素材池')
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : '基础图上传失败')
    } finally {
      setUploading(false)
    }
  }

  const removeAssets = async (assetsToRemove: ProfileAsset[]) => {
    if (!selectedProfile) return
    const targets = assetsToRemove.filter(isSelectableAsset)
    if (!targets.length) return
    setRemovingAssets(true)
    try {
      const profile = selectedProfile.backendId
        ? selectedProfile
        : await persistProfile(selectedProfile, false)
      if (!profile?.backendId) {
        patchSelectedProfile((current) => ({
          ...current,
          assets: current.assets.map((asset) =>
            targets.some((target) => target.id === asset.id)
              ? { ...asset, assetStatus: 'REMOVED' }
              : asset
          )
        }))
        setSelectedAssetIds(new Set())
        feedback.success(`已移除 ${targets.length} 张图片`)
        return
      }
      const active = activeAssets(profile)
      const usageTargets: ProfileAsset[] = []
      const physicalTargets: ProfileAsset[] = []
      for (const physicalAsset of uniquePhysicalAssets(targets)) {
        const selectedUsages = targets.filter((target) => samePhysicalAsset(target, physicalAsset))
        const allUsages = active.filter((candidate) => samePhysicalAsset(candidate, physicalAsset))
        if (selectedUsages.length >= allUsages.length || selectedUsages.some((target) => !target.usageId)) {
          physicalTargets.push(physicalAsset)
        } else usageTargets.push(...selectedUsages)
      }
      let saved: ProductImageProfileDetailView | undefined
      for (const target of usageTargets) {
        saved = await removeProductImageProfileAssetUsage(
          profile.backendId,
          target.usageId!,
          requestOwnerId,
          storeCode
        )
      }
      if (physicalTargets.length) {
        saved = await batchRemoveProductImageProfileAssets(
          profile.backendId,
          requestOwnerId,
          storeCode,
          physicalTargets.map(assetRemoveItem)
        )
      }
      if (saved) replaceSelectedProfile(profile.id, mapBackendProfile(saved))
      setSelectedAssetIds(new Set())
      feedback.success(`已移除 ${targets.length} 个图片用途`)
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : '基础图移除失败')
    } finally {
      setRemovingAssets(false)
    }
  }

  const removeAsset = (asset: ProfileAsset) => removeAssets([asset])
  const selectAssets = (assets: ProfileAsset[]) => {
    setSelectedAssetIds(new Set(assets.filter(isSelectableAsset).map((asset) => asset.id)))
  }
  const clearAssetSelection = () => setSelectedAssetIds(new Set())
  const toggleAssetSelection = (assetId: string, checked: boolean) => {
    setSelectedAssetIds((current) => {
      const next = new Set(current)
      if (checked) next.add(assetId)
      else next.delete(assetId)
      return next
    })
  }

  const changeAssetRole = async (assetId: string, imageRole: ImageRole) => {
    if (!selectedProfile) return
    const target = selectedProfile.assets.find((asset) => asset.id === assetId)
    if (!target || target.imageRole === imageRole) return
    const previousRole = target.imageRole
    patchSelectedProfile((profile) => ({
      ...profile,
      assets: profile.assets.map((asset) => asset.id === assetId ? { ...asset, imageRole } : asset)
    }))
    if (!target.backendId && !target.imageUrl) return
    setChangingAssetRoleId(assetId)
    try {
      const profile = selectedProfile.backendId
        ? selectedProfile
        : await persistProfile(selectedProfile, false)
      if (!profile?.backendId) return
      const saved = target.usageId
        ? await updateProductImageProfileAssetUsage(
            profile.backendId,
            target.usageId,
            requestOwnerId,
            storeCode,
            {
              imageRole,
              processingNote: target.processingNote,
              processingStatus: target.processingStatus
            }
          )
        : await updateProductImageProfileAssetRole(
            profile.backendId,
            requestOwnerId,
            storeCode,
            assetRoleUpdateItem(target, imageRole)
          )
      replaceSelectedProfile(profile.id, mapBackendProfile(saved))
    } catch (error) {
      patchSelectedProfile((profile) => ({
        ...profile,
        assets: profile.assets.map((asset) =>
          asset.id === assetId ? { ...asset, imageRole: previousRole } : asset
        )
      }))
      feedback.error(error instanceof Error ? error.message : '基础图分类更新失败')
    } finally {
      setChangingAssetRoleId((current) => current === assetId ? undefined : current)
    }
  }

  return {
    changeAssetRole,
    changingAssetRoleId,
    clearAssetSelection,
    handleUpload,
    removeAsset,
    removeAssets,
    removingAssets,
    selectAssets,
    selectedAssetIds,
    toggleAssetSelection,
    uploading
  }
}
