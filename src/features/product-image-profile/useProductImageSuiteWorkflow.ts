import { useEffect, useState } from 'react'
import {
  approveProductImageSuite,
  createProductImageSuiteDraft,
  deleteProductImageSuite,
  deleteProductImageSuiteAsset,
  moveProductImageSuiteAsset,
  rejectProductImageSuite,
  retryProductImageSuite
} from './api'
import { missingGenerationProfileFields } from './productImageAssetModel'
import { mapBackendProfile } from './productImageProfileMapper'
import {
  buildReviewAssetPrompts,
  buildReviewAssetTemplate,
  buildReviewRejectPayload
} from './productImageReviewFeedback'
import type {
  ProductImageSuite,
  ProductImageSuiteAsset
} from './productImageProfileTypes'
import type { ProductImageSuiteWorkflowOptions } from './productImageSuiteWorkflowContracts'

export function useProductImageSuiteWorkflow({
  feedback,
  modal,
  onMissingProfile,
  patchSelectedProfile,
  persistProfile,
  replaceSelectedProfile,
  requestOwnerId,
  selectedProfile,
  selectedSkinId,
  storeCode,
  validSkinCount
}: ProductImageSuiteWorkflowOptions) {
  const [creatingSuiteDraft, setCreatingSuiteDraft] = useState(false)
  const [reviewingSuite, setReviewingSuite] = useState<ProductImageSuite | null>(null)
  const [reviewAssetFeedback, setReviewAssetFeedback] = useState('')
  const [reviewOverallComment, setReviewOverallComment] = useState('')
  const [submittingSuiteAction, setSubmittingSuiteAction] = useState(false)
  const [changingSuiteAssetId, setChangingSuiteAssetId] = useState<string>()
  const [deletingSuiteId, setDeletingSuiteId] = useState<string>()
  const [previewSuiteAsset, setPreviewSuiteAsset] = useState<ProductImageSuiteAsset | null>(null)

  useEffect(() => setPreviewSuiteAsset(null), [selectedProfile?.id])

  const createSuiteDraft = async () => {
    if (!selectedProfile || !storeCode) {
      if (!storeCode) feedback.warning('当前店铺不能为空')
      return
    }
    const missing = missingGenerationProfileFields(selectedProfile)
    if (missing.length) {
      modal.confirm({
        title: '请先完成商品基础资料',
        content: `还缺少：${missing.join('、')}。补充完整后再申请做图。`,
        okText: '去完善资料',
        cancelText: '取消',
        onOk: () => onMissingProfile(missing.includes('基础图片') ? 'assets' : 'elements')
      })
      return
    }
    if (!selectedSkinId) {
      feedback.warning(validSkinCount ? '请选择一个皮肤' : '当前店铺没有可用的完整皮肤')
      return
    }
    setCreatingSuiteDraft(true)
    try {
      const profile = await persistProfile(selectedProfile, false)
      if (!profile?.backendId) {
        feedback.error('请先保存商品图资料')
        return
      }
      const saved = await createProductImageSuiteDraft(
        profile.backendId,
        requestOwnerId,
        storeCode,
        selectedSkinId
      )
      replaceSelectedProfile(profile.id, mapBackendProfile(saved))
      feedback.success('已提交做图')
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : '申请做图失败')
    } finally {
      setCreatingSuiteDraft(false)
    }
  }

  const runSuiteAction = async (
    suite: ProductImageSuite,
    action: typeof approveProductImageSuite,
    successText: string,
    failureText: string
  ) => {
    if (!selectedProfile?.backendId || !suite.backendId) return
    setSubmittingSuiteAction(true)
    try {
      const saved = await action(
        selectedProfile.backendId,
        suite.backendId,
        requestOwnerId,
        storeCode
      )
      replaceSelectedProfile(selectedProfile.id, mapBackendProfile(saved))
      feedback.success(successText)
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : failureText)
    } finally {
      setSubmittingSuiteAction(false)
    }
  }

  const approveSuite = (suite: ProductImageSuite) => runSuiteAction(
    suite,
    approveProductImageSuite,
    '审核已通过，正在自动发布到 Noon',
    '审核通过失败'
  )
  const retrySuite = (suite: ProductImageSuite) => runSuiteAction(
    suite,
    retryProductImageSuite,
    '已重新提交任务',
    '重试失败'
  )

  const openRejectSuite = (suite: ProductImageSuite) => {
    setReviewingSuite(suite)
    setReviewAssetFeedback(buildReviewAssetTemplate(buildReviewAssetPrompts(suite.assets)))
    setReviewOverallComment('')
  }

  const submitRejectSuite = async () => {
    if (!selectedProfile?.backendId || !reviewingSuite?.backendId) return
    const payload = buildReviewRejectPayload(
      reviewAssetFeedback,
      reviewOverallComment,
      buildReviewAssetPrompts(reviewingSuite.assets)
    )
    if (!payload) {
      feedback.warning('请填写逐图修改意见或整体意见')
      return
    }
    if (payload.comment.length > 2000) {
      feedback.warning('逐图修改意见和整体意见合计不能超过 2000 字')
      return
    }
    setSubmittingSuiteAction(true)
    try {
      const saved = await rejectProductImageSuite(
        selectedProfile.backendId,
        reviewingSuite.backendId,
        requestOwnerId,
        storeCode,
        payload
      )
      replaceSelectedProfile(selectedProfile.id, mapBackendProfile(saved))
      setReviewingSuite(null)
      feedback.success('审核意见已提交，正在重新做图')
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : '审核不通过提交失败')
    } finally {
      setSubmittingSuiteAction(false)
    }
  }

  const removeSuite = async (suite: ProductImageSuite) => {
    setDeletingSuiteId(suite.id)
    if (selectedProfile?.backendId && suite.backendId) {
      try {
        const saved = await deleteProductImageSuite(
          selectedProfile.backendId,
          suite.backendId,
          requestOwnerId,
          storeCode
        )
        replaceSelectedProfile(selectedProfile.id, mapBackendProfile(saved))
        feedback.success('AI 套图已删除')
      } catch (error) {
        feedback.error(error instanceof Error ? error.message : 'AI 套图删除失败')
      } finally {
        setDeletingSuiteId((current) => current === suite.id ? undefined : current)
      }
      return
    }
    patchSelectedProfile((profile) => ({
      ...profile,
      suites: profile.suites.filter((candidate) => candidate.id !== suite.id)
    }))
    setDeletingSuiteId(undefined)
    feedback.success('AI 套图已删除')
  }

  const moveSuiteAsset = async (
    suite: ProductImageSuite,
    asset: ProductImageSuiteAsset,
    options: { targetSuiteId?: number; targetIndex?: number }
  ) => {
    if (!selectedProfile?.backendId || !suite.backendId || !asset.backendId) {
      feedback.warning('请先保存商品图资料')
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
      feedback.success(options.targetSuiteId && options.targetSuiteId !== suite.backendId
        ? '图片已移动到目标套图'
        : '图片位置已更新')
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'AI 套图图片移动失败')
    } finally {
      setChangingSuiteAssetId(undefined)
    }
  }

  const removeSuiteAsset = async (suite: ProductImageSuite, asset: ProductImageSuiteAsset) => {
    if (!selectedProfile?.backendId || !suite.backendId || !asset.backendId) {
      feedback.warning('请先保存商品图资料')
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
      feedback.success('套图图片已删除')
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'AI 套图图片删除失败')
    } finally {
      setChangingSuiteAssetId(undefined)
    }
  }

  return {
    approveSuite,
    changingSuiteAssetId,
    createSuiteDraft,
    creatingSuiteDraft,
    deletingSuiteId,
    moveSuiteAsset,
    openRejectSuite,
    previewSuiteAsset,
    removeSuite,
    removeSuiteAsset,
    retrySuite,
    reviewAssetFeedback,
    reviewOverallComment,
    reviewingSuite,
    setPreviewSuiteAsset,
    setReviewAssetFeedback,
    setReviewOverallComment,
    setReviewingSuite,
    submitRejectSuite,
    submittingSuiteAction
  }
}
