import type { Dispatch, SetStateAction } from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Dropdown,
  Segmented,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography
} from 'antd';
import {
  CheckCircleOutlined,
  DiffOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  PlusOutlined,
  RollbackOutlined,
  StopOutlined
} from '@ant-design/icons';
import type { FormInstance, UploadFile } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type {
  FileParseAiChunkPayload,
  FileParseLogisticsActivationPayload,
  FileParseLogisticsChannelPayload,
  FileParseSourceRowPayload,
  FileParseValidationIssuePayload,
  FileParseWorkflowPayload
} from './api';
import { AiFileParseProcessPanel } from './AiFileParseProcessPanel';
import {
  CreateBatchDrawer,
  EditResultDrawer,
  FieldCompareModal,
  type CreateBatchFormValues,
  type EditResultFormValues
} from './AiFileParseOverlays';
import {
  keepOldHelp,
  rejectHelp,
  renderActionHelp,
  renderDetailInputItems,
  summarizeInputs,
  targetOutputPlanLabel,
  type VersionCompareRow
} from './boardTransforms';
import {
  getFieldValueClass,
  readFieldDisplayValue
} from './helpers';
import {
  changeTypeMeta,
  confidenceMeta,
  reviewStatusMeta,
  taskStatusMeta,
  validationMeta,
  visibleReviewFilters
} from './meta';
import type {
  AiParseChangeType,
  AiParseConfidence,
  AiParseDocumentStandard,
  AiParseResultItem,
  AiParseReviewStatus,
  AiParseRolePermission,
  AiParseStandardField,
  AiParseTargetOutputPlan,
  AiParseTask,
  AiParseTaskStatus,
  AiParseVersion
} from './types';

const { Text, Title } = Typography;

const LOGISTICS_RELATED_ITEM_LABELS: Record<string, string> = {
  logistics_cargo_category: '分类',
  logistics_base_price: '基础价',
  logistics_surcharge: '附加费',
  logistics_billing_rule: '计费',
  logistics_warehouse_service_fee: '仓费',
  logistics_restriction: '限制'
};

function renderLogisticsRelatedQuoteContext(record: FileParseLogisticsChannelPayload) {
  const counts = record.fields?.relatedItemCounts ?? {};
  const entries = Object.entries(counts)
    .map(([itemType, count]) => [itemType, Number(count)] as const)
    .filter(([, count]) => Number.isFinite(count) && count > 0);
  if (!entries.length) {
    return '-';
  }
  return (
    <Space size={[4, 4]} wrap>
      {entries.map(([itemType, count]) => (
        <Tag key={itemType}>{`${LOGISTICS_RELATED_ITEM_LABELS[itemType] ?? itemType} ${count}`}</Tag>
      ))}
    </Space>
  );
}

