import { Input, Space, Tag, Typography } from 'antd';
import type { ProductListRowPayload } from '../types';
import { formatSnapshotValue, normalizeNoonImageUrl } from '../utils';
import { ProductImageThumb } from '../components/ProductBaselineDisplay';
import type { ProductGroupRow } from './productGroupRows';

const { Text } = Typography;

type ProductGroupListPaneProps = {
  groups: ProductGroupRow[];
  groupKeyword: string;
  selectedGroupKey?: string;
  onGroupKeywordChange: (value: string) => void;
  onSelectGroup: (group: ProductGroupRow) => void;
};

function memberLeadImage(item: ProductListRowPayload) {
  return normalizeNoonImageUrl(item.imageUrl || item.galleryImages?.[0]);
}

function GroupMemberImages({ group }: { group: ProductGroupRow }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 48px))',
        gap: 6,
        alignItems: 'center'
      }}
    >
      {group.items.map((item) => {
        const imageUrl = memberLeadImage(item);
        return (
          <span
            key={item.skuParent}
            title={item.title || item.skuParent}
          >
            <ProductImageThumb src={imageUrl} alt={item.title || item.skuParent} imageCount={imageUrl ? 1 : 0} width={48} />
          </span>
        );
      })}
    </div>
  );
}

export function ProductGroupListPane(props: ProductGroupListPaneProps) {
  const { groups, groupKeyword, selectedGroupKey, onGroupKeywordChange, onSelectGroup } = props;

  return (
    <div
      style={{
        border: '1px solid var(--pm-subtle-border)',
        borderRadius: 8,
        background: '#fff',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          padding: '8px 10px',
          borderBottom: '1px solid var(--pm-subtle-border)',
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 8,
          alignItems: 'center'
        }}
      >
        <Text strong>分组列表</Text>
        <Text type="secondary">{groups.length} 组</Text>
      </div>

      <div style={{ padding: '8px 8px 0' }}>
        <Input.Search
          allowClear
          size="small"
          value={groupKeyword}
          placeholder="搜索 Group"
          onChange={(event) => onGroupKeywordChange(event.target.value)}
        />
      </div>

      <div style={{ maxHeight: 'calc(100vh - 286px)', overflow: 'auto', padding: 8 }}>
        {groups.length ? (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            {groups.map((group) => {
              const selected = group.key === selectedGroupKey;
              return (
                <button
                  key={group.key}
                  type="button"
                  onClick={() => onSelectGroup(group)}
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 8,
                    border: selected ? '1px solid #1677ff' : '1px solid var(--pm-subtle-border)',
                    background: selected ? '#e6f4ff' : '#fff',
                    boxShadow: selected ? '0 3px 10px rgba(22, 119, 255, 0.08)' : 'none',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <Space direction="vertical" size={7} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'start' }}>
                      <Space direction="vertical" size={2} style={{ minWidth: 0 }}>
                        <Text strong ellipsis={{ tooltip: group.groupRef }} style={{ maxWidth: 220, fontSize: 14 }}>
                          {formatSnapshotValue(group.groupRef)}
                        </Text>
                      </Space>
                      <Tag color={selected ? 'blue' : undefined} style={{ marginInlineEnd: 0 }}>
                        {group.memberCount} 个
                      </Tag>
                    </div>
                    <GroupMemberImages group={group} />
                  </Space>
                </button>
              );
            })}
          </Space>
        ) : (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <Text type="secondary">暂无分组</Text>
          </div>
        )}
      </div>
    </div>
  );
}
