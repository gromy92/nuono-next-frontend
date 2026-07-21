import { Card, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { readFieldDisplayValue } from './helpers';
import { changeTypeMeta, validationMeta } from './meta';
import type { VersionCompareRow } from './fileParseVersionModel';
import type { AiParseChangeType, AiParseStandardField, AiParseVersion } from './types';

const { Text } = Typography;

type VersionCompareProps = {
  versions: AiParseVersion[];
  baseVersion: AiParseVersion | undefined;
  targetVersion: AiParseVersion | undefined;
  rows: VersionCompareRow[];
  fields: AiParseStandardField[];
  loading: boolean;
  onBaseVersionChange: (versionId: string) => void;
  onTargetVersionChange: (versionId: string) => void;
};

export function FileParseVersionCompare(props: VersionCompareProps) {
  const {
    baseVersion,
    fields,
    loading,
    onBaseVersionChange,
    onTargetVersionChange,
    rows,
    targetVersion,
    versions
  } = props;
  const columns: ColumnsType<VersionCompareRow> = [
    {
      title: '变化', dataIndex: 'changeType', width: 100,
      render: (value: AiParseChangeType) => <Tag color={changeTypeMeta[value].color}>{changeTypeMeta[value].label}</Tag>
    },
    { title: '结果类型', dataIndex: 'itemTypeLabel', width: 130 },
    {
      title: baseVersion?.versionNo ?? '基准版本', width: 260,
      render: (_, row) => row.baseFields ? (
        <Space direction="vertical" size={2}>
          {fields.map((field) => (
            <Text key={field.key} type="secondary">
              {field.label}：{readFieldDisplayValue(row.baseFields?.[field.key])}
            </Text>
          ))}
        </Space>
      ) : '-'
    },
    {
      title: targetVersion?.versionNo ?? '目标版本', width: 300,
      render: (_, row) => (
        <Space direction="vertical" size={2}>
          {fields.map((field) => (
            <Text
              key={field.key}
              className={row.changedFieldKeys.includes(field.key) ? changeTypeMeta[row.changeType].className : ''}
            >
              {field.label}：{readFieldDisplayValue(row.targetFields?.[field.key])}
            </Text>
          ))}
        </Space>
      )
    },
    { title: '变化字段', width: 160, render: (_, row) => row.changedFieldKeys.join('、') || '-' },
    {
      title: '校验结果', width: 210,
      render: (_, row) => (
        <Space direction="vertical" size={2}>
          <Tag color={validationMeta[row.validationStatus].color}>{validationMeta[row.validationStatus].label}</Tag>
          <Text type={row.validationStatus === 'hard_error' ? 'danger' : 'secondary'}>{row.validationMessage}</Text>
        </Space>
      )
    }
  ];

  return (
    <Card variant="borderless" className="ai-file-parse-section">
      <div className="ai-file-parse-table-head">
        <Space className="ai-file-parse-compare-selects" wrap>
          <Text strong>版本对比</Text>
          <Select
            aria-label="选择基准版本"
            className="ai-file-parse-version-select"
            value={baseVersion?.id}
            options={versions.map((version) => ({
              label: `${version.versionNo} / ${version.publishedAt}`,
              value: version.id,
              disabled: versions.length > 1 && version.id === targetVersion?.id
            }))}
            placeholder="选择基准版本"
            onChange={onBaseVersionChange}
          />
          <Text type="secondary">对比</Text>
          <Select
            aria-label="选择目标版本"
            className="ai-file-parse-version-select"
            value={targetVersion?.id}
            options={versions.map((version) => ({
              label: `${version.versionNo} / ${version.publishedAt}`,
              value: version.id,
              disabled: versions.length > 1 && version.id === baseVersion?.id
            }))}
            placeholder="选择目标版本"
            onChange={onTargetVersionChange}
          />
        </Space>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={loading}
        pagination={false}
        size="middle"
        scroll={{ x: 1020 }}
      />
    </Card>
  );
}