type AiFileParseBoardViewProps = {
  actionLoading: boolean;
  aiChunks: FileParseAiChunkPayload[];
  aiChunksError: string;
  allResultFields: AiParseStandardField[];
  blockingItems: AiParseResultItem[];
  comparingItem: AiParseResultItem | null;
  createForm: FormInstance<CreateBatchFormValues>;
  createOpen: boolean;
  createParentTask: AiParseTask | null;
  createTargetPlan: AiParseTargetOutputPlan | undefined;
  detailLoading: boolean;
  detailTab: string;
  editForm: FormInstance<EditResultFormValues>;
  editingItem: AiParseResultItem | null;
  filteredItems: AiParseResultItem[];
  isLogisticsPlan: boolean;
  logisticsActivation: FileParseLogisticsActivationPayload | null;
  logisticsLoading: boolean;
  logisticsVersionId: string;
  onBackToList: () => void;
  onBatchConfirmItems: () => void;
  onCompareBaseVersionChange: (versionId: string) => void;
  onCompareItem: (item: AiParseResultItem) => void;
  onCompareTargetVersionChange: (versionId: string) => void;
  onCreateClose: () => void;
  onCreateSubmit: () => void;
  onCreateTargetPlanChange: (targetPlanId: string) => void;
  onDetailTabChange: (tab: string) => void;
  onEditClose: () => void;
  onEditSave: () => void;
  onExportOverview: () => void;
  onKeepOld: (item: AiParseResultItem) => void;
  onOpenCreate: () => void;
  onOpenUpdateSource: (task: AiParseTask) => void;
  onOpenDetail: (task: AiParseTask, tab?: string) => void;
  onOpenEdit: (item: AiParseResultItem) => void;
  onPublish: () => void;
  onProcessingSelectionChange: (itemIds: string[]) => void;
  onRejectItem: (item: AiParseResultItem) => void;
  onReviewFilterChange: (value: AiParseReviewStatus | 'ALL') => void;
  onRunSelectedTask: () => void;
  onSaveLogisticsActivation: () => void;
  onToggleLogisticsChannel: (channelKey: string, checked: boolean) => void;
  onUploadFilesChange: Dispatch<SetStateAction<UploadFile[]>>;
  overviewItems: AiParseResultItem[];
  pageLoading: boolean;
  permission: AiParseRolePermission;
  processLoading: boolean;
  reviewFilter: AiParseReviewStatus | 'ALL';
  selectedBaseVersion: AiParseVersion | undefined;
  selectedProcessingItemIds: string[];
  selectedLogisticsChannelKeys: string[];
  selectedStandard: AiParseDocumentStandard | undefined;
  selectedTargetVersion: AiParseVersion | undefined;
  selectedTask: AiParseTask | undefined;
  sourceRows: FileParseSourceRowPayload[];
  sortedSelectedVersions: AiParseVersion[];
  targetPlans: AiParseTargetOutputPlan[];
  tasks: AiParseTask[];
  uploadFiles: UploadFile[];
  validationIssues: FileParseValidationIssuePayload[];
  versionCompareRows: VersionCompareRow[];
  viewMode: 'list' | 'detail';
  visibleFields: AiParseStandardField[];
  workflow: FileParseWorkflowPayload | null;
  onCompareClose: () => void;
  onConfirmItem: (item: AiParseResultItem) => void;
  onLogisticsVersionChange: (versionId: string) => void;
};

