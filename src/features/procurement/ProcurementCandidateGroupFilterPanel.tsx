import { Button, Space, Tag, Typography } from 'antd';
import { procurementCandidateGroupTypeMeta } from './domain';
import type { ProcurementCandidateGroup } from './types';

const { Text } = Typography;

type ProcurementCandidateGroupFilterPanelProps = {
  groups: ProcurementCandidateGroup[];
  activeKey: string;
  onChange: (groupKey: string) => void;
};

export function ProcurementCandidateGroupFilterPanel({
  groups,
  activeKey,
  onChange
}: ProcurementCandidateGroupFilterPanelProps) {
  if (!groups.length) {
    return null;
  }

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 10,
        border: '1px solid #e2e8f0',
        background: '#f8fafc'
      }}
    >
      <Text strong style={{ display: 'block', color: '#0f172a', marginBottom: 10 }}>
        候选归并结果
      </Text>
      <Space wrap size={[10, 10]}>
        <Button type={activeKey === 'all' ? 'primary' : 'default'} onClick={() => onChange('all')}>
          全部候选
        </Button>
        {groups.map((group) => {
          const groupMeta = procurementCandidateGroupTypeMeta(group.groupType);
          const isActive = activeKey === group.groupKey;
          return (
            <button
              key={group.groupKey}
              type="button"
              onClick={() => onChange(group.groupKey)}
              style={{
                minWidth: 220,
                maxWidth: 280,
                padding: 12,
                borderRadius: 10,
                border: isActive ? '1px solid #0f766e' : '1px solid #dbe4ea',
                background: isActive ? '#f0fdfa' : '#ffffff',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <Space wrap size={[6, 6]} style={{ marginBottom: 6 }}>
                <Tag color={groupMeta.color} style={{ marginInlineEnd: 0 }}>
                  {groupMeta.label}
                </Tag>
                <Tag color="default" style={{ marginInlineEnd: 0 }}>
                  {group.candidateCount || group.candidateIds.length || 0} 条
                </Tag>
                {typeof group.bestScore === 'number' ? (
                  <Tag color="default" style={{ marginInlineEnd: 0 }}>
                    最高分 {group.bestScore}
                  </Tag>
                ) : null}
              </Space>
              <Text strong style={{ display: 'block', color: '#0f172a', marginBottom: 4 }}>
                {group.groupLabel || '当前候选组'}
              </Text>
              <Text style={{ color: '#475569', fontSize: 12 }}>
                {group.summary || '当前候选组摘要待补充。'}
              </Text>
            </button>
          );
        })}
      </Space>
    </div>
  );
}
