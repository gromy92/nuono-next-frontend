import { Button, Card, Checkbox, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { FileParseLogisticsActivationPayload, FileParseLogisticsChannelPayload } from './api';
import type { AiParseRolePermission, AiParseVersion } from './types';

const { Text } = Typography;
const RELATED_ITEM_LABELS: Record<string, string> = {
  logistics_cargo_category: '分类',
  logistics_base_price: '基础价',
  logistics_surcharge: '附加费',
  logistics_billing_rule: '计费',
  logistics_warehouse_service_fee: '仓费',
  logistics_restriction: '限制'
};

function RelatedQuoteContext({ channel }: { channel: FileParseLogisticsChannelPayload }) {
  const entries = Object.entries(channel.fields?.relatedItemCounts ?? {})
    .map(([itemType, count]) => [itemType, Number(count)] as const)
    .filter(([, count]) => Number.isFinite(count) && count > 0);
  if (!entries.length) return <>-</>;
  return (
    <Space size={[4, 4]} wrap>
      {entries.map(([itemType, count]) => (
        <Tag key={itemType}>{`${RELATED_ITEM_LABELS[itemType] ?? itemType} ${count}`}</Tag>
      ))}
    </Space>
  );
}

type LogisticsActivationProps = {
  versions: AiParseVersion[];
  versionId: string;
  activation: FileParseLogisticsActivationPayload | null;
  selectedChannelKeys: string[];
  permission: AiParseRolePermission;
  loading: boolean;
  actionLoading: boolean;
  onVersionChange: (versionId: string) => void;
  onToggle: (channelKey: string, checked: boolean) => void;
  onSave: () => void;
};

export function FileParseLogisticsActivation(props: LogisticsActivationProps) {
  const {
    actionLoading,
    activation,
    loading,
    onSave,
    onToggle,
    onVersionChange,
    permission,
    selectedChannelKeys,
    versionId,
    versions
  } = props;
  const columns: ColumnsType<FileParseLogisticsChannelPayload> = [
    {
      title: '生效', width: 78, fixed: 'left',
      render: (_, channel) => (
        <Checkbox
          checked={selectedChannelKeys.includes(channel.channelKey)}
          disabled={!permission.canActivateLogisticsChannels}
          onChange={(event) => onToggle(channel.channelKey, event.target.checked)}
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
    { title: '关联报价包', width: 260, render: (_, channel) => <RelatedQuoteContext channel={channel} /> }
  ];

  return (
    <Card variant="borderless" className="ai-file-parse-section">
      <div className="ai-file-parse-table-head">
        <Space wrap>
          <Text strong>物流服务线生效</Text>
          <Select
            className="ai-file-parse-version-select"
            value={versionId || undefined}
            placeholder="选择版本"
            options={versions.map((version) => ({
              label: `${version.versionNo} / ${version.publishedAt}`,
              value: version.id
            }))}
            onChange={onVersionChange}
          />
          <Text type="secondary">
            已选择 {selectedChannelKeys.length} / {activation?.channels.length ?? 0}
          </Text>
        </Space>
        <Button
          type="primary"
          loading={actionLoading}
          disabled={!permission.canActivateLogisticsChannels || !versionId}
          onClick={onSave}
        >
          保存生效服务线
        </Button>
      </div>
      <Table
        rowKey={(channel) => `${channel.versionItemId}-${channel.channelKey}`}
        columns={columns}
        dataSource={activation?.channels ?? []}
        loading={loading}
        pagination={false}
        size="middle"
        scroll={{ x: 1400 }}
      />
    </Card>
  );
}
