import { Col, Row, Space, Tag, Typography } from 'antd';
import {
  procurementCheckStatusMeta,
  procurementDisplayText,
  procurementEvidenceSourceMeta
} from './domain';
import type { ProcurementCandidate, ProcurementCheckResult } from './types';

const { Text } = Typography;

type ProcurementAutoCheckPanelProps = {
  structuredChecks: ProcurementCheckResult[];
  candidate: ProcurementCandidate;
};

export function ProcurementAutoCheckPanel({ structuredChecks, candidate }: ProcurementAutoCheckPanelProps) {
  return (
    <>
      <div
        style={{
          marginTop: 14,
          padding: 14,
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          background: '#ffffff'
        }}
      >
        <Text strong style={{ display: 'block', marginBottom: 6, color: '#0f172a' }}>
          自动核验结果
        </Text>
        <Text style={{ display: 'block', marginBottom: 12, color: '#64748b', fontSize: 12 }}>
          字段来源优先读取人工维护值；缺失时，再从标题、标签、推荐理由和风险点里自动解析补齐。
        </Text>
        <Row gutter={[12, 12]}>
          {structuredChecks.map((item) => {
            const statusMeta = procurementCheckStatusMeta(item.status);
            return (
              <Col xs={24} md={12} xl={8} key={item.label}>
                <div
                  style={{
                    height: '100%',
                    padding: 12,
                    borderRadius: 10,
                    border: `1px solid ${statusMeta.border}`,
                    background: statusMeta.background
                  }}
                >
                  <Space wrap size={[8, 8]} style={{ marginBottom: 8 }}>
                    <Text strong style={{ color: '#0f172a' }}>
                      {item.label}
                    </Text>
                    <Tag color={statusMeta.color} style={{ marginInlineEnd: 0 }}>
                      {statusMeta.label}
                    </Tag>
                  </Space>
                  <Text style={{ display: 'block', color: '#475569', fontSize: 12 }}>
                    目标：{item.sourceValue}
                  </Text>
                  <Text style={{ display: 'block', color: '#475569', fontSize: 12, marginTop: 4 }}>
                    候选：{item.candidateValue}
                  </Text>
                  <Text style={{ display: 'block', color: '#0f172a', marginTop: 8 }}>
                    {item.judgement}
                  </Text>
                </div>
              </Col>
            );
          })}
        </Row>
      </div>

      {candidate.extractionEvidences?.length ? (
        <div
          style={{
            marginTop: 14,
            padding: 14,
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            background: '#ffffff'
          }}
        >
          <Text strong style={{ display: 'block', marginBottom: 6, color: '#0f172a' }}>
            1688 抽取依据
          </Text>
          <Text style={{ display: 'block', marginBottom: 12, color: '#64748b', fontSize: 12 }}>
            当前优先读取属性快照、详情卖点、物流说明与包装说明，再回落到结果卡片、标题和标签。
          </Text>
          <Row gutter={[12, 12]}>
            {candidate.extractionEvidences.map((item, index) => {
              const sourceMeta = procurementEvidenceSourceMeta(item.sourceType);
              return (
                <Col xs={24} md={12} xl={8} key={`${item.fieldKey || 'field'}-${index}`}>
                  <div
                    style={{
                      height: '100%',
                      padding: 12,
                      borderRadius: 10,
                      border: '1px solid #dbe4ea',
                      background: '#f8fafc'
                    }}
                  >
                    <Space wrap size={[8, 8]} style={{ marginBottom: 8 }}>
                      <Text strong style={{ color: '#0f172a' }}>
                        {item.fieldLabel || '字段'}
                      </Text>
                      <Tag color={sourceMeta.color} style={{ marginInlineEnd: 0 }}>
                        {sourceMeta.label}
                      </Tag>
                      {item.sourceLabel && item.sourceLabel !== '人工维护' ? (
                        <Tag color="default" style={{ marginInlineEnd: 0 }}>
                          {item.sourceLabel}
                        </Tag>
                      ) : null}
                    </Space>
                    <Text style={{ display: 'block', color: '#0f172a', marginBottom: 6 }}>
                      抽取值：{procurementDisplayText(item.fieldValue)}
                    </Text>
                    <Text style={{ display: 'block', color: '#64748b', fontSize: 12 }}>
                      依据：{procurementDisplayText(item.evidenceText)}
                    </Text>
                  </div>
                </Col>
              );
            })}
          </Row>
        </div>
      ) : null}
    </>
  );
}
