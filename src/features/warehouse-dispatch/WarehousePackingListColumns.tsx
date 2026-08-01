import { DownloadOutlined, EyeOutlined } from '@ant-design/icons'
import { Button, Space, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { LogisticsPartitionTags } from './LogisticsPartitionViews'
import type { ShippingBatch } from './types'
import {
  renderShippingBatchMetric,
  renderShippingBatchStatus,
  shippingBatchPartition
} from './WarehousePackingListView'

const { Text } = Typography

type Options = {
  detailLoadingBatchId?: string
  exportLoadingBatchId?: string
  onOpenDetails: (batch: ShippingBatch) => Promise<void>
  onOpenExport: (batch: ShippingBatch) => Promise<void>
}

export function warehousePackingListColumns({
  detailLoadingBatchId,
  exportLoadingBatchId,
  onOpenDetails,
  onOpenExport
}: Options): ColumnsType<ShippingBatch> {
  return [
    {
      title: '发货单', dataIndex: 'batchNo', width: 210,
      render: (_value, batch) => (
        <Space direction="vertical" size={0}>
          <Text strong>{batch.batchNo || batch.id}</Text>
          <Text type="secondary">{batch.createdAt || '-'}</Text>
        </Space>
      )
    },
    {
      title: '站点 / 运输方式', width: 190,
      render: (_value, batch) => <LogisticsPartitionTags summary={shippingBatchPartition(batch)} />
    },
    {
      title: '状态', width: 110,
      render: (_value, batch) => renderShippingBatchStatus(batch.status)
    },
    {
      title: '总体积', width: 120, align: 'right',
      render: (_value, batch) => renderShippingBatchMetric(batch.volumeCbm, 4, 'm³')
    },
    {
      title: '总毛重', width: 120, align: 'right',
      render: (_value, batch) => renderShippingBatchMetric(batch.grossWeightKg, 1, 'kg')
    },
    {
      title: '箱数', dataIndex: 'boxCount', width: 90, align: 'right',
      render: (value: number) => value > 0 ? `${value} 箱` : <Text type="secondary">待装箱</Text>
    },
    {
      title: '商品数', dataIndex: 'skuCount', width: 110, align: 'right',
      render: (value: number) => `${value} PSKU`
    },
    {
      title: '件数', dataIndex: 'totalQuantity', width: 100, align: 'right',
      render: (value: number) => `${value.toLocaleString('zh-CN')} 件`
    },
    {
      title: '计划物流数', dataIndex: 'optionCount', width: 110, align: 'right',
      render: (value: number) => `${value} 个`
    },
    {
      title: '操作', width: 270, fixed: 'right',
      render: (_value, batch) => (
        <Space size={0}>
          <Button type="link" icon={<EyeOutlined />} loading={detailLoadingBatchId === batch.id}
            onClick={(event) => {
              event.stopPropagation()
              void onOpenDetails(batch)
            }}>查看装箱详情</Button>
          <Button type="link" icon={<DownloadOutlined />} disabled={!canExportBatch(batch)}
            loading={exportLoadingBatchId === batch.id}
            onClick={(event) => {
              event.stopPropagation()
              void onOpenExport(batch)
            }}>导出装箱单</Button>
        </Space>
      )
    }
  ]
}

function canExportBatch(batch: ShippingBatch) {
  return batch.boxCount > 0 && ['PACKED', 'SHIPPED'].includes(String(batch.status || '').toUpperCase())
}
