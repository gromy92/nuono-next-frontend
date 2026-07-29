import { Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type {
  NoonAdvertisingCampaignDiagnostic,
  NoonAdvertisingCampaignRow
} from '../types'
import {
  formatDecimal,
  formatMoney,
  formatNumber,
  formatRate,
  statusTag
} from './formatters'
import {
  CampaignActionInline,
  DiagnosticInline,
  planTypeTagColor
} from '../components/AdviceGroups'

const { Text } = Typography

export function buildProductCampaignColumns(
  diagnosticsByCode: Map<string, NoonAdvertisingCampaignDiagnostic>,
  zeroOrderCountByCampaign: Map<string, number>,
  winningCountByCampaign: Map<string, number>
): ColumnsType<NoonAdvertisingCampaignRow> {
  return [
    {
      title: '广告计划',
      dataIndex: 'campaignCode',
      key: 'campaign',
      width: 230,
      fixed: 'left',
      render: (_, row) => (
        <div>
          <Text strong>{row.campaignName || row.campaignCode}</Text>
          <div className="noon-ads-muted">{row.campaignCode}</div>
        </div>
      )
    },
    {
      title: '类型',
      dataIndex: 'campaignCode',
      key: 'planType',
      width: 116,
      render: (_, row) => {
        const diagnostic = diagnosticsByCode.get(row.campaignCode)
        return <Tag color={planTypeTagColor(diagnostic?.planType)}>{diagnostic?.planTypeLabel || '未分类'}</Tag>
      }
    },
    {
      title: '诊断标签',
      dataIndex: 'campaignCode',
      key: 'diagnostic',
      width: 180,
      render: (_, row) => <DiagnosticInline diagnostic={diagnosticsByCode.get(row.campaignCode)} />
    },
    {
      title: '建议动作',
      dataIndex: 'campaignCode',
      key: 'recommendedActions',
      width: 240,
      render: (_, row) => <CampaignActionInline diagnostic={diagnosticsByCode.get(row.campaignCode)} />
    },
    { title: '状态', dataIndex: 'campaignStatus', key: 'campaignStatus', width: 94, render: statusTag },
    { title: '花费', dataIndex: 'spendAmount', key: 'spendAmount', align: 'right', width: 104, render: formatMoney },
    { title: '收入', dataIndex: 'adRevenue', key: 'adRevenue', align: 'right', width: 104, render: formatMoney },
    { title: '订单', dataIndex: 'ordersCount', key: 'ordersCount', align: 'right', width: 80, render: formatNumber },
    { title: 'ROAS', dataIndex: 'roas', key: 'roas', align: 'right', width: 84, render: formatDecimal },
    { title: '零订单占比', dataIndex: 'zeroOrderSpendShare', key: 'zeroOrderSpendShare', align: 'right', width: 108, render: formatRate },
    {
      title: '零订单词',
      key: 'zeroOrderQueryCount',
      align: 'right',
      width: 92,
      render: (_, row) => formatNumber(zeroOrderCountByCampaign.get(row.campaignCode) || 0)
    },
    {
      title: '高转化词',
      key: 'winningQueryCount',
      align: 'right',
      width: 92,
      render: (_, row) => formatNumber(winningCountByCampaign.get(row.campaignCode) || 0)
    }
  ]
}
