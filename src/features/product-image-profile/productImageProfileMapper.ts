import type {
  ProductImageProfileDetailView,
  ProductImageProfileSummaryView,
  ProductImageSectionCommand,
  ProductImageSectionType
} from './api'
import { buildDefaultProductFactText } from './aiCopyText'
import { resolveProductImageShortTitleAr, resolveProductImageShortTitleEn } from './productImageTitle'
import { summarizeImageStatus } from './profileSummaryStatus'
import { profileMissingFields } from './productImageAssetModel'
import type { ProductImageProfile, ProfileAsset, RepeatableImageSection, SimpleImageSection } from './productImageProfileTypes'
import { accentAt, imageRoleLabel, optionalNumber, optionalText } from './productImageProfileConstants'
import { buildReviewAssetPresentation } from './productImageReviewFeedback'

export function emptySimpleSection(): SimpleImageSection {
  return {
    titleAr: '',
    titleEn: '',
    descriptionAr: '',
    descriptionEn: '',
    attributesText: ''
  }
}

export function backendSimpleSection(profile: ProductImageProfileDetailView, sectionType: ProductImageSectionType): SimpleImageSection {
  const section = profile.sections?.find((item) => item.sectionType === sectionType)
  return {
    titleAr: optionalText(section?.titleAr),
    titleEn: optionalText(section?.titleEn),
    descriptionAr: optionalText(section?.descriptionAr),
    descriptionEn: optionalText(section?.descriptionEn),
    attributesText: optionalText(section?.attributesText)
  }
}

export function backendRepeatableSections(profile: ProductImageProfileDetailView, sectionType: ProductImageSectionType): RepeatableImageSection[] {
  const items = (profile.sections ?? [])
    .filter((item) => item.sectionType === sectionType)
    .sort((current, next) => (current.sortOrder ?? 0) - (next.sortOrder ?? 0))
    .map((item, index) => ({
      id: item.id ? `section-${item.id}` : `${sectionType}-${index}`,
      titleAr: optionalText(item.titleAr),
      titleEn: optionalText(item.titleEn),
      descriptionAr: optionalText(item.descriptionAr),
      descriptionEn: optionalText(item.descriptionEn),
      attributesText: optionalText(item.attributesText),
      focusPart: optionalText(item.focusPart)
    }))
  if (items.length) {
    return items
  }
  return [{
    id: `${sectionType}-empty`,
    ...emptySimpleSection(),
    focusPart: ''
  }]
}

export function backendProfileId(profile: ProductImageProfileDetailView | ProductImageProfileSummaryView) {
  if (profile.id) {
    return `profile-${profile.id}`
  }
  return `candidate-${optionalText(profile.pskuCode)}-${optionalText(profile.productIdentityKey)}`
}

