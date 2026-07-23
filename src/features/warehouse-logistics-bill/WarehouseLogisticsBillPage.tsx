import { EyeOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Empty, Input, Modal, Spin, Table, Tag, Typography, message } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AuthSession } from '../auth/session'
import { loadLogisticsBill, loadLogisticsBills } from '../purchase-order/api'
import type { LogisticsBill, LogisticsBillComponent } from '../purchase-order/types'
import {
  feeTypeLabel,
  filterBills,
  formatDate,
  formatMoney,
  formatNumber,
  reconciliationStatusColor,
  reconciliationStatusLabel
} from './warehouseLogisticsBillDomain'
import './WarehouseLogisticsBillPage.css'

const { Text, Title } = Typography

type WarehouseLogisticsBillPageProps = {
  session?: AuthSession | null
}

export function WarehouseLogisticsBillPage({ session }: WarehouseLogisticsBillPageProps) {
  const [bills, setBills] = useState<LogisticsBill[]>([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [detailTarget, setDetailTarget] = useState<LogisticsBill | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const visibleBills = useMemo(() => filterBills(bills, keyword), [bills, keyword])

  const loadPage = useCallback(async () => {
    setLoading(true)
    try {
      setBills(await loadLogisticsBills())
    } catch (error) {
      message.error(error instanceof Error ? error.message : '读取物流账单失败')
      setBills([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPage()
  }, [loadPage])

  async function openDetail(bill: LogisticsBill) {
    setDetailTarget({ ...bill, components: [] })
    setDetailLoading(true)
    try {
      const detail = await loadLogisticsBill(bill.id)
      setDetailTarget(detail)
      setBills((current) => current.map((item) => (item.id === detail.id ? { ...item, ...detail, components: item.components } : item)))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '读取物流账单详情失败')
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="warehouse-logistics-bill-page" data-testid="warehouse-logistics-bill-page">
      <div className="warehouse-logistics-bill-toolbar">
        <div>
          <Title level={4}>物流账单</Title>
          <Text type="secondary">按发货单核对预估账单和货代实际账单。</Text>
        </div>
        <div className="warehouse-logistics-bill-toolbar-actions">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索账单 / 发货单 / SKU"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Button icon={<ReloadOutlined />} onClick={() => void loadPage()} loading={loading}>
            刷新
          </Button>
        </div>
      </div>

      <Spin spinning={loading}>
        <section className="warehouse-logistics-bill-table-section">
          <Table<LogisticsBill>
            size="small"
            rowKey="id"
            pagination={{ pageSize: 12, showSizeChanger: false }}
            columns={[
              {
                title: '物流账单',
                dataIndex: 'expectedBillNo',
                width: 240,
                render: (_, bill) => (
                  <div className="warehouse-logistics-bill-name">
                    <Text strong>{bill.expectedBillNo}</Text>
                    <Text type="secondary">{bill.shippingOrderSegmentNo || bill.shippingOrderNo}</Text>
                  </div>
                )
              },
              {
                title: '发货单',
                dataIndex: 'shippingOrderTitle',
                width: 220,
                ellipsis: true
              },
              {
                title: '货代 / 渠道',
                dataIndex: 'forwarderName',
                width: 280,
                render: (_, bill) => (
                  <div className="warehouse-logistics-bill-route">
                    <Text>{bill.forwarderName || bill.forwarderCode || '-'}</Text>
                    <Text type="secondary">{bill.routeName || bill.serviceName || bill.routeCode || '-'}</Text>
                  </div>
                )
              },
              {
                title: '预估金额',
                dataIndex: 'expectedTotalAmount',
                width: 130,
                align: 'right',
                render: (_, bill) => formatMoney(bill.expectedTotalAmount, bill.currency)
              },
              {
                title: '实际金额',
                dataIndex: 'actualTotalCny',
                width: 120,
                align: 'right',
                render: (value) => formatMoney(value, 'CNY')
              },
              {
                title: '差异',
                dataIndex: 'diffAmountCny',
                width: 110,
                align: 'right',
                render: (value) => formatMoney(value, 'CNY')
              },
              {
                title: '核对状态',
                dataIndex: 'reconciliationStatus',
                width: 130,
                render: (value) => <Tag color={reconciliationStatusColor(String(value || ''))}>{reconciliationStatusLabel(String(value || ''))}</Tag>
              },
              {
                title: '创建时间',
                dataIndex: 'createdAt',
                width: 130,
                render: (value) => formatDate(String(value || ''))
              },
              {
                title: '操作',
                width: 110,
                render: (_, bill) => (
                  <Button
                    size="small"
                    icon={<EyeOutlined />}
                    loading={detailLoading && detailTarget?.id === bill.id}
                    onClick={() => void openDetail(bill)}
                  >
                    查看详情
                  </Button>
                )
              }
            ]}
            dataSource={visibleBills}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无物流账单" /> }}
          />
        </section>
      </Spin>

      <Modal
        title={detailTarget ? `${detailTarget.expectedBillNo} 明细` : '物流账单明细'}
        open={Boolean(detailTarget)}
        footer={null}
        onCancel={() => setDetailTarget(null)}
        width={980}
        destroyOnClose
      >
        <Spin spinning={detailLoading}>
          <div className="warehouse-logistics-bill-detail-summary">
            <span>发货单：{detailTarget?.shippingOrderNo || '-'}</span>
            {detailTarget?.shippingOrderSegmentNo ? <span>子发货单：{detailTarget.shippingOrderSegmentNo}</span> : null}
            <span>预估：{formatMoney(detailTarget?.expectedTotalAmount, detailTarget?.currency)}</span>
            <span>实际：{formatMoney(detailTarget?.actualTotalCny, 'CNY')}</span>
            <Tag color={reconciliationStatusColor(detailTarget?.reconciliationStatus || '')}>
              {reconciliationStatusLabel(detailTarget?.reconciliationStatus || '')}
            </Tag>
          </div>
          <Table<LogisticsBillComponent>
            size="small"
            rowKey={(record) => record.id || `${record.quoteLineId}-${record.barcode}`}
            pagination={false}
            columns={[
              {
                title: 'Barcode',
                dataIndex: 'barcode',
                width: 150
              },
              {
                title: 'PSKU',
                dataIndex: 'pskuCode',
                width: 130
              },
              {
                title: '站点',
                dataIndex: 'siteCode',
                width: 80
              },
              {
                title: '费用类型',
                dataIndex: 'feeType',
                width: 120,
                render: (value) => feeTypeLabel(String(value || ''))
              },
              {
                title: '数量',
                dataIndex: 'quantity',
                width: 90,
                align: 'right',
                render: (value) => formatNumber(value)
              },
              {
                title: '计费量',
                dataIndex: 'chargeQuantity',
                width: 100,
                align: 'right',
                render: (_, component) => `${formatNumber(component.chargeQuantity)} ${component.chargeUnit || ''}`.trim()
              },
              {
                title: '单价',
                dataIndex: 'unitPrice',
                width: 110,
                align: 'right',
                render: (_, component) => formatMoney(component.unitPrice, component.currency)
              },
              {
                title: '预估金额',
                dataIndex: 'expectedAmount',
                width: 120,
                align: 'right',
                render: (_, component) => formatMoney(component.expectedAmount, component.currency)
              }
            ]}
            dataSource={detailTarget?.components || []}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无账单明细" /> }}
          />
        </Spin>
      </Modal>
    </div>
  )
}
