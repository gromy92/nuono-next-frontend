import type { ProductImageRole } from './api'

export type ProductImageAssetSectionRole = Exclude<ProductImageRole, 'OTHER'>

export type ProductImageAssetRoleSection = {
  role: ProductImageAssetSectionRole
  label: string
}

export type ProductImageAssetRoleGroup<TAsset> = ProductImageAssetRoleSection & {
  assets: TAsset[]
}

export const productImageAssetRoleSections: ProductImageAssetRoleSection[] = [
  { role: 'MAIN', label: '主图' },
  { role: 'SIZE', label: '尺寸图' },
  { role: 'DETAIL', label: '细节' },
  { role: 'SCENE', label: '场景' },
  { role: 'PACKAGE', label: '包装' }
]

function assetSectionRole(role?: ProductImageRole | null): ProductImageAssetSectionRole {
  if (role === 'SIZE' || role === 'DETAIL' || role === 'SCENE' || role === 'PACKAGE') {
    return role
  }
  return 'MAIN'
}

export function groupProductImageAssetsByRole<TAsset extends { imageRole?: ProductImageRole | null }>(
  assets: TAsset[]
): ProductImageAssetRoleGroup<TAsset>[] {
  const groups = new Map<ProductImageAssetSectionRole, TAsset[]>()
  productImageAssetRoleSections.forEach((section) => groups.set(section.role, []))
  assets.forEach((asset) => {
    groups.get(assetSectionRole(asset.imageRole))?.push(asset)
  })
  return productImageAssetRoleSections.map((section) => ({
    ...section,
    assets: groups.get(section.role) ?? []
  }))
}
