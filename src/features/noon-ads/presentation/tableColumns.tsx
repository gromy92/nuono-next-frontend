import { Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type {
  NoonAdvertisingCampaignDiagnostic,
  NoonAdvertisingCampaignRow,
  NoonAdvertisingQueryRow
} from '../types'
import {
  displaySkuOf,
  formatDecimal,
  formatMoney,
  formatNumber,
  formatRate,
  statusTag
} from './formatters'
import {
  DiagnosticInline,
  planTypeTagColor
} from '../components/AdviceGroups'

const { Text } = Typography

export function buildCampaignColumns(
  diagnosticsByCode: Map<string, NoonAdvertisingCampaignDiagnostic>
): ColumnsType<NoonAdvertisingCampaignRow> {
  return [
    {
      title: '广告计划',
      dataIndex: 'campaignCode',
      key: 'campaign',
      width: 260,
      fixed: 'left',
      render: (_, row) => (
        <div>
          <Text strong>{row.campaignName || row.campaignCode}</Text>
          <div className="noon-ads-muted">{row.campaignCode}</div>
        </div>
      )
    },
    {
      title: '计划类型',
      dataIndex: 'campaignCode',
      key: 'planType',
      width: 130,
      render: (_, row) => {
        const diagnostic = diagnosticsByCode.get(row.campaignCode)
        return <Tag color={planTypeTagColor(diagnostic?.planType)}>{diagnostic?.planTypeLabel || '未分类'}</Tag>
      }
    },
    {
      title: '结构诊断',
      dataIndex: 'campaignCode',
      key: 'diagnostic',
      width: 180,
      render: (_, row) => <DiagnosticInline diagnostic={diagnosticsByCode.get(row.campaignCode)} />
    },
    { title: '状态', dataIndex: 'campaignStatus', key: 'campaignStatus', width: 110, render: statusTag },
    { title: '花费', dataIndex: 'spendAmount', key: 'spendAmount', align: 'right', width: 120, render: formatMoney },
    { title: '收入', dataIndex: 'adRevenue', key: 'adRevenue', align: 'right', width: 120, render: formatMoney },
    { title: '订单', dataIndex: 'ordersCount', key: 'ordersCount', align: 'right', width: 90, render: formatNumber },
    { title: 'ROAS', dataIndex: 'roas', key: 'roas', align: 'right', width: 90, render: formatDecimal },
    { title: 'CTR', dataIndex: 'ctrPercentage', key: 'ctrPercentage', align: 'right', width: 90, render: formatRate },
    { title: 'CVR', dataIndex: 'cvrPercentage', key: 'cvrPercentage', align: 'right', width: 90, render: formatRate },
    { title: '零订单花费', dataIndex: 'zeroOrderSpendAmount', key: 'zeroOrderSpendAmount', align: 'right', width: 130, render: formatMoney },
    { title: '零订单占比', dataIndex: 'zeroOrderSpendShare', key: 'zeroOrderSpendShare', align: 'right', width: 120, render: formatRate }
  ]
}

export function buildQueryColumns(): ColumnsType<NoonAdvertisingQueryRow> {
  return [
    {
      title: '关键词/搜索词',
      dataIndex: 'queryText',
      key: 'queryText',
      width: 300,
      fixed: 'left',
      render: (_, row) => (
        <div className="noon-ads-query-cell">
          <span className="noon-ads-query-text">{row.queryText || '(缺失关键词/搜索词)'}</span>
          <span className="noon-ads-muted">{row.queryKind || 'unknown'} · {displaySkuOf(row) || 'no sku'}</span>
        </div>
      )
    },
    {
      title: '广告计划',
      dataIndex: 'campaignCode',
      key: 'campaignCode',
      width: 190,
      render: (_, row) => (
        <div>
          <Text>{row.campaignName || row.campaignCode}</Text>
          <div className="noon-ads-muted">{row.campaignCode}</div>
        </div>
      )
    },
    { title: '花费', dataIndex: 'spendAmount', key: 'spendAmount', align: 'right', width: 110, render: formatMoney },
    { title: '收入', dataIndex: 'adRevenue', key: 'adRevenue', align: 'right', width: 110, render: formatMoney },
    { title: '订单', dataIndex: 'ordersCount', key: 'ordersCount', align: 'right', width: 80, render: formatNumber },
    { title: '点击', dataIndex: 'clicks', key: 'clicks', align: 'right', width: 80, render: formatNumber },
    { title: 'ROAS', dataIndex: 'roas', key: 'roas', align: 'right', width: 90, render: formatDecimal },
    { title: 'CPC', dataIndex: 'cpc', key: 'cpc', align: 'right', width: 90, render: formatMoney },
    { title: 'CVR', dataIndex: 'cvrPercentage', key: 'cvrPercentage', align: 'right', width: 90, render: formatRate }
  ]
}
