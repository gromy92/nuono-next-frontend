import { Button, Col, Row, Space, Tag, Typography } from 'antd';
import { procurementCandidateGroupTypeMeta } from './domain';
import type { ProcurementCandidateGroup } from './types';

const { Paragraph, Text } = Typography;

type ProcurementInquirySheetView = {
  openingLine: string;
  summaryLine: string;
  group: ProcurementCandidateGroup | null;
  questions: string[];
  quoteChecklist: string[];
  sampleChecklist: string[];
};

type ProcurementInquirySheetPanelProps = {
  sheet: ProcurementInquirySheetView;
  activeGroupFilterKey: string;
  onGroupFilterChange: (groupKey: string) => void;
  onCopyInquiry: () => void | Promise<void>;
};

function ProcurementChecklistColumn({ title, items, prefix }: { title: string; items: string[]; prefix: string }) {
  return (
    <Col xs={24} xl={8}>
      <Text strong style={{ display: 'block', color: '#312e81', marginBottom: 6 }}>
        {title}
      </Text>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {items.map((item, index) => (
          <div
            key={`${prefix}-${index}-${item}`}
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              background: '#ffffff',
              border: '1px solid #c7d2fe'
            }}
          >
            <Text style={{ color: '#334155' }}>
              {index + 1}. {item}
            </Text>
          </div>
        ))}
      </Space>
    </Col>
  );
}

export function ProcurementInquirySheetPanel({
  sheet,
  activeGroupFilterKey,
  onGroupFilterChange,
  onCopyInquiry
}: ProcurementInquirySheetPanelProps) {
  const groupMeta = sheet.group ? procurementCandidateGroupTypeMeta(sheet.group.groupType) : undefined;
  const isActiveGroup = Boolean(sheet.group && activeGroupFilterKey === sheet.group.groupKey);

  return (
    <Row gutter={[12, 12]} style={{ marginTop: 14 }}>
      <Col xs={24} xl={8}>
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            border: '1px solid #dbe4ea',
            background: '#ffffff',
            height: '100%'
          }}
        >
          <Space wrap size={[8, 8]} style={{ marginBottom: 8 }}>
            <Text strong style={{ color: '#0f172a' }}>
              候选归并视角
            </Text>
            {groupMeta ? (
              <Tag color={groupMeta.color} style={{ marginInlineEnd: 0 }}>
                {groupMeta.label}
              </Tag>
            ) : null}
          </Space>
          {sheet.group ? (
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <div>
                <Text strong style={{ display: 'block', color: '#0f172a', marginBottom: 4 }}>
                  {sheet.group.groupLabel || '当前候选组'}
                </Text>
                <Text style={{ color: '#475569' }}>
                  {sheet.group.summary || '当前候选暂时没有明显重复项。'}
                </Text>
              </div>
              <Space wrap size={[8, 8]}>
                {sheet.group.tags.map((item) => (
                  <Tag key={`group-tag-${item}`} color="default" style={{ marginInlineEnd: 0 }}>
                    {item}
                  </Tag>
                ))}
              </Space>
              <Button
                type={isActiveGroup ? 'primary' : 'default'}
                onClick={() => onGroupFilterChange(isActiveGroup ? 'all' : sheet.group?.groupKey || 'all')}
              >
                {isActiveGroup ? '查看全部候选' : '只看本组候选'}
              </Button>
            </Space>
          ) : (
            <Text style={{ color: '#64748b' }}>当前候选暂时没有归并结果，可先直接进入询价判断。</Text>
          )}
        </div>
      </Col>
      <Col xs={24} xl={16}>
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            border: '1px solid #c7d2fe',
            background: '#eef2ff',
            height: '100%'
          }}
        >
          <Space wrap size={[8, 8]} style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text strong style={{ color: '#312e81' }}>
              询价准备单
            </Text>
            <Button type="primary" ghost onClick={() => void onCopyInquiry()}>
              复制询价要点
            </Button>
          </Space>
          <Paragraph style={{ marginBottom: 8, color: '#312e81' }}>{sheet.openingLine}</Paragraph>
          <div
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              background: '#ffffff',
              border: '1px solid #c7d2fe',
              color: '#475569',
              marginBottom: 10
            }}
          >
            {sheet.summaryLine}
          </div>
          <Row gutter={[12, 12]}>
            <ProcurementChecklistColumn title="本轮必须确认" items={sheet.questions} prefix="inquiry-question" />
            <ProcurementChecklistColumn title="报价要求" items={sheet.quoteChecklist} prefix="quote-check" />
            <ProcurementChecklistColumn title="样品核验" items={sheet.sampleChecklist} prefix="sample-check" />
          </Row>
        </div>
      </Col>
    </Row>
  );
}
