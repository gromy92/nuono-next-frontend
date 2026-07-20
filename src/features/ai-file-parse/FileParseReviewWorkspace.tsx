import {
  CheckCircleOutlined,
  DiffOutlined,
  EditOutlined,
  MoreOutlined,
  RollbackOutlined,
  StopOutlined
} from '@ant-design/icons';
import { Button, Card, Dropdown, Segmented, Space, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ActionHelp, keepOldHelp, rejectHelp } from './FileParseInputItems';
import { getFieldValueClass, readFieldDisplayValue } from './helpers';
import {
  changeTypeMeta,
  confidenceMeta,
  reviewStatusMeta,
  validationMeta,
  visibleReviewFilters
} from './meta';
import type {
  AiParseChangeType,
  AiParseConfidence,
  AiParseResultItem,
  AiParseReviewStatus,
  AiParseRolePermission,
  AiParseStandardField,
  AiParseTask
} from './types';

const { Text } = Typography;

type ReviewWorkspaceProps = {
  actionLoading: boolean;
  loading: boolean;
  task: AiParseTask;
  permission: AiParseRolePermission;
  items: AiParseResultItem[];
  visibleFields: AiParseStandardField[];
  reviewFilter: AiParseReviewStatus | 'ALL';
  selectedItemIds: string[];
  onFilterChange: (filter: AiParseReviewStatus | 'ALL') => void;
  onSelectionChange: (itemIds: string[]) => void;
  onBatchConfirm: () => void;
  onCompare: (item: AiParseResultItem) => void;
  onEdit: (item: AiParseResultItem) => void;
  onConfirm: (item: AiParseResultItem) => void;
  onKeepOld: (item: AiParseResultItem) => void;
  onReject: (item: AiParseResultItem) => void;
};

export function FileParseReviewWorkspace(props: ReviewWorkspaceProps) {
  const {
    actionLoading,
    items,
    loading,
    onBatchConfirm,
    onCompare,
    onConfirm,
    onEdit,
    onFilterChange,
    onKeepOld,
    onReject,
    onSelectionChange,
    permission,
    reviewFilter,
    selectedItemIds,
    task,
    visibleFields
  } = props;
  const canConfirm = (item: AiParseResultItem) =>
    permission.canDraftEdit
    && task.status !== 'published'
    && item.validationStatus !== 'hard_error'
    && item.reviewStatus !== 'confirmed'
    && item.reviewStatus !== 'keep_old'
    && item.reviewStatus !== 'rejected';
  const selectedConfirmableCount = items.filter(
    (item) => selectedItemIds.includes(item.id) && canConfirm(item)
  ).length;
  const columns: ColumnsType<AiParseResultItem> = [
    {
      title: '变化', dataIndex: 'changeType', width: 95,
      render: (value: AiParseChangeType) => <Tag color={changeTypeMeta[value].color}>{changeTypeMeta[value].label}</Tag>
    },
    {
      title: '状态', dataIndex: 'reviewStatus', width: 96,
      render: (value: AiParseReviewStatus) => <Tag color={reviewStatusMeta[value].color}>{reviewStatusMeta[value].label}</Tag>
    },
    {
      title: '置信度', dataIndex: 'confidence', width: 86,
      render: (value: AiParseConfidence) => <Tag color={confidenceMeta[value].color}>{confidenceMeta[value].label}</Tag>
    },
    { title: '结果类型', dataIndex: 'itemTypeLabel', width: 120 },
    ...visibleFields.map<ColumnsType<AiParseResultItem>[number]>((field) => ({
      title: field.label,
      width: field.width ?? 120,
      render: (_, item) => (
        <span className={getFieldValueClass(item, field.key)}>{readFieldDisplayValue(item.fields[field.key])}</span>
      )
    })),
    {
      title: '摘要', dataIndex: 'summary', width: 240,
      render: (value: string, item) => <span className={changeTypeMeta[item.changeType].className}>{value}</span>
    },
    {
      title: '校验结果', width: 180,
      render: (_, item) => (
        <Tooltip title={item.validationMessage}>
          <Tag color={validationMeta[item.validationStatus].color}>{validationMeta[item.validationStatus].label}</Tag>
          <Text type={item.validationStatus === 'hard_error' ? 'danger' : 'secondary'}>{item.validationMessage}</Text>
        </Tooltip>
      )
    },
    { title: '来源证据', dataIndex: 'evidence', width: 230, ellipsis: true },
    {
      title: '操作', width: 280, fixed: 'right',
      render: (_, item) => (
        <Space size={6}>
          <Button size="small" icon={<DiffOutlined />} onClick={() => onCompare(item)}>对比</Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            disabled={actionLoading || !permission.canDraftEdit || task.status === 'published'}
            onClick={() => onEdit(item)}
          >
            编辑
          </Button>
          <Button
            size="small"
            icon={<CheckCircleOutlined />}
            disabled={actionLoading || !canConfirm(item)}
            onClick={() => onConfirm(item)}
          >
            确认
          </Button>
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                {
                  key: 'keep-old',
                  label: <Space size={4}><span>保留旧值</span><ActionHelp text={keepOldHelp} /></Space>,
                  icon: <RollbackOutlined />,
                  disabled: actionLoading || !permission.canDraftEdit || task.status === 'published' || !item.oldFields
                },
                {
                  key: 'reject',
                  label: <Space size={4}><span>驳回</span><ActionHelp text={rejectHelp} /></Space>,
                  icon: <StopOutlined />,
                  danger: true,
                  disabled: actionLoading || !permission.canDraftEdit || task.status === 'published'
                }
              ],
              onClick: ({ key }) => key === 'keep-old' ? onKeepOld(item) : onReject(item)
            }}
          >
            <Button aria-label="更多操作" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      )
    }
  ];

  return (
    <Card variant="borderless" className="ai-file-parse-section">
      <div className="ai-file-parse-table-head">
        <Space wrap>
          <Text strong>结果处理</Text>
          <Text type="secondary">查看变动、校验和人工处理状态</Text>
        </Space>
        <Space wrap>
          <Button
            size="small"
            icon={<CheckCircleOutlined />}
            disabled={actionLoading || selectedConfirmableCount === 0}
            onClick={onBatchConfirm}
          >
            批量确认{selectedConfirmableCount ? ` ${selectedConfirmableCount}` : ''}
          </Button>
          <Segmented
            value={reviewFilter}
            options={visibleReviewFilters.map((filter) => ({
              label: filter === 'ALL' ? '全部' : reviewStatusMeta[filter].label,
              value: filter
            }))}
            onChange={(value) => onFilterChange(value as AiParseReviewStatus | 'ALL')}
          />
        </Space>
      </div>
      <Table
        rowKey="id"
        rowSelection={{
          selectedRowKeys: selectedItemIds,
          onChange: (keys) => onSelectionChange(keys.map(String)),
          getCheckboxProps: (item) => ({ disabled: !canConfirm(item) })
        }}
        columns={columns}
        dataSource={items}
        loading={loading}
        pagination={false}
        size="middle"
        rowClassName={(item) => `ai-file-parse-row ${changeTypeMeta[item.changeType].className}-row`}
        scroll={{ x: 1460 }}
      />
    </Card>
  );
}
