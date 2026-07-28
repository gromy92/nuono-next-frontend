import { groupProductImageAssetsByRole } from './assetRoleSections'
import {
  activeAssets,
  isSelectableAsset,
  profileCompleteness,
  samePhysicalAsset,
  uniquePhysicalAssets
} from './productImageAssetModel'
import { imageRoleOptions } from './productImageProfileConstants'
import type { ProductImageProfile, ProfileAsset } from './productImageProfileTypes'
import { imageSummaryStatusMeta, summarizeImageStatus } from './profileSummaryStatus'

export function buildProductImageProfileSelection(params: {
  profile: ProductImageProfile
  reuseAsset: ProfileAsset | null
  selectedAssetIds: Set<string>
}) {
  const { profile, reuseAsset, selectedAssetIds } = params
  const assets = activeAssets(profile)
  const selectableAssets = assets.filter(isSelectableAsset)
  const selectedAssets = selectableAssets.filter((asset) => selectedAssetIds.has(asset.id))
  const assetCount = profile.detailLoaded
    ? uniquePhysicalAssets(assets).length
    : profile.assetCount ?? assets.length
  const assetUsageCount = profile.detailLoaded ? assets.length : assetCount
  const suiteCount = profile.detailLoaded
    ? profile.suites.length
    : profile.suiteCount ?? profile.suites.length
  const reuseUsedRoles = new Set(reuseAsset
    ? assets.filter((asset) => samePhysicalAsset(asset, reuseAsset)).map((asset) => asset.imageRole)
    : [])

  return {
    completeness: profileCompleteness(profile),
    imageStatus: imageSummaryStatusMeta[
      profile.imageStatus ?? summarizeImageStatus(profile.suites.map((suite) => suite.suiteStatus))
    ],
    assets,
    assetGroups: groupProductImageAssetsByRole(assets),
    selectableAssets,
    selectedAssets,
    allAssetsSelected: selectableAssets.length > 0 && selectedAssets.length === selectableAssets.length,
    profileReady: Boolean(profile.detailLoaded || !profile.backendId),
    assetCount,
    assetUsageCount,
    suiteCount,
    availableReuseRoleOptions: imageRoleOptions.filter((option) => !reuseUsedRoles.has(option.value))
  }
}
