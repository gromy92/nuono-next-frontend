import { Alert, Button, Card, Col, List, Progress, Row, Space, Statistic, Tag, Typography } from 'antd'
import type { LogisticsQuoteBundleDetailDto } from '../types'
import { bundleStatusColor } from '../utils'

const { Paragraph, Text } = Typography

type QuotePublishReviewCardProps = {
  bundle: LogisticsQuoteBundleDetailDto
}

export function QuotePublishReviewCard({ bundle }: QuotePublishReviewCardProps) {
  const isDraft = bundle.quoteVersion.status === 'DRAFT'
  const reviewItems = [
    {
      key: 'service',
      label: '服务线路已拆分',
      ready: bundle.services.length > 0,
      detail: `当前 ${bundle.services.length} 条服务，需确认国家、线路、运输方式和服务范围。`
    },
    {
      key: 'rule',
      label: '报价规则已结构化',
      ready: bundle.rules.length > 0,
      detail: `当前 ${bundle.rules.length} 条规则，需确认计费单位、币种、价格和适用条件。`
    },
    {
      key: 'restriction',
      label: '限制条件已核对',
      ready: bundle.restrictions.length > 0,
      detail: `当前 ${bundle.restrictions.length} 条限制，需确认硬限制和需单询条件。`
    },
    {
      key: 'evidence',
      label: '证据来源已补充',
      ready: true,
      detail: `当前 ${bundle.evidences.length} 条证据。证据用于回溯和人工复核，不要求每条规则或限制都必须挂证据。`
    },
    {
      key: 'source',
      label: '来源材料可追溯',
      ready: bundle.files.length > 0 && bundle.notes.length > 0,
      detail: `当前文件 ${bundle.files.length} 条、补充文案 ${bundle.notes.length} 条。`
    }
  ]
  const readyCount = reviewItems.filter((item) => item.ready).length
  const readiness = Math.round((readyCount / reviewItems.length) * 100)
  const canPublish = isDraft && readyCount === reviewItems.length

  return (
    <Card
      title="报价草稿确认发布"
      bordered={false}
      style={{ boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}
      extra={
        <Tag color={bundleStatusColor(bundle.quoteVersion.status)} style={{ marginInlineEnd: 0 }}>
          {bundle.quoteVersion.status}
        </Tag>
      }
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          type={canPublish ? 'success' : isDraft ? 'warning' : 'info'}
          showIcon
          message={canPublish ? '这版报价草稿已满足发布前置条件' : '当前是发布确认 UI 预览'}
          description={
            canPublish
              ? '下一步接入发布接口后，点击确认发布会把该报价版本切为 PUBLISHED，后续运输方案只读取已发布版本。'
              : '本阶段先确认页面信息架构和发布口径，发布/退回按钮暂不连接后端接口。'
          }
        />

        <Row gutter={[12, 12]}>
          <Col xs={12} md={6}>
            <Statistic title="版本号" value={bundle.quoteVersion.versionNo || '-'} />
          </Col>
          <Col xs={12} md={6}>
            <Statistic title="服务数" value={bundle.services.length} />
          </Col>
          <Col xs={12} md={6}>
            <Statistic title="规则数" value={bundle.rules.length} />
          </Col>
          <Col xs={12} md={6}>
            <Statistic title="证据数" value={bundle.evidences.length} />
          </Col>
        </Row>

        <Card size="small" title="发布前核对">
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Progress percent={readiness} status={readiness === 100 ? 'success' : 'active'} />
            <List
              dataSource={reviewItems}
              renderItem={(item) => (
                <List.Item style={{ paddingInline: 0 }}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Space wrap size={[8, 8]}>
                      <Tag color={item.ready ? 'success' : 'warning'} style={{ marginInlineEnd: 0 }}>
                        {item.ready ? '已满足' : '待补充'}
                      </Tag>
                      <Text strong>{item.label}</Text>
                    </Space>
                    <Text type="secondary">{item.detail}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Space>
        </Card>

        <Card size="small" title="发布后读取口径">
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Paragraph style={{ marginBottom: 0 }}>
              运输方案模块后续只读取 `PUBLISHED` 报价版本，不读取 `DRAFT` 草稿。
            </Paragraph>
            <Paragraph style={{ marginBottom: 0 }}>
              如果同一货代后续有新报价，建议新建新版本；旧发布版本后续再设计 `superseded` 失效逻辑。
            </Paragraph>
            <Paragraph style={{ marginBottom: 0 }}>
              风评不会阻塞本次报价发布，但会作为运输方案推荐排序时的风险参考。
            </Paragraph>
            <Paragraph style={{ marginBottom: 0 }}>
              证据来源不作为发布硬门槛；发布时允许人工确认后先发布，再后续补充证据。
            </Paragraph>
          </Space>
        </Card>

        <Space wrap>
          <Button type="primary" disabled>
            确认发布报价版本（待接接口）
          </Button>
          <Button disabled>退回继续整理（待接接口）</Button>
          <Text type="secondary">已确认：证据来源不作为发布硬门槛。</Text>
        </Space>
      </Space>
    </Card>
  )
}
