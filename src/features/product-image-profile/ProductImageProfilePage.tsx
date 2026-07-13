import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileImageOutlined,
  HistoryOutlined,
  LinkOutlined,
  PictureOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  UploadOutlined
} from '@ant-design/icons'
import { App, Button, Checkbox, Empty, Input, Modal, Popconfirm, Select, Space, Tabs, Tag, Tooltip, Typography, Upload } from 'antd'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { AuthSession } from '../auth/session'
import {
  adoptProductImageSuite,
  batchRemoveProductImageProfileAssets,
  createProductImageSuiteDraft,
  deleteProductImageSuite,
  deleteProductImageSuiteAsset,
  extractProductImageFacts,
  fetchProductImageAssetMetadata,
  fetchProductImageAssetPreviewUrl,
  fetchProductImageProfileDetail,
  fetchProductImageProfileSummaries,
  importProductImageProfileAssetUrls,
  moveProductImageSuiteAsset,
  saveProductImageProfile,
  updateProductImageProfileAssetRole,
  uploadProductImageProfileAsset,
  type ProductImageAssetRoleUpdateItem,
  type ProductImageAssetRemoveItem,
  type ProductImageAiExtractionSuggestionView,
  type ProductImageProfileDetailView,
  type ProductImageProfileSummaryView,
  type ProductImageRole as ApiImageRole,
  type ProductImageSectionCommand,
  type ProductImageSectionType,
  type ProductImageSuiteAssetRole as ApiSuiteAssetRole,
  type ProductImageSuiteStatus as ApiSuiteStatus
} from './api'
import { normalizeNoonImageUrl } from '../product-management/utils'
import { createSourceCollection, loadSourceCollections } from '../source-collection/api'
import type { ProductSelectionSourceCollection } from '../source-collection/types'
import {
  buildDefaultProductFactText,
  buildProductImageAiPromptSections,
  buildProductImageAiCopyText
} from './aiCopyText'
import type { ProductImageAiPromptSection } from './aiCopyText'
import { groupProductImageAssetsByRole } from './assetRoleSections'
import { productProfileVirtualWindow } from './virtualProfileList'
import './ProductImageProfilePage.css'

const { Text } = Typography
const { TextArea } = Input

type ProductImageProfilePageProps = {
  session: AuthSession
  activeOwnerId?: number
}

type ImageRole = ApiImageRole
type SuiteStatus = ApiSuiteStatus
type SuiteAssetRole = ApiSuiteAssetRole
type ProductImageProfileTabKey = 'assets' | 'elements' | 'suites'

type ProfileAsset = {
  id: string
  backendId?: number
  title: string
  imageUrl?: string
  contentType?: string
  sizeBytes?: number
  widthPx?: number
  heightPx?: number
  imageRole: ImageRole
  sortOrder: number
  assetStatus: 'ACTIVE' | 'REMOVED'
  accent: string
  removable?: boolean
}

type SimpleImageSection = {
  titleAr: string
  titleEn: string
  descriptionAr: string
  descriptionEn: string
  attributesText?: string
}

type RepeatableImageSection = SimpleImageSection & {
  id: string
  focusPart?: string
}

type ProductImageSuiteAsset = {
  id: string
  backendId?: number
  imageRole: SuiteAssetRole
  title: string
  imageUrl?: string
  sortOrder: number
  accent: string
}

type ProductImageSuite = {
  id: string
  backendId?: number
  suiteName: string
  skinId?: number
  skinName: string
  generationTaskId?: string
  draftPackageJson?: string
  draftPromptText?: string
  suiteStatus: SuiteStatus
  createdAt: string
  adoptedAt?: string
  assets: ProductImageSuiteAsset[]
}

type ProductImageProfile = {
  id: string
  backendId?: number
  ownerUserId?: number
  storeCode?: string
  productIdentityKey?: string
  productMasterId?: number
  productVariantId?: number
  pskuCode: string
  productTitle: string
  brand: string
  titleAr: string
  titleEn: string
  specSummary: string
  productFactText: string
  heroSellingPoints: string[]
  updatedAt: string
  assetCount?: number
  coverImageUrl?: string
  detailLoaded?: boolean
  hasAdoptedSuite?: boolean
  suiteCount?: number
  assets: ProfileAsset[]
  sizeSection: SimpleImageSection
  coreFeatures: RepeatableImageSection[]
  materialDetails: RepeatableImageSection[]
  usageScene: SimpleImageSection
  packageList: SimpleImageSection
  suites: ProductImageSuite[]
}

type ImageRoleOption = { label: string; value: ImageRole; disabled?: boolean }

const imageRoleOptions: ImageRoleOption[] = [
  { label: '主图', value: 'MAIN' },
  { label: '尺寸图', value: 'SIZE' },
  { label: '细节', value: 'DETAIL' },
  { label: '场景', value: 'SCENE' },
  { label: '包装', value: 'PACKAGE' }
]

const imageRoleLabel: Record<ImageRole, string> = {
  MAIN: '主图',
  SIZE: '尺寸图',
  DETAIL: '细节',
  SCENE: '场景',
  PACKAGE: '包装',
  OTHER: '未分类'
}

function imageRoleSelectOptions(value: ImageRole): ImageRoleOption[] {
  return value === 'OTHER'
    ? [{ label: imageRoleLabel.OTHER, value: 'OTHER' as ImageRole, disabled: true }, ...imageRoleOptions]
    : imageRoleOptions
}

const suiteStatusMeta: Record<SuiteStatus, { label: string; color: string }> = {
  DRAFT: { label: '候选', color: 'blue' },
  ADOPTED: { label: '当前采用', color: 'green' },
  HISTORICAL: { label: '历史采用', color: 'default' },
  DISCARDED: { label: '废弃', color: 'red' }
}

const suiteAssetRoleLabel: Record<SuiteAssetRole, string> = {
  MAIN: '头图',
  SIZE: '尺寸',
  CORE_FEATURE: '卖点',
  MATERIAL_DETAIL: '细节',
  USAGE_SCENE: '场景',
  PACKAGE_LIST: '包装'
}

const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
const maxImageBytes = 8 * 1024 * 1024
const fallbackAccentColors = ['#f6d44b', '#0f766e', '#7c3aed', '#f97316', '#2563eb', '#14b8a6']

const mockProfiles: ProductImageProfile[] = [
  {
    id: 'profile-papersay-whiteboard',
    pskuCode: 'PAPERSAYSB024',
    productTitle: '8色磁性白板笔套装',
    brand: 'PAPERSAY',
    titleAr: 'أقلام سبورة مغناطيسية',
    titleEn: 'Magnetic Whiteboard Markers',
    specSummary: '8 Colors / Magnetic Cap / Dry Erase',
    productFactText: '',
    heroSellingPoints: ['8 vivid colors', 'Magnetic cap', 'Smooth dry erase'],
    updatedAt: '2026-06-12 16:20',
    assets: [
      { id: 'base-1', title: '当前主图', imageRole: 'MAIN', sortOrder: 1, assetStatus: 'ACTIVE', accent: '#f6d44b' },
      { id: 'base-2', title: '颜色展示', imageRole: 'SIZE', sortOrder: 2, assetStatus: 'ACTIVE', accent: '#0f766e' },
      { id: 'base-3', title: '磁吸笔帽', imageRole: 'DETAIL', sortOrder: 3, assetStatus: 'ACTIVE', accent: '#7c3aed' },
      { id: 'base-4', title: '包装清单', imageRole: 'PACKAGE', sortOrder: 4, assetStatus: 'ACTIVE', accent: '#f97316' }
    ],
    sizeSection: {
      titleAr: 'مقاس القلم',
      titleEn: 'Marker Size',
      descriptionAr: 'مناسب للسبورات البيضاء في المكتب والمدرسة',
      descriptionEn: 'Standard whiteboard marker size for office, school, and home use.',
      attributesText: 'Length 14 cm / Tip 2 mm / 8 pcs'
    },
    coreFeatures: [
      {
        id: 'feature-1',
        titleAr: 'غطاء مغناطيسي',
        titleEn: 'Magnetic Cap',
        descriptionAr: 'يثبت على السبورة أو الأسطح المعدنية',
        descriptionEn: 'Attach the marker to whiteboards or metal surfaces after use.'
      },
      {
        id: 'feature-2',
        titleAr: 'مسح جاف وسهل',
        titleEn: 'Easy Dry Erase',
        descriptionAr: 'كتابة واضحة وتمسح بسهولة',
        descriptionEn: 'Clean writing that wipes off smoothly without heavy residue.'
      }
    ],
    materialDetails: [
      {
        id: 'detail-1',
        titleAr: 'رأس كتابة ناعم',
        titleEn: 'Smooth Bullet Tip',
        descriptionAr: 'رأس ثابت للكتابة اليومية',
        descriptionEn: 'Stable tip for daily notes, reminders, and classroom writing.',
        focusPart: 'Marker tip'
      },
      {
        id: 'detail-2',
        titleAr: 'حبر واضح',
        titleEn: 'Bright Ink',
        descriptionAr: 'ألوان متعددة وسهلة القراءة',
        descriptionEn: 'Readable colors for planning boards and teaching scenes.',
        focusPart: 'Ink color'
      }
    ],
    usageScene: {
      titleAr: 'للمكتب والمدرسة',
      titleEn: 'Office, School, Home',
      descriptionAr: 'مناسب للاجتماعات والدراسة والتخطيط اليومي',
      descriptionEn: 'Use for meetings, classrooms, home planning, and quick reminders.'
    },
    packageList: {
      titleAr: 'تتضمن العبوة',
      titleEn: 'What is included',
      descriptionAr: '8 أقلام بألوان مختلفة',
      descriptionEn: '8 magnetic whiteboard markers in assorted colors.',
      attributesText: 'Black / Blue / Red / Brown / Purple / Green / Yellow / Orange'
    },
    suites: [
      {
        id: 'suite-1',
        suiteName: '黄框品牌套图 V1',
        skinName: '黄框品牌型',
        suiteStatus: 'ADOPTED',
        createdAt: '2026-06-12 15:20',
        adoptedAt: '2026-06-12 15:42',
        assets: buildSuiteAssets(['#f6d44b', '#0f766e', '#38bdf8', '#a78bfa', '#fb923c', '#64748b'])
      },
      {
        id: 'suite-2',
        suiteName: '极简白底候选 A',
        skinName: '极简白底型',
        suiteStatus: 'DRAFT',
        createdAt: '2026-06-12 16:05',
        assets: buildSuiteAssets(['#e2e8f0', '#0f766e', '#22c55e', '#f59e0b', '#06b6d4', '#94a3b8'])
      }
    ]
  },
  {
    id: 'profile-nfc-card',
    pskuCode: 'SGGRB076',
    productTitle: 'NFC 白卡',
    brand: 'SGGR',
    titleAr: '',
    titleEn: 'Blank NFC Cards',
    specSummary: 'PVC / 13.56MHz / 100 pcs',
    productFactText: '',
    heroSellingPoints: ['Writable NFC chip', 'Blank printable surface'],
    updatedAt: '2026-06-12 10:12',
    assets: [
      { id: 'base-5', title: '白卡主图', imageRole: 'MAIN', sortOrder: 1, assetStatus: 'ACTIVE', accent: '#60a5fa' },
      { id: 'base-6', title: '厚度示意', imageRole: 'SIZE', sortOrder: 2, assetStatus: 'ACTIVE', accent: '#14b8a6' }
    ],
    sizeSection: {
      titleAr: '',
      titleEn: 'Card Size',
      descriptionAr: '',
      descriptionEn: 'Standard card size for access control, tags, and custom printing.',
      attributesText: '85.6 x 54 mm'
    },
    coreFeatures: [
      {
        id: 'feature-3',
        titleAr: '',
        titleEn: 'Writable NFC',
        descriptionAr: '',
        descriptionEn: 'Suitable for NFC tag writing and custom business use.'
      }
    ],
    materialDetails: [
      {
        id: 'detail-3',
        titleAr: '',
        titleEn: 'Blank PVC Surface',
        descriptionAr: '',
        descriptionEn: 'Clean blank card surface for labeling and printing.',
        focusPart: 'Card surface'
      }
    ],
    usageScene: {
      titleAr: '',
      titleEn: 'Access, Events, Labeling',
      descriptionAr: '',
      descriptionEn: 'Use for access control, event cards, NFC labels, and samples.'
    },
    packageList: {
      titleAr: '',
      titleEn: 'Pack Contents',
      descriptionAr: '',
      descriptionEn: '100 blank NFC cards.',
      attributesText: '100 pcs / White'
    },
    suites: []
  }
]

