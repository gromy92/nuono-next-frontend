import { App, Card, Form, Space, Tabs } from 'antd'
import { useState } from 'react'
import { ManualSelectionAnalysisPanel } from './components/ManualSelectionAnalysisPanel'
import { ManualSelectionAddGroupModal } from './components/ManualSelectionAddGroupModal'
import { ManualSelectionAiAnalysisModal } from './components/ManualSelectionAiAnalysisModal'
import { ManualSelectionCompetitorModal } from './components/ManualSelectionCompetitorModal'
import { ManualSelectionTable } from './components/ManualSelectionTable'
import { ManualSelectionDetailModal } from './components/ManualSelectionDetailModal'
import { ManualSelectionProfitEstimateModal } from './components/ManualSelectionProfitEstimateModal'
import { ManualSelectionToolbar } from './components/ManualSelectionToolbar'
import { NewCollectionModal } from './components/NewCollectionModal'
import { useManualSelectionCollections } from './hooks/useManualSelectionCollections'
import { useManualSelectionAnalysisWorkspace } from './hooks/useManualSelectionAnalysisWorkspace'
import { useManualSelectionCompetitorActions } from './hooks/useManualSelectionCompetitorActions'
import { useManualSelectionGroupActions } from './hooks/useManualSelectionGroupActions'
import type {
  ManualSelectionAnalysisProjectView,
  ManualSelectionPageProps,
  ManualSelectionSearchValues,
  NewCollectionValues
} from './types'
import type { ProductSelectionSourceCollection } from '../source-collection/types'
import {
  initialManualSelectionTabKey,
  siteCodeFromStoreCode,
  syncManualSelectionTabQuery,
  type ManualSelectionTabKey
} from './manualSelectionPageModel'
import './ManualSelectionPage.css'

export function ManualSelectionPage(props: ManualSelectionPageProps) {
  const { message } = App.useApp()
  const [searchForm] = Form.useForm<ManualSelectionSearchValues>()
  const [newCollectionForm] = Form.useForm<NewCollectionValues>()
  const [newCollectionModalOpen, setNewCollectionModalOpen] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<ProductSelectionSourceCollection | null>(null)
  const [activeTabKey, setActiveTabKey] = useState<ManualSelectionTabKey>(() => initialManualSelectionTabKey())
  const [selectedCollectionRowKeys, setSelectedCollectionRowKeys] = useState<string[]>([])
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

  const analysisWorkspace = useManualSelectionAnalysisWorkspace({
    storeName: props.storeName,
    storeCode: props.storeCode,
    collections,
    filteredCollections,
    filters,
    message
  })
  const {
    analysisGroups, setAnalysisGroups, analysisGroupsLoading,
    analysisCollectionIds, analysisCollections, analysisProjectByCollectionId,
    analysisProjects, ali1688ProcurementInfoByCollectionId, visibleCollections
  } = analysisWorkspace

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
  const groupActions = useManualSelectionGroupActions({
    storeName: props.storeName,
    storeCode: props.storeCode,
    collections,
    analysisCollectionIds,
    analysisProjects,
    setAnalysisGroups,
    selectedCollectionRowKeys,
    setSelectedCollectionRowKeys,
    handleTabChange,
    message
  })
  const {
    profitEstimateSeed, setProfitEstimateSeed,
    analysisProjectDraftRecords, analysisProjectJoinMode, setAnalysisProjectJoinMode,
    analysisProjectExistingId, setAnalysisProjectExistingId,
    analysisProjectName, setAnalysisProjectName, analysisProjectError,
    setAnalysisProjectError, addingAnalysisProject, resetDraft,
    handleOpenListing, handleOpenProfitEstimate, handleProfitEstimateSaved,
    openAddCollectionsToAnalysis, handleConfirmAddCollectionsToAnalysis,
    handleBatchAddToAnalysis
  } = groupActions

  const competitorActions = useManualSelectionCompetitorActions({
    analysisGroups,
    setAnalysisGroups,
    ali1688ProcurementInfoByCollectionId,
    setSelectedCollection,
    message
  })
  const {
    competitorModalProject, setCompetitorModalProject,
    aiAnalysisModalProject, setAiAnalysisModalProject,
    aiAnalysisResultsByGroupId, analyzingCollectionIds,
    recollectingCompetitorIds, deletingCompetitorIds,
    handleOpenAiAnalysis, handleChangeAli1688ProcurementInfo,
    handleChangeGroupName, handleOpenCompetitors, handleOpenCompetitorDetail,
    handleSaveCompetitors, handleRecollectCompetitor, handleDeleteCompetitor
  } = competitorActions

  return (
    <Space className="manual-selection-page" direction="vertical" size={10}>
      <Tabs
        size="small"
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
              <Card
                variant="borderless"
                styles={{ body: { padding: 0 } }}
                className="manual-selection-tab-panel"
              >
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
                  loading={loading}
                  recollecting={submitting}
                  selectedRowKeys={selectedCollectionRowKeys}
                  onAddToAnalysis={(record) => openAddCollectionsToAnalysis([record])}
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
                  recollectingCompetitorIds={recollectingCompetitorIds}
                  onChangeGroupProcurementInfo={handleChangeAli1688ProcurementInfo}
                  onChangeGroupName={handleChangeGroupName}
                  onDeleteCompetitor={(project, competitor) => void handleDeleteCompetitor(project, competitor)}
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

      <ManualSelectionAddGroupModal
        records={analysisProjectDraftRecords}
        joinMode={analysisProjectJoinMode}
        setJoinMode={setAnalysisProjectJoinMode}
        existingId={analysisProjectExistingId}
        setExistingId={setAnalysisProjectExistingId}
        projectName={analysisProjectName}
        setProjectName={setAnalysisProjectName}
        error={analysisProjectError}
        clearError={() => setAnalysisProjectError('')}
        adding={addingAnalysisProject}
        projects={analysisProjects}
        onCancel={() => {
          if (!addingAnalysisProject) resetDraft()
        }}
        onConfirm={() => void handleConfirmAddCollectionsToAnalysis()}
      />
    </Space>
  )
}
