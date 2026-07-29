import { Button, Modal, Table, Typography } from 'antd'
import type { CompetitorCategoryRow } from '../profitCompetitorCategoryLinks'

const { Text } = Typography

type Props = {
  open: boolean
  rows: CompetitorCategoryRow[]
  onClose: () => void
}

export function ManualSelectionCompetitorCategoryModal({ open: competitorCategoryOpen, rows: competitorCategoryRows, onClose }: Props) {
  const setCompetitorCategoryOpen = (next: boolean) => {
    if (!next) onClose()
  }
  return (
        <Modal
          title="竞品类目链接"
          open={competitorCategoryOpen}
          width={780}
          footer={[
            <Button key="close" onClick={() => setCompetitorCategoryOpen(false)}>
              关闭
            </Button>
          ]}
          onCancel={() => setCompetitorCategoryOpen(false)}
        >
          <Table<CompetitorCategoryRow>
            rowKey="rowKey"
            size="small"
            pagination={false}
            dataSource={competitorCategoryRows}
            columns={[
              {
                title: '竞品',
                dataIndex: 'competitorLabel',
                width: 220,
                render: (value: string) => (
                  <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0 }}>
                    {value}
                  </Typography.Paragraph>
                )
              },
              {
                title: '来源',
                dataIndex: 'sourceHost',
                width: 130,
                render: (value: string) => value || '-'
              },
              {
                title: '类目',
                dataIndex: 'categoryPath',
                width: 180,
                render: (value: string) => <Text type={value === '暂无类目链接' ? 'secondary' : undefined}>{value}</Text>
              },
              {
                title: '类目链接',
                dataIndex: 'categoryUrl',
                width: 120,
                render: (value: string) => value ? (
                  <Typography.Link href={value} target="_blank" rel="noreferrer">
                    打开
                  </Typography.Link>
                ) : (
                  <Text type="secondary">暂无</Text>
                )
              },
              {
                title: '商品链接',
                dataIndex: 'productUrl',
                width: 120,
                render: (value: string) => value ? (
                  <Typography.Link href={value} target="_blank" rel="noreferrer">
                    查看
                  </Typography.Link>
                ) : (
                  <Text type="secondary">暂无</Text>
                )
              }
            ]}
            locale={{ emptyText: '当前选品组暂无竞品链接' }}
          />
        </Modal>
  )
}
