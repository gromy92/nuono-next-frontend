import { DeleteOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Input, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { FileParseInputItems } from './FileParseInputItems';
import { targetOutputPlanLabel } from './fileParseTaskModel';
import { taskStatusMeta } from './meta';
import type {
  AiParseTargetOutputPlan,
  AiParseTask,
  AiParseTaskFilters,
  AiParseTaskStatus
} from './types';

const { Text } = Typography;
const TASK_STATUSES: AiParseTaskStatus[] = [
  'reading',
  'parsing',
  'retry_waiting',
  'review_required',
  'ready_to_publish',
  'published',
  'failed'
];

type TaskCollectionProps = {
  actionLoading: boolean;
  loading: boolean;
  tasks: AiParseTask[];
  targetPlans: AiParseTargetOutputPlan[];
  filters: AiParseTaskFilters;
  selectedTaskIds: string[];
  onFiltersChange: (filters: AiParseTaskFilters) => void;
  onFiltersReset: () => void;
  onSelectionChange: (taskIds: string[]) => void;
  onOpenCreate: () => void;
  onOpenDetail: (task: AiParseTask) => void;
  onDelete: (task: AiParseTask) => void;
  onBatchDelete: (tasks: AiParseTask[]) => void;
};

export function FileParseTaskCollection(props: TaskCollectionProps) {
  const {
    actionLoading,
    filters,
    loading,
    onBatchDelete,
    onDelete,
    onFiltersChange,
    onFiltersReset,
    onOpenCreate,
    onOpenDetail,
    onSelectionChange,
    selectedTaskIds,
    targetPlans,
    tasks
  } = props;
  const selectedIds = new Set(selectedTaskIds);
  const selectedTasks = tasks.filter((task) => selectedIds.has(task.id));
  const columns: ColumnsType<AiParseTask> = [
    {
      title: '文档名称',
      dataIndex: 'documentTitle',
      width: 300,
      render: (value: string, task) => (
        <Space size={4} direction="vertical">
          <Text strong className="ai-file-parse-doc-title">{value}</Text>
          <Tag color="blue">{task.standardVersion}</Tag>
        </Space>
      )
    },
    {
      title: '目标输出方案',
      width: 190,
      render: (_, task) => targetOutputPlanLabel(task, targetPlans)
    },
    {
      title: '输入项',
      width: 190,
      render: (_, task) => <FileParseInputItems task={task} compact />
    },
    {
      title: '解析状态',
      dataIndex: 'status',
      width: 105,
      render: (status: AiParseTaskStatus) => (
        <Tag color={taskStatusMeta[status].color}>{taskStatusMeta[status].label}</Tag>
      )
    },
    {
      title: '待处理',
      width: 340,
      render: (_, task) => {
        const stats = [
          { label: '解析结果', value: task.stats.total, color: 'default' },
          { label: '待确认', value: task.stats.pending, color: 'warning' },
          { label: '硬错误', value: task.stats.hardErrors, color: 'error' },
          { label: '冲突', value: task.stats.conflicts, color: 'red' },
          { label: '疑似删除', value: task.stats.deleteSuspected, color: 'orange' }
        ].filter((item) => item.value > 0);
        return stats.length ? (
          <Space size={[4, 6]} wrap className="ai-file-parse-stat-tags-inline">
            {stats.map((item) => <Tag key={item.label} color={item.color}>{item.label} {item.value}</Tag>)}
          </Space>
        ) : <Text type="secondary">-</Text>;
      }
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
      width: 170,
      render: (_, task) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => onOpenDetail(task)}>详情</Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            disabled={actionLoading || !task.availableActions?.canCreateTask}
            onClick={() => onDelete(task)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  return (
    <Card
      data-testid="file-parse-task-list"
      variant="borderless"
      className="ai-file-parse-section ai-file-parse-list-card"
    >
      <div className="ai-file-parse-list-toolbar">
        <Space data-testid="file-parse-task-filter-bar" className="ai-file-parse-task-filters" wrap>
          <Select
            aria-label="目标输出方案筛选"
            className="ai-file-parse-filter-select"
            data-testid="file-parse-target-plan-filter"
            value={filters.targetPlanId || 'ALL'}
            options={[
              { label: '全部目标输出方案', value: 'ALL' },
              ...targetPlans.map((plan) => ({ label: plan.label, value: plan.id }))
            ]}
            onChange={(value) => onFiltersChange({
              ...filters,
              targetPlanId: value === 'ALL' ? '' : value
            })}
          />
          <Select
            aria-label="解析状态筛选"
            className="ai-file-parse-filter-select"
            data-testid="file-parse-status-filter"
            value={filters.status || 'ALL'}
            options={[
              { label: '全部状态', value: 'ALL' },
              ...TASK_STATUSES.map((status) => ({ label: taskStatusMeta[status].label, value: status }))
            ]}
            onChange={(value) => onFiltersChange({
              ...filters,
              status: value === 'ALL' ? '' : value as AiParseTaskStatus
            })}
          />
          <Input.Search
            allowClear
            className="ai-file-parse-keyword-filter"
            placeholder="搜索文档名或任务号"
            value={filters.keyword}
            onChange={(event) => onFiltersChange({ ...filters, keyword: event.target.value })}
            onSearch={(keyword) => onFiltersChange({ ...filters, keyword })}
          />
          <Button onClick={onFiltersReset}>重置筛选</Button>
        </Space>
        <Space className="ai-file-parse-list-actions" wrap>
          {selectedTasks.length ? <Text type="secondary">已选择 {selectedTasks.length} 个</Text> : null}
          <Button
            danger
            data-testid="file-parse-bulk-delete-button"
            disabled={actionLoading || !selectedTasks.length}
            icon={<DeleteOutlined />}
            onClick={() => onBatchDelete(selectedTasks)}
          >
            批量删除
          </Button>
          <Button data-testid="file-parse-create-button" type="primary" icon={<PlusOutlined />} onClick={onOpenCreate}>
            新建解析文档
          </Button>
        </Space>
      </div>
      <Table
        className="ai-file-parse-list-table"
        rowKey="id"
        rowSelection={{
          selectedRowKeys: selectedTaskIds,
          onChange: (keys) => onSelectionChange(keys.map(String)),
          getCheckboxProps: (task) => ({
            disabled: actionLoading || !task.availableActions?.canCreateTask
          })
        }}
        columns={columns}
        dataSource={tasks}
        loading={loading}
        pagination={false}
        size="middle"
        scroll={{ x: 1500 }}
      />
    </Card>
  );
}