export function mapBackendProfile(profile: ProductImageProfileDetailView): ProductImageProfile {
  const assets = (profile.assets ?? [])
    .map((asset, index): ProfileAsset => ({
      id: asset.id
        ? `asset-${asset.id}-${asset.usageId ? `usage-${asset.usageId}` : `legacy-${asset.imageRole || 'OTHER'}`}`
        : `asset-current-${index}-${optionalText(asset.imageUrl)}`,
      backendId: optionalNumber(asset.id),
      usageId: optionalNumber(asset.usageId),
      title: imageRoleLabel[asset.imageRole || 'OTHER'],
      imageUrl: optionalText(asset.imageUrl) || undefined,
      contentType: optionalText(asset.contentType) || undefined,
      sizeBytes: optionalNumber(asset.sizeBytes),
      widthPx: optionalNumber(asset.widthPx),
      heightPx: optionalNumber(asset.heightPx),
      horizontalPpi: optionalNumber(asset.horizontalPpi),
      verticalPpi: optionalNumber(asset.verticalPpi),
      colorSpace: optionalText(asset.colorSpace) || undefined,
      imageRole: asset.imageRole || 'OTHER',
      sortOrder: asset.sortOrder ?? index + 1,
      assetStatus: asset.assetStatus || 'ACTIVE',
      accent: accentAt(index),
      removable: Boolean(asset.removable && asset.id),
      processingNote: optionalText(asset.processingNote),
      processingStatus: asset.processingStatus || 'PENDING',
      processedAt: optionalText(asset.processedAt) || undefined,
      noonTechnicalCompliance: asset.noonTechnicalCompliance || undefined
    }))

  const mappedProfile: ProductImageProfile = {
    id: backendProfileId(profile),
    backendId: optionalNumber(profile.id),
    ownerUserId: optionalNumber(profile.ownerUserId),
    storeCode: optionalText(profile.storeCode) || undefined,
    productIdentityKey: optionalText(profile.productIdentityKey) || undefined,
    productMasterId: optionalNumber(profile.productMasterId),
    pskuCode: optionalText(profile.pskuCode),
    productTitle: optionalText(profile.productTitle),
    brand: optionalText(profile.brand),
    titleAr: resolveProductImageShortTitleAr(profile.titleAr, profile.productTitle),
    titleEn: resolveProductImageShortTitleEn(profile.titleEn, profile.productTitle),
    specSummary: optionalText(profile.specSummary),
    productFactText: optionalText(profile.productFactText),
    heroSellingPoints: profile.heroSellingPoints?.length ? profile.heroSellingPoints.map(optionalText).slice(0, 5) : [''],
    updatedAt: optionalText(profile.updatedAt),
    assetCount: assets.filter((asset) => asset.assetStatus === 'ACTIVE').length,
    coverImageUrl: assets.find((asset) => asset.imageUrl)?.imageUrl,
    detailLoaded: true,
    hasAdoptedSuite: (profile.suites ?? []).some((suite) => suite.suiteStatus === 'ADOPTED'),
    suiteCount: (profile.suites ?? []).filter((suite) => suite.suiteStatus !== 'DISCARDED').length,
    assets,
    sizeSection: backendSimpleSection(profile, 'SIZE'),
    coreFeatures: backendRepeatableSections(profile, 'CORE_FEATURE').slice(0, 2),
    materialDetails: backendRepeatableSections(profile, 'MATERIAL_DETAIL').slice(0, 3),
    usageScene: backendSimpleSection(profile, 'USAGE_SCENE'),
    packageList: backendSimpleSection(profile, 'PACKAGE_LIST'),
    suites: (profile.suites ?? []).map((suite, suiteIndex) => ({
      id: `suite-${suite.id}`,
      backendId: suite.id,
      suiteName: optionalText(suite.suiteName) || `AI 套图 ${suiteIndex + 1}`,
      skinId: optionalNumber(suite.skinId),
      skinName: optionalText(suite.skinName) || '-',
      generationTaskId: optionalText(suite.generationTaskId) || undefined,
      draftPackageJson: optionalText(suite.draftPackageJson) || undefined,
      draftPromptText: optionalText(suite.draftPromptText) || undefined,
      suiteStatus: suite.suiteStatus,
      reviewComment: optionalText(suite.reviewComment) || undefined,
      failureReason: optionalText(suite.failureReason) || undefined,
      publishedAt: optionalText(suite.publishedAt) || undefined,
      createdAt: optionalText(suite.updatedAt),
      adoptedAt: optionalText(suite.adoptedAt) || undefined,
      assets: buildReviewAssetPresentation((suite.assets ?? []).map((asset, assetIndex) => ({
        id: asset.id ? `suite-asset-${asset.id}` : `suite-asset-${suite.id}-${assetIndex}`,
        backendId: optionalNumber(asset.id),
        imageRole: asset.imageRole || 'MAIN',
        roleOrdinal: asset.roleOrdinal ?? 1,
        title: asset.imageRole || 'MAIN',
        imageUrl: optionalText(asset.imageUrl) || undefined,
        sortOrder: asset.sortOrder ?? assetIndex + 1,
        accent: accentAt(assetIndex)
      })))
    }))
  }
  const missingProfileFields = profileMissingFields(mappedProfile)
  const activeSuiteCount = mappedProfile.suites.filter(
    (suite) => suite.suiteStatus !== 'HISTORICAL' && suite.suiteStatus !== 'DISCARDED'
  ).length
  return {
    ...mappedProfile,
    activeSuiteCount,
    imageStatus: summarizeImageStatus(mappedProfile.suites.map((suite) => suite.suiteStatus)),
    missingProfileFields,
    profileReadinessStatus: missingProfileFields.length ? 'INCOMPLETE' : 'COMPLETE'
  }
}

