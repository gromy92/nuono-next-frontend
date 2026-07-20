import { useMemo, useState } from 'react';
import { App as AntdApp, Space } from 'antd';
import {
  CreateBatchDrawer,
  EditResultDrawer,
  FieldCompareModal
} from './AiFileParseOverlays';
import { keepOldHelp } from './FileParseInputItems';
import { FileParseLogisticsActivation } from './FileParseLogisticsActivation';
import { FileParseOverview } from './FileParseOverview';
import { FileParseReviewWorkspace } from './FileParseReviewWorkspace';
import { FileParseTaskCollection } from './FileParseTaskCollection';
import { FileParseTaskDetail } from './FileParseTaskDetail';
import { FileParseTaskSummary } from './FileParseTaskSummary';
import { FileParseVersionCompare } from './FileParseVersionCompare';
import { FileParseVersionHistory } from './FileParseVersionHistory';
import { isLogisticsTargetPlan } from './fileParseTaskModel';
import { useFileParseCollection } from './useFileParseCollection';
import { useFileParseLogisticsActivation } from './useFileParseLogisticsActivation';
import { useFileParseReviewWorkflow } from './useFileParseReviewWorkflow';
import { useFileParseSnapshot } from './useFileParseSnapshot';
import { useFileParseSourceWorkflow } from './useFileParseSourceWorkflow';
import type { AiParseRolePermission } from './types';
import './aiFileParse.css';

