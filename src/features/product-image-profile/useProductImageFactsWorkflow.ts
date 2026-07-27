import { useEffect, useState } from 'react'
import {
  extractProductImageFacts,
  saveProductImageProfile,
  type ProductImageAiExtractionSuggestionView
} from './api'
import {
  applyAllProductImageAiSuggestions,
  applyProductImageAiSuggestionField,
  normalizeProductImageAiSuggestion,
  productImageAiSuggestionFields,
  type ProductImageAiSuggestionFieldKey
} from './aiExtractionDiff'
import type { ProductImageFactsValue } from './ProductImageFactsEditor'
import { buildSaveRequest, mapBackendProfile } from './productImageProfileMapper'
import type { ProductImageProfile } from './productImageProfileTypes'

type Feedback = {
  error: (content: string) => void
  success: (content: string) => void
  warning: (content: string) => void
}

type FactsWorkflowOptions = {
  commitSelectedProfile: (currentId: string, nextProfile: ProductImageProfile) => void
  feedback: Feedback
  patchSelectedProfileDraft: (updater: (profile: ProductImageProfile) => ProductImageProfile) => void
  requestOwnerId: number
  selectedProfile?: ProductImageProfile
  storeCode: string
}

export function useProductImageFactsWorkflow({
  commitSelectedProfile,
  feedback,
  patchSelectedProfileDraft,
  requestOwnerId,
  selectedProfile,
  storeCode
}: FactsWorkflowOptions) {
  const [saving, setSaving] = useState(false)
  const [extractingImageFacts, setExtractingImageFacts] = useState(false)
  const [aiCopyModalOpen, setAiCopyModalOpen] = useState(false)
  const [aiExtractionSuggestion, setAiExtractionSuggestion] =
    useState<ProductImageAiExtractionSuggestionView | null>(null)
  const [aiSuggestionDecisions, setAiSuggestionDecisions] =
    useState<Partial<Record<ProductImageAiSuggestionFieldKey, 'accepted' | 'ignored'>>>({})

  useEffect(() => {
    setAiExtractionSuggestion(null)
    setAiSuggestionDecisions({})
  }, [selectedProfile?.id])

  const persistProfile = async (profile: ProductImageProfile, showSuccess = true) => {
    if (!storeCode) {
      feedback.warning('当前店铺不能为空')
      return undefined
    }
    if (!profile.pskuCode.trim()) {
      feedback.warning('PSKU 不能为空')
      return undefined
    }
    const saved = await saveProductImageProfile(buildSaveRequest(profile, requestOwnerId, storeCode))
    const nextProfile = mapBackendProfile(saved)
    commitSelectedProfile(profile.id, nextProfile)
    if (showSuccess) feedback.success('商品图资料已保存')
    return nextProfile
  }

  const ensureProfileReadyForAssets = async () => {
    if (!selectedProfile) return undefined
    if (!storeCode) {
      feedback.warning('当前店铺不能为空')
      return undefined
    }
    const persistedProfile = selectedProfile.backendId
      ? selectedProfile
      : await persistProfile(selectedProfile, false)
    if (!persistedProfile?.backendId) {
      feedback.error('请先保存商品图资料后再添加基础图')
      return undefined
    }
    return persistedProfile
  }

  const saveCurrentProfile = async () => {
    if (!selectedProfile) return
    if (selectedProfile.backendId && !selectedProfile.detailLoaded) {
      feedback.warning('商品图详情加载中，请稍后再保存')
      return
    }
    setSaving(true)
    try {
      await persistProfile(selectedProfile)
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : '商品图资料保存失败')
    } finally {
      setSaving(false)
    }
  }

  const extractCurrentImageFacts = async () => {
    if (!selectedProfile) return
    if (!storeCode) {
      feedback.warning('当前店铺不能为空')
      return
    }
    setExtractingImageFacts(true)
    try {
      const persistedProfile = selectedProfile.backendId
        ? selectedProfile
        : await persistProfile(selectedProfile, false)
      if (!persistedProfile?.backendId) {
        feedback.error('请先保存商品图资料后再提取')
        return
      }
      const suggestion = await extractProductImageFacts(
        persistedProfile.backendId,
        requestOwnerId,
        storeCode
      )
      setAiExtractionSuggestion(normalizeProductImageAiSuggestion(suggestion))
      setAiSuggestionDecisions({})
      feedback.success('AI 建议已生成，请逐项确认')
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : '商品资料 AI 提取失败')
    } finally {
      setExtractingImageFacts(false)
    }
  }

  const acceptAiSuggestionField = (field: ProductImageAiSuggestionFieldKey) => {
    if (!aiExtractionSuggestion) return
    patchSelectedProfileDraft((profile) =>
      applyProductImageAiSuggestionField(profile, aiExtractionSuggestion, field)
    )
    setAiSuggestionDecisions((current) => ({ ...current, [field]: 'accepted' }))
  }

  const ignoreAiSuggestionField = (field: ProductImageAiSuggestionFieldKey) => {
    setAiSuggestionDecisions((current) => ({ ...current, [field]: 'ignored' }))
  }

  const acceptAllAiSuggestions = () => {
    if (!aiExtractionSuggestion) return
    patchSelectedProfileDraft((profile) =>
      applyAllProductImageAiSuggestions(profile, aiExtractionSuggestion)
    )
    setAiSuggestionDecisions(Object.fromEntries(
      productImageAiSuggestionFields.map((item) => [item.key, 'accepted'])
    ) as Record<ProductImageAiSuggestionFieldKey, 'accepted'>)
    feedback.success('已接受全部 AI 建议；点击保存后才会写入后台')
  }

  const updateProductImageFacts = (value: ProductImageFactsValue) => {
    patchSelectedProfileDraft((profile) => ({
      ...profile,
      specSummary: value.specSummary,
      titleEn: value.titleEn,
      titleAr: value.titleAr,
      heroSellingPoints: value.heroSellingPoints,
      sizeSection: { ...profile.sizeSection, attributesText: value.sizeAttributesText },
      packageList: { ...profile.packageList, attributesText: value.packageAttributesText }
    }))
  }

  const closeAiSuggestion = () => {
    setAiExtractionSuggestion(null)
    setAiSuggestionDecisions({})
  }

  return {
    acceptAiSuggestionField,
    acceptAllAiSuggestions,
    aiCopyModalOpen,
    aiExtractionSuggestion,
    aiSuggestionDecisions,
    closeAiSuggestion,
    ensureProfileReadyForAssets,
    extractCurrentImageFacts,
    extractingImageFacts,
    ignoreAiSuggestionField,
    persistProfile,
    saveCurrentProfile,
    saving,
    setAiCopyModalOpen,
    updateProductImageFacts
  }
}
