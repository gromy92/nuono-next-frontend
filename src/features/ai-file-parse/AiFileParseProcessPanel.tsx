import {
  Alert,
  Card,
  Empty,
  Space,
  Statistic,
  Steps,
  Table,
  Tag,
  Typography
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type {
  FileParseAiChunkPayload,
  FileParseSourceRowPayload,
  FileParseValidationIssuePayload,
  FileParseWorkflowPayload
} from './api';

const { Text } = Typography;

type AiFileParseProcessPanelProps = {
  aiChunks: FileParseAiChunkPayload[];
  aiChunksError?: string;
  loading: boolean;
  sourceRows: FileParseSourceRowPayload[];
  validationIssues: FileParseValidationIssuePayload[];
  workflow: FileParseWorkflowPayload | null;
};

const sourceTypeLabel: Record<string, string> = {
  excel_row: 'Excel 行',
  csv_row: 'CSV 行',
  pdf_text_line: 'PDF 文本行',
  pdf_ocr_line: 'PDF OCR 行',
  pdf_attachment: 'PDF 附件',
  image_attachment: '图片附件',
  image_ocr_block: '图片 OCR 行',
  manual_text_block: '人工文本',
  word_paragraph: 'Word 段落',
  text_block: '文本'
};

const severityColor: Record<string, string> = {
  hard_error: 'red',
  error: 'red',
  warning: 'orange',
  info: 'blue'
};

const chunkStatusColor: Record<string, string> = {
  succeeded: 'success',
  success: 'success',
  failed: 'error',
  running: 'processing',
  pending: 'default'
};

function stepStatus(value: string): 'wait' | 'process' | 'finish' | 'error' {
  if (value === 'succeeded' || value === 'success') {
    return 'finish';
  }
  if (value === 'hard_error' || value === 'failed') {
    return 'error';
  }
  if (value === 'running' || value === 'parsing') {
    return 'process';
  }
  return 'wait';
}

function compactHash(value?: string | null) {
  return value ? `${value.slice(0, 8)}...${value.slice(-6)}` : '-';
}

function displayDate(value?: string | null) {
  return value ? value.replace('T', ' ').slice(0, 19) : '-';
}

function sourceLocator(record: FileParseSourceRowPayload) {
  return [
    record.sheetName ? `sheet=${record.sheetName}` : null,
    record.sourceLocator,
    record.pageNo ? `page=${record.pageNo}` : null,
    record.rowNo ? `row=${record.rowNo}` : null
  ].filter(Boolean).join(' / ') || '-';
}

function emptyText(text: string) {
  return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={text} />;
}

export function AiFileParseProcessPanel({
  aiChunks,
  aiChunksError,
  loading,
  sourceRows,
  validationIssues,
  workflow
}: AiFileParseProcessPanelProps) {
  const sourceColumns: ColumnsType<FileParseSourceRowPayload> = [
    {
      title: '类型',
      dataIndex: 'sourceType',
      width: 110,
      render: (value: string) => <Tag>{sourceTypeLabel[value] ?? value}</Tag>
    },
    {
      title: '定位',
      width: 190,
      render: (_, record) => sourceLocator(record)
    },
    {
      title: '输入项',
      dataIndex: 'inputId',
      width: 90,
      render: (value?: number | null) => value ?? '-'
    },
    {
      title: '源内容',
      dataIndex: 'rawText',
      width: 520,
      render: (value?: string | null) => <Text className="ai-file-parse-source-text">{value || '-'}</Text>
    },
    {
      title: '源 Hash',
      dataIndex: 'sourceHash',
      width: 150,
      render: compactHash
    }
  ];

  const chunkColumns: ColumnsType<FileParseAiChunkPayload> = [
    {
      title: '批次',
      dataIndex: 'chunkNo',
      width: 80,
      render: (value?: number | null) => value ?? '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value: string) => <Tag color={chunkStatusColor[value] ?? 'default'}>{value}</Tag>
    },
    { title: '源行数', dataIndex: 'sourceRowCount', width: 90, render: (value?: number | null) => value ?? 0 },
    { title: '输出行数', dataIndex: 'outputItemCount', width: 90, render: (value?: number | null) => value ?? 0 },
    {
      title: '模型',
      width: 190,
      render: (_, record) => [record.modelProvider, record.modelName].filter(Boolean).join(' / ') || '-'
    },
    { title: '输入 Hash', dataIndex: 'inputHash', width: 150, render: compactHash },
    { title: '响应 Hash', dataIndex: 'responseHash', width: 150, render: compactHash },
    {
      title: '失败原因',
      width: 260,
      render: (_, record) => record.failureMessage || record.failureCode || '-'
    },
    { title: '开始时间', dataIndex: 'startedAt', width: 160, render: displayDate },
    { title: '结束时间', dataIndex: 'finishedAt', width: 160, render: displayDate }
  ];

  const issueColumns: ColumnsType<FileParseValidationIssuePayload> = [
    {
      title: '级别',
      dataIndex: 'severity',
      width: 100,
      render: (value: string) => <Tag color={severityColor[value] ?? 'default'}>{value}</Tag>
    },
    { title: '类型', dataIndex: 'issueType', width: 150 },
    { title: '字段', dataIndex: 'fieldKey', width: 120, render: (value?: string | null) => value || '-' },
    { title: '源行', dataIndex: 'sourceRowId', width: 100, render: (value?: number | null) => value ?? '-' },
    { title: '结果行', dataIndex: 'resultItemId', width: 100, render: (value?: number | null) => value ?? '-' },
    { title: 'AI 批次', dataIndex: 'aiChunkId', width: 100, render: (value?: number | null) => value ?? '-' },
    { title: '说明', dataIndex: 'message', width: 360, render: (value?: string | null) => value || '-' },
    { title: '状态', dataIndex: 'resolvedStatus', width: 110, render: (value?: string | null) => value || '-' }
  ];

  return (
    <Space direction="vertical" size={14} style={{ width: '100%' }}>
      <Card variant="borderless" className="ai-file-parse-section">
        {workflow ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div className="ai-file-parse-process-head">
              <Space direction="vertical" size={2}>
                <Text strong>流程进度</Text>
                <Text type="secondary">
                  已处理 {workflow.coverage.processedSourceRows} / {workflow.coverage.sourceRows} 行，生成 {workflow.coverage.resultItems} 条结果
                </Text>
              </Space>
            </div>
            <div className="ai-file-parse-process-stats">
              <Statistic title="源内容行" value={workflow.coverage.sourceRows} />
              <Statistic title="已处理源行" value={workflow.coverage.processedSourceRows} />
              <Statistic title="未覆盖源行" value={workflow.coverage.unprocessedSourceRows} />
              <Statistic title="结果行" value={workflow.coverage.resultItems} />
              <Statistic title="硬错误" value={workflow.coverage.hardErrors} />
            </div>
            <Steps
              size="small"
              items={workflow.steps.map((step) => ({
                title: step.label,
                description: step.count === undefined || step.count === null ? undefined : `${step.count} 条`,
                status: stepStatus(step.status)
              }))}
            />
          </Space>
        ) : (
          emptyText('暂无解析过程数据')
        )}
      </Card>

      <Card
        variant="borderless"
        className="ai-file-parse-section"
        title={<Text strong>源内容行</Text>}
      >
        <Table
          rowKey="id"
          columns={sourceColumns}
          dataSource={sourceRows}
          loading={loading}
          pagination={false}
          size="middle"
          scroll={{ x: 1060 }}
          locale={{ emptyText: emptyText('暂无源内容行') }}
        />
      </Card>

      <Card
        variant="borderless"
        className="ai-file-parse-section"
        title={<Text strong>AI 分块</Text>}
      >
        {aiChunksError ? (
          <Alert type="warning" showIcon message={aiChunksError} />
        ) : (
          <Table
            rowKey="id"
            columns={chunkColumns}
            dataSource={aiChunks}
            loading={loading}
            pagination={false}
            size="middle"
            scroll={{ x: 1380 }}
            locale={{ emptyText: emptyText('暂无 AI 分块记录') }}
          />
        )}
      </Card>

      <Card
        variant="borderless"
        className="ai-file-parse-section"
        title={<Text strong>结构化校验问题</Text>}
      >
        <Table
          rowKey="id"
          columns={issueColumns}
          dataSource={validationIssues}
          loading={loading}
          pagination={false}
          size="middle"
          scroll={{ x: 1240 }}
          locale={{ emptyText: emptyText('暂无校验问题') }}
        />
      </Card>
    </Space>
  );
}