export function mapBackendProfileSummary(profile: ProductImageProfileSummaryView): ProductImageProfile {
  const coverImageUrl = optionalText(profile.coverImageUrl)
  const coverAsset: ProfileAsset[] = coverImageUrl ? [{
    id: `summary-cover-${profile.id ?? profile.pskuCode ?? coverImageUrl}`,
    title: imageRoleLabel.MAIN,
    imageUrl: coverImageUrl,
    imageRole: 'MAIN',
    sortOrder: 0,
    assetStatus: 'ACTIVE',
    accent: accentAt(0),
    removable: false,
    processingNote: '',
    processingStatus: 'PENDING'
  }] : []

  return {
    id: backendProfileId(profile),
    backendId: optionalNumber(profile.id),
    ownerUserId: optionalNumber(profile.ownerUserId),
    storeCode: optionalText(profile.storeCode) || undefined,
    productIdentityKey: optionalText(profile.productIdentityKey) || undefined,
    productMasterId: optionalNumber(profile.productMasterId),
    pskuCode: optionalText(profile.pskuCode),
    productTitle: optionalText(profile.productTitle),
    brand: optionalText(profile.brand),
    titleAr: resolveProductImageShortTitleAr(profile.titleAr, profile.productTitle),
    titleEn: resolveProductImageShortTitleEn(profile.titleEn, profile.productTitle),
    specSummary: optionalText(profile.specSummary),
    productFactText: '',
    heroSellingPoints: [''],
    updatedAt: optionalText(profile.updatedAt),
    assetCount: optionalNumber(profile.assetCount) ?? coverAsset.length,
    coverImageUrl: coverImageUrl || undefined,
    detailLoaded: false,
    hasAdoptedSuite: Boolean(profile.hasAdoptedSuite),
    suiteCount: optionalNumber(profile.suiteCount) ?? 0,
    activeSuiteCount: optionalNumber(profile.activeSuiteCount) ?? 0,
    profileReadinessStatus: profile.profileReadinessStatus || 'INCOMPLETE',
    missingProfileFields: profile.missingProfileFields ?? [],
    imageStatus: profile.imageStatus
      || (profile.hasAdoptedSuite ? 'PENDING_CONFIRMATION' : (profile.suiteCount ? 'CANDIDATE' : 'NOT_REQUESTED')),
    assets: coverAsset,
    sizeSection: emptySimpleSection(),
    coreFeatures: [],
    materialDetails: [],
    usageScene: emptySimpleSection(),
    packageList: emptySimpleSection(),
    suites: []
  }
}

export function buildSaveRequest(profile: ProductImageProfile, ownerUserId: number, storeCode: string) {
  return {
    id: profile.backendId,
    ownerUserId,
    storeCode,
    pskuCode: profile.pskuCode,
    productIdentityKey: profile.productIdentityKey,
    productMasterId: profile.productMasterId,
    productTitle: profile.productTitle,
    brand: profile.brand,
    titleAr: profile.titleAr,
    titleEn: profile.titleEn,
    specSummary: profile.specSummary,
    productFactText: optionalText(profile.productFactText) || buildDefaultProductFactText(profile),
    heroSellingPoints: profile.heroSellingPoints.map(optionalText).filter(Boolean).slice(0, 5),
    sections: buildSectionCommands(profile)
  }
}

export function hasSimpleSectionContent(section: SimpleImageSection) {
  return Boolean(
    optionalText(section.titleAr)
    || optionalText(section.titleEn)
    || optionalText(section.descriptionAr)
    || optionalText(section.descriptionEn)
    || optionalText(section.attributesText)
  )
}

export function simpleSectionCommand(
  sectionType: ProductImageSectionType,
  section: SimpleImageSection,
  sortOrder: number
): ProductImageSectionCommand | undefined {
  if (!hasSimpleSectionContent(section)) {
    return undefined
  }
  return {
    sectionType,
    titleAr: optionalText(section.titleAr),
    titleEn: optionalText(section.titleEn),
    descriptionAr: optionalText(section.descriptionAr),
    descriptionEn: optionalText(section.descriptionEn),
    attributesText: optionalText(section.attributesText),
    sortOrder,
    enabled: true
  }
}

export function repeatableSectionCommands(
  sectionType: ProductImageSectionType,
  sections: RepeatableImageSection[],
  startSortOrder: number
) {
  return sections
    .map((section, index): ProductImageSectionCommand | undefined => {
      if (!hasSimpleSectionContent(section) && !optionalText(section.focusPart)) {
        return undefined
      }
      return {
        sectionType,
        titleAr: optionalText(section.titleAr),
        titleEn: optionalText(section.titleEn),
        descriptionAr: optionalText(section.descriptionAr),
        descriptionEn: optionalText(section.descriptionEn),
        attributesText: optionalText(section.attributesText),
        focusPart: optionalText(section.focusPart),
        sortOrder: startSortOrder + index,
        enabled: true
      }
    })
    .filter((section): section is ProductImageSectionCommand => Boolean(section))
}

export function buildSectionCommands(profile: ProductImageProfile): ProductImageSectionCommand[] {
  return [
    simpleSectionCommand('SIZE', profile.sizeSection, 10),
    ...repeatableSectionCommands('CORE_FEATURE', profile.coreFeatures, 20),
    ...repeatableSectionCommands('MATERIAL_DETAIL', profile.materialDetails, 40),
    simpleSectionCommand('USAGE_SCENE', profile.usageScene, 60),
    simpleSectionCommand('PACKAGE_LIST', profile.packageList, 70)
  ].filter((section): section is ProductImageSectionCommand => Boolean(section))
}
