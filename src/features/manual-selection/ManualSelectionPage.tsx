import { Alert, App, Card, Form, Input, Modal, Radio, Select, Space, Tabs, Tag, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import {
  addManualSelectionAnalysisItems,
  addManualSelectionGroupMaterials,
  analyzeManualSelectionCollection,
  createManualSelectionGroup,
  deleteManualSelectionCollection,
  deleteManualSelectionGroup,
  deleteManualSelectionGroupCompetitor,
  loadManualSelectionGroupProfitEstimate,
  loadManualSelectionGroups,
  recollectManualSelectionGroupCompetitor,
  saveManualSelectionAnalysisItemProcurement,
  saveManualSelectionGroupCompetitors,
  saveManualSelectionGroupName,
  saveManualSelectionGroupProcurement
} from './api'
import { ManualSelectionAnalysisPanel } from './components/ManualSelectionAnalysisPanel'
import { ManualSelectionAiAnalysisModal } from './components/ManualSelectionAiAnalysisModal'
import { ManualSelectionCompetitorModal } from './components/ManualSelectionCompetitorModal'
import { ManualSelectionTable } from './components/ManualSelectionTable'
import { ManualSelectionDetailModal } from './components/ManualSelectionDetailModal'
import { ManualSelectionProfitEstimateModal } from './components/ManualSelectionProfitEstimateModal'
import { ManualSelectionToolbar } from './components/ManualSelectionToolbar'
import { NewCollectionModal } from './components/NewCollectionModal'
import { useManualSelectionCollections } from './hooks/useManualSelectionCollections'
import { collectionFromLinkCompetitor } from './competitorDetailAdapter'
import { openManualSelectionGroupListingInNewTab } from './listingNavigation'
import { normalizeManualSelectionKeyword } from './utils'
import { createManualSelectionProfitEstimateSeed } from './profitEstimateSeed'
import {
  analysisProjectFromGroup,
  groupProcurementPurchasePrice,
  groupsFromLegacyAnalysisItems,
  mergeManualSelectionGroups,
  normalizeManualSelectionGroup,
  replaceGroupCompetitors
} from './manualSelectionGroupWorkspace'
import {
  isGroupEndpointMissingError,
  loadManualSelectionGroupWorkspace
} from './manualSelectionGroupRepository'
import { normalizeManualSelectionPageErrorMessage } from './manualSelectionErrorMessage'
import type { ManualSelectionGroupDeleteMode } from './manualSelectionDeleteOptions'
import { saveManualSelectionGroupListingPrefill } from '../product-listing/sourcePrefill'
import type {
  ManualSelectionAli1688ProcurementInfo,
  ManualSelectionAiAnalysisResult,
  ManualSelectionAnalysisProjectInfo,
  ManualSelectionAnalysisProjectView,
  ManualSelectionCompetitor,
  ManualSelectionGroupProfitEstimateSnapshot,
  ManualSelectionGroupView,
  ManualSelectionPageProps,
  ManualSelectionProfitEstimateSeed,
  ManualSelectionSearchValues,
  NewCollectionValues
} from './types'
import type { ProductSelectionSourceCollection } from '../source-collection/types'
import './ManualSelectionPage.css'

function sourceHostFromUrl(url?: string) {
  if (!url) {
    return ''
  }
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function siteCodeFromStoreCode(storeCode?: string) {
  const normalized = (storeCode || '').trim().toUpperCase()
  if (normalized.includes('NAE') || normalized.endsWith('-AE')) {
    return 'AE'
  }
  if (normalized.includes('NSA') || normalized.endsWith('-SA')) {
    return 'SA'
  }
  return undefined
}

type ManualSelectionTabKey = 'collections' | 'analysis'
type ManualSelectionCompetitorFocus = { kind: 'link' | 'collection'; id: string }

const MANUAL_SELECTION_TAB_QUERY_KEY = 'manualSelectionTab'

function initialManualSelectionTabKey(): ManualSelectionTabKey {
  if (typeof window === 'undefined') {
    return 'collections'
  }
  const tabKey = new URLSearchParams(window.location.search).get(MANUAL_SELECTION_TAB_QUERY_KEY)
  return tabKey === 'analysis' ? 'analysis' : 'collections'
}

function syncManualSelectionTabQuery(tabKey: ManualSelectionTabKey) {
  if (typeof window === 'undefined') {
    return
  }
  const nextUrl = new URL(window.location.href)
  if (tabKey === 'analysis') {
    nextUrl.searchParams.set(MANUAL_SELECTION_TAB_QUERY_KEY, 'analysis')
  } else {
    nextUrl.searchParams.delete(MANUAL_SELECTION_TAB_QUERY_KEY)
  }
  window.history.replaceState(window.history.state, '', nextUrl)
}

function titleFromCompetitorUrl(url?: string) {
  if (!url) {
    return ''
  }
  try {
    const parsedUrl = new URL(url)
    const ignoredPathSegments = new Set([
      'ae-en',
      'ae-ar',
      'amazon',
      'dp',
      'egypt-ar',
      'egypt-en',
      'gp',
      'p',
      'product',
      'saudi-ar',
      'saudi-en',
      'uae-ar',
      'uae-en'
    ])
    const pathSegments = parsedUrl.pathname
      .split('/')
      .map((item) => {
        try {
          return decodeURIComponent(item).trim()
        } catch {
          return item.trim()
        }
      })
      .filter(Boolean)
    const readableSegments = pathSegments
      .filter((item) => /[a-zA-Z\u4e00-\u9fa5]/.test(item))
      .filter((item) => !ignoredPathSegments.has(item.toLowerCase()))
      .sort((left, right) => right.length - left.length)
    const bestSegment = readableSegments[0] || pathSegments[0] || parsedUrl.host
    return bestSegment
      .replace(/[-_+]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  } catch {
    return url
      .replace(/^https?:\/\//, '')
      .replace(/[-_+/?#=&]+/g, ' ')
      .trim()
  }
}

function buildFetchedCompetitor(competitor: ManualSelectionCompetitor): ManualSelectionCompetitor {
  const host = sourceHostFromUrl(competitor.url)
  if (!competitor.url || !host) {
    return {
      ...competitor,
      fetchStatus: 'failed',
      fetchMessage: '链接格式无法识别'
    }
  }
  return {
    ...competitor,
    fetchStatus: 'success',
    fetchedSourceHost: competitor.fetchedSourceHost || host,
    fetchedTitle: competitor.fetchedTitle || titleFromCompetitorUrl(competitor.url),
    fetchedAt: competitor.fetchedAt || new Date().toISOString(),
    fetchMessage: competitor.fetchMessage || '竞品内容已拉取'
  }
}

function defaultAnalysisProjectName(records: ProductSelectionSourceCollection[]) {
  const firstRecord = records[0]
  const firstTitle = firstRecord?.sourceTitleCn || firstRecord?.selectedText || firstRecord?.sourceTitle || ''
  if (!firstTitle) {
    return '未命名选品项目'
  }
  if (records.length <= 1) {
    return firstTitle.slice(0, 60)
  }
  return `${firstTitle.slice(0, 48)} 等${records.length}个素材`
}

export function ManualSelectionPage(props: ManualSelectionPageProps) {
  const { message } = App.useApp()
  const [searchForm] = Form.useForm<ManualSelectionSearchValues>()
  const [newCollectionForm] = Form.useForm<NewCollectionValues>()
  const [newCollectionModalOpen, setNewCollectionModalOpen] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<ProductSelectionSourceCollection | null>(null)
  const [profitEstimateSeed, setProfitEstimateSeed] = useState<ManualSelectionProfitEstimateSeed | null>(null)
  const [competitorModalProject, setCompetitorModalProject] = useState<ManualSelectionAnalysisProjectView | null>(null)
  const [aiAnalysisModalProject, setAiAnalysisModalProject] = useState<ManualSelectionAnalysisProjectView | null>(null)
  const [aiAnalysisResultsByGroupId, setAiAnalysisResultsByGroupId] = useState<Record<string, ManualSelectionAiAnalysisResult>>({})
  const [analyzingCollectionIds, setAnalyzingCollectionIds] = useState<string[]>([])
  const [recollectingCompetitorIds, setRecollectingCompetitorIds] = useState<string[]>([])
  const [deletingCompetitorIds, setDeletingCompetitorIds] = useState<string[]>([])
  const [deletingCollectionIds, setDeletingCollectionIds] = useState<string[]>([])
  const [deletingGroupIds, setDeletingGroupIds] = useState<string[]>([])
  const [activeTabKey, setActiveTabKey] = useState<ManualSelectionTabKey>(() => initialManualSelectionTabKey())
  const [analysisGroups, setAnalysisGroups] = useState<ManualSelectionGroupView[]>([])
  const [analysisGroupsLoading, setAnalysisGroupsLoading] = useState(false)
  const [selectedCollectionRowKeys, setSelectedCollectionRowKeys] = useState<string[]>([])
  const [analysisProjectDraftRecords, setAnalysisProjectDraftRecords] = useState<ProductSelectionSourceCollection[]>([])
  const [analysisProjectJoinMode, setAnalysisProjectJoinMode] = useState<'new' | 'existing'>('new')
  const [analysisProjectExistingId, setAnalysisProjectExistingId] = useState<string>()
  const [analysisProjectName, setAnalysisProjectName] = useState('')
  const [analysisProjectError, setAnalysisProjectError] = useState('')
  const [addingAnalysisProject, setAddingAnalysisProject] = useState(false)
  const currentSiteCode = (props.siteCode || siteCodeFromStoreCode(props.storeCode) || 'SA').toUpperCase()

  const {
    collections,
    filteredCollections,
    filters,
    loading,
    submitting,
    createNewCollection,
    loadCollections,
    recollect,
    setFilters
  } = useManualSelectionCollections(props)

  useEffect(() => {
    let cancelled = false
    setAnalysisGroupsLoading(true)
    loadManualSelectionGroupWorkspace(props.storeName, props.storeCode)
      .then((groups) => {
        if (!cancelled) {
          const normalizedGroups = groups.map(normalizeManualSelectionGroup)
          setAnalysisGroups(normalizedGroups)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          const messageText = normalizeManualSelectionPageErrorMessage(
            error instanceof Error ? error.message : undefined,
            '读取选品分析失败'
          )
          message.error(messageText)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setAnalysisGroupsLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [props.storeName, props.storeCode])

  const analysisCollectionIds = useMemo(() => (
    analysisGroups.flatMap((group) => group.materials.map((material) => material.sourceCollectionId)).filter(Boolean)
  ), [analysisGroups])

  const analysisCollections = useMemo(() => {
    const collectionById = new Map(collections.map((record) => [record.id, record]))
    return analysisGroups
      .flatMap((group) => group.materials)
      .map((material) => material.sourceCollection || collectionById.get(material.sourceCollectionId))
      .filter((record): record is ProductSelectionSourceCollection => Boolean(record))
  }, [analysisGroups, collections])

  const analysisProjectByCollectionId = useMemo<Record<string, ManualSelectionAnalysisProjectInfo>>(() => {
    const projectByCollectionId: Record<string, ManualSelectionAnalysisProjectInfo> = {}
    analysisGroups.forEach((group) => {
      group.materials.forEach((material) => {
        if (!material.sourceCollectionId) {
          return
        }
        projectByCollectionId[material.sourceCollectionId] = {
          projectId: group.groupId,
          projectName: group.groupName || '未命名选品组',
          projectMaterialCount: group.materialCount || group.materials.length || 1
        }
      })
    })
    return projectByCollectionId
  }, [analysisGroups])

  const analysisProjects = useMemo<ManualSelectionAnalysisProjectView[]>(() => {
    const collectionById = new Map(collections.map((record) => [record.id, record]))
    return analysisGroups.map((group) => analysisProjectFromGroup(group, collectionById))
  }, [analysisGroups, collections])

  const ali1688ProcurementInfoByCollectionId = useMemo(() => {
    const procurementInfoByCollectionId: Record<string, ManualSelectionAli1688ProcurementInfo> = {}
    analysisGroups.forEach((group) => {
      group.materials.forEach((material) => {
        procurementInfoByCollectionId[material.sourceCollectionId] = {
          purchaseUrl: group.procurement?.ali1688PurchaseUrl,
          purchasePrice: groupProcurementPurchasePrice(group)
        }
      })
    })
    return procurementInfoByCollectionId
  }, [analysisGroups])

  const visibleCollections = useMemo(() => {
    const linkedStatus = filters.analysisLinkedStatus
    const projectNameKeyword = normalizeManualSelectionKeyword(filters.projectName)
    return filteredCollections.filter((record) => {
      const project = analysisProjectByCollectionId[record.id]
      if (linkedStatus === 'linked' && !project) {
        return false
      }
      if (linkedStatus === 'unlinked' && project) {
        return false
      }
      if (projectNameKeyword) {
        const projectText = normalizeManualSelectionKeyword(project?.projectName || '')
        if (!projectText.includes(projectNameKeyword)) {
          return false
        }
      }
      return true
    })
  }, [analysisProjectByCollectionId, filteredCollections, filters])

  const handleSearch = () => {
    setFilters(searchForm.getFieldsValue())
  }

  const handleTabChange = (nextTabKey: string) => {
    const normalizedTabKey: ManualSelectionTabKey = nextTabKey === 'analysis' ? 'analysis' : 'collections'
    setActiveTabKey(normalizedTabKey)
    syncManualSelectionTabQuery(normalizedTabKey)
  }

  const handleResetSearch = () => {
    searchForm.resetFields()
    setFilters({})
  }

  const handleCreateNewCollection = async (values: NewCollectionValues) => {
    const created = await createNewCollection(values)
    if (created) {
      newCollectionForm.resetFields()
      setNewCollectionModalOpen(false)
    }
  }

  const representativeRecordFromProject = (project: ManualSelectionAnalysisProjectView) => project.records[0]

  const handleOpenListing = async (project: ManualSelectionAnalysisProjectView) => {
    if (!(project.groupId || project.projectId)) {
      message.warning('选品组缺少组编号，无法进入上架')
      return
    }
    const groupId = project.groupId || project.projectId
    let profitEstimate: ManualSelectionGroupProfitEstimateSnapshot | null = null
    try {
      profitEstimate = await loadManualSelectionGroupProfitEstimate(groupId)
    } catch {
      // 上架仍可进入，缺少利润快照时由上架页展示类目缺失校验。
    }
    saveManualSelectionGroupListingPrefill(
      project,
      props.storeCode,
      project.competitors || [],
      profitEstimate
    )
    if (!openManualSelectionGroupListingInNewTab(project)) {
      message.warning('浏览器拦截了上架新标签页，请允许弹窗后重试')
    }
  }

  const handleOpenProfitEstimate = async (project: ManualSelectionAnalysisProjectView) => {
    try {
      const groups = await loadManualSelectionGroups(props.storeName, props.storeCode)
      const normalizedGroups = groups.map(normalizeManualSelectionGroup)
      setAnalysisGroups(normalizedGroups)
      const latestGroup = normalizedGroups.find((group) => (
        group.groupId === project.projectId || group.groupId === project.groupId
      ))
      setProfitEstimateSeed(createManualSelectionProfitEstimateSeed(
        latestGroup ? analysisProjectFromGroup(latestGroup) : project
      ))
    } catch (error) {
      const messageText = error instanceof Error ? error.message : '读取最新1688信息失败'
      message.warning(`${messageText}，将使用当前页面数据估算。`)
      setProfitEstimateSeed(createManualSelectionProfitEstimateSeed(project))
    }
  }

  const handleProfitEstimateSaved = async () => {
    try {
      const groups = await loadManualSelectionGroups(props.storeName, props.storeCode)
      const normalizedGroups = groups.map(normalizeManualSelectionGroup)
      setAnalysisGroups(normalizedGroups)
    } catch (error) {
      const messageText = error instanceof Error ? error.message : '刷新选品组失败'
      message.warning(messageText)
    }
  }

  const openAddCollectionsToAnalysis = (records: ProductSelectionSourceCollection[]) => {
    const existingIdSet = new Set(analysisCollectionIds)
    const analyzableRecords = records.filter((record) => record.status === 'success' && !existingIdSet.has(record.id))
    if (!analyzableRecords.length) {
      message.warning('请选择未入组且采集成功的商品')
      return
    }
    setAnalysisProjectDraftRecords(analyzableRecords)
    setAnalysisProjectName(defaultAnalysisProjectName(analyzableRecords))
    setAnalysisProjectExistingId(undefined)
    setAnalysisProjectJoinMode('new')
    setAnalysisProjectError('')
  }

  const handleConfirmAddCollectionsToAnalysis = async () => {
    const records = analysisProjectDraftRecords
    if (!records.length) {
      return
    }

    const newRecordIds = records.map((record) => record.id)
    const existingProject = analysisProjects.find((project) => project.projectId === analysisProjectExistingId)
    if (analysisProjectJoinMode === 'existing' && !existingProject) {
      message.warning('请选择要加入的已有组')
      return
    }
    const projectName = analysisProjectJoinMode === 'existing'
      ? existingProject?.projectName || ''
      : analysisProjectName.trim() || defaultAnalysisProjectName(records)
    setAddingAnalysisProject(true)
    setAnalysisProjectError('')
    try {
      const savedGroup = await (
        analysisProjectJoinMode === 'existing' && existingProject
          ? addManualSelectionGroupMaterials(existingProject.projectId, newRecordIds)
          : createManualSelectionGroup(newRecordIds, { groupName: projectName })
      ).catch(async (groupError) => {
        const groupErrorMessage = groupError instanceof Error ? groupError.message : undefined
        if (!isGroupEndpointMissingError(groupErrorMessage)) {
          throw groupError
        }
        const createdItems = await addManualSelectionAnalysisItems(newRecordIds, {
          projectId: analysisProjectJoinMode === 'existing' ? existingProject?.projectId : undefined,
          projectName
        })
        const compatibleGroups = groupsFromLegacyAnalysisItems(createdItems)
        if (analysisProjectJoinMode === 'existing' && existingProject) {
          return {
            groupId: existingProject.projectId,
            groupName: existingProject.projectName,
            materialCount: (existingProject.records.length || existingProject.projectMaterialCount || 0) + newRecordIds.length,
            materials: [
              ...existingProject.records.map((record) => ({
                groupId: existingProject.projectId,
                sourceCollectionId: record.id,
                status: 'active',
                sourceCollection: record
              })),
              ...compatibleGroups.flatMap((group) => group.materials)
            ],
            procurement: existingProject.procurement
          } as ManualSelectionGroupView
        }
        return compatibleGroups[0]
      })
      setAnalysisGroups((current) => mergeManualSelectionGroups(current, savedGroup ? [savedGroup] : []))
      message.success(`${analysisProjectJoinMode === 'existing' ? '已加入组' : '已创建组'}：${projectName}`)
      setSelectedCollectionRowKeys([])
      setAnalysisProjectDraftRecords([])
      setAnalysisProjectName('')
      setAnalysisProjectExistingId(undefined)
      setAnalysisProjectJoinMode('new')
      setAnalysisProjectError('')
      handleTabChange('analysis')
    } catch (error) {
      const messageText = normalizeManualSelectionPageErrorMessage(
        error instanceof Error ? error.message : undefined,
        '创建选品组失败'
      )
      setAnalysisProjectError(messageText)
      message.error(messageText)
    } finally {
      setAddingAnalysisProject(false)
    }
  }

  const handleBatchAddToAnalysis = () => {
    const selectedRecords = collections.filter((record) => selectedCollectionRowKeys.includes(record.id))
    openAddCollectionsToAnalysis(selectedRecords)
  }

  const handleOpenAiAnalysis = async (project: ManualSelectionAnalysisProjectView) => {
    const record = representativeRecordFromProject(project)
    if (!record) {
      message.warning('选品组缺少采集素材，无法发起 AI 分析')
      return
    }
    setAiAnalysisModalProject(project)
    setAnalyzingCollectionIds((current) => current.includes(project.projectId) ? current : [...current, project.projectId])
    try {
      const result = await analyzeManualSelectionCollection(record, project.competitors || [])
      setAiAnalysisResultsByGroupId((current) => ({
        ...current,
        [project.projectId]: result
      }))
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
        .then((savedItem) => {
          setAnalysisGroups((current) => mergeManualSelectionGroups(current, groupsFromLegacyAnalysisItems([savedItem])))
        })
        .catch((error) => {
          const messageText = error instanceof Error ? error.message : '保存1688采购信息失败'
          message.error(messageText)
        })
      return
    }
    setAnalysisGroups((current) => current.map((group) => (
      group.groupId === ownerGroup.groupId
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
        : group
    )))
    saveManualSelectionGroupProcurement(ownerGroup.groupId, nextInfo)
      .then((savedGroup) => {
        setAnalysisGroups((current) => mergeManualSelectionGroups(current, [savedGroup]))
      })
      .catch(async (error) => {
        const fallbackSourceCollectionId = ownerGroup.materials[0]?.sourceCollectionId
        if (fallbackSourceCollectionId) {
          try {
            const savedItem = await saveManualSelectionAnalysisItemProcurement(fallbackSourceCollectionId, nextInfo)
            setAnalysisGroups((current) => mergeManualSelectionGroups(current, groupsFromLegacyAnalysisItems([savedItem])))
            return
          } catch {
            // Fall through to the original group-save error.
          }
        }
        const messageText = error instanceof Error ? error.message : '保存1688采购信息失败'
        message.error(messageText)
      })
  }

  const handleChangeGroupName = async (groupId: string, groupName: string) => {
    const savedGroup = await saveManualSelectionGroupName(groupId, groupName)
    setAnalysisGroups((current) => mergeManualSelectionGroups(current, [savedGroup]))
    message.success('组名已保存')
  }

  const handleOpenCompetitors = (
    project: ManualSelectionAnalysisProjectView
  ) => {
    setCompetitorModalProject(project)
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
    const competitor = project.competitors?.find((item, index) => (item.id || item.url || String(index)) === focus.id)
    if (competitor) {
      const index = project.competitors?.indexOf(competitor) ?? 0
      setSelectedCollection(collectionFromLinkCompetitor(project, competitor, index))
      return
    }
    message.warning('没有找到这个竞品详情')
  }

  const handleSaveCompetitors = (project: ManualSelectionAnalysisProjectView, competitors: ManualSelectionCompetitor[]) => {
    const competitorsWithFetchStatus = competitors.map((competitor) => buildFetchedCompetitor({
      ...competitor,
      fetchStatus: 'success' as const,
      fetchMessage: competitor.fetchMessage || '已记录竞品信息'
    }))
    setAnalysisGroups((current) => replaceGroupCompetitors(current, project.projectId, competitorsWithFetchStatus))
    setCompetitorModalProject(null)
    saveManualSelectionGroupCompetitors(project.projectId, competitorsWithFetchStatus)
      .then((savedGroup) => {
        const normalizedGroup = normalizeManualSelectionGroup(savedGroup)
        const savedCompetitors = normalizedGroup.competitors || competitorsWithFetchStatus
        setAnalysisGroups((current) => mergeManualSelectionGroups(current, [normalizedGroup]))
        message.success(`已保存 ${savedCompetitors.length} 个竞品`)
      })
      .catch((error) => {
        const messageText = error instanceof Error ? error.message : '保存竞品失败'
        message.error(messageText)
      })
  }

  const handleRecollectCompetitor = async (
    project: ManualSelectionAnalysisProjectView,
    competitor: ManualSelectionCompetitor
  ) => {
    if (!project.projectId || !competitor.id) {
      message.warning('竞品缺少编号，不能重新采集')
      return
    }
    const loadingKey = `${project.projectId}:${competitor.id}`
    if (recollectingCompetitorIds.includes(loadingKey)) {
      return
    }
    setRecollectingCompetitorIds((current) => [...current, loadingKey])
    try {
      const savedGroup = await recollectManualSelectionGroupCompetitor(project.projectId, competitor.id)
      const normalizedGroup = normalizeManualSelectionGroup(savedGroup)
      const savedCompetitors = normalizedGroup.competitors || []
      setAnalysisGroups((current) => mergeManualSelectionGroups(current, [normalizedGroup]))
      setCompetitorModalProject((current) => (
        current?.projectId === project.projectId
          ? analysisProjectFromGroup(normalizedGroup)
          : current
      ))
      const recollected = savedCompetitors.find((item) => item.id === competitor.id)
      if (recollected?.fetchStatus === 'success') {
        message.success('竞品已重新采集')
      } else {
        message.error(recollected?.fetchMessage || '竞品重新采集失败')
      }
    } catch (error) {
      const messageText = error instanceof Error ? error.message : '竞品重新采集失败'
      message.error(messageText)
    } finally {
      setRecollectingCompetitorIds((current) => current.filter((item) => item !== loadingKey))
    }
  }

  const handleDeleteCompetitor = async (
    project: ManualSelectionAnalysisProjectView,
    competitor: ManualSelectionCompetitor
  ) => {
    if (!project.projectId || !competitor.id) {
      message.warning('竞品缺少编号，不能删除')
      return
    }
    const loadingKey = `${project.projectId}:${competitor.id}`
    if (deletingCompetitorIds.includes(loadingKey)) {
      return
    }
    setDeletingCompetitorIds((current) => [...current, loadingKey])
    try {
      const savedGroup = await deleteManualSelectionGroupCompetitor(project.projectId, competitor.id)
      const normalizedGroup = normalizeManualSelectionGroup(savedGroup)
      const savedCompetitors = normalizedGroup.competitors || []
      setAnalysisGroups((current) => mergeManualSelectionGroups(current, [normalizedGroup]))
      setCompetitorModalProject((current) => (
        current?.projectId === project.projectId
          ? analysisProjectFromGroup(normalizedGroup)
          : current
      ))
      message.success('竞品已删除')
    } catch (error) {
      const messageText = error instanceof Error ? error.message : '删除竞品失败'
      message.error(messageText)
    } finally {
      setDeletingCompetitorIds((current) => current.filter((item) => item !== loadingKey))
    }
  }

  const handleDeleteCollection = async (record: ProductSelectionSourceCollection) => {
    if (analysisCollectionIds.includes(record.id)) {
      message.warning('该采集数据已被选品分析引用，请先在选品分析中解除关联')
      return
    }
    if (deletingCollectionIds.includes(record.id)) {
      return
    }
    setDeletingCollectionIds((current) => [...current, record.id])
    try {
      await deleteManualSelectionCollection(record.id, props.storeCode)
      setSelectedCollectionRowKeys((current) => current.filter((id) => id !== record.id))
      await loadCollections()
      message.success('人工采集数据已删除')
    } catch (error) {
      const messageText = normalizeManualSelectionPageErrorMessage(
        error instanceof Error ? error.message : undefined,
        '删除人工采集数据失败'
      )
      message.error(messageText)
    } finally {
      setDeletingCollectionIds((current) => current.filter((id) => id !== record.id))
    }
  }

  const handleDeleteGroup = async (
    project: ManualSelectionAnalysisProjectView,
    mode: ManualSelectionGroupDeleteMode
  ) => {
    const groupId = project.groupId || project.projectId
    if (deletingGroupIds.includes(groupId)) {
      return
    }
    setDeletingGroupIds((current) => [...current, groupId])
    try {
      await deleteManualSelectionGroup(groupId, mode, props.storeCode)
      setAnalysisGroups((current) => current.filter((group) => group.groupId !== groupId))
      const sourceCollectionIds = new Set(project.records.map((record) => record.id))
      setSelectedCollectionRowKeys((current) => current.filter((id) => !sourceCollectionIds.has(id)))
      await loadCollections()
      try {
        const groups = await loadManualSelectionGroupWorkspace(props.storeName, props.storeCode)
        setAnalysisGroups(groups.map(normalizeManualSelectionGroup))
      } catch (refreshError) {
        message.warning(refreshError instanceof Error ? refreshError.message : '选品分析已更新，请稍后刷新页面')
      }
      message.success(mode === 'group-only' ? '整组选品分析已删除，采集数据已保留' : '整组选品分析和对应采集数据已删除')
    } catch (error) {
      const messageText = normalizeManualSelectionPageErrorMessage(
        error instanceof Error ? error.message : undefined,
        '删除选品分析失败'
      )
      message.error(messageText)
      throw error
    } finally {
      setDeletingGroupIds((current) => current.filter((id) => id !== groupId))
    }
  }

  return (
    <Space className="manual-selection-page" direction="vertical" size={16}>
      <Tabs
        activeKey={activeTabKey}
        onChange={handleTabChange}
        items={[
          {
            key: 'collections',
            label: (
              <span>
                人工采集
              </span>
            ),
            children: (
              <Card bordered={false} bodyStyle={{ padding: 0 }} className="manual-selection-tab-panel">
                <ManualSelectionToolbar
                  form={searchForm}
                  loading={loading}
                  selectedCount={selectedCollectionRowKeys.length}
                  onBatchAddToAnalysis={handleBatchAddToAnalysis}
                  onOpenNewCollection={() => setNewCollectionModalOpen(true)}
                  onRefresh={() => void loadCollections()}
                  onReset={handleResetSearch}
                  onSearch={handleSearch}
                />
                <ManualSelectionTable
                  analysisCollectionIds={analysisCollectionIds}
                  analysisProjectByCollectionId={analysisProjectByCollectionId}
                  dataSource={visibleCollections}
                  deletingCollectionIds={deletingCollectionIds}
                  loading={loading}
                  recollecting={submitting}
                  selectedRowKeys={selectedCollectionRowKeys}
                  onAddToAnalysis={(record) => openAddCollectionsToAnalysis([record])}
                  onDelete={(record) => void handleDeleteCollection(record)}
                  onOpenDetail={setSelectedCollection}
                  onRecollect={(record) => void recollect(record)}
                  onSelectedRowKeysChange={setSelectedCollectionRowKeys}
                />
              </Card>
            )
          },
          {
            key: 'analysis',
            label: '选品分析',
            children: (
              <div className="manual-selection-tab-panel">
                <ManualSelectionAnalysisPanel
                  analyzingCollectionIds={analyzingCollectionIds}
                  dataSource={analysisCollections}
                  projects={analysisProjects}
                  loading={analysisGroupsLoading}
                  deletingCompetitorIds={deletingCompetitorIds}
                  deletingGroupIds={deletingGroupIds}
                  recollectingCompetitorIds={recollectingCompetitorIds}
                  onChangeGroupProcurementInfo={handleChangeAli1688ProcurementInfo}
                  onChangeGroupName={handleChangeGroupName}
                  onDeleteCompetitor={(project, competitor) => void handleDeleteCompetitor(project, competitor)}
                  onDeleteGroup={handleDeleteGroup}
                  onOpenAiAnalysis={(project) => void handleOpenAiAnalysis(project)}
                  onOpenCompetitorDetail={handleOpenCompetitorDetail}
                  onOpenCompetitors={handleOpenCompetitors}
                  onOpenListing={(project) => void handleOpenListing(project)}
                  onOpenProfitEstimate={(project) => void handleOpenProfitEstimate(project)}
                  onRecollectCompetitor={(project, competitor) => void handleRecollectCompetitor(project, competitor)}
                />
              </div>
            )
          }
        ]}
      />

      <ManualSelectionDetailModal
        record={selectedCollection}
        onCancel={() => setSelectedCollection(null)}
      />

      <NewCollectionModal
        open={newCollectionModalOpen}
        form={newCollectionForm}
        submitting={submitting}
        onCancel={() => setNewCollectionModalOpen(false)}
        onSubmit={(values) => void handleCreateNewCollection(values)}
      />

      <ManualSelectionProfitEstimateModal
        open={profitEstimateSeed !== null}
        seed={profitEstimateSeed}
        siteCode={currentSiteCode}
        storeCode={props.storeCode}
        onCancel={() => setProfitEstimateSeed(null)}
        onSaved={() => void handleProfitEstimateSaved()}
      />

      <ManualSelectionAiAnalysisModal
        open={aiAnalysisModalProject !== null}
        record={aiAnalysisModalProject ? representativeRecordFromProject(aiAnalysisModalProject) : null}
        result={aiAnalysisModalProject ? aiAnalysisResultsByGroupId[aiAnalysisModalProject.projectId] : undefined}
        loading={aiAnalysisModalProject ? analyzingCollectionIds.includes(aiAnalysisModalProject.projectId) : false}
        onCancel={() => setAiAnalysisModalProject(null)}
      />

      <ManualSelectionCompetitorModal
        open={competitorModalProject !== null}
        project={competitorModalProject}
        record={competitorModalProject ? representativeRecordFromProject(competitorModalProject) : null}
        competitors={competitorModalProject?.competitors || []}
        recollectingCompetitorIds={recollectingCompetitorIds}
        onCancel={() => {
          setCompetitorModalProject(null)
        }}
        onOpenDetail={setSelectedCollection}
        onRecollectCompetitor={(competitor) => {
          if (competitorModalProject) {
            void handleRecollectCompetitor(competitorModalProject, competitor)
          }
        }}
        onSave={(_, competitors) => {
          if (competitorModalProject) {
            handleSaveCompetitors(competitorModalProject, competitors)
          }
        }}
      />

      <Modal
        title="加入组"
        open={analysisProjectDraftRecords.length > 0}
        width={640}
        okText="加入组"
        cancelText="取消"
        confirmLoading={addingAnalysisProject}
        onCancel={() => {
          if (!addingAnalysisProject) {
            setAnalysisProjectDraftRecords([])
            setAnalysisProjectName('')
            setAnalysisProjectExistingId(undefined)
            setAnalysisProjectJoinMode('new')
            setAnalysisProjectError('')
          }
        }}
        onOk={() => void handleConfirmAddCollectionsToAnalysis()}
        destroyOnClose
      >
        <Space className="manual-selection-project-create" direction="vertical" size={12}>
          <Typography.Paragraph className="manual-selection-project-help" type="secondary">
            一个组可以包含多个采集素材，后续在选品分析里合并判断利润、竞品和上架。
          </Typography.Paragraph>
          {analysisProjectError ? (
            <Alert
              showIcon
              type="error"
              message="加入组失败"
              description={analysisProjectError}
            />
          ) : null}
          <div className="manual-selection-project-selected">
            <Typography.Text type="secondary">已选择素材</Typography.Text>
            <div className="manual-selection-project-selected-list">
              {analysisProjectDraftRecords.map((record) => (
                <Tag
                  className="manual-selection-project-selected-tag"
                  key={record.id}
                  title={`${record.sourcePlatform || '三方'} · ${record.sourceTitleCn || record.sourceTitle || record.id}`}
                >
                  {record.sourcePlatform || '三方'} · {record.sourceTitleCn || record.sourceTitle || record.id}
                </Tag>
              ))}
            </div>
          </div>
          <Radio.Group
            className="manual-selection-project-mode"
            value={analysisProjectJoinMode}
            onChange={(event) => {
              const nextMode = event.target.value as 'new' | 'existing'
              setAnalysisProjectJoinMode(nextMode)
              if (nextMode === 'existing') {
                setAnalysisProjectExistingId((current) => current || analysisProjects[0]?.projectId)
              } else {
                setAnalysisProjectExistingId(undefined)
              }
              setAnalysisProjectError('')
            }}
          >
            <Radio value="new">新建组</Radio>
            <Radio value="existing" disabled={!analysisProjects.length}>加入已有组</Radio>
          </Radio.Group>
          {analysisProjectJoinMode === 'existing' ? (
            <label className="manual-selection-project-name-field">
              <span>选择已有组</span>
              <Select
                data-testid="manual-selection-existing-group-select"
                placeholder="选择已有组"
                value={analysisProjectExistingId}
                style={{ width: '100%' }}
                options={analysisProjects.map((project) => ({
                  value: project.projectId,
                  label: (
                    <span className="manual-selection-project-option" title={project.projectName}>
                      <span className="manual-selection-project-option-name">{project.projectName}</span>
                      <span className="manual-selection-project-option-count">
                        {project.records.length || project.projectMaterialCount || 1} 个素材
                      </span>
                    </span>
                  )
                }))}
                onChange={setAnalysisProjectExistingId}
              />
            </label>
          ) : (
            <label className="manual-selection-project-name-field">
              <span>组名称</span>
              <Input
                value={analysisProjectName}
                maxLength={80}
                placeholder="例如：桌面线缆收纳"
                onChange={(event) => setAnalysisProjectName(event.target.value)}
              />
            </label>
          )}
        </Space>
      </Modal>
    </Space>
  )
}
