import { Empty, List, Modal, Space, Tag, Typography } from 'antd'
import type { ProductContentKeywordInputRow } from './productContentKeywordEditor'
import type { ProductCompetitorContentTextItem } from './productCompetitorContentSources'
import {
  competitorSourceDisplayText,
  competitorSourceLinkTitle
} from './productContentKeywordEditor'
import { matchingCompetitorsForKeywordRow } from './productKeywordCompetitorMatching'

const { Text } = Typography

export function ProductKeywordCompetitorMatchModal(props: {
  open: boolean
  productTitle: string
  row?: ProductContentKeywordInputRow
  competitors: ProductCompetitorContentTextItem[]
  onCancel: () => void
}) {
  const { competitors, onCancel, open, productTitle, row } = props
  const matches = row ? matchingCompetitorsForKeywordRow(productTitle, row, competitors) : []

  return (
    <Modal
      destroyOnClose
      open={open}
      title="AI 匹配的 Noon 竞品"
      width={720}
      footer={null}
      onCancel={onCancel}
    >
      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        <Text type="secondary">
          只展示我方标题与竞品标题同时包含当前关键词的商品，匹配关系由 AI 结果自动维护。
        </Text>
        {matches.length ? (
          <List
            bordered
            size="small"
            dataSource={matches}
            renderItem={(item) => (
              <List.Item key={item.key}>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Space size={8} wrap>
                    {item.source.url ? (
                      <Typography.Link
                        href={item.source.url}
                        rel="noreferrer"
                        target="_blank"
                        title={competitorSourceLinkTitle(item)}
                      >
                        {competitorSourceDisplayText(item)}
                      </Typography.Link>
                    ) : (
                      <Text>{competitorSourceDisplayText(item)}</Text>
                    )}
                    <Tag color="geekblue">标题共同关键词</Tag>
                  </Space>
                  <Text type="secondary" style={{ whiteSpace: 'pre-wrap' }}>
                    {item.text}
                  </Text>
                </Space>
              </List.Item>
            )}
          />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有符合双边标题关键词规则的竞品" />
        )}
      </Space>
    </Modal>
  )
}