export function AiFileParseBoardView({
  actionLoading,
  aiChunks,
  aiChunksError,
  allResultFields,
  blockingItems,
  comparingItem,
  createForm,
  createOpen,
  createParentTask,
  createTargetPlan,
  detailLoading,
  detailTab,
  editForm,
  editingItem,
  filteredItems,
  isLogisticsPlan,
  logisticsActivation,
  logisticsLoading,
  logisticsVersionId,
  onBackToList,
  onBatchConfirmItems,
  onCompareBaseVersionChange,
  onCompareClose,
  onCompareItem,
  onCompareTargetVersionChange,
  onConfirmItem,
  onCreateClose,
  onCreateSubmit,
  onCreateTargetPlanChange,
  onDetailTabChange,
  onEditClose,
  onEditSave,
  onExportOverview,
  onKeepOld,
  onLogisticsVersionChange,
  onOpenCreate,
  onOpenUpdateSource,
  onOpenDetail,
  onOpenEdit,
  onPublish,
  onProcessingSelectionChange,
  onRejectItem,
  onReviewFilterChange,
  onRunSelectedTask,
  onSaveLogisticsActivation,
  onToggleLogisticsChannel,
  onUploadFilesChange,
  overviewItems,
  pageLoading,
  permission,
  processLoading,
  reviewFilter,
  selectedBaseVersion,
  selectedProcessingItemIds,
  selectedLogisticsChannelKeys,
  selectedStandard,
  selectedTargetVersion,
  selectedTask,
  sourceRows,
  sortedSelectedVersions,
  targetPlans,
  tasks,
  uploadFiles,
  validationIssues,
  versionCompareRows,
  viewMode,
  visibleFields,
  workflow
}: AiFileParseBoardViewProps) {
  const canBatchConfirmItem = (item: AiParseResultItem) =>
    permission.canDraftEdit
    && selectedTask?.status !== 'published'
    && item.validationStatus !== 'hard_error'
    && item.reviewStatus !== 'confirmed'
    && item.reviewStatus !== 'keep_old'
    && item.reviewStatus !== 'rejected';

  const selectedConfirmableCount = filteredItems.filter(
    (item) => selectedProcessingItemIds.includes(item.id) && canBatchConfirmItem(item)
  ).length;
  const overviewNaturalKeyCounts = overviewItems.reduce((accumulator, item) => {
    if (item.naturalKey) {
      accumulator.set(item.naturalKey, (accumulator.get(item.naturalKey) ?? 0) + 1);
    }
    return accumulator;
  }, new Map<string, number>());
  const overviewDuplicateNaturalKeyCount = Array.from(overviewNaturalKeyCounts.values()).reduce(
    (total, count) => total + Math.max(count - 1, 0),
    0
  );
  const overviewValidationStats = overviewItems.reduce(
    (accumulator, item) => {
      accumulator[item.validationStatus] += 1;
      return accumulator;
    },
    { pass: 0, warning: 0, hard_error: 0 } as Record<AiParseResultItem['validationStatus'], number>
  );

  const taskColumns: ColumnsType<AiParseTask> = [
    {
      title: '文档名称',
      dataIndex: 'documentTitle',
      width: 300,
      render: (value: string, record) => (
        <Space size={4} direction="vertical">
          <Text strong className="ai-file-parse-doc-title">{value}</Text>
          <Tag color="blue">{record.standardVersion}</Tag>
        </Space>
      )
    },
    {
      title: '目标输出方案',
      width: 190,
      render: (_, record) => targetOutputPlanLabel(record, targetPlans)
    },
    {
      title: '输入项',
      width: 190,
      render: (_, record) => summarizeInputs(record)
    },
    {
      title: '解析状态',
      dataIndex: 'status',
      width: 105,
      render: (value: AiParseTaskStatus) => <Tag color={taskStatusMeta[value].color}>{taskStatusMeta[value].label}</Tag>
    },
    {
      title: '待处理',
      width: 340,
      render: (_, record) =>
        record.stats.total || record.stats.deleteSuspected ? (
          <Space size={[4, 6]} wrap className="ai-file-parse-stat-tags-inline">
            <Tag color="default">解析结果 {record.stats.total}</Tag>
            <Tag color="warning">待确认 {record.stats.pending}</Tag>
            <Tag color="error">硬错误 {record.stats.hardErrors}</Tag>
            <Tag color="red">冲突 {record.stats.conflicts}</Tag>
            {record.stats.deleteSuspected ? <Tag color="orange">疑似删除 {record.stats.deleteSuspected}</Tag> : null}
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        )
    },
    {
      title: '当前生效版本',
      dataIndex: 'currentVersion',
      width: 270,
      render: (value: string) => <Text className="ai-file-parse-version-text">{value || '-'}</Text>
    },
    { title: '更新时间', dataIndex: 'updatedAt', width: 150 },
    {
      title: '操作',
      width: 105,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => onOpenDetail(record, 'processing')}>
            详情
          </Button>
        </Space>
      )
    }
  ];

  const resultColumns: ColumnsType<AiParseResultItem> = [
    {
      title: '变化',
      dataIndex: 'changeType',
      width: 95,
      render: (value: AiParseChangeType) => <Tag color={changeTypeMeta[value].color}>{changeTypeMeta[value].label}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'reviewStatus',
      width: 96,
      render: (value: AiParseReviewStatus) => <Tag color={reviewStatusMeta[value].color}>{reviewStatusMeta[value].label}</Tag>
    },
    {
      title: '置信度',
      dataIndex: 'confidence',
      width: 86,
      render: (value: AiParseConfidence) => <Tag color={confidenceMeta[value].color}>{confidenceMeta[value].label}</Tag>
    },
    { title: '结果类型', dataIndex: 'itemTypeLabel', width: 120 },
    ...visibleFields.map<ColumnsType<AiParseResultItem>[number]>((field) => ({
      title: field.label,
      width: field.width ?? 120,
      render: (_, record) => (
        <span className={getFieldValueClass(record, field.key)}>{readFieldDisplayValue(record.fields[field.key])}</span>
      )
    })),
    {
      title: '摘要',
      dataIndex: 'summary',
      width: 240,
      render: (value: string, record) => <span className={changeTypeMeta[record.changeType].className}>{value}</span>
    },
    {
      title: '校验结果',
      width: 180,
      render: (_, record) => (
        <Tooltip title={record.validationMessage}>
          <Tag color={validationMeta[record.validationStatus].color}>{validationMeta[record.validationStatus].label}</Tag>
          <Text type={record.validationStatus === 'hard_error' ? 'danger' : 'secondary'}>{record.validationMessage}</Text>
        </Tooltip>
      )
    },
    {
      title: '来源证据',
      dataIndex: 'evidence',
      width: 230,
      ellipsis: true
    },
    {
      title: '操作',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space size={6}>
          <Button size="small" icon={<DiffOutlined />} onClick={() => onCompareItem(record)}>
            对比
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            disabled={actionLoading || !permission.canDraftEdit || selectedTask?.status === 'published'}
            onClick={() => onOpenEdit(record)}
          >
            编辑
          </Button>
          <Button
            size="small"
            icon={<CheckCircleOutlined />}
            disabled={actionLoading || !canBatchConfirmItem(record)}
            onClick={() => onConfirmItem(record)}
          >
            确认
          </Button>
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                {
                  key: 'keep-old',
                  label: (
                    <Space size={4}>
                      <span>保留旧值</span>
                      {renderActionHelp(keepOldHelp)}
                    </Space>
                  ),
                  icon: <RollbackOutlined />,
                  disabled: actionLoading || !permission.canDraftEdit || selectedTask?.status === 'published' || !record.oldFields
                },
                {
                  key: 'reject',
                  label: (
                    <Space size={4}>
                      <span>驳回</span>
                      {renderActionHelp(rejectHelp)}
                    </Space>
                  ),
                  icon: <StopOutlined />,
                  danger: true,
                  disabled: actionLoading || !permission.canDraftEdit || selectedTask?.status === 'published'
                }
              ],
              onClick: ({ key }) => {
                if (key === 'keep-old') {
                  onKeepOld(record);
                }
                if (key === 'reject') {
                  onRejectItem(record);
                }
              }
            }}
          >
            <Button aria-label="更多操作" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      )
    }
  ];

  const resultOverviewColumns: ColumnsType<AiParseResultItem> = [
    {
      title: '行号',
      width: 70,
      fixed: 'left',
      render: (_, __, index) => index + 1
    },
    {
      title: '结果类型',
      dataIndex: 'itemTypeLabel',
      width: 150,
      fixed: 'left'
    },
    ...allResultFields.map<ColumnsType<AiParseResultItem>[number]>((field) => ({
      title: field.label,
      width: Math.max(field.width ?? 130, 120),
      render: (_, record) => readFieldDisplayValue(record.fields[field.key])
    }))
  ];
  const resultOverviewScrollX =
    220 + allResultFields.reduce((total, field) => total + Math.max(field.width ?? 130, 120), 0);

  const versionColumns: ColumnsType<AiParseVersion> = [
    { title: '版本号', dataIndex: 'versionNo', width: 210 },
    { title: '文档类型', dataIndex: 'documentName', width: 140 },
    { title: '店铺', dataIndex: 'storeLabel', width: 150 },
    {
      title: '目标输出方案',
      dataIndex: 'businessScopeText',
      width: 170,
      render: (value: string, record) =>
        tasks.find((task) => task.id === record.sourceTaskId)
          ? targetOutputPlanLabel(tasks.find((task) => task.id === record.sourceTaskId), targetPlans)
          : value
    },
    { title: '发布时间', dataIndex: 'publishedAt', width: 160 },
    { title: '发布人', dataIndex: 'publisherName', width: 110 },
    { title: '输入项', dataIndex: 'inputSummary', width: 160 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (value: 'active' | 'history' | 'revoked') => {
        const labelMap = { active: '生效', history: '历史', revoked: '撤销' };
        const colorMap = { active: 'success', history: 'default', revoked: 'error' };
        return <Tag color={colorMap[value]}>{labelMap[value]}</Tag>;
      }
    }
  ];

  const logisticsChannelColumns: ColumnsType<FileParseLogisticsChannelPayload> = [
    {
      title: '生效',
      width: 78,
      fixed: 'left',
      render: (_, record) => (
        <Checkbox
          checked={selectedLogisticsChannelKeys.includes(record.channelKey)}
          disabled={!permission.canActivateLogisticsChannels}
          onChange={(event) => onToggleLogisticsChannel(record.channelKey, event.target.checked)}
        />
      )
    },
    { title: '服务线标识', dataIndex: 'channelKey', width: 220 },
    { title: '国家', dataIndex: 'country', width: 90, render: (value) => value || '-' },
    { title: '目的节点', dataIndex: 'city', width: 150, render: (value) => value || '-' },
    { title: '运输方式', dataIndex: 'shippingMethod', width: 120, render: (value) => value || '-' },
    { title: '服务范围', dataIndex: 'feeItem', width: 170, render: (value) => value || '-' },
    { title: '计费/班次', dataIndex: 'billingRule', width: 180, render: (value) => value || '-' },
    { title: '时效', dataIndex: 'leadTime', width: 120, render: (value) => value || '-' },
    { title: '关联报价包', width: 260, render: (_, record) => renderLogisticsRelatedQuoteContext(record) }
  ];

  const renderList = () => (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Card data-testid="file-parse-task-list" variant="borderless" className="ai-file-parse-section ai-file-parse-list-card">
        <div className="ai-file-parse-list-toolbar">
          <Button data-testid="file-parse-create-button" type="primary" icon={<PlusOutlined />} onClick={onOpenCreate}>
            新建解析文档
          </Button>
        </div>
        <Table
          className="ai-file-parse-list-table"
          rowKey="id"
          columns={taskColumns}
          dataSource={tasks}
          loading={pageLoading}
          pagination={false}
          size="middle"
          scroll={{ x: 1500 }}
        />
      </Card>
    </Space>
  );

  const renderDetailSummary = () => {
    if (!selectedTask) {
      return null;
    }
    const detailMetaItems = [
      { label: '落库标准', value: selectedTask.documentName },
      { label: '标准版本', value: selectedTask.standardVersion },
      { label: '当前生效版本', value: selectedTask.currentVersion },
      { label: '解析迭代', value: `第 ${selectedTask.iterationNo ?? 1} 次` },
      { label: '更新时间', value: selectedTask.updatedAt },
      { label: '目标输出方案', value: targetOutputPlanLabel(selectedTask, targetPlans) }
    ];
    const detailMetricItems = [
      { label: '解析结果', value: selectedTask.stats.total, tone: 'default' },
      { label: '待确认', value: selectedTask.stats.pending, tone: 'warning' },
      { label: '需修正', value: selectedTask.stats.needsFix, tone: 'error' },
      { label: '冲突', value: selectedTask.stats.conflicts, tone: 'error' },
      { label: '硬错误', value: selectedTask.stats.hardErrors, tone: 'error' },
      { label: '已确认', value: selectedTask.stats.confirmed, tone: 'success' }
    ];
    return (
      <Card variant="borderless" className="ai-file-parse-section ai-file-parse-detail-summary">
        <div className="ai-file-parse-detail-head">
          <Space direction="vertical" size={4}>
            <Space wrap>
              <Title level={4} style={{ margin: 0 }}>
                {selectedTask.documentTitle}
              </Title>
              <Tag color={taskStatusMeta[selectedTask.status].color}>{taskStatusMeta[selectedTask.status].label}</Tag>
              <Tag color="blue">{targetOutputPlanLabel(selectedTask, targetPlans)}</Tag>
            </Space>
          </Space>
          <Space wrap>
            <Button onClick={onBackToList}>返回列表</Button>
            <Button
              disabled={
                !selectedTask.availableActions?.canCreateTask
                || selectedTask.status === 'reading'
                || selectedTask.status === 'parsing'
                || selectedTask.status === 'retry_waiting'
              }
              onClick={() => onOpenUpdateSource(selectedTask)}
            >
              更新源文件
            </Button>
            {(selectedTask.status === 'failed' || selectedTask.status === 'reading') && (
              <Button loading={actionLoading} disabled={!permission.canDraftEdit} onClick={onRunSelectedTask}>
                {selectedTask.status === 'failed' ? '重新解析' : '发起解析'}
              </Button>
            )}
            <Button
              type="primary"
              loading={actionLoading}
              disabled={!permission.canPublish || selectedTask.status !== 'ready_to_publish'}
              onClick={onPublish}
            >
              发布为新版本
            </Button>
          </Space>
        </div>

        <div className="ai-file-parse-detail-meta">
          {detailMetaItems.map((item) => (
            <div className="ai-file-parse-detail-meta-item" key={item.label}>
              <Text type="secondary">{item.label}</Text>
              <Text strong>{item.value || '-'}</Text>
            </div>
          ))}
        </div>

        <div className="ai-file-parse-input-strip">
          <Text type="secondary">输入项</Text>
          <div className="ai-file-parse-input-strip-content">
            {renderDetailInputItems(selectedTask)}
          </div>
        </div>

        <div className="ai-file-parse-metric-grid">
          {detailMetricItems.map((item) => (
            <div className={`ai-file-parse-metric ai-file-parse-metric-${item.tone}`} key={item.label}>
              <Text type="secondary">{item.label}</Text>
              <strong>{item.value}</strong>
            </div>
          ))}
          {selectedTask.stats.deleteSuspected ? (
            <div className="ai-file-parse-metric ai-file-parse-metric-warning">
              <Text type="secondary">疑似删除</Text>
              <strong>{selectedTask.stats.deleteSuspected}</strong>
            </div>
          ) : null}
        </div>

        {blockingItems.length ? (
          <Alert
            className="ai-file-parse-block-alert"
            type="warning"
            showIcon
            message={`还有 ${blockingItems.length} 条结果需要处理，发布按钮暂不可用。`}
          />
        ) : selectedTask.status === 'parsing' || selectedTask.status === 'reading' ? (
          <Alert className="ai-file-parse-block-alert" type="info" showIcon message="当前文档正在解析，解析结果生成后可查看。" />
        ) : selectedTask.status === 'retry_waiting' ? (
          <Alert
            className="ai-file-parse-block-alert"
            type="info"
            showIcon
            message={`上次解析遇到临时错误，系统将在 ${selectedTask.nextRunAt || '稍后'} 自动重试。`}
          />
        ) : selectedTask.status === 'failed' ? (
          <Alert
            className="ai-file-parse-block-alert"
            type="error"
            showIcon
            message={selectedTask.failureMessage || '解析失败，未生成解析结果。'}
          />
        ) : selectedTask.status === 'ready_to_publish' ? (
          <Alert className="ai-file-parse-block-alert" type="success" showIcon message="解析结果已满足发布条件。" />
        ) : null}
      </Card>
    );
  };

  const renderProcessingTab = () => (
    <Card variant="borderless" className="ai-file-parse-section">
      <div className="ai-file-parse-table-head">
        <Space wrap>
          <Text strong>解析处理</Text>
          <Text type="secondary">查看变动、校验和人工处理状态</Text>
        </Space>
        <Space wrap>
          <Button
            size="small"
            icon={<CheckCircleOutlined />}
            disabled={actionLoading || selectedConfirmableCount === 0}
            onClick={onBatchConfirmItems}
          >
            批量确认{selectedConfirmableCount ? ` ${selectedConfirmableCount}` : ''}
          </Button>
          <Segmented
            value={reviewFilter}
            options={visibleReviewFilters.map((filter) => ({
              label: filter === 'ALL' ? '全部' : reviewStatusMeta[filter].label,
              value: filter
            }))}
            onChange={(value) => onReviewFilterChange(value as AiParseReviewStatus | 'ALL')}
          />
        </Space>
      </div>
      <Table
        rowKey="id"
        rowSelection={{
          selectedRowKeys: selectedProcessingItemIds,
          onChange: (keys) => onProcessingSelectionChange(keys.map(String)),
          getCheckboxProps: (record) => ({
            disabled: !canBatchConfirmItem(record)
          })
        }}
        columns={resultColumns}
        dataSource={filteredItems}
        loading={detailLoading}
        pagination={false}
        size="middle"
        rowClassName={(record) => `ai-file-parse-row ${changeTypeMeta[record.changeType].className}-row`}
        scroll={{ x: 1460 }}
      />
    </Card>
  );

  const renderResultOverviewTab = () => (
    <Card variant="borderless" className="ai-file-parse-section">
      <div className="ai-file-parse-table-head">
        <Space wrap>
          <Text strong>解析总览</Text>
          <Text type="secondary">
            结果 {overviewItems.length} 行 / 自然键 {overviewNaturalKeyCounts.size} 个 / 字段 {allResultFields.length} 个
          </Text>
        </Space>
        <Button size="small" disabled={!selectedTask?.resultId} onClick={onExportOverview}>
          导出结果
        </Button>
      </div>
      <Space size={8} wrap className="ai-file-parse-stat-tags ai-file-parse-overview-stats">
        <Tag color="default">总览结果 {overviewItems.length}</Tag>
        <Tag color="blue">自然键 {overviewNaturalKeyCounts.size}</Tag>
        <Tag color={overviewDuplicateNaturalKeyCount ? 'red' : 'success'}>
          重复自然键 {overviewDuplicateNaturalKeyCount}
        </Tag>
        <Tag color="success">通过 {overviewValidationStats.pass}</Tag>
        <Tag color="warning">警告 {overviewValidationStats.warning}</Tag>
        <Tag color="red">硬错误 {overviewValidationStats.hard_error}</Tag>
        <Tag color="warning">待确认 {selectedTask?.stats.pending ?? 0}</Tag>
        <Tag color="success">已确认 {selectedTask?.stats.confirmed ?? 0}</Tag>
        {selectedTask?.stats.deleteSuspected ? (
          <Tag color="orange">疑似删除 {selectedTask.stats.deleteSuspected}</Tag>
        ) : null}
      </Space>
      <Table
        rowKey="id"
        columns={resultOverviewColumns}
        dataSource={overviewItems}
        loading={detailLoading}
        pagination={false}
        size="middle"
        scroll={{ x: resultOverviewScrollX }}
      />
    </Card>
  );

  const renderProcessTab = () => (
    <AiFileParseProcessPanel
      aiChunks={aiChunks}
      aiChunksError={aiChunksError}
      loading={processLoading}
      sourceRows={sourceRows}
      validationIssues={validationIssues}
      workflow={workflow}
    />
  );

  const renderDiffTab = () => (
    <Card variant="borderless" className="ai-file-parse-section">
      <div className="ai-file-parse-table-head">
        <Space className="ai-file-parse-compare-selects" wrap>
          <Text strong>版本对比</Text>
          <Select
            aria-label="选择基准版本"
            className="ai-file-parse-version-select"
            value={selectedBaseVersion?.id}
            options={sortedSelectedVersions.map((version) => ({
              label: `${version.versionNo} / ${version.publishedAt}`,
              value: version.id,
              disabled: sortedSelectedVersions.length > 1 && version.id === selectedTargetVersion?.id
            }))}
            placeholder="选择基准版本"
            onChange={onCompareBaseVersionChange}
          />
          <Text type="secondary">对比</Text>
          <Select
            aria-label="选择目标版本"
            className="ai-file-parse-version-select"
            value={selectedTargetVersion?.id}
            options={sortedSelectedVersions.map((version) => ({
              label: `${version.versionNo} / ${version.publishedAt}`,
              value: version.id,
              disabled: sortedSelectedVersions.length > 1 && version.id === selectedBaseVersion?.id
            }))}
            placeholder="选择目标版本"
            onChange={onCompareTargetVersionChange}
          />
        </Space>
      </div>
      <Table
        rowKey="id"
        columns={[
          {
            title: '变化',
            dataIndex: 'changeType',
            width: 100,
            render: (value: AiParseChangeType) => <Tag color={changeTypeMeta[value].color}>{changeTypeMeta[value].label}</Tag>
          },
          { title: '结果类型', dataIndex: 'itemTypeLabel', width: 130 },
          {
            title: selectedBaseVersion?.versionNo ?? '基准版本',
            width: 260,
            render: (_, record: VersionCompareRow) =>
              record.baseFields ? (
                <Space direction="vertical" size={2}>
                  {allResultFields.map((field) => (
                    <Text key={field.key} type="secondary">
                      {field.label}：{readFieldDisplayValue(record.baseFields?.[field.key])}
                    </Text>
                  ))}
                </Space>
              ) : (
                '-'
              )
          },
          {
            title: selectedTargetVersion?.versionNo ?? '目标版本',
            width: 300,
            render: (_, record: VersionCompareRow) => (
              <Space direction="vertical" size={2}>
                {allResultFields.map((field) => (
                  <Text
                    key={field.key}
                    className={record.changedFieldKeys.includes(field.key) ? changeTypeMeta[record.changeType].className : ''}
                  >
                    {field.label}：{readFieldDisplayValue(record.targetFields?.[field.key])}
                  </Text>
                ))}
              </Space>
            )
          },
          {
            title: '变化字段',
            width: 160,
            render: (_, record: VersionCompareRow) => record.changedFieldKeys.join('、') || '-'
          },
          {
            title: '校验结果',
            width: 210,
            render: (_, record: VersionCompareRow) => (
              <Space direction="vertical" size={2}>
                <Tag color={validationMeta[record.validationStatus].color}>{validationMeta[record.validationStatus].label}</Tag>
                <Text type={record.validationStatus === 'hard_error' ? 'danger' : 'secondary'}>
                  {record.validationMessage}
                </Text>
              </Space>
            )
          }
        ]}
        dataSource={versionCompareRows}
        loading={detailLoading}
        pagination={false}
        size="middle"
        scroll={{ x: 1020 }}
      />
    </Card>
  );

  const renderLogisticsActivationPanel = () => {
    if (!isLogisticsPlan) {
      return null;
    }
    return (
      <Card variant="borderless" className="ai-file-parse-section">
        <div className="ai-file-parse-table-head">
          <Space wrap>
            <Text strong>物流服务线生效</Text>
            <Select
              className="ai-file-parse-version-select"
              value={logisticsVersionId || undefined}
              placeholder="选择版本"
              options={sortedSelectedVersions.map((version) => ({
                label: `${version.versionNo} / ${version.publishedAt}`,
                value: version.id
              }))}
              onChange={onLogisticsVersionChange}
            />
            <Text type="secondary">
              已选择 {selectedLogisticsChannelKeys.length} / {logisticsActivation?.channels.length ?? 0}
            </Text>
          </Space>
          <Button
            type="primary"
            loading={actionLoading}
            disabled={!permission.canActivateLogisticsChannels || !logisticsVersionId}
            onClick={onSaveLogisticsActivation}
          >
            保存生效服务线
          </Button>
        </div>
        <Table
          rowKey={(record) => `${record.versionItemId}-${record.channelKey}`}
          columns={logisticsChannelColumns}
          dataSource={logisticsActivation?.channels ?? []}
          loading={logisticsLoading}
          pagination={false}
          size="middle"
          scroll={{ x: 1400 }}
        />
      </Card>
    );
  };

  const renderVersionsTab = () => (
    <Space direction="vertical" size={14} style={{ width: '100%' }}>
      {renderLogisticsActivationPanel()}
      <Card variant="borderless" className="ai-file-parse-section">
        <Table
          rowKey="id"
          columns={versionColumns}
          dataSource={sortedSelectedVersions}
          loading={detailLoading}
          pagination={false}
          size="middle"
          scroll={{ x: 1320 }}
        />
      </Card>
    </Space>
  );

  const renderDetail = () => {
    if (!selectedTask) {
      return <Alert type="warning" showIcon message="没有可展示的解析任务" />;
    }
    const hasGeneratedResults = selectedTask.status !== 'parsing'
      && selectedTask.status !== 'retry_waiting'
      && selectedTask.status !== 'reading'
      && selectedTask.status !== 'failed';
    const detailTabs = [
      ...(hasGeneratedResults
        ? [
            { key: 'processing', label: '解析处理', children: renderProcessingTab() },
            { key: 'overview', label: '解析总览', children: renderResultOverviewTab() },
            { key: 'process', label: '解析过程', children: renderProcessTab() },
            { key: 'diff', label: '版本对比', children: renderDiffTab() }
          ]
        : [{ key: 'process', label: '解析过程', children: renderProcessTab() }]),
      { key: 'versions', label: '版本历史', children: renderVersionsTab() }
    ];
    return (
      <Space data-testid="file-parse-detail" direction="vertical" size={14} style={{ width: '100%' }}>
        {renderDetailSummary()}
        <Tabs
          className="ai-file-parse-detail-tabs"
          activeKey={hasGeneratedResults ? detailTab : detailTab === 'versions' ? 'versions' : 'process'}
          onChange={onDetailTabChange}
          items={detailTabs}
        />
      </Space>
    );
  };

  return (
    <Space data-testid="file-parse-workbench" className="ai-file-parse-page" direction="vertical" size={16}>
      {viewMode === 'list' ? renderList() : renderDetail()}

      <CreateBatchDrawer
        form={createForm}
        open={createOpen}
        targetPlans={targetPlans.filter((plan) => plan.availableActions?.canCreateTask)}
        selectedPlan={createTargetPlan}
        parentTask={createParentTask}
        submitting={actionLoading}
        uploadFiles={uploadFiles}
        onClose={onCreateClose}
        onSubmit={onCreateSubmit}
        onTargetPlanChange={onCreateTargetPlanChange}
        onUploadFilesChange={onUploadFilesChange}
      />

      <EditResultDrawer
        form={editForm}
        item={editingItem}
        standard={selectedStandard}
        onClose={onEditClose}
        onSave={onEditSave}
      />

      <FieldCompareModal
        item={comparingItem}
        standard={selectedStandard}
        permission={permission}
        taskPublished={selectedTask?.status === 'published'}
        keepOldHelp={keepOldHelp}
        onClose={onCompareClose}
        onConfirm={onConfirmItem}
        onKeepOld={onKeepOld}
      />
    </Space>
  );
}
