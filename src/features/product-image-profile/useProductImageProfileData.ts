import { useEffect, useMemo, useRef, useState } from 'react'
import type { AuthSession } from '../auth/session'
import { fetchOperationsSkins } from '../operations-skin-management/api'
import type { OperationsSkinView } from '../operations-skin-management/types'
import { buildProductImageAiCopyText, buildProductImageAiPromptSections } from './aiCopyText'
import { fetchProductImageProfileDetail, fetchProductImageProfileSummaries } from './api'
import { profileDisplayTitle, profileMissingFields, profileReadinessStatus, samePhysicalAsset } from './productImageAssetModel'
import {
  currentOperatorName,
  currentStoreCode,
  currentStoreName
} from './productImageProfileConstants'
import { mapBackendProfile, mapBackendProfileSummary } from './productImageProfileMapper'
import { preserveProductImageProfileDraft } from './productImageProfileDraft'
import type { ProductImageProfile, ProfileAsset, SuiteStatus } from './productImageProfileTypes'
import type {
  ProductImageProfileSidebarItem,
  ProductImageReadinessFilter,
  ProductImageStatusFilter
} from './ProductImageProfileSidebar'
import { summarizeImageStatus } from './profileSummaryStatus'

export function useProductImageProfileData(session: AuthSession) {
  const [profiles, setProfiles] = useState<ProductImageProfile[]>([])
  const dirtyProfileIds = useRef(new Set<string>())
  const [selectedProfileId, setSelectedProfileId] = useState('')
  const [keyword, setKeyword] = useState('')
  const [readinessFilter, setReadinessFilter] = useState<ProductImageReadinessFilter>('ALL')
  const [imageStatusFilter, setImageStatusFilter] = useState<ProductImageStatusFilter>('ALL')
  const [loading, setLoading] = useState(false)
  const [selectedDetailLoading, setSelectedDetailLoading] = useState(false)
  const [loadError, setLoadError] = useState<string>()
  const [availableSkins, setAvailableSkins] = useState<OperationsSkinView[]>([])
  const [selectedSkinId, setSelectedSkinId] = useState<number>()
  const requestOwnerId = session.defaultOwnerUserId ?? session.userId
  const storeCode = currentStoreCode(session)
  const storeName = currentStoreName(session)
  const operatorName = currentOperatorName(session)

  const validActiveSkins = useMemo(() => availableSkins.filter((skin) => {
    const required = skin.heroComponentRequiredCount ?? 4
    return skin.status === 'ACTIVE' && (skin.heroComponentCount ?? 0) >= required
  }), [availableSkins])

  useEffect(() => {
    let cancelled = false
    if (!storeCode) {
      setAvailableSkins([])
      setSelectedSkinId(undefined)
      return () => { cancelled = true }
    }
    void fetchOperationsSkins({ storeCode, status: 'ACTIVE' })
      .then((skins) => {
        if (cancelled) return
        setAvailableSkins(skins)
        const valid = skins.filter((skin) =>
          (skin.heroComponentCount ?? 0) >= (skin.heroComponentRequiredCount ?? 4)
        )
        setSelectedSkinId((current) =>
          valid.some((skin) => skin.id === current) ? current : valid[0]?.id
        )
      })
      .catch(() => {
        if (!cancelled) {
          setAvailableSkins([])
          setSelectedSkinId(undefined)
        }
      })
    return () => { cancelled = true }
  }, [storeCode])

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
      dirtyProfileIds.current.clear()
      try {
        const response = await fetchProductImageProfileSummaries({ ownerUserId: requestOwnerId, storeCode })
        if (cancelled) return
        const items = (response.items ?? []).map(mapBackendProfileSummary)
        setLoadError(undefined)
        setProfiles(items)
        setSelectedProfileId((currentId) =>
          items.some((item) => item.id === currentId) ? currentId : items[0]?.id ?? ''
        )
      } catch (error) {
        if (cancelled) return
        setProfiles([])
        setSelectedProfileId('')
        setSelectedDetailLoading(false)
        setLoadError(error instanceof Error ? error.message : '商品图资料读取失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void loadProfiles()
    return () => { cancelled = true }
  }, [requestOwnerId, storeCode])

  const filteredProfiles = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    return profiles.filter((profile) => {
      const matchesKeyword = !normalizedKeyword
        || [profile.pskuCode, profile.productTitle, profile.brand, profile.titleEn, profile.titleAr]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedKeyword))
      const readinessStatus = profileReadinessStatus(profile)
      const imageStatus = profile.imageStatus
        ?? summarizeImageStatus(profile.suites.map((suite) => suite.suiteStatus))
      return matchesKeyword
        && (readinessFilter === 'ALL' || readinessStatus === readinessFilter)
        && (imageStatusFilter === 'ALL' || imageStatus === imageStatusFilter)
    })
  }, [imageStatusFilter, keyword, profiles, readinessFilter])

  useEffect(() => {
    if (filteredProfiles.length && !filteredProfiles.some((profile) => profile.id === selectedProfileId)) {
      setSelectedProfileId(filteredProfiles[0].id)
    }
  }, [filteredProfiles, selectedProfileId])

  const selectedProfile = filteredProfiles.find((profile) => profile.id === selectedProfileId)
    ?? filteredProfiles[0]
    ?? profiles[0]
  const profilesById = useMemo(() => new Map(profiles.map((profile) => [profile.id, profile])), [profiles])
  const sidebarItems = useMemo<ProductImageProfileSidebarItem[]>(() => profiles.map((profile) => ({
    activeSuiteCount: profile.activeSuiteCount ?? 0,
    coverImageUrl: profile.coverImageUrl,
    id: profile.id,
    imageStatus: profile.imageStatus ?? summarizeImageStatus(profile.suites.map((suite) => suite.suiteStatus)),
    missingProfileFields: profileMissingFields(profile),
    productTitle: profileDisplayTitle(profile),
    profileReadinessStatus: profileReadinessStatus(profile),
    pskuCode: profile.pskuCode
  })), [profiles])
  const filteredIds = useMemo(() => new Set(filteredProfiles.map((profile) => profile.id)), [filteredProfiles])
  const filteredSidebarItems = useMemo(
    () => sidebarItems.filter((item) => filteredIds.has(item.id)),
    [filteredIds, sidebarItems]
  )
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
    setProfiles((current) =>
      current.map((profile) => profile.id === selectedProfile.id ? updater(profile) : profile)
    )
  }

  const patchSelectedProfileDraft = (
    updater: (profile: ProductImageProfile) => ProductImageProfile
  ) => {
    if (!selectedProfile) return
    dirtyProfileIds.current.add(selectedProfile.id)
    patchSelectedProfile(updater)
  }

  const replaceSelectedProfile = (currentId: string, nextProfile: ProductImageProfile) => {
    setProfiles((current) => {
      const currentProfile = current.find((profile) => profile.id === currentId)
      const mergedProfile = currentProfile && dirtyProfileIds.current.has(currentId)
        ? preserveProductImageProfileDraft(currentProfile, nextProfile)
        : nextProfile
      return currentProfile
        ? current.map((profile) => profile.id === currentId ? mergedProfile : profile)
        : [mergedProfile, ...current]
    })
    setSelectedProfileId(nextProfile.id)
  }

  const commitSelectedProfile = (currentId: string, nextProfile: ProductImageProfile) => {
    dirtyProfileIds.current.delete(currentId)
    setProfiles((current) => current.some((profile) => profile.id === currentId)
      ? current.map((profile) => profile.id === currentId ? nextProfile : profile)
      : [nextProfile, ...current])
    setSelectedProfileId(nextProfile.id)
  }

  const recordAssetNaturalSize = (asset: ProfileAsset, widthPx: number, heightPx: number) => {
    patchSelectedProfile((profile) => {
      if (asset.widthPx === widthPx && asset.heightPx === heightPx) return profile
      return {
        ...profile,
        assets: profile.assets.map((candidate) =>
          samePhysicalAsset(candidate, asset) || candidate.imageUrl === asset.imageUrl
            ? { ...candidate, widthPx, heightPx }
            : candidate
        )
      }
    })
  }

  useEffect(() => {
    if (!selectedProfile?.backendId || selectedProfile.detailLoaded) {
      setSelectedDetailLoading(false)
      return undefined
    }
    let cancelled = false
    setSelectedDetailLoading(true)
    fetchProductImageProfileDetail(selectedProfile.backendId, { ownerUserId: requestOwnerId, storeCode })
      .then((response) => {
        if (cancelled) return
        const detail = mapBackendProfile(response)
        setProfiles((current) =>
          current.map((profile) => profile.id === selectedProfile.id ? detail : profile)
        )
        setSelectedProfileId(detail.id)
        setLoadError(undefined)
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : '商品图资料详情读取失败')
      })
      .finally(() => {
        if (!cancelled) setSelectedDetailLoading(false)
      })
    return () => { cancelled = true }
  }, [requestOwnerId, selectedProfile?.backendId, selectedProfile?.detailLoaded, selectedProfile?.id, storeCode])

  useEffect(() => {
    const running: SuiteStatus[] = ['PENDING_GENERATION', 'GENERATING', 'REGENERATING', 'PUBLISHING']
    if (!selectedProfile?.backendId
      || !selectedProfile.suites.some((suite) => running.includes(suite.suiteStatus))) return undefined
    let cancelled = false
    const timer = window.setInterval(() => {
      void fetchProductImageProfileDetail(selectedProfile.backendId!, { ownerUserId: requestOwnerId, storeCode })
        .then((response) => {
          if (!cancelled) replaceSelectedProfile(selectedProfile.id, mapBackendProfile(response))
        })
        .catch(() => undefined)
    }, 5000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [requestOwnerId, selectedProfile?.backendId, selectedProfile?.id, selectedProfile?.suites, storeCode])

  return {
    aiCopyText,
    aiPromptSections,
    filteredProfiles,
    filteredSidebarItems,
    imageStatusFilter,
    keyword,
    loadError,
    loading,
    operatorName,
    patchSelectedProfile,
    patchSelectedProfileDraft,
    profilesById,
    readinessFilter,
    recordAssetNaturalSize,
    commitSelectedProfile,
    replaceSelectedProfile,
    requestOwnerId,
    sidebarItems,
    selectedDetailLoading,
    selectedProfile,
    selectedProfileId,
    selectedSkinId,
    setImageStatusFilter,
    setKeyword,
    setReadinessFilter,
    setSelectedProfileId,
    setSelectedSkinId,
    storeCode,
    storeName,
    validActiveSkins
  }
}
