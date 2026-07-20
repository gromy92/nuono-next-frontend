import { Card, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { targetOutputPlanLabel } from './fileParseTaskModel';
import type { AiParseTargetOutputPlan, AiParseTask, AiParseVersion } from './types';

type VersionHistoryProps = {
  versions: AiParseVersion[];
  tasks: AiParseTask[];
  targetPlans: AiParseTargetOutputPlan[];
  loading: boolean;
};

export function FileParseVersionHistory({ loading, targetPlans, tasks, versions }: VersionHistoryProps) {
  const columns: ColumnsType<AiParseVersion> = [
    { title: '版本号', dataIndex: 'versionNo', width: 210 },
    { title: '文档类型', dataIndex: 'documentName', width: 140 },
    { title: '店铺', dataIndex: 'storeLabel', width: 150 },
    {
      title: '目标输出方案', dataIndex: 'businessScopeText', width: 170,
      render: (value: string, version) => {
        const task = tasks.find((item) => item.id === version.sourceTaskId);
        return task ? targetOutputPlanLabel(task, targetPlans) : value;
      }
    },
    { title: '发布时间', dataIndex: 'publishedAt', width: 160 },
    { title: '发布人', dataIndex: 'publisherName', width: 110 },
    { title: '输入项', dataIndex: 'inputSummary', width: 160 },
    {
      title: '状态', dataIndex: 'status', width: 90,
      render: (status: AiParseVersion['status']) => (
        <Tag color={{ active: 'success', history: 'default', revoked: 'error' }[status]}>
          {{ active: '生效', history: '历史', revoked: '撤销' }[status]}
        </Tag>
      )
    }
  ];
  return (
    <Card variant="borderless" className="ai-file-parse-section">
      <Table
        rowKey="id"
        columns={columns}
        dataSource={versions}
        loading={loading}
        pagination={false}
        size="middle"
        scroll={{ x: 1320 }}
      />
    </Card>
  );
}