function buildSuiteAssets(colors: string[]): ProductImageSuiteAsset[] {
  const roles: SuiteAssetRole[] = ['MAIN', 'SIZE', 'CORE_FEATURE', 'MATERIAL_DETAIL', 'USAGE_SCENE', 'PACKAGE_LIST']
  return roles.map((role, index) => ({
    id: `${role}-${index}`,
    imageRole: role,
    title: suiteAssetRoleLabel[role],
    sortOrder: index + 1,
    accent: colors[index] || '#94a3b8'
  }))
}

function optionalText(value?: string | null) {
  return value?.trim() || ''
}

function optionalNumber(value?: number | null) {
  return typeof value === 'number' ? value : undefined
}

function currentStoreCode(session: AuthSession) {
  return session.currentStore?.storeCode || ''
}

function currentStoreName(session: AuthSession) {
  return session.currentStore?.projectName
    || session.currentStore?.orgName
    || session.currentStore?.storeCode
    || '当前店铺'
}

function currentOperatorName(session: AuthSession) {
  return session.realName || session.accountNo || String(session.userId)
}

function splitImportUrls(value: string) {
  const seen = new Set<string>()
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter((item) => {
      if (!item || seen.has(item)) {
        return false
      }
      seen.add(item)
      return true
    })
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function inferMarketplacePlatform(rawUrl: string): 'Amazon' | 'Noon' | undefined {
  try {
    const host = new URL(rawUrl.trim()).hostname.toLowerCase()
    if (host.includes('amazon.') || host.includes('amzn.')) {
      return 'Amazon'
    }
    if (host.includes('noon.')) {
      return 'Noon'
    }
    return undefined
  } catch {
    return undefined
  }
}

function accentAt(index: number) {
  return fallbackAccentColors[index % fallbackAccentColors.length]
}

function emptySimpleSection(): SimpleImageSection {
  return {
    titleAr: '',
    titleEn: '',
    descriptionAr: '',
    descriptionEn: '',
    attributesText: ''
  }
}

function backendSimpleSection(profile: ProductImageProfileDetailView, sectionType: ProductImageSectionType): SimpleImageSection {
  const section = profile.sections?.find((item) => item.sectionType === sectionType)
  return {
    titleAr: optionalText(section?.titleAr),
    titleEn: optionalText(section?.titleEn),
    descriptionAr: optionalText(section?.descriptionAr),
    descriptionEn: optionalText(section?.descriptionEn),
    attributesText: optionalText(section?.attributesText)
  }
}

function backendRepeatableSections(profile: ProductImageProfileDetailView, sectionType: ProductImageSectionType): RepeatableImageSection[] {
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

function backendProfileId(profile: ProductImageProfileDetailView | ProductImageProfileSummaryView) {
  if (profile.id) {
    return `profile-${profile.id}`
  }
  return `candidate-${optionalText(profile.pskuCode)}-${optionalText(profile.productIdentityKey) || optionalText(profile.productVariantId?.toString())}`
}

function mapBackendProfile(profile: ProductImageProfileDetailView): ProductImageProfile {
  const assets = (profile.assets ?? [])
    .map((asset, index): ProfileAsset => ({
      id: asset.id ? `asset-${asset.id}` : `asset-current-${index}-${optionalText(asset.imageUrl)}`,
      backendId: optionalNumber(asset.id),
      title: imageRoleLabel[asset.imageRole || 'OTHER'],
      imageUrl: optionalText(asset.imageUrl) || undefined,
      contentType: optionalText(asset.contentType) || undefined,
      sizeBytes: optionalNumber(asset.sizeBytes),
      widthPx: optionalNumber(asset.widthPx),
      heightPx: optionalNumber(asset.heightPx),
      imageRole: asset.imageRole || 'OTHER',
      sortOrder: asset.sortOrder ?? index + 1,
      assetStatus: asset.assetStatus || 'ACTIVE',
      accent: accentAt(index),
      removable: Boolean(asset.removable && asset.id)
    }))

  return {
    id: backendProfileId(profile),
    backendId: optionalNumber(profile.id),
    ownerUserId: optionalNumber(profile.ownerUserId),
    storeCode: optionalText(profile.storeCode) || undefined,
    productIdentityKey: optionalText(profile.productIdentityKey) || undefined,
    productMasterId: optionalNumber(profile.productMasterId),
    productVariantId: optionalNumber(profile.productVariantId),
    pskuCode: optionalText(profile.pskuCode),
    productTitle: optionalText(profile.productTitle),
    brand: optionalText(profile.brand),
    titleAr: optionalText(profile.titleAr),
    titleEn: optionalText(profile.titleEn),
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
      createdAt: optionalText(suite.updatedAt),
      adoptedAt: optionalText(suite.adoptedAt) || undefined,
      assets: (suite.assets ?? []).map((asset, assetIndex) => ({
        id: asset.id ? `suite-asset-${asset.id}` : `suite-asset-${suite.id}-${assetIndex}`,
        backendId: optionalNumber(asset.id),
        imageRole: asset.imageRole || 'MAIN',
        title: suiteAssetRoleLabel[asset.imageRole || 'MAIN'],
        imageUrl: optionalText(asset.imageUrl) || undefined,
        sortOrder: asset.sortOrder ?? assetIndex + 1,
        accent: accentAt(assetIndex)
      }))
    }))
  }
}

function mapBackendProfileSummary(profile: ProductImageProfileSummaryView): ProductImageProfile {
  const coverImageUrl = optionalText(profile.coverImageUrl)
  const coverAsset: ProfileAsset[] = coverImageUrl ? [{
    id: `summary-cover-${profile.id ?? profile.pskuCode ?? coverImageUrl}`,
    title: imageRoleLabel.MAIN,
    imageUrl: coverImageUrl,
    imageRole: 'MAIN',
    sortOrder: 0,
    assetStatus: 'ACTIVE',
    accent: accentAt(0),
    removable: false
  }] : []

  return {
    id: backendProfileId(profile),
    backendId: optionalNumber(profile.id),
    ownerUserId: optionalNumber(profile.ownerUserId),
    storeCode: optionalText(profile.storeCode) || undefined,
    productIdentityKey: optionalText(profile.productIdentityKey) || undefined,
    productMasterId: optionalNumber(profile.productMasterId),
    productVariantId: optionalNumber(profile.productVariantId),
    pskuCode: optionalText(profile.pskuCode),
    productTitle: optionalText(profile.productTitle),
    brand: optionalText(profile.brand),
    titleAr: optionalText(profile.titleAr),
    titleEn: optionalText(profile.titleEn),
    specSummary: optionalText(profile.specSummary),
    productFactText: '',
    heroSellingPoints: [''],
    updatedAt: optionalText(profile.updatedAt),
    assetCount: optionalNumber(profile.assetCount) ?? coverAsset.length,
    coverImageUrl: coverImageUrl || undefined,
    detailLoaded: false,
    hasAdoptedSuite: Boolean(profile.hasAdoptedSuite),
    suiteCount: optionalNumber(profile.suiteCount) ?? 0,
    assets: coverAsset,
    sizeSection: emptySimpleSection(),
    coreFeatures: [],
    materialDetails: [],
    usageScene: emptySimpleSection(),
    packageList: emptySimpleSection(),
    suites: []
  }
}

