import { App } from 'antd'
import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { ProductSelectionSourceCollection } from '../../source-collection/types'
import { saveManualSelectionGroupListingPrefill } from '../../product-listing/sourcePrefill'
import {
  addManualSelectionAnalysisItems,
  addManualSelectionGroupMaterials,
  createManualSelectionGroup,
  loadManualSelectionGroups
} from '../api'
import {
  buildManualSelectionGroupListingTarget,
  openManualSelectionGroupListingInNewTab
} from '../listingNavigation'
import { isGroupEndpointMissingError } from '../manualSelectionGroupRepository'
import {
  analysisProjectFromGroup,
  groupsFromLegacyAnalysisItems,
  mergeManualSelectionGroups,
  normalizeManualSelectionGroup
} from '../manualSelectionGroupWorkspace'
import { normalizeManualSelectionPageErrorMessage } from '../manualSelectionErrorMessage'
import { defaultAnalysisProjectName } from '../manualSelectionPageModel'
import { createManualSelectionProfitEstimateSeed } from '../profitEstimateSeed'
import type {
  ManualSelectionAnalysisProjectView,
  ManualSelectionGroupView,
  ManualSelectionProfitEstimateSeed
} from '../types'

type Options = {
  storeName: string
  storeCode?: string
  collections: ProductSelectionSourceCollection[]
  analysisCollectionIds: string[]
  analysisProjects: ManualSelectionAnalysisProjectView[]
  setAnalysisGroups: Dispatch<SetStateAction<ManualSelectionGroupView[]>>
  selectedCollectionRowKeys: string[]
  setSelectedCollectionRowKeys: Dispatch<SetStateAction<string[]>>
  handleTabChange: (tab: string) => void
  message: ReturnType<typeof App.useApp>['message']
}

