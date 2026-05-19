import { Card, Col, Descriptions, Drawer, Progress, Row, Space, Tag, Typography } from 'antd';
import type { ProcurementCandidateRecord, ProcurementRequirementRecord } from '../../types';

const { Link, Paragraph, Text, Title } = Typography;

type CandidateSourceDetailDrawerProps = {
  batch: ProcurementRequirementRecord;
  candidate: ProcurementCandidateRecord | null;
  open: boolean;
  onClose: () => void;
};

const scoreRows = [
  { key: 'matchScore', label: '匹配度分', max: 40 },
  { key: 'specScore', label: '规格匹配分', max: 25 },
  { key: 'priceScore', label: '价格分', max: 14 },
  { key: 'supplierScore', label: '供应商分', max: 14 },
  { key: 'deliveryScore', label: '交期分', max: 12 }
] as const;

type SpecMatchStatus = 'EXACT' | 'PARTIAL' | 'MISMATCH' | 'UNKNOWN';

export function CandidateSourceDetailDrawer({
  batch,
  candidate,
  open,
  onClose
}: CandidateSourceDetailDrawerProps) {
  const specBasisRows = candidate ? buildSpecBasisRows(batch, candidate) : [];
  const inferredSpecScore = specBasisRows.reduce((sum, row) => sum + row.points, 0);

  return (
    <Drawer
      title="1688 源数据与评分依据"
      open={open}
      onClose={onClose}
      width={760}
      destroyOnClose
    >
      {candidate ? (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Card bordered={false} style={{ borderRadius: 18, background: '#f8fafc' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={7}>
                <img
                  src={candidate.mainImageUrl}
                  alt={candidate.title}
                  style={{ width: '100%', borderRadius: 18, objectFit: 'cover' }}
                />
              </Col>
              <Col xs={24} md={17}>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Space wrap size={[8, 8]}>
                    <Tag color="processing">总分 {candidate.totalScore}</Tag>
                    <Tag color="default">原始排名 #{candidate.rankNo}</Tag>
                    <Tag color="geekblue">offerId {candidate.offerId}</Tag>
                  </Space>
                  <Title level={5} style={{ margin: 0 }}>
                    {candidate.title}
                  </Title>
                  <Text>{candidate.supplierName}</Text>
                  {candidate.candidateUrl ? (
                    <Link href={candidate.candidateUrl} target="_blank" rel="noreferrer">
                      打开 1688 商品链接
                    </Link>
                  ) : null}
                </Space>
              </Col>
            </Row>
          </Card>

          <Card title="评分计算" bordered={false} style={{ borderRadius: 18, border: '1px solid #e2e8f0' }}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {scoreRows.map((row) => {
                const value = candidate.scores[row.key] || 0;
                return (
                  <div key={row.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text strong>{row.label}</Text>
                      <Text>
                        {value} / {row.max}
                      </Text>
                    </div>
                    <Progress percent={Math.min(100, Math.round((value / row.max) * 100))} showInfo={false} />
                  </div>
                );
              })}
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                总分 = 匹配度分 + 规格匹配分 + 价格分 + 供应商分 + 交期分。
              </Paragraph>
            </Space>
          </Card>

          <Card title="规格匹配依据" bordered={false} style={{ borderRadius: 18, border: '1px solid #e2e8f0' }}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                规格匹配分按材质、供电方式、尺寸、包装四类 1688 线索计算：完全命中 +4，部分命中 +2，未命中或信息不足 +0；入池排序以后端返回的规格分为准。
              </Paragraph>
              <Row gutter={[12, 12]}>
                {specBasisRows.map((row) => (
                  <Col xs={24} md={12} key={row.label}>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 14, padding: 12, background: '#f8fafc' }}>
                      <Space direction="vertical" size={6} style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                          <Text strong>{row.label}</Text>
                          <Tag color={matchStatusColor[row.status]}>
                            {matchStatusLabel[row.status]} +{row.points}
                          </Tag>
                        </div>
                        <Text type="secondary">采购目标：{row.target || '未结构化'}</Text>
                        <Text>1688 识别：{row.source || '未识别'}</Text>
                      </Space>
                    </div>
                  </Col>
                ))}
              </Row>
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                当前可见字段推导 {inferredSpecScore} 分；后端返回规格匹配分 {candidate.scores.specScore} 分。
              </Paragraph>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="采购要求">{batch.specialRequirement || batch.demandTitle}</Descriptions.Item>
                <Descriptions.Item label="交期线索">{candidate.deliveryText}</Descriptions.Item>
              </Descriptions>
            </Space>
          </Card>

          <Card title="1688 源数据" bordered={false} style={{ borderRadius: 18, border: '1px solid #e2e8f0' }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="价格文本">{candidate.priceText}</Descriptions.Item>
              <Descriptions.Item label="MOQ">{candidate.moqText}</Descriptions.Item>
              <Descriptions.Item label="发货地">{candidate.locationText}</Descriptions.Item>
              <Descriptions.Item label="搜索结果卡片">{candidate.resultCardText}</Descriptions.Item>
              <Descriptions.Item label="详情摘要">{candidate.detailHighlightText || '未识别'}</Descriptions.Item>
              <Descriptions.Item label="属性快照">{candidate.attributeSnapshotText || '未识别'}</Descriptions.Item>
              <Descriptions.Item label="物流快照">{candidate.shippingSnapshotText || '未识别'}</Descriptions.Item>
              <Descriptions.Item label="包装快照">{candidate.packageSnapshotText || '未识别'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="入选原因与风险" bordered={false} style={{ borderRadius: 18, border: '1px solid #e2e8f0' }}>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <TagList title="标签" values={candidate.tags} color="processing" />
              <TagList title="入选原因" values={candidate.reasons} color="success" />
              <TagList title="风险提示" values={candidate.warnings} color="warning" />
            </Space>
          </Card>
        </Space>
      ) : null}
    </Drawer>
  );
}

function TagList({ title, values, color }: { title: string; values: string[]; color: string }) {
  return (
    <div>
      <Text strong>{title}</Text>
      <div style={{ marginTop: 8 }}>
        <Space wrap size={[8, 8]}>
          {values.length ? values.map((value) => <Tag key={value} color={color}>{value}</Tag>) : <Text type="secondary">暂无</Text>}
        </Space>
      </div>
    </div>
  );
}

const matchStatusLabel: Record<SpecMatchStatus, string> = {
  EXACT: '完全命中',
  PARTIAL: '部分命中',
  MISMATCH: '未命中',
  UNKNOWN: '信息不足'
};

const matchStatusColor: Record<SpecMatchStatus, string> = {
  EXACT: 'success',
  PARTIAL: 'processing',
  MISMATCH: 'error',
  UNKNOWN: 'default'
};

const specKeywordMap = {
  material: ['abs', '陶瓷', '树脂', '金属', '塑料', '电镀'],
  power: ['充电', 'usb', '插电', '无电', '蜡烛', '炭'],
  size: ['便携', '手持', '迷你', '桌面', '落地', 'cm'],
  package: ['礼盒', '彩盒', '普通盒', '箱', '袋', 'opp']
} as const;

function buildSpecBasisRows(batch: ProcurementRequirementRecord, candidate: ProcurementCandidateRecord) {
  return [
    buildSpecBasisRow('材质', batch.targetMaterial, candidate.materialText, specKeywordMap.material),
    buildSpecBasisRow('供电方式', batch.targetPowerMode, candidate.powerModeText, specKeywordMap.power),
    buildSpecBasisRow('尺寸', batch.targetSizeText, candidate.sizeText, specKeywordMap.size),
    buildSpecBasisRow('包装', batch.targetPackageType, candidate.packageText, specKeywordMap.package)
  ];
}

function buildSpecBasisRow(
  label: string,
  target: string | undefined,
  source: string | undefined,
  keywords: readonly string[]
) {
  const status = resolveSpecMatchStatus(target, source, keywords);
  return {
    label,
    target,
    source,
    status,
    points: status === 'EXACT' ? 4 : status === 'PARTIAL' ? 2 : 0
  };
}

function resolveSpecMatchStatus(
  target: string | undefined,
  source: string | undefined,
  keywords: readonly string[]
): SpecMatchStatus {
  const normalizedTarget = normalizeSpecText(target);
  const normalizedSource = normalizeSpecText(source);
  if (!normalizedTarget || !normalizedSource) {
    return 'UNKNOWN';
  }
  if (
    normalizedTarget === normalizedSource ||
    normalizedTarget.includes(normalizedSource) ||
    normalizedSource.includes(normalizedTarget)
  ) {
    return 'EXACT';
  }
  const hasSharedKeyword = keywords.some(
    (keyword) => normalizedTarget.includes(keyword) && normalizedSource.includes(keyword)
  );
  return hasSharedKeyword ? 'PARTIAL' : 'MISMATCH';
}

function normalizeSpecText(value: string | undefined) {
  return (value || '').toLowerCase().replace(/\s+/g, '');
}
