import { App as AntdApp, Button, Card, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { downloadFileParseOverview } from './api';
import { readFieldDisplayValue } from './helpers';
import type { AiParseResultItem, AiParseStandardField, AiParseTask } from './types';

const { Text } = Typography;

type OverviewProps = {
  task: AiParseTask;
  items: AiParseResultItem[];
  fields: AiParseStandardField[];
  loading: boolean;
};

export function FileParseOverview({ fields, items, loading, task }: OverviewProps) {
  const { message } = AntdApp.useApp();
  const naturalKeyCounts = items.reduce((counts, item) => {
    if (item.naturalKey) counts.set(item.naturalKey, (counts.get(item.naturalKey) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
  const duplicateCount = Array.from(naturalKeyCounts.values()).reduce(
    (total, count) => total + Math.max(count - 1, 0),
    0
  );
  const validationStats = items.reduce((stats, item) => {
    stats[item.validationStatus] += 1;
    return stats;
  }, { pass: 0, warning: 0, hard_error: 0 });
  const columns: ColumnsType<AiParseResultItem> = [
    { title: '行号', width: 70, fixed: 'left', render: (_, __, index) => index + 1 },
    { title: '结果类型', dataIndex: 'itemTypeLabel', width: 150, fixed: 'left' },
    ...fields.map<ColumnsType<AiParseResultItem>[number]>((field) => ({
      title: field.label,
      width: Math.max(field.width ?? 130, 120),
      render: (_, item) => readFieldDisplayValue(item.fields[field.key])
    }))
  ];
  const scrollX = 220 + fields.reduce((total, field) => total + Math.max(field.width ?? 130, 120), 0);

  const exportOverview = () => {
    void downloadFileParseOverview(task.id)
      .then(({ blob, fileName }) => {
        const href = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = href;
        anchor.download = fileName;
        anchor.click();
        URL.revokeObjectURL(href);
      })
      .catch((error) => {
        message.error(error instanceof Error ? error.message : '导出解析总览失败');
      });
  };

  return (
    <Card variant="borderless" className="ai-file-parse-section">
      <div className="ai-file-parse-table-head">
        <Space wrap>
          <Text strong>解析总览</Text>
          <Text type="secondary">
            结果 {items.length} 行 / 自然键 {naturalKeyCounts.size} 个 / 字段 {fields.length} 个
          </Text>
        </Space>
        <Button size="small" disabled={!task.resultId} onClick={exportOverview}>导出结果</Button>
      </div>
      <Space size={8} wrap className="ai-file-parse-stat-tags ai-file-parse-overview-stats">
        <Tag color="default">总览结果 {items.length}</Tag>
        <Tag color="blue">自然键 {naturalKeyCounts.size}</Tag>
        {duplicateCount > 0 ? <Tag color="red">重复自然键 {duplicateCount}</Tag> : null}
        {validationStats.pass > 0 ? <Tag color="success">通过 {validationStats.pass}</Tag> : null}
        {validationStats.warning > 0 ? <Tag color="warning">警告 {validationStats.warning}</Tag> : null}
        {validationStats.hard_error > 0 ? <Tag color="red">硬错误 {validationStats.hard_error}</Tag> : null}
        {task.stats.pending > 0 ? <Tag color="warning">待确认 {task.stats.pending}</Tag> : null}
        {task.stats.confirmed > 0 ? <Tag color="success">已确认 {task.stats.confirmed}</Tag> : null}
        {task.stats.deleteSuspected ? <Tag color="orange">疑似删除 {task.stats.deleteSuspected}</Tag> : null}
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={loading}
        pagination={false}
        size="middle"
        scroll={{ x: scrollX }}
      />
    </Card>
  );
}