export function useManualSelectionGroupActions(options: Options) {
  const {
    storeName, storeCode, collections, analysisCollectionIds, analysisProjects,
    setAnalysisGroups, selectedCollectionRowKeys, setSelectedCollectionRowKeys,
    handleTabChange, message
  } = options
  const [profitEstimateSeed, setProfitEstimateSeed] = useState<ManualSelectionProfitEstimateSeed | null>(null)
  const [analysisProjectDraftRecords, setAnalysisProjectDraftRecords] = useState<ProductSelectionSourceCollection[]>([])
  const [analysisProjectJoinMode, setAnalysisProjectJoinMode] = useState<'new' | 'existing'>('new')
  const [analysisProjectExistingId, setAnalysisProjectExistingId] = useState<string>()
  const [analysisProjectName, setAnalysisProjectName] = useState('')
  const [analysisProjectError, setAnalysisProjectError] = useState('')
  const [addingAnalysisProject, setAddingAnalysisProject] = useState(false)

  const handleOpenListing = (project: ManualSelectionAnalysisProjectView) => {
    if (!(project.groupId || project.projectId)) {
      message.warning('选品组缺少组编号，无法进入上架')
      return
    }
    const target = buildManualSelectionGroupListingTarget(project, storeCode)
    saveManualSelectionGroupListingPrefill(project, storeCode, project.competitors || [], null)
    if (!openManualSelectionGroupListingInNewTab(project, storeCode)) {
      window.location.assign(target)
    }
  }
  const handleOpenProfitEstimate = async (project: ManualSelectionAnalysisProjectView) => {
    try {
      const groups = (await loadManualSelectionGroups(storeName, storeCode)).map(normalizeManualSelectionGroup)
      setAnalysisGroups(groups)
      const latest = groups.find((group) => group.groupId === project.projectId || group.groupId === project.groupId)
      setProfitEstimateSeed(createManualSelectionProfitEstimateSeed(
        latest ? analysisProjectFromGroup(latest) : project
      ))
    } catch (error) {
      message.warning(`${error instanceof Error ? error.message : '读取最新1688信息失败'}，将使用当前页面数据估算。`)
      setProfitEstimateSeed(createManualSelectionProfitEstimateSeed(project))
    }
  }
  const handleProfitEstimateSaved = async () => {
    try {
      setAnalysisGroups((await loadManualSelectionGroups(storeName, storeCode)).map(normalizeManualSelectionGroup))
    } catch (error) {
      message.warning(error instanceof Error ? error.message : '刷新选品组失败')
    }
  }
  const openAddCollectionsToAnalysis = (records: ProductSelectionSourceCollection[]) => {
    const existingIds = new Set(analysisCollectionIds)
    const candidates = records.filter((record) => record.status === 'success' && !existingIds.has(record.id))
    if (!candidates.length) {
      message.warning('请选择未入组且采集成功的商品')
      return
    }
    setAnalysisProjectDraftRecords(candidates)
    setAnalysisProjectName(defaultAnalysisProjectName(candidates))
    setAnalysisProjectExistingId(undefined)
    setAnalysisProjectJoinMode('new')
    setAnalysisProjectError('')
  }
  const handleConfirmAddCollectionsToAnalysis = async () => {
    if (!analysisProjectDraftRecords.length) return
    const recordIds = analysisProjectDraftRecords.map((record) => record.id)
    const existing = analysisProjects.find((project) => project.projectId === analysisProjectExistingId)
    if (analysisProjectJoinMode === 'existing' && !existing) {
      message.warning('请选择要加入的已有组')
      return
    }
    const projectName = analysisProjectJoinMode === 'existing'
      ? existing?.projectName || ''
      : analysisProjectName.trim() || defaultAnalysisProjectName(analysisProjectDraftRecords)
    setAddingAnalysisProject(true)
    setAnalysisProjectError('')
    try {
      const savedGroup = await (
        analysisProjectJoinMode === 'existing' && existing
          ? addManualSelectionGroupMaterials(existing.projectId, recordIds)
          : createManualSelectionGroup(recordIds, { groupName: projectName })
      ).catch(async (groupError) => {
        const errorMessage = groupError instanceof Error ? groupError.message : undefined
        if (!isGroupEndpointMissingError(errorMessage)) throw groupError
        const items = await addManualSelectionAnalysisItems(recordIds, {
          projectId: analysisProjectJoinMode === 'existing' ? existing?.projectId : undefined,
          projectName
        })
        const compatible = groupsFromLegacyAnalysisItems(items)
        if (analysisProjectJoinMode === 'existing' && existing) {
          return {
            groupId: existing.projectId,
            groupName: existing.projectName,
            materialCount: (existing.records.length || existing.projectMaterialCount || 0) + recordIds.length,
            materials: [
              ...existing.records.map((record) => ({
                groupId: existing.projectId,
                sourceCollectionId: record.id,
                status: 'active',
                sourceCollection: record
              })),
              ...compatible.flatMap((group) => group.materials)
            ],
            procurement: existing.procurement
          } as ManualSelectionGroupView
        }
        return compatible[0]
      })
      setAnalysisGroups((current) => mergeManualSelectionGroups(current, savedGroup ? [savedGroup] : []))
      message.success(`${analysisProjectJoinMode === 'existing' ? '已加入组' : '已创建组'}：${projectName}`)
      setSelectedCollectionRowKeys([])
      resetDraft()
      handleTabChange('analysis')
    } catch (error) {
      const text = normalizeManualSelectionPageErrorMessage(
        error instanceof Error ? error.message : undefined,
        '创建选品组失败'
      )
      setAnalysisProjectError(text)
      message.error(text)
    } finally {
      setAddingAnalysisProject(false)
    }
  }
  const resetDraft = () => {
    setAnalysisProjectDraftRecords([])
    setAnalysisProjectName('')
    setAnalysisProjectExistingId(undefined)
    setAnalysisProjectJoinMode('new')
    setAnalysisProjectError('')
  }

  return {
    profitEstimateSeed, setProfitEstimateSeed,
    analysisProjectDraftRecords, analysisProjectJoinMode, setAnalysisProjectJoinMode,
    analysisProjectExistingId, setAnalysisProjectExistingId,
    analysisProjectName, setAnalysisProjectName, analysisProjectError,
    setAnalysisProjectError, addingAnalysisProject, resetDraft,
    handleOpenListing, handleOpenProfitEstimate, handleProfitEstimateSaved,
    openAddCollectionsToAnalysis, handleConfirmAddCollectionsToAnalysis,
    handleBatchAddToAnalysis: () => openAddCollectionsToAnalysis(
      collections.filter((record) => selectedCollectionRowKeys.includes(record.id))
    )
  }
}
