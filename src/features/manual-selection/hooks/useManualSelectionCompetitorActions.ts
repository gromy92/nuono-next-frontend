import { App } from 'antd'
import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { ProductSelectionSourceCollection } from '../../source-collection/types'
import {
  analyzeManualSelectionCollection,
  deleteManualSelectionGroupCompetitor,
  recollectManualSelectionGroupCompetitor,
  saveManualSelectionAnalysisItemProcurement,
  saveManualSelectionGroupCompetitors,
  saveManualSelectionGroupName,
  saveManualSelectionGroupProcurement
} from '../api'
import { collectionFromLinkCompetitor } from '../competitorDetailAdapter'
import {
  analysisProjectFromGroup,
  groupProcurementPurchasePrice,
  groupsFromLegacyAnalysisItems,
  mergeManualSelectionGroups,
  normalizeManualSelectionGroup,
  replaceGroupCompetitors
} from '../manualSelectionGroupWorkspace'
import { buildFetchedCompetitor, type ManualSelectionCompetitorFocus } from '../manualSelectionPageModel'
import type {
  ManualSelectionAiAnalysisResult,
  ManualSelectionAli1688ProcurementInfo,
  ManualSelectionAnalysisProjectView,
  ManualSelectionCompetitor,
  ManualSelectionGroupView
} from '../types'

type Options = {
  analysisGroups: ManualSelectionGroupView[]
  setAnalysisGroups: Dispatch<SetStateAction<ManualSelectionGroupView[]>>
  ali1688ProcurementInfoByCollectionId: Record<string, ManualSelectionAli1688ProcurementInfo>
  setSelectedCollection: Dispatch<SetStateAction<ProductSelectionSourceCollection | null>>
  message: ReturnType<typeof App.useApp>['message']
}

