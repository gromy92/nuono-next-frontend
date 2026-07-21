import type { ReactNode } from 'react';
import { Alert, Space, Tabs } from 'antd';
import type { AiParseTask } from './types';

type TaskDetailProps = {
  task: AiParseTask | undefined;
  summary: ReactNode;
  processing: ReactNode;
  overview: ReactNode;
  comparison: ReactNode;
  versions: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export function FileParseTaskDetail(props: TaskDetailProps) {
  const { activeTab, comparison, onTabChange, overview, processing, summary, task, versions } = props;
  if (!task) return <Alert type="warning" showIcon message="没有可展示的解析任务" />;
  const hasResults = !['parsing', 'retry_waiting', 'reading', 'failed'].includes(task.status);
  const tabs = [
    { key: 'processing', label: '结果处理', children: processing },
    ...(hasResults ? [
      { key: 'overview', label: '解析总览', children: overview },
      { key: 'diff', label: '版本对比', children: comparison }
    ] : []),
    { key: 'versions', label: '版本历史', children: versions }
  ];
  const resolvedTab = tabs.some((tab) => tab.key === activeTab) ? activeTab : 'processing';
  return (
    <Space data-testid="file-parse-detail" direction="vertical" size={14} style={{ width: '100%' }}>
      {summary}
      <Tabs
        className="ai-file-parse-detail-tabs"
        activeKey={resolvedTab}
        onChange={onTabChange}
        items={tabs}
      />
    </Space>
  );
}
