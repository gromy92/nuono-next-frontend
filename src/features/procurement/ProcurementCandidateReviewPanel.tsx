import { Button, Col, Form, Input, Progress, Row, Select, Space, Table, Typography, type FormInstance } from 'antd';
import { procurementCandidateDisplayTitle } from './domain';
import type { ProcurementCandidate } from './types';

const { Text } = Typography;

type ProcurementScoreCard = {
  label: string;
  value: number;
  max: number;
};

type ProcurementCompareRow = {
  label: string;
  sourceValue: string;
  candidateValue: string;
  judgement: string;
};

type ProcurementCandidateReviewPanelProps = {
  form: FormInstance;
  candidate: ProcurementCandidate;
  scoreCards: ProcurementScoreCard[];
  rows: ProcurementCompareRow[];
  saving: boolean;
  onSave: () => void | Promise<void>;
};

export function ProcurementCandidateReviewPanel({
  form,
  candidate,
  scoreCards,
  rows,
  saving,
  onSave
}: ProcurementCandidateReviewPanelProps) {
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
        <Space wrap size={[8, 8]} style={{ width: '100%', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text strong style={{ color: '#0f172a' }}>
            当前阶段说明
          </Text>
          <Text style={{ color: '#64748b' }}>
            当前内容保存到候选：{procurementCandidateDisplayTitle(candidate)}
          </Text>
        </Space>
        <Form form={form} layout="vertical">
          <Row gutter={[12, 12]}>
            <Col xs={24} md={12}>
              <Form.Item label="人工判断备注" name="manualReviewNote">
                <Input.TextArea rows={3} placeholder="记录这条候选的外观、规格、价格和风险判断" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="询价结论" name="inquirySummary">
                <Input.TextArea rows={3} placeholder="如果已经问过供应商，可补充报价、MOQ、交期等结论" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="下一步动作" name="nextAction">
                <Select
                  allowClear
                  placeholder="选择下一步动作"
                  options={[
                    { label: '倾向采购', value: 'INTENT' },
                    { label: '准备询价', value: 'PREPARE_INQUIRY' },
                    { label: '继续比对', value: 'CONTINUE_COMPARE' },
                    { label: '暂缓处理', value: 'HOLD' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'flex-end'
                }}
              >
                <Button type="primary" loading={saving} onClick={() => void onSave()}>
                  保存人工判断
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </div>

      <Row gutter={[12, 12]} style={{ marginTop: 14 }}>
        {scoreCards.map((item) => (
          <Col xs={24} md={12} xl={8} key={item.label}>
            <div
              style={{
                padding: 12,
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                background: '#ffffff'
              }}
            >
              <Text style={{ display: 'block', marginBottom: 8, color: '#334155' }}>{item.label}</Text>
              <Progress
                percent={Math.max(0, Math.min(100, Math.round((item.value / item.max) * 100)))}
                size="small"
                strokeColor="#0f766e"
              />
              <Text style={{ color: '#64748b', fontSize: 12 }}>
                {item.value} / {item.max}
              </Text>
            </div>
          </Col>
        ))}
      </Row>

      <div style={{ marginTop: 14 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          关键信息对照
        </Text>
        <Table
          size="small"
          pagination={false}
          rowKey={(record) => record.label}
          dataSource={rows}
          columns={[
            {
              title: '对比项',
              dataIndex: 'label',
              key: 'label',
              width: 130
            },
            {
              title: '原商品',
              dataIndex: 'sourceValue',
              key: 'sourceValue',
              width: 240,
              render: (value: string) => <Text style={{ color: '#334155' }}>{value}</Text>
            },
            {
              title: '候选商品',
              dataIndex: 'candidateValue',
              key: 'candidateValue',
              width: 240,
              render: (value: string) => <Text style={{ color: '#334155' }}>{value}</Text>
            },
            {
              title: '拟合判断',
              dataIndex: 'judgement',
              key: 'judgement',
              render: (value: string) => (
                <Text strong style={{ color: '#0f172a' }}>
                  {value}
                </Text>
              )
            }
          ]}
          scroll={{ x: 860 }}
        />
      </div>
    </>
  );
}