export function AiFileParseBoard() {
  const { message, modal } = AntdApp.useApp();
  const [actionLoading, setActionLoading] = useState(false);
  const collection = useFileParseCollection(message, modal, setActionLoading);
  const snapshot = useFileParseSnapshot({
    messageApi: message,
    targetPlans: collection.targetPlans,
    tasks: collection.tasks,
    setTasks: collection.setTasks,
    selectedTaskId: collection.selectedTaskId,
    viewMode: collection.viewMode
  });
  const permission = useMemo<AiParseRolePermission>(() => ({
    role: 'admin',
    label: '当前账号',
    scope: '当前可见范围',
    canDraftEdit: Boolean(
      snapshot.selectedTask?.availableActions?.canProcess
      ?? snapshot.selectedTargetPlan?.availableActions?.canProcess
    ),
    canPublish: Boolean(
      snapshot.selectedTask?.availableActions?.canPublish
      ?? snapshot.selectedTargetPlan?.availableActions?.canPublish
    ),
    canActivateLogisticsChannels: Boolean(
      snapshot.selectedTask?.availableActions?.canActivateLogisticsChannels
      ?? snapshot.selectedTargetPlan?.availableActions?.canActivateLogisticsChannels
    ),
    canManageStandard: Boolean(
      snapshot.selectedTask?.availableActions?.canManageStandard
      ?? snapshot.selectedTargetPlan?.availableActions?.canManageStandard
    )
  }), [snapshot.selectedTargetPlan, snapshot.selectedTask]);
  const source = useFileParseSourceWorkflow({
    messageApi: message,
    targetPlans: collection.targetPlans,
    selectedTask: snapshot.selectedTask,
    canProcess: permission.canDraftEdit,
    setSelectedTaskId: collection.setSelectedTaskId,
    setViewMode: collection.setViewMode,
    setDetailTab: snapshot.setDetailTab,
    setActionLoading,
    loadTasks: collection.loadTasks,
    loadDetailData: snapshot.loadDetailData
  });
  const review = useFileParseReviewWorkflow({
    messageApi: message,
    modal,
    selectedTask: snapshot.selectedTask,
    selectedItems: snapshot.selectedItems,
    blockingItems: snapshot.blockingItems,
    selectedStandard: snapshot.selectedStandard,
    permission,
    setActionLoading,
    loadTasks: collection.loadTasks,
    loadDetailData: snapshot.loadDetailData
  });
  const isLogisticsPlan = isLogisticsTargetPlan(snapshot.selectedTargetPlan);
  const logistics = useFileParseLogisticsActivation({
    messageApi: message,
    detailTab: snapshot.detailTab,
    isLogisticsPlan,
    targetPlan: snapshot.selectedTargetPlan,
    versions: snapshot.sortedVersions,
    permission,
    setActionLoading
  });
  const task = snapshot.selectedTask;

  const openDetail = (nextTask: Parameters<typeof collection.openDetail>[0]) => {
    snapshot.setDetailTab(collection.openDetail(nextTask));
  };

  const versions = (
    <Space direction="vertical" size={14} style={{ width: '100%' }}>
      {isLogisticsPlan ? (
        <FileParseLogisticsActivation
          versions={snapshot.sortedVersions}
          versionId={logistics.versionId}
          activation={logistics.activation}
          selectedChannelKeys={logistics.selectedChannelKeys}
          permission={permission}
          loading={logistics.loading}
          actionLoading={actionLoading}
          onVersionChange={logistics.setVersionId}
          onToggle={logistics.toggle}
          onSave={logistics.save}
        />
      ) : null}
      <FileParseVersionHistory
        versions={snapshot.sortedVersions}
        tasks={collection.tasks}
        targetPlans={collection.targetPlans}
        loading={snapshot.detailLoading}
      />
    </Space>
  );

  return (
    <Space data-testid="file-parse-workbench" className="ai-file-parse-page" direction="vertical" size={16}>
      {collection.viewMode === 'list' ? (
        <FileParseTaskCollection
          actionLoading={actionLoading}
          loading={collection.pageLoading}
          tasks={collection.tasks}
          targetPlans={collection.targetPlans}
          filters={collection.taskFilters}
          selectedTaskIds={collection.selectedTaskIds}
          onFiltersChange={(filters) => void collection.reloadWithFilters(filters)}
          onFiltersReset={collection.resetFilters}
          onSelectionChange={collection.setSelectedTaskIds}
          onOpenCreate={source.openCreate}
          onOpenDetail={openDetail}
          onDelete={collection.deleteTask}
          onBatchDelete={collection.deleteTasks}
        />
      ) : (
        <FileParseTaskDetail
          task={task}
          activeTab={snapshot.detailTab}
          onTabChange={snapshot.setDetailTab}
          summary={task ? (
            <FileParseTaskSummary
              task={task}
              targetPlans={collection.targetPlans}
              blockingItems={snapshot.blockingItems}
              permission={permission}
              actionLoading={actionLoading}
              onBack={() => collection.setViewMode('list')}
              onUpdateSource={() => source.openUpdate(task)}
              onRun={source.runSelected}
              onPublish={review.publish}
            />
          ) : null}
          processing={task ? (
            <FileParseReviewWorkspace
              actionLoading={actionLoading}
              loading={snapshot.detailLoading}
              task={task}
              permission={permission}
              items={review.filteredItems}
              visibleFields={snapshot.visibleFields}
              reviewFilter={review.reviewFilter}
              selectedItemIds={review.selectedItemIds}
              onFilterChange={review.setReviewFilter}
              onSelectionChange={review.setSelectedItemIds}
              onBatchConfirm={review.batchConfirm}
              onCompare={review.setComparingItem}
              onEdit={review.setEditingItem}
              onConfirm={review.confirm}
              onKeepOld={review.keepOld}
              onReject={review.reject}
            />
          ) : null}
          overview={task ? (
            <FileParseOverview
              task={task}
              items={snapshot.overviewItems}
              fields={snapshot.allResultFields}
              loading={snapshot.detailLoading}
            />
          ) : null}
          comparison={(
            <FileParseVersionCompare
              versions={snapshot.sortedVersions}
              baseVersion={snapshot.selectedBaseVersion}
              targetVersion={snapshot.selectedTargetVersion}
              rows={snapshot.versionCompareRows}
              fields={snapshot.allResultFields}
              loading={snapshot.detailLoading}
              onBaseVersionChange={snapshot.setCompareBaseVersionId}
              onTargetVersionChange={snapshot.setCompareTargetVersionId}
            />
          )}
          versions={versions}
        />
      )}

      <CreateBatchDrawer
        form={source.form}
        open={source.open}
        targetPlans={collection.targetPlans.filter((plan) => plan.availableActions?.canCreateTask)}
        parentTask={source.parentTask}
        submitting={source.submitting}
        uploadFiles={source.uploadFiles}
        onClose={source.close}
        onSubmit={source.submit}
        onTargetPlanChange={source.setTargetPlanId}
        onUploadFilesChange={source.setUploadFiles}
      />
      <EditResultDrawer
        form={review.editForm}
        item={review.editingItem}
        standard={snapshot.selectedStandard}
        onClose={review.closeEdit}
        onSave={review.saveEdit}
      />
      <FieldCompareModal
        item={review.comparingItem}
        standard={snapshot.selectedStandard}
        permission={permission}
        taskPublished={task?.status === 'published'}
        keepOldHelp={keepOldHelp}
        onClose={() => review.setComparingItem(null)}
        onConfirm={review.confirm}
        onKeepOld={review.keepOld}
      />
    </Space>
  );
}
