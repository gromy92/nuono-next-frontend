import { Button, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import type { OfficialWarehouseAppointment } from '../api'
import {
  appointmentDurationText,
  appointmentStatusTag,
  businessErrorText
} from '../officialWarehouseAsnPresentation'
import { officialWarehousePublicAsnNo } from '../domain'

const { Text } = Typography

export function buildOfficialWarehouseAppointmentColumns({
  durationNow,
  openCorrection
}: {
  durationNow: Dayjs
  openCorrection: (appointment: OfficialWarehouseAppointment) => void
}): ColumnsType<OfficialWarehouseAppointment> {
  return [
    {
      title: 'ASN / 状态',
      width: 170,
      fixed: 'left',
      render: (_, row) => {
        const asnNo = officialWarehousePublicAsnNo(row)
        return (
          <div className="official-warehouse-identity">
            <Text
              strong
              copyable={asnNo !== '-' ? { text: asnNo, tooltips: ['复制 ASN', '已复制'] } : false}
              className="official-warehouse-asn-copy"
            >
              {asnNo}
            </Text>
            {appointmentStatusTag(row.status)}
          </div>
        )
      }
    },
    {
      title: '店铺/站点',
      width: 150,
      render: (_, row) => (
        <div className="official-warehouse-stack">
          <Text>{row.storeCode || '-'}</Text>
          <Text type="secondary">{row.siteCode || '-'}</Text>
        </div>
      )
    },
    {
      title: '仓库',
      width: 160,
      render: (_, row) => (
        <Text>{row.warehouseToPartnerCode || '-'}</Text>
      )
    },
    {
      title: '预约范围',
      width: 210,
      render: (_, row) => (
        <div className="official-warehouse-stack">
          <Text>{row.apStartDate} - {row.apEndDate}</Text>
          <Text type="secondary">{row.apTimeRange || '全天'}</Text>
        </div>
      )
    },
    {
      title: '预约结果',
      width: 170,
      render: (_, row) => row.appointmentDate
        ? `${row.appointmentDate} ${row.appointmentTime || ''}`.trim()
        : '-'
    },
    {
      title: '尝试',
      width: 130,
      render: (_, row) => (
        <div className="official-warehouse-stack">
          <Text>{row.attemptCount || 0} 次</Text>
          <Text type="secondary">{row.lastAttemptAt || '-'}</Text>
        </div>
      )
    },
    {
      title: '失败原因',
      width: 260,
      ellipsis: true,
      render: (_, row) => row.failureType || row.errorMessage
        ? <Text type="danger">{businessErrorText(row.errorMessage, row.failureType)}</Text>
        : '-'
    },
    {
      title: '创建时间',
      width: 170,
      render: (_, row) => <Text>{row.createdAt || '-'}</Text>
    },
    {
      title: '约仓耗时',
      width: 130,
      render: (_, row) => <Text>{appointmentDurationText(row, durationNow)}</Text>
    },
    {
      title: '操作',
      width: 96,
      fixed: 'right',
      render: (_, row) => (
        <Button size="small" onClick={() => openCorrection(row)}>
          订正
        </Button>
      )
    }
  ]
}
