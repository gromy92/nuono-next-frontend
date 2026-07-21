import { Alert, Button, Card, Space, Tag, Typography } from 'antd';
import { FileParseInputItems } from './FileParseInputItems';
import { targetOutputPlanLabel } from './fileParseTaskModel';
import { taskStatusMeta } from './meta';
import type {
  AiParseResultItem,
  AiParseRolePermission,
  AiParseTargetOutputPlan,
  AiParseTask
} from './types';

const { Text, Title } = Typography;

type TaskSummaryProps = {
  task: AiParseTask;
  targetPlans: AiParseTargetOutputPlan[];
  blockingItems: AiParseResultItem[];
  permission: AiParseRolePermission;
  actionLoading: boolean;
  onBack: () => void;
  onUpdateSource: () => void;
  onRun: () => void;
  onPublish: () => void;
};

export function FileParseTaskSummary(props: TaskSummaryProps) {
  const {
    actionLoading,
    blockingItems,
    onBack,
    onPublish,
    onRun,
    onUpdateSource,
    permission,
    targetPlans,
    task
  } = props;
  const metadata = [
    { label: '落库标准', value: task.documentName },
    { label: '标准版本', value: task.standardVersion },
    { label: '当前生效版本', value: task.currentVersion },
    { label: '解析迭代', value: `第 ${task.iterationNo ?? 1} 次` },
    { label: '更新时间', value: task.updatedAt },
    { label: '目标输出方案', value: targetOutputPlanLabel(task, targetPlans) }
  ];
  const metrics = [
    { label: '解析结果', value: task.stats.total, tone: 'default' },
    { label: '待确认', value: task.stats.pending, tone: 'warning' },
    { label: '需修正', value: task.stats.needsFix, tone: 'error' },
    { label: '冲突', value: task.stats.conflicts, tone: 'error' },
    { label: '硬错误', value: task.stats.hardErrors, tone: 'error' },
    { label: '已确认', value: task.stats.confirmed, tone: 'success' }
  ].filter((item) => item.label === '解析结果' || item.value > 0);

  return (
    <Card variant="borderless" className="ai-file-parse-section ai-file-parse-detail-summary">
      <div className="ai-file-parse-detail-head">
        <Space direction="vertical" size={4}>
          <Space wrap>
            <Title level={4} style={{ margin: 0 }}>{task.documentTitle}</Title>
            <Tag color={taskStatusMeta[task.status].color}>{taskStatusMeta[task.status].label}</Tag>
            <Tag color="blue">{targetOutputPlanLabel(task, targetPlans)}</Tag>
          </Space>
        </Space>
        <Space wrap>
          <Button onClick={onBack}>返回列表</Button>
          <Button
            disabled={
              !task.availableActions?.canCreateTask
              || task.status === 'reading'
              || task.status === 'parsing'
              || task.status === 'retry_waiting'
            }
            onClick={onUpdateSource}
          >
            更新源文件
          </Button>
          {(task.status === 'failed' || task.status === 'reading') ? (
            <Button loading={actionLoading} disabled={!permission.canDraftEdit} onClick={onRun}>
              {task.status === 'failed' ? '重新解析' : '发起解析'}
            </Button>
          ) : null}
          <Button
            type="primary"
            loading={actionLoading}
            disabled={!permission.canPublish || task.status !== 'ready_to_publish'}
            onClick={onPublish}
          >
            发布为新版本
          </Button>
        </Space>
      </div>
      <div className="ai-file-parse-detail-meta">
        {metadata.map((item) => (
          <div className="ai-file-parse-detail-meta-item" key={item.label}>
            <Text type="secondary">{item.label}</Text>
            <Text strong>{item.value || '-'}</Text>
          </div>
        ))}
      </div>
      <div className="ai-file-parse-input-strip">
        <Text type="secondary">输入项</Text>
        <div className="ai-file-parse-input-strip-content"><FileParseInputItems task={task} /></div>
      </div>
      <div className="ai-file-parse-metric-grid">
        {metrics.map((item) => (
          <div className={`ai-file-parse-metric ai-file-parse-metric-${item.tone}`} key={item.label}>
            <Text type="secondary">{item.label}</Text><strong>{item.value}</strong>
          </div>
        ))}
        {task.stats.deleteSuspected ? (
          <div className="ai-file-parse-metric ai-file-parse-metric-warning">
            <Text type="secondary">疑似删除</Text><strong>{task.stats.deleteSuspected}</strong>
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
      ) : task.status === 'parsing' || task.status === 'reading' ? (
        <Alert className="ai-file-parse-block-alert" type="info" showIcon message="当前文档正在解析，解析结果生成后可查看。" />
      ) : task.status === 'retry_waiting' ? (
        <Alert
          className="ai-file-parse-block-alert"
          type="info"
          showIcon
          message={`上次解析遇到临时错误，系统将在 ${task.nextRunAt || '稍后'} 自动重试。`}
        />
      ) : task.status === 'failed' ? (
        <Alert className="ai-file-parse-block-alert" type="error" showIcon message={task.failureMessage || '解析失败，未生成解析结果。'} />
      ) : task.status === 'ready_to_publish' ? (
        <Alert className="ai-file-parse-block-alert" type="success" showIcon message="解析结果已满足发布条件。" />
      ) : null}
    </Card>
  );
}