function buildSaveRequest(profile: ProductImageProfile, ownerUserId: number, storeCode: string) {
  return {
    id: profile.backendId,
    ownerUserId,
    storeCode,
    pskuCode: profile.pskuCode,
    productIdentityKey: profile.productIdentityKey,
    productMasterId: profile.productMasterId,
    productVariantId: profile.productVariantId,
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

function hasSimpleSectionContent(section: SimpleImageSection) {
  return Boolean(
    optionalText(section.titleAr)
    || optionalText(section.titleEn)
    || optionalText(section.descriptionAr)
    || optionalText(section.descriptionEn)
    || optionalText(section.attributesText)
  )
}

function simpleSectionCommand(
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

function repeatableSectionCommands(
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

function buildSectionCommands(profile: ProductImageProfile): ProductImageSectionCommand[] {
  return [
    simpleSectionCommand('SIZE', profile.sizeSection, 10),
    ...repeatableSectionCommands('CORE_FEATURE', profile.coreFeatures, 20),
    ...repeatableSectionCommands('MATERIAL_DETAIL', profile.materialDetails, 40),
    simpleSectionCommand('USAGE_SCENE', profile.usageScene, 60),
    simpleSectionCommand('PACKAGE_LIST', profile.packageList, 70)
  ].filter((section): section is ProductImageSectionCommand => Boolean(section))
}

function applyExtractionSuggestion(
  profile: ProductImageProfile,
  suggestion: ProductImageAiExtractionSuggestionView
): ProductImageProfile {
  const heroSellingPoints = (suggestion.heroSellingPoints ?? []).map(optionalText).filter(Boolean).slice(0, 5)
  return {
    ...profile,
    specSummary: optionalText(suggestion.specSummary) || profile.specSummary,
    titleEn: optionalText(suggestion.titleEn) || profile.titleEn,
    titleAr: optionalText(suggestion.titleAr) || profile.titleAr,
    heroSellingPoints: heroSellingPoints.length ? heroSellingPoints : profile.heroSellingPoints,
    sizeSection: {
      ...profile.sizeSection,
      attributesText: optionalText(suggestion.sizeText) || profile.sizeSection.attributesText
    },
    packageList: {
      ...profile.packageList,
      attributesText: optionalText(suggestion.packageText) || profile.packageList.attributesText
    }
  }
}

function activeAssets(profile: ProductImageProfile) {
  return profile.assets
    .filter((asset) => asset.assetStatus === 'ACTIVE')
    .sort((current, next) => current.sortOrder - next.sortOrder)
}

function isSelectableAsset(asset: ProfileAsset) {
  return Boolean(asset.backendId || asset.imageUrl)
}

function assetRemoveItem(asset: ProfileAsset): ProductImageAssetRemoveItem {
  return {
    assetId: asset.backendId,
    imageUrl: asset.imageUrl
  }
}

function assetRoleUpdateItem(asset: ProfileAsset, imageRole: ImageRole): ProductImageAssetRoleUpdateItem {
  return {
    assetId: asset.backendId,
    imageUrl: asset.imageUrl,
    imageRole
  }
}

function profileCoverAsset(profile: ProductImageProfile) {
  const assets = activeAssets(profile)
  return assets.find((asset) => asset.imageUrl) || assets[0]
}

function profileCompleteness(profile: ProductImageProfile) {
  const hasHero = Boolean(profile.brand.trim() && (profile.titleAr.trim() || profile.titleEn.trim()) && profile.specSummary.trim())
  const hasAssets = activeAssets(profile).length > 0
  const hasFactText = Boolean(profile.productFactText.trim()) || Boolean(buildDefaultProductFactText(profile).trim())
  if (hasHero && hasAssets && hasFactText) return { label: '资料完整', color: 'success' as const }
  if (hasAssets || hasHero) return { label: '待补充', color: 'warning' as const }
  return { label: '未维护', color: 'default' as const }
}

function profileDisplayTitle(profile: ProductImageProfile) {
  return profile.productTitle.trim()
    || profile.titleEn.trim()
    || profile.brand.trim()
    || profile.pskuCode
}

function isManagedAssetUrl(imageUrl?: string) {
  return Boolean(imageUrl?.startsWith('/api/product-images/assets/'))
}

function formatImageSize(sizeBytes?: number) {
  if (typeof sizeBytes !== 'number') return '-'
  if (sizeBytes < 1024) return `${sizeBytes} B`
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`
  return `${(sizeBytes / 1024 / 1024).toFixed(2)} MB`
}

function isCompleteImageMetadata(detail: { height?: number; sizeBytes?: number; width?: number }) {
  return Boolean(detail.width && detail.height && typeof detail.sizeBytes === 'number')
}

function metadataFallbackText(loading: boolean) {
  return loading ? '读取中' : '待补全'
}

function useSystemImagePreviewUrl(imageUrl?: string) {
  const [previewUrl, setPreviewUrl] = useState(imageUrl)

  useEffect(() => {
    if (!imageUrl) {
      setPreviewUrl(undefined)
      return undefined
    }
    if (!imageUrl.startsWith('/api/product-images/assets/')) {
      setPreviewUrl(normalizeNoonImageUrl(imageUrl))
      return undefined
    }

    let objectUrl: string | undefined
    const controller = new AbortController()
    setPreviewUrl(undefined)
    fetchProductImageAssetPreviewUrl(imageUrl, controller.signal)
      .then((nextUrl) => {
        objectUrl = nextUrl
        setPreviewUrl(nextUrl)
      })
      .catch(() => {
        setPreviewUrl(imageUrl)
      })

    return () => {
      controller.abort()
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [imageUrl])

  return previewUrl
}

function SystemImage({
  src,
  alt,
  fallback,
  fetchPriority = 'auto'
}: {
  alt: string
  fallback?: ReactNode
  fetchPriority?: 'auto' | 'high' | 'low'
  src?: string
}) {
  const previewUrl = useSystemImagePreviewUrl(src)
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setFailed(false)
    setLoaded(false)
  }, [previewUrl])

  const fallbackNode = fallback ?? <PictureOutlined />
  if (!previewUrl || failed) {
    return fallbackNode
  }
  return (
    <>
      {loaded ? null : fallbackNode}
      <img
        src={previewUrl}
        alt={alt}
        decoding="async"
        fetchPriority={fetchPriority}
        loading="lazy"
        style={{ visibility: loaded ? undefined : 'hidden' }}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </>
  )
}

function useNearViewportEnabled(rootMargin = '280px') {
  const [node, setNode] = useState<HTMLElement | null>(null)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (enabled || !node) {
      return undefined
    }
    if (typeof IntersectionObserver === 'undefined') {
      setEnabled(true)
      return undefined
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting || entry.intersectionRatio > 0)) {
        setEnabled(true)
        observer.disconnect()
      }
    }, { rootMargin })
    observer.observe(node)
    return () => observer.disconnect()
  }, [enabled, node, rootMargin])

  return { enabled, ref: setNode }
}

type AssetMetadataContext = {
  ownerUserId: number
  productMasterId?: number
  storeCode: string
}

function useAssetPreviewDetail(asset: ProfileAsset | null, metadataContext: AssetMetadataContext) {
  const [detail, setDetail] = useState<{
    contentType?: string
    error?: string
    height?: number
    loading: boolean
    previewUrl?: string
    sizeBytes?: number
    width?: number
  }>({ loading: false })

  useEffect(() => {
    if (!asset?.imageUrl) {
      setDetail({ loading: false })
      return undefined
    }

    let cancelled = false
    let objectUrl: string | undefined
    const controller = new AbortController()
    const storedDetail = {
      contentType: asset.contentType,
      height: asset.heightPx,
      sizeBytes: asset.sizeBytes,
      width: asset.widthPx
    }

    if (isManagedAssetUrl(asset.imageUrl)) {
      setDetail({ ...storedDetail, loading: false })
      fetchProductImageAssetPreviewUrl(asset.imageUrl, controller.signal)
        .then((previewUrl) => {
          if (cancelled) return
          objectUrl = previewUrl
          setDetail({
            ...storedDetail,
            loading: false,
            previewUrl
          })
        })
        .catch((error) => {
          if (cancelled || controller.signal.aborted) return
          setDetail({
            ...storedDetail,
            error: error instanceof Error ? error.message : '图片信息读取失败',
            loading: false
          })
        })
    } else {
      const originalImageUrl = asset.imageUrl
      const productMasterId = metadataContext.productMasterId
      if (isCompleteImageMetadata(storedDetail) || !productMasterId) {
        setDetail({
          ...storedDetail,
          loading: false,
          previewUrl: originalImageUrl
        })
        return () => {
          cancelled = true
          controller.abort()
        }
      }
      setDetail({
        ...storedDetail,
        loading: true,
        previewUrl: originalImageUrl
      })
      fetchProductImageAssetMetadata({
        imageUrl: originalImageUrl,
        ownerUserId: metadataContext.ownerUserId,
        productMasterId,
        storeCode: metadataContext.storeCode
      })
        .then((metadata) => {
          if (cancelled) return
          setDetail({
            contentType: optionalText(metadata.contentType) || storedDetail.contentType,
            height: optionalNumber(metadata.heightPx) || storedDetail.height,
            loading: false,
            previewUrl: originalImageUrl,
            sizeBytes: optionalNumber(metadata.sizeBytes) ?? storedDetail.sizeBytes,
            width: optionalNumber(metadata.widthPx) || storedDetail.width
          })
        })
        .catch((error) => {
          if (cancelled || controller.signal.aborted) return
          setDetail({
            ...storedDetail,
            error: error instanceof Error ? error.message : '图片信息读取失败',
            loading: false,
            previewUrl: originalImageUrl
          })
        })
    }

    return () => {
      cancelled = true
      controller.abort()
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [
    asset?.contentType,
    asset?.heightPx,
    asset?.id,
    asset?.imageUrl,
    asset?.sizeBytes,
    asset?.widthPx,
    metadataContext.ownerUserId,
    metadataContext.productMasterId,
    metadataContext.storeCode
  ])

  return detail
}

function AssetDetailModal({
  asset,
  metadataContext,
  onClose
}: {
  asset: ProfileAsset | null
  metadataContext: AssetMetadataContext
  onClose: () => void
}) {
  const detail = useAssetPreviewDetail(asset, metadataContext)
  const dimensionText = detail.width && detail.height ? `${detail.width} x ${detail.height} px` : metadataFallbackText(detail.loading)
  const sizeText = typeof detail.sizeBytes === 'number' ? formatImageSize(detail.sizeBytes) : metadataFallbackText(detail.loading)
  const contentTypeText = detail.contentType || metadataFallbackText(detail.loading)

  return (
    <Modal
      className="product-image-profile-asset-detail-modal"
      footer={null}
      onCancel={onClose}
      open={Boolean(asset)}
      title="图片详情"
      width={880}
    >
      <div className="product-image-profile-asset-detail">
        <div className="product-image-profile-asset-detail-preview">
          {detail.previewUrl ? (
            <img src={detail.previewUrl} alt="图片详情" />
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={detail.error || '图片读取中'} />
          )}
        </div>
        <dl className="product-image-profile-asset-detail-info">
          <div>
            <dt>图片类型</dt>
            <dd>{asset ? imageRoleLabel[asset.imageRole] : '-'}</dd>
          </div>
          <div>
            <dt>图片尺寸</dt>
            <dd>{dimensionText}</dd>
          </div>
          <div>
            <dt>文件大小</dt>
            <dd>{sizeText}</dd>
          </div>
          <div>
            <dt>文件类型</dt>
            <dd>{contentTypeText}</dd>
          </div>
        </dl>
      </div>
    </Modal>
  )
}

function AssetThumb({ asset, onPreview }: { asset: ProfileAsset; onPreview: (asset: ProfileAsset) => void }) {
  const fallback = (
    <>
      <PictureOutlined />
      <span>{imageRoleLabel[asset.imageRole]}</span>
    </>
  )
  return (
    <button
      className={`product-image-profile-asset-thumb${asset.imageUrl ? ' has-image' : ' is-empty'}`}
      disabled={!asset.imageUrl}
      onClick={() => onPreview(asset)}
      style={{ '--asset-accent': asset.accent } as CSSProperties}
      type="button"
    >
      {asset.imageUrl ? (
        <SystemImage src={asset.imageUrl} alt={asset.title} fallback={fallback} />
      ) : (
        fallback
      )}
      {asset.imageUrl ? <span className="product-image-profile-asset-thumb-action"><EyeOutlined /> 查看</span> : null}
    </button>
  )
}

function ProductListThumb({ profile }: { profile: ProductImageProfile }) {
  const asset = profileCoverAsset(profile)
  const { enabled, ref } = useNearViewportEnabled()
  return (
    <span className="product-image-profile-product-thumb" ref={ref}>
      {asset?.imageUrl && enabled ? (
        <SystemImage src={asset.imageUrl} alt={profile.pskuCode} fetchPriority="low" />
      ) : (
        <PictureOutlined />
      )}
    </span>
  )
}

function SuitePreviewModal({ asset, onClose }: { asset: ProductImageSuiteAsset | null; onClose: () => void }) {
  const previewUrl = useSystemImagePreviewUrl(asset?.imageUrl)

  return (
    <Modal
      className="product-image-profile-suite-preview-modal"
      footer={null}
      onCancel={onClose}
      open={Boolean(asset)}
      title={asset?.title || 'AI 套图'}
      width="min(920px, calc(100vw - 32px))"
    >
      <div className="product-image-profile-suite-preview">
        {previewUrl ? (
          <img src={previewUrl} alt={asset?.title || 'AI 套图'} />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="图片读取中" />
        )}
      </div>
    </Modal>
  )
}

function SuiteThumb({
  asset,
  canMoveDown,
  canMoveUp,
  moving,
  onMove,
  onMoveToSuite,
  onPreview,
  onRemove,
  otherSuites
}: {
  asset: ProductImageSuiteAsset
  canMoveDown: boolean
  canMoveUp: boolean
  moving?: boolean
  onMove: (targetIndex: number) => void
  onMoveToSuite: (targetSuiteId: number) => void
  onPreview: (asset: ProductImageSuiteAsset) => void
  onRemove: () => void
  otherSuites: ProductImageSuite[]
}) {
  return (
    <div
      className={`product-image-profile-suite-thumb${asset.imageUrl ? ' has-image' : ''}`}
      style={{ '--asset-accent': asset.accent } as CSSProperties}
    >
      <button
        className="product-image-profile-suite-thumb-preview"
        disabled={!asset.imageUrl || moving}
        onClick={() => onPreview(asset)}
        type="button"
      >
        {asset.imageUrl ? <SystemImage src={asset.imageUrl} alt={asset.title} fallback={<FileImageOutlined />} /> : null}
        <span><EyeOutlined /> {asset.title}</span>
      </button>
      <div className="product-image-profile-suite-thumb-actions">
        <Tooltip title="上移">
          <Button
            disabled={!canMoveUp || moving}
            icon={<ArrowUpOutlined />}
            size="small"
            type="text"
            onClick={() => onMove(-1)}
          />
        </Tooltip>
        <Tooltip title="下移">
          <Button
            disabled={!canMoveDown || moving}
            icon={<ArrowDownOutlined />}
            size="small"
            type="text"
            onClick={() => onMove(1)}
          />
        </Tooltip>
        <Select
          className="product-image-profile-suite-thumb-move-select"
          disabled={!otherSuites.length || moving}
          options={otherSuites.map((suite) => ({ label: suite.suiteName, value: suite.backendId ?? 0 })).filter((option) => option.value)}
          placeholder="移动到"
          size="small"
          value={undefined}
          onChange={onMoveToSuite}
        />
        <Popconfirm
          cancelText="取消"
          okText="删除"
          okButtonProps={{ danger: true }}
          title="确定删除这张套图图片吗？"
          onConfirm={onRemove}
        >
          <Button danger disabled={moving} icon={<DeleteOutlined />} size="small" type="text" />
        </Popconfirm>
      </div>
    </div>
  )
}

function AiPromptSectionList({
  compact = false,
  onCopy,
  sections
}: {
  compact?: boolean
  onCopy: (section: ProductImageAiPromptSection) => void
  sections: ProductImageAiPromptSection[]
}) {
  return (
    <div className={`product-image-profile-ai-prompt-sections${compact ? ' is-compact' : ''}`}>
      {sections.map((section) => (
        <section className="product-image-profile-ai-prompt-section" key={section.key}>
          <div className="product-image-profile-ai-prompt-section-head">
            <div>
              <strong>{section.title}</strong>
              <Text type="secondary">{section.subtitle}</Text>
            </div>
            <Button icon={<CopyOutlined />} size="small" type="text" onClick={() => onCopy(section)}>
              复制
            </Button>
          </div>
          <TextArea
            className="product-image-profile-ai-prompt-section-textarea"
            readOnly
            autoSize={{ minRows: compact ? 3 : 4, maxRows: compact ? 8 : 10 }}
            value={section.text}
          />
        </section>
      ))}
    </div>
  )
}

export function ProductImageProfilePage({ session }: ProductImageProfilePageProps) {
  const { message } = App.useApp()
  const [profiles, setProfiles] = useState<ProductImageProfile[]>([])
  const [selectedProfileId, setSelectedProfileId] = useState('')
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedDetailLoading, setSelectedDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [removingAssets, setRemovingAssets] = useState(false)
  const [creatingSuiteDraft, setCreatingSuiteDraft] = useState(false)
  const [extractingImageFacts, setExtractingImageFacts] = useState(false)
  const [assetImportOpen, setAssetImportOpen] = useState(false)
  const [aiCopyModalOpen, setAiCopyModalOpen] = useState(false)
  const [activeProfileTab, setActiveProfileTab] = useState<ProductImageProfileTabKey>('assets')
  const [assetImportTab, setAssetImportTab] = useState<'url' | 'link' | 'upload'>('url')
  const [assetUrlText, setAssetUrlText] = useState('')
  const [sourceLinkUrl, setSourceLinkUrl] = useState('')
  const [sourceCollectionId, setSourceCollectionId] = useState<string>()
  const [sourceCollectionStatus, setSourceCollectionStatus] = useState<string>()
  const [sourceCandidates, setSourceCandidates] = useState<string[]>([])
  const [selectedSourceCandidates, setSelectedSourceCandidates] = useState<Set<string>>(() => new Set())
  const [importingAssetUrls, setImportingAssetUrls] = useState(false)
  const [collectingSourceLink, setCollectingSourceLink] = useState(false)
  const [loadError, setLoadError] = useState<string>()
  const [previewAsset, setPreviewAsset] = useState<ProfileAsset | null>(null)
  const [previewSuiteAsset, setPreviewSuiteAsset] = useState<ProductImageSuiteAsset | null>(null)
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(() => new Set())
  const [changingAssetRoleId, setChangingAssetRoleId] = useState<string>()
  const [changingSuiteAssetId, setChangingSuiteAssetId] = useState<string>()
  const [deletingSuiteId, setDeletingSuiteId] = useState<string>()
  const [productListScrollTop, setProductListScrollTop] = useState(0)
  const [productListViewportHeight, setProductListViewportHeight] = useState(640)
  const productListRef = useRef<HTMLDivElement | null>(null)
  const requestOwnerId = session.defaultOwnerUserId ?? session.userId
  const storeCode = currentStoreCode(session)
  const storeName = currentStoreName(session)
  const operatorName = currentOperatorName(session)

  useEffect(() => {
    let cancelled = false
    async function loadProfiles() {
      if (!storeCode) {
        setProfiles([])
        setSelectedProfileId('')
        setSelectedDetailLoading(false)
        setLoadError('当前店铺不能为空')
        return
      }
      setLoading(true)
      setSelectedDetailLoading(false)
      try {
        const response = await fetchProductImageProfileSummaries({
          ownerUserId: requestOwnerId,
          storeCode
        })
        if (cancelled) return
        setLoadError(undefined)
        const items = (response.items ?? []).map(mapBackendProfileSummary)
        if (items.length) {
          setProfiles(items)
          setSelectedProfileId((currentId) => items.some((item) => item.id === currentId) ? currentId : items[0].id)
        } else {
          setProfiles(mockProfiles)
          setSelectedProfileId(mockProfiles[0]?.id || '')
        }
      } catch (error) {
        if (cancelled) return
        setProfiles([])
        setSelectedProfileId('')
        setSelectedDetailLoading(false)
        setLoadError(error instanceof Error ? error.message : '商品图资料读取失败')
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadProfiles()
    return () => {
      cancelled = true
    }
  }, [requestOwnerId, storeCode])

  useEffect(() => {
    setSelectedAssetIds(new Set())
    setSourceLinkUrl('')
    setSourceCollectionId(undefined)
    setSourceCollectionStatus(undefined)
    setSourceCandidates([])
    setSelectedSourceCandidates(new Set())
    setPreviewSuiteAsset(null)
  }, [selectedProfileId])

  const filteredProfiles = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    if (!normalizedKeyword) {
      return profiles
    }
    return profiles.filter((profile) =>
      [profile.pskuCode, profile.productTitle, profile.brand, profile.titleEn, profile.titleAr]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedKeyword))
    )
  }, [keyword, profiles])

  const productListWindow = useMemo(
    () => productProfileVirtualWindow(filteredProfiles.length, productListScrollTop, productListViewportHeight),
    [filteredProfiles.length, productListScrollTop, productListViewportHeight]
  )
  const visibleProfileItems = useMemo(
    () => filteredProfiles.slice(productListWindow.startIndex, productListWindow.endIndex),
    [filteredProfiles, productListWindow.endIndex, productListWindow.startIndex]
  )

  useEffect(() => {
    const node = productListRef.current
    if (!node) {
      return undefined
    }
    const updateViewportHeight = () => setProductListViewportHeight(node.clientHeight || 640)
    updateViewportHeight()
    if (typeof ResizeObserver === 'undefined') {
      return undefined
    }
    const observer = new ResizeObserver(updateViewportHeight)
    observer.observe(node)
    return () => observer.disconnect()
  }, [filteredProfiles.length])

  const selectedProfile = profiles.find((profile) => profile.id === selectedProfileId) || filteredProfiles[0] || profiles[0]
  const aiCopyText = useMemo(
    () => selectedProfile ? buildProductImageAiCopyText(selectedProfile) : '',
    [selectedProfile]
  )
  const aiPromptSections = useMemo(
    () => selectedProfile ? buildProductImageAiPromptSections(selectedProfile) : [],
    [selectedProfile]
  )

  const patchSelectedProfile = (updater: (profile: ProductImageProfile) => ProductImageProfile) => {
    if (!selectedProfile) return
    setProfiles((currentProfiles) =>
      currentProfiles.map((profile) => profile.id === selectedProfile.id ? updater(profile) : profile)
    )
  }

  const replaceSelectedProfile = (currentId: string, nextProfile: ProductImageProfile) => {
    setProfiles((currentProfiles) => {
      const exists = currentProfiles.some((profile) => profile.id === currentId)
      if (!exists) {
        return [nextProfile, ...currentProfiles]
      }
      return currentProfiles.map((profile) => profile.id === currentId ? nextProfile : profile)
    })
    setSelectedProfileId(nextProfile.id)
  }

  useEffect(() => {
    if (!selectedProfile?.backendId || selectedProfile.detailLoaded) {
      setSelectedDetailLoading(false)
      return undefined
    }

    let cancelled = false
    setSelectedDetailLoading(true)
    fetchProductImageProfileDetail(selectedProfile.backendId, {
      ownerUserId: requestOwnerId,
      storeCode
    })
      .then((response) => {
        if (cancelled) return
        const detail = mapBackendProfile(response)
        setProfiles((currentProfiles) =>
          currentProfiles.map((profile) => profile.id === selectedProfile.id ? detail : profile)
        )
        setSelectedProfileId(detail.id)
        setLoadError(undefined)
      })
      .catch((error) => {
        if (cancelled) return
        setLoadError(error instanceof Error ? error.message : '商品图资料详情读取失败')
      })
      .finally(() => {
        if (!cancelled) {
          setSelectedDetailLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [requestOwnerId, selectedProfile?.backendId, selectedProfile?.detailLoaded, selectedProfile?.id, storeCode])

  const copyPskuCode = (pskuCode: string, sourceElement?: HTMLElement | null) => {
    try {
      copyTextWithFallback(pskuCode)
      message.success('PSKU 已复制')
      return
    } catch {
      // Continue to the async clipboard API below when execCommand is unavailable.
    }

    if (!navigator.clipboard?.writeText) {
      selectPskuText(sourceElement)
      return
    }

    void navigator.clipboard.writeText(pskuCode)
      .then(() => message.success('PSKU 已复制'))
      .catch(() => selectPskuText(sourceElement))
  }

  const copyTextWithFallback = (value: string) => {
    const textarea = document.createElement('textarea')
    textarea.value = value
    textarea.setAttribute('readonly', 'true')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const copied = document.execCommand('copy')
    document.body.removeChild(textarea)
    if (!copied) {
      throw new Error('copy failed')
    }
  }

  const selectPskuText = (sourceElement?: HTMLElement | null) => {
    if (!sourceElement) {
      message.error('PSKU 复制失败')
      return
    }
    const selection = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(sourceElement)
    selection?.removeAllRanges()
    selection?.addRange(range)
    message.info('已选中 PSKU，可手动复制')
  }

  const copyAiCopyText = () => {
    if (!aiCopyText.trim()) {
      message.warning('暂无可复制文案')
      return
    }

    try {
      copyTextWithFallback(aiCopyText)
      message.success('AI 文案已复制')
      return
    } catch {
      // Continue to the async clipboard API below when execCommand is unavailable.
    }

    if (!navigator.clipboard?.writeText) {
      message.warning('当前浏览器不支持自动复制')
      return
    }

    void navigator.clipboard.writeText(aiCopyText)
      .then(() => message.success('AI 文案已复制'))
      .catch(() => message.error('AI 文案复制失败'))
  }

  const copyAiPromptSection = (section: ProductImageAiPromptSection) => {
    const sectionText = `【${section.copyTitle}】\n${section.text}`
    try {
      copyTextWithFallback(sectionText)
      message.success(`${section.title}指令已复制`)
      return
    } catch {
      // Continue to the async clipboard API below when execCommand is unavailable.
    }

    if (!navigator.clipboard?.writeText) {
      message.warning('当前浏览器不支持自动复制')
      return
    }

    void navigator.clipboard.writeText(sectionText)
      .then(() => message.success(`${section.title}指令已复制`))
      .catch(() => message.error(`${section.title}指令复制失败`))
  }

  const copySuiteDraftText = (suite: ProductImageSuite) => {
    const draftText = suite.draftPromptText?.trim()
    if (!draftText) {
      message.warning('暂无可复制草稿')
      return
    }

    try {
      copyTextWithFallback(draftText)
      message.success('AI 草稿已复制')
      return
    } catch {
      // Continue to the async clipboard API below when execCommand is unavailable.
    }

    if (!navigator.clipboard?.writeText) {
      message.warning('当前浏览器不支持自动复制')
      return
    }

    void navigator.clipboard.writeText(draftText)
      .then(() => message.success('AI 草稿已复制'))
      .catch(() => message.error('AI 草稿复制失败'))
  }

  const persistProfile = async (profile: ProductImageProfile, showSuccess = true) => {
    if (!storeCode) {
      message.warning('当前店铺不能为空')
      return undefined
    }
    if (!profile.pskuCode.trim()) {
      message.warning('PSKU 不能为空')
      return undefined
    }
    const saved = await saveProductImageProfile(buildSaveRequest(profile, requestOwnerId, storeCode))
    const nextProfile = mapBackendProfile(saved)
    replaceSelectedProfile(profile.id, nextProfile)
    if (showSuccess) {
      message.success('商品图资料已保存')
    }
    return nextProfile
  }

  const ensureProfileReadyForAssets = async () => {
    if (!selectedProfile) {
      return undefined
    }
    if (!storeCode) {
      message.warning('当前店铺不能为空')
      return undefined
    }
    const persistedProfile = selectedProfile.backendId
      ? selectedProfile
      : await persistProfile(selectedProfile, false)
    if (!persistedProfile?.backendId) {
      message.error('请先保存商品图资料后再添加基础图')
      return undefined
    }
    return persistedProfile
  }

  const importAssetUrls = async (imageUrls: string[], successText: string) => {
    const normalizedUrls = imageUrls.map((item) => item.trim()).filter(Boolean)
    if (!normalizedUrls.length) {
      message.warning('请先填写图片链接')
      return
    }
    setImportingAssetUrls(true)
    try {
      const persistedProfile = await ensureProfileReadyForAssets()
      if (!persistedProfile?.backendId) {
        return
      }
      const saved = await importProductImageProfileAssetUrls(
        persistedProfile.backendId,
        requestOwnerId,
        storeCode,
        normalizedUrls,
        'MAIN'
      )
      replaceSelectedProfile(persistedProfile.id, mapBackendProfile(saved))
      message.success(successText)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '基础图导入失败')
    } finally {
      setImportingAssetUrls(false)
    }
  }

  const importAssetUrlText = async () => {
    const imageUrls = splitImportUrls(assetUrlText)
    await importAssetUrls(imageUrls, `已加入 ${imageUrls.length} 张基础图`)
    if (imageUrls.length) {
      setAssetUrlText('')
    }
  }

  const applySourceCollectionCandidates = (record: {
    id?: string
    status?: string
    statusText?: string
    sourceImageUrl?: string
    imageUrls?: string[]
  }) => {
    const imageUrls = splitImportUrls([record.sourceImageUrl || '', ...(record.imageUrls || [])].join('\n'))
    setSourceCollectionId(record.id)
    setSourceCollectionStatus(record.statusText || record.status)
    setSourceCandidates(imageUrls)
    setSelectedSourceCandidates(new Set())
    return imageUrls
  }

  const findSourceCollectionRecord = (
    records: ProductSelectionSourceCollection[],
    collectionId?: string,
    pageUrl?: string
  ) => records.find((item) => collectionId && item.id === collectionId)
    || records.find((item) => pageUrl && (item.pageUrl === pageUrl || item.sourceUrl === pageUrl))

  const waitForSourceCandidates = async (collectionId: string | undefined, pageUrl: string) => {
    for (let attempt = 0; attempt < 24; attempt += 1) {
      await wait(2500)
      const records = await loadSourceCollections(storeName, storeCode)
      const record = findSourceCollectionRecord(records, collectionId, pageUrl)
      if (!record) {
        continue
      }
      const imageUrls = applySourceCollectionCandidates(record)
      if (imageUrls.length || record.status === 'success' || record.status === 'failed') {
        return { record, imageUrls }
      }
    }
    return undefined
  }

  const collectSourceLink = async () => {
    const pageUrl = sourceLinkUrl.trim()
    const sourcePlatform = inferMarketplacePlatform(pageUrl)
    if (!sourcePlatform) {
      message.warning('商品链接仅支持 Amazon 或 noon')
      return
    }
    setCollectingSourceLink(true)
    try {
      const record = await createSourceCollection(
        {
          sourceType: 'marketplace-url',
          sourcePlatform,
          sourceUrl: pageUrl,
          pageUrl
        },
        storeName,
        storeCode,
        operatorName
      )
      const imageUrls = applySourceCollectionCandidates(record)
      if (imageUrls.length) {
        message.success(`已读取 ${imageUrls.length} 张候选图`)
      } else {
        message.info('已提交采集，正在读取候选图')
        const result = await waitForSourceCandidates(record.id, pageUrl)
        if (!result) {
          message.info('采集还在处理中，稍后点刷新查看候选图')
        } else if (result.imageUrls.length) {
          message.success(`已读取 ${result.imageUrls.length} 张候选图`)
        } else if (result.record.status === 'failed') {
          message.error(result.record.failureMessage || '商品链接采集失败')
        } else {
          message.info('采集完成，但没有返回商品图片')
        }
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '商品链接采集失败')
    } finally {
      setCollectingSourceLink(false)
    }
  }

  const refreshSourceCandidates = async () => {
    const pageUrl = sourceLinkUrl.trim()
    if (!sourceCollectionId && !pageUrl) {
      message.warning('请先提交商品链接')
      return
    }
    setCollectingSourceLink(true)
    try {
      const records = await loadSourceCollections(storeName, storeCode)
      const record = findSourceCollectionRecord(records, sourceCollectionId, pageUrl)
      if (!record) {
        message.warning('暂未找到采集记录')
        return
      }
      const imageUrls = applySourceCollectionCandidates(record)
      if (imageUrls.length) {
        message.success(`已读取 ${imageUrls.length} 张候选图`)
      } else {
        message.info('采集还没有返回候选图')
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '候选图刷新失败')
    } finally {
      setCollectingSourceLink(false)
    }
  }

  const toggleSourceCandidate = (imageUrl: string, checked: boolean) => {
    setSelectedSourceCandidates((current) => {
      const next = new Set(current)
      if (checked) {
        next.add(imageUrl)
      } else {
        next.delete(imageUrl)
      }
      return next
    })
  }

  const importSelectedSourceCandidates = async () => {
    const imageUrls = Array.from(selectedSourceCandidates)
    if (!imageUrls.length) {
      message.warning('请先勾选候选图')
      return
    }
    await importAssetUrls(imageUrls, `已加入 ${imageUrls.length} 张候选图`)
    setSelectedSourceCandidates(new Set())
  }

  const saveCurrentProfile = async () => {
    if (!selectedProfile) return
    if (selectedProfile.backendId && !selectedProfile.detailLoaded) {
      message.warning('商品图详情加载中，请稍后再保存')
      return
    }
    setSaving(true)
    try {
      await persistProfile(selectedProfile)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '商品图资料保存失败')
    } finally {
      setSaving(false)
    }
  }

  const extractCurrentImageFacts = async () => {
    if (!selectedProfile) return
    if (!storeCode) {
      message.warning('当前店铺不能为空')
      return
    }
    setExtractingImageFacts(true)
    try {
      const persistedProfile = selectedProfile.backendId
        ? selectedProfile
        : await persistProfile(selectedProfile, false)
      if (!persistedProfile?.backendId) {
        message.error('请先保存商品图资料后再提取')
        return
      }
      const suggestion = await extractProductImageFacts(
        persistedProfile.backendId,
        requestOwnerId,
        storeCode
      )
      const nextProfile = applyExtractionSuggestion(persistedProfile, suggestion)
      replaceSelectedProfile(persistedProfile.id, nextProfile)
      message.success('商品资料已提取，请检查后保存')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '商品资料 AI 提取失败')
    } finally {
      setExtractingImageFacts(false)
    }
  }

  const createSuiteDraft = async () => {
    if (!selectedProfile) return
    if (!storeCode) {
      message.warning('当前店铺不能为空')
      return
    }
    setCreatingSuiteDraft(true)
    try {
      const persistedProfile = await persistProfile(selectedProfile, false)
      if (!persistedProfile?.backendId) {
        message.error('请先保存商品图资料')
        return
      }
      const saved = await createProductImageSuiteDraft(persistedProfile.backendId, requestOwnerId, storeCode)
      replaceSelectedProfile(persistedProfile.id, mapBackendProfile(saved))
      message.success('AI 套图草稿已生成')
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'AI 套图草稿生成失败')
    } finally {
      setCreatingSuiteDraft(false)
    }
  }

  const updateHeroPoint = (index: number, value: string) => {
    patchSelectedProfile((profile) => ({
      ...profile,
      heroSellingPoints: profile.heroSellingPoints.map((point, pointIndex) => pointIndex === index ? value : point)
    }))
  }

  const addHeroPoint = () => {
    patchSelectedProfile((profile) => {
      if (profile.heroSellingPoints.length >= 5) {
        return profile
      }
      return { ...profile, heroSellingPoints: [...profile.heroSellingPoints, ''] }
    })
  }

  const removeHeroPoint = (index: number) => {
    patchSelectedProfile((profile) => ({
      ...profile,
      heroSellingPoints: profile.heroSellingPoints.filter((_, pointIndex) => pointIndex !== index)
    }))
  }

  const handleUpload = async (file: File) => {
    if (!acceptedImageTypes.includes(file.type)) {
      message.warning('仅支持 JPG、PNG、WEBP、GIF、AVIF 图片')
      return
    }
    if (file.size > maxImageBytes) {
      message.warning('基础图不能超过 8MB')
      return
    }
    if (!selectedProfile) return

    setUploading(true)
    try {
      const persistedProfile = await ensureProfileReadyForAssets()
      if (!persistedProfile?.backendId) {
        return
      }
      const saved = await uploadProductImageProfileAsset(
        persistedProfile.backendId,
        requestOwnerId,
        storeCode,
        file,
        'MAIN'
      )
      replaceSelectedProfile(persistedProfile.id, mapBackendProfile(saved))
      message.success('基础图已加入素材池')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '基础图上传失败')
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
      const persistedProfile = selectedProfile.backendId
        ? selectedProfile
        : await persistProfile(selectedProfile, false)
      if (!persistedProfile?.backendId) {
        patchSelectedProfile((profile) => ({
          ...profile,
          assets: profile.assets.map((candidate) =>
            targets.some((asset) => asset.id === candidate.id)
              ? { ...candidate, assetStatus: 'REMOVED' }
              : candidate
          )
        }))
        setSelectedAssetIds(new Set())
        message.success(`已移除 ${targets.length} 张图片`)
        return
      }
      const saved = await batchRemoveProductImageProfileAssets(
        persistedProfile.backendId,
        requestOwnerId,
        storeCode,
        targets.map(assetRemoveItem)
      )
      replaceSelectedProfile(persistedProfile.id, mapBackendProfile(saved))
      setSelectedAssetIds(new Set())
      message.success(`已从基础图素材池移除 ${targets.length} 张图片`)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '基础图移除失败')
    } finally {
      setRemovingAssets(false)
    }
  }

  const removeAsset = async (asset: ProfileAsset) => {
    await removeAssets([asset])
  }

  const toggleAssetSelection = (assetId: string, checked: boolean) => {
    setSelectedAssetIds((current) => {
      const next = new Set(current)
      if (checked) {
        next.add(assetId)
      } else {
        next.delete(assetId)
      }
      return next
    })
  }

  const selectAssets = (assetsToSelect: ProfileAsset[]) => {
    setSelectedAssetIds(new Set(assetsToSelect.filter(isSelectableAsset).map((asset) => asset.id)))
  }

  const clearAssetSelection = () => {
    setSelectedAssetIds(new Set())
  }

  const changeAssetRole = async (assetId: string, imageRole: ImageRole) => {
    if (!selectedProfile) return
    const targetAsset = selectedProfile.assets.find((asset) => asset.id === assetId)
    if (!targetAsset || targetAsset.imageRole === imageRole) return
    const previousRole = targetAsset.imageRole
    patchSelectedProfile((profile) => ({
      ...profile,
      assets: profile.assets.map((asset) => asset.id === assetId ? { ...asset, imageRole } : asset)
    }))
    if (!targetAsset.backendId && !targetAsset.imageUrl) {
      return
    }
    setChangingAssetRoleId(assetId)
    try {
      const persistedProfile = selectedProfile.backendId
        ? selectedProfile
        : await persistProfile(selectedProfile, false)
      if (!persistedProfile?.backendId) {
        return
      }
      const saved = await updateProductImageProfileAssetRole(
        persistedProfile.backendId,
        requestOwnerId,
        storeCode,
        assetRoleUpdateItem(targetAsset, imageRole)
      )
      replaceSelectedProfile(persistedProfile.id, mapBackendProfile(saved))
    } catch (error) {
      patchSelectedProfile((profile) => ({
        ...profile,
        assets: profile.assets.map((asset) => asset.id === assetId ? { ...asset, imageRole: previousRole } : asset)
      }))
      message.error(error instanceof Error ? error.message : '基础图分类更新失败')
    } finally {
      setChangingAssetRoleId((currentId) => currentId === assetId ? undefined : currentId)
    }
  }

  const adoptSuite = async (suite: ProductImageSuite) => {
    if (selectedProfile?.backendId && suite.backendId) {
      try {
        const saved = await adoptProductImageSuite(selectedProfile.backendId, suite.backendId, requestOwnerId, storeCode)
        replaceSelectedProfile(selectedProfile.id, mapBackendProfile(saved))
        message.success('已标记为当前采用套图')
        return
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'AI 套图采用失败')
        return
      }
    }
    patchSelectedProfile((profile) => ({
      ...profile,
      suites: profile.suites.map((candidate) => {
        if (candidate.id === suite.id) {
          return { ...candidate, suiteStatus: 'ADOPTED', adoptedAt: '刚刚' }
        }
        if (candidate.suiteStatus === 'ADOPTED') {
          return { ...candidate, suiteStatus: 'HISTORICAL' }
        }
        return candidate
      })
    }))
    message.success('已标记为当前采用套图')
  }

  const removeSuite = async (suite: ProductImageSuite) => {
    setDeletingSuiteId(suite.id)
    if (selectedProfile?.backendId && suite.backendId) {
      try {
        const saved = await deleteProductImageSuite(selectedProfile.backendId, suite.backendId, requestOwnerId, storeCode)
        replaceSelectedProfile(selectedProfile.id, mapBackendProfile(saved))
        message.success('AI 套图已删除')
        return
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'AI 套图删除失败')
        return
      } finally {
        setDeletingSuiteId((currentId) => currentId === suite.id ? undefined : currentId)
      }
    }
    patchSelectedProfile((profile) => ({
      ...profile,
      suites: profile.suites.filter((candidate) => candidate.id !== suite.id)
    }))
    setDeletingSuiteId((currentId) => currentId === suite.id ? undefined : currentId)
    message.success('AI 套图已删除')
  }

  const moveSuiteAsset = async (
    suite: ProductImageSuite,
    asset: ProductImageSuiteAsset,
    options: { targetSuiteId?: number; targetIndex?: number }
  ) => {
    if (!selectedProfile?.backendId || !suite.backendId || !asset.backendId) {
      message.warning('请先保存商品图资料')
      return
    }
    setChangingSuiteAssetId(asset.id)
    try {
      const saved = await moveProductImageSuiteAsset(
        selectedProfile.backendId,
        suite.backendId,
        asset.backendId,
        requestOwnerId,
        storeCode,
        options
      )
      replaceSelectedProfile(selectedProfile.id, mapBackendProfile(saved))
      message.success(options.targetSuiteId && options.targetSuiteId !== suite.backendId ? '图片已移动到目标套图' : '图片位置已更新')
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'AI 套图图片移动失败')
    } finally {
      setChangingSuiteAssetId((currentId) => currentId === asset.id ? undefined : currentId)
    }
  }

  const removeSuiteAsset = async (suite: ProductImageSuite, asset: ProductImageSuiteAsset) => {
    if (!selectedProfile?.backendId || !suite.backendId || !asset.backendId) {
      message.warning('请先保存商品图资料')
      return
    }
    setChangingSuiteAssetId(asset.id)
    try {
      const saved = await deleteProductImageSuiteAsset(
        selectedProfile.backendId,
        suite.backendId,
        asset.backendId,
        requestOwnerId,
        storeCode
      )
      replaceSelectedProfile(selectedProfile.id, mapBackendProfile(saved))
      message.success('套图图片已删除')
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'AI 套图图片删除失败')
    } finally {
      setChangingSuiteAssetId((currentId) => currentId === asset.id ? undefined : currentId)
    }
  }

  if (!selectedProfile) {
    return <Empty description={loading ? '商品图资料加载中' : loadError || '暂无商品图档案'} />
  }

  const selectedCompleteness = profileCompleteness(selectedProfile)
  const selectedProfileAssets = activeAssets(selectedProfile)
  const selectedProfileAssetGroups = groupProductImageAssetsByRole(selectedProfileAssets)
  const selectableAssets = selectedProfileAssets.filter(isSelectableAsset)
  const selectedAssets = selectableAssets.filter((asset) => selectedAssetIds.has(asset.id))
  const allAssetsSelected = selectableAssets.length > 0 && selectedAssets.length === selectableAssets.length
  const selectedProfileReady = Boolean(selectedProfile.detailLoaded || !selectedProfile.backendId)
  const selectedAssetCount = selectedProfile.detailLoaded
    ? selectedProfileAssets.length
    : selectedProfile.assetCount ?? selectedProfileAssets.length
  const selectedSuiteCount = selectedProfile.detailLoaded
    ? selectedProfile.suites.length
    : selectedProfile.suiteCount ?? selectedProfile.suites.length

  const renderAssetCard = (asset: ProfileAsset) => (
    <div
      className={`product-image-profile-asset-card${selectedAssetIds.has(asset.id) ? ' is-selected' : ''}`}
      key={asset.id}
    >
      <Checkbox
        checked={selectedAssetIds.has(asset.id)}
        className="product-image-profile-asset-select"
        disabled={!isSelectableAsset(asset) || removingAssets}
        onChange={(event) => toggleAssetSelection(asset.id, event.target.checked)}
        onClick={(event) => event.stopPropagation()}
      />
      <AssetThumb asset={asset} onPreview={setPreviewAsset} />
      <div className="product-image-profile-asset-meta">
        <Select
          disabled={changingAssetRoleId === asset.id}
          loading={changingAssetRoleId === asset.id}
          size="small"
          options={imageRoleSelectOptions(asset.imageRole)}
          value={asset.imageRole}
          onChange={(value) => void changeAssetRole(asset.id, value)}
        />
        <Popconfirm
          cancelText="取消"
          okButtonProps={{ danger: true, loading: removingAssets }}
          okText="移除"
          onConfirm={() => void removeAsset(asset)}
          title="确定移除这张图片吗？"
        >
          <Button danger disabled={removingAssets} size="small" type="text" icon={<DeleteOutlined />}>
            移除
          </Button>
        </Popconfirm>
      </div>
    </div>
  )

  return (
    <div className="product-image-profile-page">
      <div className="product-image-profile-layout">
        <aside className="product-image-profile-sidebar">
          <div className="product-image-profile-sidebar-head">
            <strong>PSKU</strong>
            <Text type="secondary">{loading ? '加载中' : `${filteredProfiles.length} 个`}</Text>
          </div>
          <div className="product-image-profile-sidebar-search">
            <Input.Search
              allowClear
              placeholder="搜索 PSKU / 标题 / 品牌"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onSearch={(value) => setKeyword(value)}
            />
          </div>
          <div
            className="product-image-profile-product-list"
            ref={productListRef}
            onScroll={(event) => setProductListScrollTop(event.currentTarget.scrollTop)}
          >
            {productListWindow.topPadding ? (
              <div
                aria-hidden="true"
                className="product-image-profile-product-spacer"
                style={{ height: productListWindow.topPadding }}
              />
            ) : null}
            {visibleProfileItems.map((profile) => {
              const completeness = profileCompleteness(profile)
              const displayTitle = profileDisplayTitle(profile)
              return (
                <div
                  aria-pressed={profile.id === selectedProfile.id}
                  className={`product-image-profile-product-card${profile.id === selectedProfile.id ? ' is-active' : ''}`}
                  key={profile.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedProfileId(profile.id)}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelectedProfileId(profile.id)
                    }
                  }}
                >
                  <span className="product-image-profile-product-row">
                    <ProductListThumb profile={profile} />
                    <span className="product-image-profile-product-copy">
                      <Tooltip title={displayTitle} placement="right">
                        <strong title={displayTitle}>{displayTitle}</strong>
                      </Tooltip>
                      <small className="product-image-profile-product-psku">
                        <span
                          title={profile.pskuCode}
                          onClick={(event) => {
                            event.stopPropagation()
                            copyPskuCode(profile.pskuCode, event.currentTarget)
                          }}
                        >
                          {profile.pskuCode}
                        </span>
                        <Tooltip title="复制 PSKU">
                          <Button
                            aria-label={`复制 ${profile.pskuCode}`}
                            className="product-image-profile-product-copy-button"
                            icon={<CopyOutlined />}
                            size="small"
                            type="text"
                            onClick={(event) => {
                              event.stopPropagation()
                              const pskuNode = event.currentTarget.previousElementSibling
                              copyPskuCode(profile.pskuCode, pskuNode instanceof HTMLElement ? pskuNode : null)
                            }}
                          />
                        </Tooltip>
                      </small>
                    </span>
                  </span>
                  <Tag color={completeness.color}>{completeness.label}</Tag>
                </div>
              )
            })}
            {productListWindow.bottomPadding ? (
              <div
                aria-hidden="true"
                className="product-image-profile-product-spacer"
                style={{ height: productListWindow.bottomPadding }}
              />
            ) : null}
          </div>
        </aside>

        <main className="product-image-profile-main">
          <div className="product-image-profile-summary">
            <div>
              <div className="product-image-profile-psku">{selectedProfile.pskuCode}</div>
            </div>
            <Space wrap>
              <Tag color={selectedCompleteness.color}>{selectedCompleteness.label}</Tag>
              <Tag icon={<PictureOutlined />}>基础图 {selectedAssetCount}</Tag>
              <Tag icon={<HistoryOutlined />}>AI 套图 {selectedSuiteCount}</Tag>
              <Button disabled={!selectedProfileReady} icon={<CopyOutlined />} onClick={() => setAiCopyModalOpen(true)}>
                AI 指令预览
              </Button>
              <Button
                disabled={!selectedProfileReady}
                icon={<SaveOutlined />}
                loading={saving || selectedDetailLoading}
                type="primary"
                onClick={() => void saveCurrentProfile()}
              >
                保存
              </Button>
            </Space>
          </div>

          <Tabs
            activeKey={activeProfileTab}
            className="product-image-profile-tabs"
            onChange={(key) => setActiveProfileTab(key as ProductImageProfileTabKey)}
            items={[
              {
                key: 'assets',
                label: '基础图',
                children: activeProfileTab === 'assets' ? (
                  <div className="product-image-profile-tab-body">
                    <div className="product-image-profile-tab-actions">
                      <Button disabled={!selectedProfileReady} icon={<PlusOutlined />} onClick={() => setAssetImportOpen(true)}>
                        添加基础图
                      </Button>
                      <Space className="product-image-profile-batch-actions" wrap>
                        <Text type={selectedAssets.length ? undefined : 'secondary'}>已选 {selectedAssets.length} 张</Text>
                        <Button
                          disabled={!selectedProfileReady || !selectableAssets.length || allAssetsSelected || removingAssets}
                          size="small"
                          onClick={() => selectAssets(selectableAssets)}
                        >
                          全选
                        </Button>
                        <Button
                          disabled={!selectedProfileReady || !selectedAssets.length || removingAssets}
                          size="small"
                          onClick={clearAssetSelection}
                        >
                          取消选择
                        </Button>
                        <Popconfirm
                          cancelText="取消"
                          okButtonProps={{ danger: true, loading: removingAssets }}
                          okText="移除"
                          onConfirm={() => void removeAssets(selectedAssets)}
                          title={`确定移除选中的 ${selectedAssets.length} 张图片吗？`}
                        >
                          <Button
                            danger
                            disabled={!selectedProfileReady || !selectedAssets.length}
                            icon={<DeleteOutlined />}
                            loading={removingAssets}
                            size="small"
                          >
                            批量移除
                          </Button>
                        </Popconfirm>
                      </Space>
                    </div>
                    {selectedProfileAssets.length ? (
                      <div className="product-image-profile-asset-sections">
                        {selectedProfileAssetGroups.map((section) => (
                          <section className="product-image-profile-asset-section" key={section.role}>
                            <div className="product-image-profile-asset-section-head">
                              <strong>{section.label}</strong>
                              <Text type="secondary">{section.assets.length} 张</Text>
                            </div>
                            {section.assets.length ? (
                              <div className="product-image-profile-asset-grid">
                                {section.assets.map(renderAssetCard)}
                              </div>
                            ) : (
                              <div className="product-image-profile-asset-section-empty">
                                暂无{section.label}
                              </div>
                            )}
                          </section>
                        ))}
                      </div>
                    ) : (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无基础图" />
                    )}
                  </div>
                ) : null
              },
              {
                key: 'elements',
                label: '图片元素',
                children: activeProfileTab === 'elements' ? (
                  <div className="product-image-profile-tab-body product-image-profile-elements">
                    <div className="product-image-profile-elements-grid">
                      <section className="product-image-profile-panel product-image-profile-fact-panel">
                        <div className="product-image-profile-panel-head">
                          <strong>商品资料</strong>
                          <Space className="product-image-profile-fact-actions" wrap>
                            <Button
                              disabled={!selectedProfileReady}
                              icon={<ReloadOutlined />}
                              loading={extractingImageFacts}
                              onClick={() => void extractCurrentImageFacts()}
                            >
                              AI 提取
                            </Button>
                            <Button
                              disabled={!selectedProfileReady}
                              icon={<SaveOutlined />}
                              loading={saving || selectedDetailLoading}
                              type="primary"
                              onClick={() => void saveCurrentProfile()}
                            >
                              保存
                            </Button>
                          </Space>
                        </div>
                        <div className="product-image-profile-fact-groups">
                          <div className="product-image-profile-fact-group">
                            <Text strong>主图数据</Text>
                            <div className="product-image-profile-fact-field-grid">
                              <label className="product-image-profile-fact-field">
                                <span>规格</span>
                                <Input
                                  value={selectedProfile.specSummary}
                                  placeholder="规格"
                                  onChange={(event) => patchSelectedProfile((profile) => ({ ...profile, specSummary: event.target.value }))}
                                />
                              </label>
                              <label className="product-image-profile-fact-field product-image-profile-fact-field--wide">
                                <span>英文标题</span>
                                <Input
                                  value={selectedProfile.titleEn}
                                  placeholder="英文标题"
                                  onChange={(event) => patchSelectedProfile((profile) => ({ ...profile, titleEn: event.target.value }))}
                                />
                              </label>
                              <label className="product-image-profile-fact-field product-image-profile-fact-field--wide">
                                <span>阿语标题</span>
                                <Input
                                  dir="rtl"
                                  value={selectedProfile.titleAr}
                                  placeholder="阿语标题"
                                  onChange={(event) => patchSelectedProfile((profile) => ({ ...profile, titleAr: event.target.value }))}
                                />
                              </label>
                            </div>
                          </div>

                          <div className="product-image-profile-fact-group">
                            <Text strong>尺寸数据</Text>
                            <TextArea
                              rows={3}
                              value={selectedProfile.sizeSection.attributesText}
                              placeholder="尺寸文案；没有可信尺寸就留空，用户手填"
                              onChange={(event) => patchSelectedProfile((profile) => ({
                                ...profile,
                                sizeSection: { ...profile.sizeSection, attributesText: event.target.value }
                              }))}
                            />
                          </div>

                          <div className="product-image-profile-fact-group">
                            <div className="product-image-profile-fact-group-head">
                              <Text strong>英文卖点</Text>
                              <Button icon={<PlusOutlined />} disabled={selectedProfile.heroSellingPoints.length >= 5} onClick={addHeroPoint}>
                                添加
                              </Button>
                            </div>
                            <div className="product-image-profile-selling-points">
                              {selectedProfile.heroSellingPoints.map((point, index) => (
                                <Input
                                  key={`${index}-${selectedProfile.pskuCode}`}
                                  value={point}
                                  placeholder={`English selling point ${index + 1}`}
                                  addonAfter={
                                    <Button
                                      size="small"
                                      type="text"
                                      danger
                                      icon={<DeleteOutlined />}
                                      disabled={selectedProfile.heroSellingPoints.length <= 1}
                                      onClick={() => removeHeroPoint(index)}
                                    />
                                  }
                                  onChange={(event) => updateHeroPoint(index, event.target.value)}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="product-image-profile-fact-group">
                            <Text strong>包装数据</Text>
                            <TextArea
                              rows={3}
                              value={selectedProfile.packageList.attributesText}
                              placeholder="数量、套装内容、配件、颜色组合或包装说明"
                              onChange={(event) => patchSelectedProfile((profile) => ({
                                ...profile,
                                packageList: { ...profile.packageList, attributesText: event.target.value }
                              }))}
                            />
                          </div>
                        </div>
                      </section>

                      <section className="product-image-profile-panel product-image-profile-ai-prompt-panel">
                        <div className="product-image-profile-panel-head">
                          <strong>AI 指令</strong>
                          <Button size="small" icon={<CopyOutlined />} onClick={copyAiCopyText}>
                            复制全部
                          </Button>
                        </div>
                        <AiPromptSectionList sections={aiPromptSections} onCopy={copyAiPromptSection} />
                      </section>
                    </div>
                  </div>
                ) : null
              },
              {
                key: 'suites',
                label: 'AI 套图',
                children: activeProfileTab === 'suites' ? (
                  <div className="product-image-profile-tab-body">
                    <div className="product-image-profile-tab-actions product-image-profile-suite-toolbar">
                      <Button
                        icon={<FileImageOutlined />}
                        loading={creatingSuiteDraft}
                        onClick={() => void createSuiteDraft()}
                      >
                        生成 AI 套图草稿
                      </Button>
                    </div>
                    {selectedProfile.suites.length ? (
                      <div className="product-image-profile-suite-list">
                        {selectedProfile.suites.map((suite) => {
                          const status = suiteStatusMeta[suite.suiteStatus]
                          const canAdoptSuite = suite.suiteStatus === 'DRAFT' && suite.assets.length > 0
                          const otherSuites = selectedProfile.suites.filter((candidate) => candidate.id !== suite.id && candidate.backendId)
                          return (
                            <div className="product-image-profile-suite-card" key={suite.id}>
                              <div className="product-image-profile-suite-info">
                                <div>
                                  <strong>{suite.suiteName}</strong>
                                  <Text type="secondary">{suite.skinName} / {suite.createdAt}</Text>
                                </div>
                                <Tag color={status.color}>{status.label}</Tag>
                              </div>
                              {suite.assets.length ? (
                                <div className="product-image-profile-suite-assets">
                                  {suite.assets.map((asset, assetIndex) => (
                                    <SuiteThumb
                                      asset={asset}
                                      canMoveDown={assetIndex < suite.assets.length - 1}
                                      canMoveUp={assetIndex > 0}
                                      key={asset.id}
                                      moving={changingSuiteAssetId === asset.id}
                                      onMove={(direction) => void moveSuiteAsset(suite, asset, {
                                        targetIndex: assetIndex + direction
                                      })}
                                      onMoveToSuite={(targetSuiteId) => void moveSuiteAsset(suite, asset, { targetSuiteId })}
                                      onPreview={setPreviewSuiteAsset}
                                      onRemove={() => void removeSuiteAsset(suite, asset)}
                                      otherSuites={otherSuites}
                                    />
                                  ))}
                                </div>
                              ) : suite.draftPromptText ? (
                                <TextArea
                                  className="product-image-profile-suite-draft-textarea"
                                  readOnly
                                  autoSize={{ minRows: 8, maxRows: 14 }}
                                  value={suite.draftPromptText}
                                />
                              ) : (
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无套图图片" />
                              )}
                              <div className="product-image-profile-suite-actions">
                                {suite.draftPromptText ? (
                                  <Button icon={<CopyOutlined />} onClick={() => copySuiteDraftText(suite)}>
                                    复制草稿
                                  </Button>
                                ) : null}
                                {suite.suiteStatus === 'DRAFT' ? (
                                  <>
                                    <Button
                                      disabled={!canAdoptSuite}
                                      icon={<CheckCircleOutlined />}
                                      type="primary"
                                      onClick={() => void adoptSuite(suite)}
                                    >
                                      采用
                                    </Button>
                                  </>
                                ) : (
                                  <Text type="secondary">{suite.adoptedAt ? `采用时间：${suite.adoptedAt}` : '无采用记录'}</Text>
                                )}
                                <Popconfirm
                                  cancelText="取消"
                                  okText="删除"
                                  okButtonProps={{ danger: true, loading: deletingSuiteId === suite.id }}
                                  title={suite.suiteStatus === 'ADOPTED' ? '当前采用套图也会从资料库删除，确定继续吗？' : '确定删除这套 AI 套图吗？'}
                                  onConfirm={() => void removeSuite(suite)}
                                >
                                  <Button danger icon={<DeleteOutlined />} loading={deletingSuiteId === suite.id}>
                                    删除
                                  </Button>
                                </Popconfirm>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="product-image-profile-empty-suite">
                        <FileImageOutlined />
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无 AI 生成套图" />
                      </div>
                    )}
                  </div>
                ) : null
              }
            ]}
          />
        </main>
      </div>
      <Modal
        className="product-image-profile-asset-import-modal"
        footer={null}
        onCancel={() => setAssetImportOpen(false)}
        open={assetImportOpen}
        title="添加基础图"
        width="min(760px, calc(100vw - 32px))"
      >
        <Tabs
          activeKey={assetImportTab}
          onChange={(key) => setAssetImportTab(key as 'url' | 'link' | 'upload')}
          items={[
            {
              key: 'url',
              label: '图片 URL',
              children: (
                <div className="product-image-profile-import-panel">
                  <TextArea
                    autoSize={{ minRows: 5, maxRows: 8 }}
                    value={assetUrlText}
                    placeholder="图片 URL，一行一个"
                    onChange={(event) => setAssetUrlText(event.target.value)}
                  />
                  <div className="product-image-profile-import-actions">
                    <Button
                      type="primary"
                      loading={importingAssetUrls}
                      onClick={() => void importAssetUrlText()}
                    >
                      加入基础图
                    </Button>
                  </div>
                </div>
              )
            },
            {
              key: 'link',
              label: '商品链接',
              children: (
                <div className="product-image-profile-import-panel">
                  <Space.Compact className="product-image-profile-source-input">
                    <Input
                      prefix={<LinkOutlined />}
                      value={sourceLinkUrl}
                      placeholder="Amazon / noon 商品详情链接"
                      onChange={(event) => {
                        setSourceLinkUrl(event.target.value)
                        setSourceCollectionId(undefined)
                        setSourceCollectionStatus(undefined)
                        setSourceCandidates([])
                        setSelectedSourceCandidates(new Set())
                      }}
                    />
                    <Button loading={collectingSourceLink} type="primary" onClick={() => void collectSourceLink()}>
                      采集
                    </Button>
                    <Button
                      icon={<ReloadOutlined />}
                      loading={collectingSourceLink}
                      onClick={() => void refreshSourceCandidates()}
                    />
                  </Space.Compact>
                  <div className="product-image-profile-source-status">
                    {sourceCollectionStatus ? <Tag>{sourceCollectionStatus}</Tag> : null}
                    <Text type="secondary">已选 {selectedSourceCandidates.size} 张</Text>
                    <Button
                      disabled={!selectedSourceCandidates.size}
                      loading={importingAssetUrls}
                      type="primary"
                      onClick={() => void importSelectedSourceCandidates()}
                    >
                      加入基础图
                    </Button>
                  </div>
                  {sourceCandidates.length ? (
                    <div className="product-image-profile-candidate-grid">
                      {sourceCandidates.map((imageUrl, index) => {
                        const checked = selectedSourceCandidates.has(imageUrl)
                        return (
                          <div
                            aria-pressed={checked}
                            className={`product-image-profile-candidate-card${checked ? ' is-selected' : ''}`}
                            key={imageUrl}
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleSourceCandidate(imageUrl, !checked)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                toggleSourceCandidate(imageUrl, !checked)
                              }
                            }}
                          >
                            <SystemImage src={imageUrl} alt={`候选图 ${index + 1}`} fallback={<PictureOutlined />} />
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无候选图" />
                  )}
                </div>
              )
            },
            {
              key: 'upload',
              label: '直接上传',
              children: (
                <div className="product-image-profile-import-panel">
                  <Upload
                    accept={acceptedImageTypes.join(',')}
                    beforeUpload={(file) => {
                      void handleUpload(file)
                      return Upload.LIST_IGNORE
                    }}
                    multiple
                    showUploadList={false}
                  >
                    <Button icon={<UploadOutlined />} loading={uploading} type="primary">
                      选择图片
                    </Button>
                  </Upload>
                </div>
              )
            }
          ]}
        />
      </Modal>
      <Modal
        onCancel={() => setAiCopyModalOpen(false)}
        open={aiCopyModalOpen}
        title="AI 指令预览"
        width="min(760px, calc(100vw - 32px))"
        footer={[
          <Button key="close" onClick={() => setAiCopyModalOpen(false)}>
            关闭
          </Button>,
          <Button key="copy" icon={<CopyOutlined />} type="primary" onClick={copyAiCopyText}>
            复制文案
          </Button>
        ]}
      >
        <AiPromptSectionList sections={aiPromptSections} onCopy={copyAiPromptSection} compact />
      </Modal>
      <AssetDetailModal
        asset={previewAsset}
        metadataContext={{
          ownerUserId: requestOwnerId,
          productMasterId: selectedProfile.productMasterId,
          storeCode
        }}
        onClose={() => setPreviewAsset(null)}
      />
      <SuitePreviewModal asset={previewSuiteAsset} onClose={() => setPreviewSuiteAsset(null)} />
    </div>
  )
}
