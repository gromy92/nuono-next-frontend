import { Card, Col, Progress, Row, Space, Tag, Typography } from 'antd';
import type { procurementBuildRoadmap } from './constants';

const { Paragraph, Text } = Typography;

type ProcurementBuildRoadmapItem = (typeof procurementBuildRoadmap)[number];

type ProcurementBuildProgress = {
  doneCount: number;
  stageCount: number;
  percent: number;
  currentStage: ProcurementBuildRoadmapItem;
  nextStep: string;
};

type ProcurementBuildProgressCardProps = {
  progress: ProcurementBuildProgress;
  roadmap: readonly ProcurementBuildRoadmapItem[];
};

export function ProcurementBuildProgressCard({ progress, roadmap }: ProcurementBuildProgressCardProps) {
  return (
    <Card
      size="small"
      variant="borderless"
      style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #eefbf6 100%)',
        border: '1px solid #d1fae5'
      }}
      title={
        <Space wrap size={[8, 8]}>
          <Text strong style={{ color: '#0f766e' }}>
            采购开发进度
          </Text>
          <Tag color="processing" style={{ marginInlineEnd: 0 }}>
            当前做到 {progress.doneCount}/{progress.stageCount}
          </Tag>
        </Space>
      }
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} xl={8}>
            <div
              style={{
                height: '100%',
                padding: 16,
                borderRadius: 10,
                background: '#ffffff',
                border: '1px solid #ccfbf1'
              }}
            >
              <Text strong style={{ display: 'block', color: '#0f172a', marginBottom: 8 }}>
                当前阶段
              </Text>
              <Text style={{ fontSize: 18, color: '#0f766e', fontWeight: 600 }}>{progress.currentStage.title}</Text>
              <div style={{ marginTop: 10 }}>
                <Tag color={progress.currentStage.color} style={{ marginInlineEnd: 0 }}>
                  {progress.currentStage.statusLabel}
                </Tag>
              </div>
              <Paragraph style={{ marginTop: 12, marginBottom: 0, color: '#475569' }}>
                {progress.currentStage.summary}
              </Paragraph>
            </div>
          </Col>
          <Col xs={24} xl={8}>
            <div
              style={{
                height: '100%',
                padding: 16,
                borderRadius: 10,
                background: '#ffffff',
                border: '1px solid #ccfbf1'
              }}
            >
              <Text strong style={{ display: 'block', color: '#0f172a', marginBottom: 8 }}>
                总体进度
              </Text>
              <Progress percent={progress.percent} strokeColor="#0f766e" />
              <Text style={{ color: '#475569' }}>
                已完成采购链路基础能力，当前正进入“减少手工录入”的优化阶段。
              </Text>
            </div>
          </Col>
          <Col xs={24} xl={8}>
            <div
              style={{
                height: '100%',
                padding: 16,
                borderRadius: 10,
                background: '#ffffff',
                border: '1px solid #ccfbf1'
              }}
            >
              <Text strong style={{ display: 'block', color: '#0f172a', marginBottom: 8 }}>
                下一步
              </Text>
              <Paragraph style={{ marginBottom: 0, color: '#475569' }}>{progress.nextStep}</Paragraph>
            </div>
          </Col>
        </Row>

        <Row gutter={[12, 12]}>
          {roadmap.map((item, index) => (
            <Col xs={24} md={12} xl={8} key={item.key}>
              <div
                style={{
                  height: '100%',
                  padding: 14,
                  borderRadius: 10,
                  background: '#ffffff',
                  border: '1px solid #e2e8f0'
                }}
              >
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Space wrap size={[8, 8]}>
                    <Tag color={item.color} style={{ marginInlineEnd: 0 }}>
                      阶段 {index + 1}
                    </Tag>
                    <Tag color={item.color} style={{ marginInlineEnd: 0 }}>
                      {item.statusLabel}
                    </Tag>
                  </Space>
                  <Text strong style={{ color: '#0f172a' }}>
                    {item.title}
                  </Text>
                  <Text style={{ color: '#64748b' }}>{item.summary}</Text>
                </Space>
              </div>
            </Col>
          ))}
        </Row>
      </Space>
    </Card>
  );
}