export function useManualSelectionCompetitorActions({
  analysisGroups,
  setAnalysisGroups,
  ali1688ProcurementInfoByCollectionId,
  setSelectedCollection,
  message
}: Options) {
  const [competitorModalProject, setCompetitorModalProject] = useState<ManualSelectionAnalysisProjectView | null>(null)
  const [aiAnalysisModalProject, setAiAnalysisModalProject] = useState<ManualSelectionAnalysisProjectView | null>(null)
  const [aiAnalysisResultsByGroupId, setAiAnalysisResultsByGroupId] = useState<Record<string, ManualSelectionAiAnalysisResult>>({})
  const [analyzingCollectionIds, setAnalyzingCollectionIds] = useState<string[]>([])
  const [recollectingCompetitorIds, setRecollectingCompetitorIds] = useState<string[]>([])
  const [deletingCompetitorIds, setDeletingCompetitorIds] = useState<string[]>([])

  const handleOpenAiAnalysis = async (project: ManualSelectionAnalysisProjectView) => {
    const record = project.records[0]
    if (!record) {
      message.warning('选品组缺少采集素材，无法发起 AI 分析')
      return
    }
    setAiAnalysisModalProject(project)
    setAnalyzingCollectionIds((current) => current.includes(project.projectId)
      ? current
      : [...current, project.projectId])
    try {
      const result = await analyzeManualSelectionCollection(record, project.competitors || [])
      setAiAnalysisResultsByGroupId((current) => ({ ...current, [project.projectId]: result }))
      if (result.status !== 'success') {
        message.warning(result.errorMessage || 'AI 选品分析暂不可用')
      }
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'AI 选品分析失败'
      setAiAnalysisResultsByGroupId((current) => ({
        ...current,
        [project.projectId]: {
          status: 'failed',
          sourceCollectionId: project.projectId,
          errorMessage: messageText,
          recommendationLevel: 'unknown',
          recommendationScore: 0
        }
      }))
      message.error(messageText)
    } finally {
      setAnalyzingCollectionIds((current) => current.filter((item) => item !== project.projectId))
    }
  }

  const handleChangeAli1688ProcurementInfo = (
    groupOrCollectionId: string,
    values: Partial<ManualSelectionAli1688ProcurementInfo>
  ) => {
    const ownerGroup = analysisGroups.find((group) => (
      group.groupId === groupOrCollectionId
      || group.materials.some((material) => material.sourceCollectionId === groupOrCollectionId)
    ))
    const nextInfo = {
      ...(ownerGroup?.procurement
        ? {
            purchaseUrl: ownerGroup.procurement.ali1688PurchaseUrl,
            purchasePrice: groupProcurementPurchasePrice(ownerGroup)
          }
        : ali1688ProcurementInfoByCollectionId[groupOrCollectionId] || {}),
      ...values
    }
    if (!ownerGroup) {
      saveManualSelectionAnalysisItemProcurement(groupOrCollectionId, nextInfo)
        .then((item) => setAnalysisGroups((current) => (
          mergeManualSelectionGroups(current, groupsFromLegacyAnalysisItems([item]))
        )))
        .catch((error) => message.error(error instanceof Error ? error.message : '保存1688采购信息失败'))
      return
    }
    setAnalysisGroups((current) => current.map((group) => group.groupId === ownerGroup.groupId
      ? normalizeManualSelectionGroup({
          ...group,
          procurement: {
            ...(group.procurement || {}),
            ali1688PurchaseUrl: nextInfo.purchaseUrl,
            purchasePriceRmb: nextInfo.purchasePrice,
            purchasePrice: nextInfo.purchasePrice,
            status: 'active'
          }
        })
      : group))
    saveManualSelectionGroupProcurement(ownerGroup.groupId, nextInfo)
      .then((group) => setAnalysisGroups((current) => mergeManualSelectionGroups(current, [group])))
      .catch(async (error) => {
        const fallbackId = ownerGroup.materials[0]?.sourceCollectionId
        if (fallbackId) {
          try {
            const item = await saveManualSelectionAnalysisItemProcurement(fallbackId, nextInfo)
            setAnalysisGroups((current) => mergeManualSelectionGroups(
              current,
              groupsFromLegacyAnalysisItems([item])
            ))
            return
          } catch {
            // Report the original group-save failure below.
          }
        }
        message.error(error instanceof Error ? error.message : '保存1688采购信息失败')
      })
  }

  const handleChangeGroupName = async (groupId: string, groupName: string) => {
    const savedGroup = await saveManualSelectionGroupName(groupId, groupName)
    setAnalysisGroups((current) => mergeManualSelectionGroups(current, [savedGroup]))
    message.success('组名已保存')
  }
  const handleOpenCompetitorDetail = (
    project: ManualSelectionAnalysisProjectView,
    focus: ManualSelectionCompetitorFocus
  ) => {
    if (focus.kind === 'collection') {
      const record = project.records.find((item) => item.id === focus.id)
      if (record) {
        setSelectedCollection(record)
        return
      }
    }
    const competitor = project.competitors?.find((item, index) => (
      (item.id || item.url || String(index)) === focus.id
    ))
    if (competitor) {
      setSelectedCollection(collectionFromLinkCompetitor(
        project,
        competitor,
        project.competitors?.indexOf(competitor) ?? 0
      ))
    } else {
      message.warning('没有找到这个竞品详情')
    }
  }
  const handleSaveCompetitors = (
    project: ManualSelectionAnalysisProjectView,
    competitors: ManualSelectionCompetitor[]
  ) => {
    const next = competitors.map((competitor) => buildFetchedCompetitor({
      ...competitor,
      fetchStatus: 'success',
      fetchMessage: competitor.fetchMessage || '已记录竞品信息'
    }))
    setAnalysisGroups((current) => replaceGroupCompetitors(current, project.projectId, next))
    setCompetitorModalProject(null)
    saveManualSelectionGroupCompetitors(project.projectId, next)
      .then((group) => {
        const normalized = normalizeManualSelectionGroup(group)
        setAnalysisGroups((current) => mergeManualSelectionGroups(current, [normalized]))
        message.success(`已保存 ${(normalized.competitors || next).length} 个竞品`)
      })
      .catch((error) => message.error(error instanceof Error ? error.message : '保存竞品失败'))
  }

  const updateCompetitor = async (
    action: 'recollect' | 'delete',
    project: ManualSelectionAnalysisProjectView,
    competitor: ManualSelectionCompetitor
  ) => {
    if (!project.projectId || !competitor.id) {
      message.warning(`竞品缺少编号，不能${action === 'delete' ? '删除' : '重新采集'}`)
      return
    }
    const key = `${project.projectId}:${competitor.id}`
    const activeIds = action === 'delete' ? deletingCompetitorIds : recollectingCompetitorIds
    const setActiveIds = action === 'delete' ? setDeletingCompetitorIds : setRecollectingCompetitorIds
    if (activeIds.includes(key)) return
    setActiveIds((current) => [...current, key])
    try {
      const saved = action === 'delete'
        ? await deleteManualSelectionGroupCompetitor(project.projectId, competitor.id)
        : await recollectManualSelectionGroupCompetitor(project.projectId, competitor.id)
      const normalized = normalizeManualSelectionGroup(saved)
      setAnalysisGroups((current) => mergeManualSelectionGroups(current, [normalized]))
      setCompetitorModalProject((current) => current?.projectId === project.projectId
        ? analysisProjectFromGroup(normalized)
        : current)
      const updated = normalized.competitors?.find((item) => item.id === competitor.id)
      if (action === 'delete') {
        message.success('竞品已删除')
      } else if (updated?.fetchStatus === 'success') {
        message.success('竞品已重新采集')
      } else {
        message.error(updated?.fetchMessage || '竞品重新采集失败')
      }
    } catch (error) {
      message.error(error instanceof Error
        ? error.message
        : action === 'delete' ? '删除竞品失败' : '竞品重新采集失败')
    } finally {
      setActiveIds((current) => current.filter((item) => item !== key))
    }
  }

  return {
    competitorModalProject, setCompetitorModalProject,
    aiAnalysisModalProject, setAiAnalysisModalProject,
    aiAnalysisResultsByGroupId, analyzingCollectionIds,
    recollectingCompetitorIds, deletingCompetitorIds,
    handleOpenAiAnalysis, handleChangeAli1688ProcurementInfo, handleChangeGroupName,
    handleOpenCompetitors: setCompetitorModalProject, handleOpenCompetitorDetail,
    handleSaveCompetitors,
    handleRecollectCompetitor: (project: ManualSelectionAnalysisProjectView, competitor: ManualSelectionCompetitor) => (
      updateCompetitor('recollect', project, competitor)
    ),
    handleDeleteCompetitor: (project: ManualSelectionAnalysisProjectView, competitor: ManualSelectionCompetitor) => (
      updateCompetitor('delete', project, competitor)
    )
  }
}
