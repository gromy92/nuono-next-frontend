import { Breadcrumb, Button, Card, Col, Row, Space, Tag, Typography } from 'antd';
import { MAX_POOL_SIZE, PROCUREMENT_REQUIREMENT_CONFIRMATION_BASE_PATH } from '../../constants';
import { navigateRequirementRoute } from '../../route';
import { batchStatusMeta } from '../../statusMeta';
import type { ProcurementRequirementRecord } from '../../types';
import type { BatchOperationHandler } from './types';
import { withPublicBasePath } from '../../../../runtimePaths';

const { Paragraph, Text, Title } = Typography;

type RequirementHeaderCardProps = {
  batch: ProcurementRequirementRecord;
  poolCount: number;
  actionLoadingKey: string | null;
  onInitializePool: BatchOperationHandler;
};

export function RequirementHeaderCard({
  batch,
  poolCount,
  actionLoadingKey,
  onInitializePool
}: RequirementHeaderCardProps) {
  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 24,
        background: 'linear-gradient(135deg, #f8fffc 0%, #fff7ed 100%)',
        border: '1px solid #dceee6'
      }}
    >
      <Space direction="vertical" size={14} style={{ width: '100%' }}>
        <Breadcrumb
          items={[
            {
              title: (
                <a
                  href={withPublicBasePath(`${PROCUREMENT_REQUIREMENT_CONFIRMATION_BASE_PATH}/list`)}
                  onClick={(event) => {
                    event.preventDefault();
                    navigateRequirementRoute({ page: 'list' });
                  }}
                >
                  采购确认列表
                </a>
              )
            },
            {
              title: batch.orderNo
            }
          ]}
        />
        <Row gutter={[18, 18]} align="middle">
          <Col xs={24} lg={8}>
            <Space size={12} align="start">
              <img
                src={batch.referenceImageUrl}
                alt={batch.demandTitle}
                style={{ width: 118, height: 118, objectFit: 'cover', borderRadius: 22, border: '1px solid #dbe4ea' }}
              />
              <img
                src={batch.packageImageUrl}
                alt="包装图"
                style={{ width: 118, height: 118, objectFit: 'cover', borderRadius: 22, border: '1px solid #dbe4ea' }}
              />
            </Space>
          </Col>
          <Col xs={24} lg={10}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Space wrap size={[8, 8]}>
                <Tag color={batchStatusMeta[batch.status].color}>{batchStatusMeta[batch.status].label}</Tag>
                <Tag color="geekblue">订单 {batch.orderNo}</Tag>
              </Space>
              <Title level={2} style={{ margin: 0 }}>
                {batch.demandTitle}
              </Title>
              <Paragraph style={{ color: '#475569', marginBottom: 0 }}>
                {batch.specialRequirement}
              </Paragraph>
              <Text style={{ color: '#64748b' }}>{batch.resultNotice}</Text>
            </Space>
          </Col>
          <Col xs={24} lg={6}>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <Tag color="geekblue" style={{ width: 'fit-content', marginInlineEnd: 0 }}>
                待选池 {poolCount} / {MAX_POOL_SIZE}
              </Tag>
              <Text style={{ color: '#475569' }}>
                {batch.hasPool ? '系统已生成待选池并创建自动询价任务。' : '当前还没有待选池，可先生成待选池。'}
              </Text>
              <Text style={{ color: '#475569' }}>待选池最多 5 个；如需补入备选，请先终止并移出一个待选候选。</Text>
              {!batch.hasPool ? (
                <Button
                  data-testid="procurement-initialize-pool-button"
                  type="primary"
                  loading={actionLoadingKey === `initialize-${batch.id}`}
                  onClick={() => onInitializePool(batch.id)}
                >
                  生成待选池
                </Button>
              ) : null}
            </Space>
          </Col>
        </Row>
      </Space>
    </Card>
  );
}
