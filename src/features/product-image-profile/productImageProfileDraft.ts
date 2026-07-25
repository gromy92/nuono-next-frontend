import type { ProductImageProfile } from './productImageProfileTypes'

export function preserveProductImageProfileDraft(
  current: ProductImageProfile,
  serverProfile: ProductImageProfile
): ProductImageProfile {
  return {
    ...serverProfile,
    titleAr: current.titleAr,
    titleEn: current.titleEn,
    specSummary: current.specSummary,
    productFactText: current.productFactText,
    heroSellingPoints: current.heroSellingPoints,
    sizeSection: current.sizeSection,
    coreFeatures: current.coreFeatures,
    materialDetails: current.materialDetails,
    usageScene: current.usageScene,
    packageList: current.packageList
  }
}
