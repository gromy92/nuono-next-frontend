import {
  CalendarOutlined,
  DownloadOutlined,
  EyeOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
import { Button, Space, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import type { OfficialWarehouseAppointment, OfficialWarehouseAsn } from '../api'
import {
  appointmentAwareWarehouseLabel,
  appointmentDeliveryTimeText,
  appointmentDurationText,
  appointmentStatusTag,
  asnHasInboundResult,
  asnInboundStage,
  inboundProgress,
  inboundStageTag,
  isAutoAppointmentRunning,
  noonAsnStatusTag,
  statusTag
} from '../officialWarehouseAsnPresentation'
import { officialWarehousePublicAsnNo } from '../domain'
import {
  officialWarehouseAppointmentCanCancel,
  officialWarehouseAppointmentCanRun,
  officialWarehouseAppointmentRequiresReconciliation
} from '../officialWarehouseAppointmentLifecycle'
import type { AppointmentSubmitMode } from '../officialWarehouseFormModel'

const { Text } = Typography

type Dependencies = {
  durationNow: Dayjs
  pdfPrintingAsnId?: string
  appointmentRunningId?: string
  openDetail: (row: OfficialWarehouseAsn) => Promise<void>
  downloadFbnTransferPdf: (row: OfficialWarehouseAsn) => Promise<void>
  requestOpenAppointment: (row: OfficialWarehouseAsn, mode: AppointmentSubmitMode) => void
  runAppointmentNow: (appointment: OfficialWarehouseAppointment) => Promise<void>
  cancelAppointment: (appointment: OfficialWarehouseAppointment) => Promise<void>
  openCorrection: (appointment: OfficialWarehouseAppointment) => void
}

export function buildOfficialWarehouseAsnColumns({
  durationNow,
  pdfPrintingAsnId,
  appointmentRunningId,
  openDetail,
  downloadFbnTransferPdf,
  requestOpenAppointment,
  runAppointmentNow,
  cancelAppointment,
  openCorrection
}: Dependencies): ColumnsType<OfficialWarehouseAsn> {
  return [
    {
      title: 'ASN / 状态',
      width: 150,
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
            {statusTag(row.status)}
          </div>
        )
      }
    },
    {
      title: '货量 / 仓库',
      width: 120,
      render: (_, row) => (
        <div className="official-warehouse-stack">
          <div className="official-warehouse-quantity">
            <span>{Number(row.totalQuantity || 0).toLocaleString()} 件</span>
          </div>
          {appointmentAwareWarehouseLabel(row)}
        </div>
      )
    },
    {
      title: '状态',
      width: 190,
      render: (_, row) => {
        if (asnHasInboundResult(row)) {
          return (
            <div className="official-warehouse-stack">
              {inboundStageTag(asnInboundStage(row))}
            </div>
          )
        }
        const appointment = row.appointment
        if (!appointment) {
          return (
            <div className="official-warehouse-stack">
              {row.noonAsnStatus ? noonAsnStatusTag(row.noonAsnStatus) : <Text type="secondary">未提交</Text>}
              {row.noonAsnStatus ? <Text type="secondary">{row.noonAsnStatus}</Text> : null}
            </div>
          )
        }
        const deliveryTimeText = appointmentDeliveryTimeText(appointment)
        const shouldLabelDeliveryTime = appointment.status === 'SCHEDULED' && !asnHasInboundResult(row)
        return (
          <div className="official-warehouse-stack">
            {appointmentStatusTag(appointment.status, appointment.failureType)}
            {deliveryTimeText ? (
              shouldLabelDeliveryTime ? (
                <Text className="official-warehouse-delivery-time">送仓时间：{deliveryTimeText}</Text>
              ) : (
                <Text type="secondary">{deliveryTimeText}</Text>
              )
            ) : null}
          </div>
        )
      }
    },
    {
      title: '入仓情况',
      width: 220,
      render: (_, row) => (
        <Button
          type="text"
          className="official-warehouse-inbound-cell-button"
          onClick={() => void openDetail(row)}
        >
          <div className="official-warehouse-stack">
            {row.inboundSummary?.reportConnected ? (
              inboundProgress(row.inboundSummary)
            ) : (
              <Text type="secondary">暂无入仓回执</Text>
            )}
          </div>
        </Button>
      )
    },
    {
      title: '创建时间',
      width: 170,
      render: (_, row) => (
        <div className="official-warehouse-stack">
          <Text>{row.createdAt || '-'}</Text>
        </div>
      )
    },
    {
      title: '约仓耗时',
      width: 130,
      render: (_, row) => <Text>{appointmentDurationText(row.appointment, durationNow)}</Text>
    },
    {
      title: '操作',
      width: 280,
      fixed: 'right',
      render: (_, row) => {
        const inboundOnly = asnHasInboundResult(row)
        const reconciliationRequired =
          officialWarehouseAppointmentRequiresReconciliation(row.appointment)
        const appointmentRunning = row.appointment?.status === 'RUNNING'
        return (
          <Space size={4} wrap className="official-warehouse-actions">
            <Button size="small" icon={<EyeOutlined />} onClick={() => void openDetail(row)}>
              查看
            </Button>
            {!inboundOnly && row.appointment?.status === 'SCHEDULED' ? (
              <Button
                size="small"
                icon={<DownloadOutlined />}
                loading={pdfPrintingAsnId === row.id}
                onClick={() => void downloadFbnTransferPdf(row)}
              >
                下载 PDF
              </Button>
            ) : null}
            {!inboundOnly && row.status === 'LINES_CREATED' && !reconciliationRequired ? (
              <Button
                size="small"
                icon={<ThunderboltOutlined />}
                disabled={isAutoAppointmentRunning(row)}
                title={isAutoAppointmentRunning(row) ? '自动约仓处理中，不能手动约仓' : undefined}
                onClick={() => requestOpenAppointment(row, 'manual')}
              >
                手动约仓
              </Button>
            ) : null}
            {!inboundOnly &&
            row.status === 'LINES_CREATED' &&
            !reconciliationRequired &&
            row.appointment?.status !== 'SCHEDULED' ? (
              <Button
                size="small"
                icon={<CalendarOutlined />}
                disabled={appointmentRunning}
                title={appointmentRunning ? '约仓正在执行，请等待结果' : undefined}
                onClick={() => requestOpenAppointment(row, 'auto')}
              >
                自动约仓
              </Button>
            ) : null}
            {!inboundOnly && row.appointment && reconciliationRequired ? (
              <Button size="small" danger onClick={() => openCorrection(row.appointment!)}>
                对账并订正
              </Button>
            ) : null}
            {!inboundOnly && row.appointment && officialWarehouseAppointmentCanRun(row.appointment) ? (
              <Button
                size="small"
                icon={<ThunderboltOutlined />}
                loading={appointmentRunningId === row.appointment.id}
                onClick={() => void runAppointmentNow(row.appointment!)}
              >
                执行一次
              </Button>
            ) : null}
            {!inboundOnly && row.appointment && officialWarehouseAppointmentCanCancel(row.appointment) ? (
              <Button
                size="small"
                danger
                loading={appointmentRunningId === row.appointment.id}
                onClick={() => void cancelAppointment(row.appointment!)}
              >
                取消
              </Button>
            ) : null}
          </Space>
        )
      }
    }
  ]
}
