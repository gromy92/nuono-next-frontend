import {
  CalendarOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons'
import { Alert, Button, Empty, Input, Modal, Select, Space, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Dispatch, SetStateAction } from 'react'
import type { OfficialWarehouseAppointment, OfficialWarehouseAsn } from '../api'
import {
  APPOINTMENT_STATUS_OPTIONS,
  ASN_APPOINTMENT_STATUS_FILTER_OPTIONS,
  ASN_INBOUND_STATUS_FILTER_OPTIONS
} from '../officialWarehouseAsnPresentation'
import type {
  OfficialWarehouseAppointmentFilterStatus,
  OfficialWarehouseInboundFilterStatus
} from '../domain'
import type { AppointmentSubmitFeedback } from '../officialWarehouseFormModel'
import { Metric } from './OfficialWarehouseMetrics'

const { Text } = Typography

type Props = {
  keyword: string
  setKeyword: Dispatch<SetStateAction<string>>
  loadAsns: () => Promise<void>
  asnAppointmentStatusFilters: OfficialWarehouseAppointmentFilterStatus[]
  setAsnAppointmentStatusFilters: Dispatch<SetStateAction<OfficialWarehouseAppointmentFilterStatus[]>>
  asnInboundStatusFilters: OfficialWarehouseInboundFilterStatus[]
  setAsnInboundStatusFilters: Dispatch<SetStateAction<OfficialWarehouseInboundFilterStatus[]>>
  loading: boolean
  syncNoonAsnList: () => Promise<void>
  asnSyncing: boolean
  setAppointmentHistoryOpen: Dispatch<SetStateAction<boolean>>
  setCreateOpen: Dispatch<SetStateAction<boolean>>
  loadError?: string
  asnSyncFeedback?: AppointmentSubmitFeedback
  setAsnSyncFeedback: Dispatch<SetStateAction<AppointmentSubmitFeedback | undefined>>
  appointmentRunFeedback?: AppointmentSubmitFeedback
  setAppointmentRunFeedback: Dispatch<SetStateAction<AppointmentSubmitFeedback | undefined>>
  asnColumns: ColumnsType<OfficialWarehouseAsn>
  visibleAsns: OfficialWarehouseAsn[]
  appointmentHistoryOpen: boolean
  appointmentStatusFilter?: string
  setAppointmentStatusFilter: Dispatch<SetStateAction<string | undefined>>
  appointmentKeyword: string
  setAppointmentKeyword: Dispatch<SetStateAction<string>>
  loadAppointmentHistory: () => Promise<void>
  appointmentHistoryLoading: boolean
  appointmentHistorySummary: {
    total: number
    pending: number
    scheduled: number
    failed: number
    canceled: number
    noCapacity: number
    reconciliationRequired: number
  }
  appointmentColumns: ColumnsType<OfficialWarehouseAppointment>
  appointments: OfficialWarehouseAppointment[]
}

export function OfficialWarehouseListPanel(props: Props) {
  const {
    keyword, setKeyword, loadAsns, asnAppointmentStatusFilters,
    setAsnAppointmentStatusFilters, asnInboundStatusFilters,
    setAsnInboundStatusFilters, loading, syncNoonAsnList, asnSyncing,
    setAppointmentHistoryOpen, setCreateOpen, loadError, asnSyncFeedback,
    setAsnSyncFeedback, appointmentRunFeedback, setAppointmentRunFeedback,
    asnColumns, visibleAsns, appointmentHistoryOpen, appointmentStatusFilter,
    setAppointmentStatusFilter, appointmentKeyword, setAppointmentKeyword,
    loadAppointmentHistory, appointmentHistoryLoading, appointmentHistorySummary,
    appointmentColumns, appointments
  } = props
  return (
    <>
      <div className="official-warehouse-toolbar">
        <div className="official-warehouse-toolbar-left">
          <Input
            className="official-warehouse-search"
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Noon ASN"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onPressEnter={() => void loadAsns()}
          />
          <Select<OfficialWarehouseAppointmentFilterStatus[]>
            mode="multiple"
            allowClear
            maxTagCount="responsive"
            className="official-warehouse-list-status-filter"
            placeholder="约仓状态"
            value={asnAppointmentStatusFilters}
            options={ASN_APPOINTMENT_STATUS_FILTER_OPTIONS}
            onChange={setAsnAppointmentStatusFilters}
          />
          <Select<OfficialWarehouseInboundFilterStatus[]>
            mode="multiple"
            allowClear
            maxTagCount="responsive"
            className="official-warehouse-list-status-filter"
            placeholder="入仓状态"
            value={asnInboundStatusFilters}
            options={ASN_INBOUND_STATUS_FILTER_OPTIONS}
            onChange={setAsnInboundStatusFilters}
          />
          <Button icon={<ReloadOutlined />} onClick={() => void loadAsns()} loading={loading}>
            刷新
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => void syncNoonAsnList()} loading={asnSyncing}>
            同步 ASN 列表
          </Button>
        </div>
        <div className="official-warehouse-toolbar-right">
          <Button icon={<CalendarOutlined />} onClick={() => setAppointmentHistoryOpen(true)}>
            约仓历史
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            创建 ASN
          </Button>
        </div>
      </div>

      {loadError ? <Alert type="error" showIcon message={loadError} /> : null}
      {asnSyncFeedback ? (
        <Alert
          type={asnSyncFeedback.type}
          showIcon
          closable
          message={asnSyncFeedback.message}
          onClose={() => setAsnSyncFeedback(undefined)}
        />
      ) : null}
      {appointmentRunFeedback ? (
        <Alert
          type={appointmentRunFeedback.type}
          showIcon
          closable
          message={appointmentRunFeedback.message}
          onClose={() => setAppointmentRunFeedback(undefined)}
        />
      ) : null}

      <div className="official-warehouse-table-panel">
        <Table
          className="official-warehouse-asn-table"
          rowKey="id"
          size="small"
          loading={loading}
          columns={asnColumns}
          dataSource={visibleAsns}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          scroll={{ x: 1320 }}
          locale={{ emptyText: <Empty description="暂无 Noon 官方仓 ASN" /> }}
        />
      </div>

      <Modal
        title="约仓历史"
        open={appointmentHistoryOpen}
        width={1280}
        footer={null}
        onCancel={() => setAppointmentHistoryOpen(false)}
        destroyOnClose={false}
      >
        <div className="official-warehouse-history-modal-content">
          <div className="official-warehouse-section-header">
            <Text type="secondary">记录手动约仓、自动约仓、失败原因和人工订正结果</Text>
            <Space wrap>
              <Select
                allowClear
                className="official-warehouse-status-filter"
                placeholder="约仓状态"
                value={appointmentStatusFilter}
                options={APPOINTMENT_STATUS_OPTIONS}
                onChange={(value) => setAppointmentStatusFilter(value)}
              />
              <Input
                className="official-warehouse-search"
                allowClear
                prefix={<SearchOutlined />}
                placeholder="ASN / 仓库"
                value={appointmentKeyword}
                onChange={(event) => setAppointmentKeyword(event.target.value)}
                onPressEnter={() => void loadAppointmentHistory()}
              />
              <Button icon={<ReloadOutlined />} onClick={() => void loadAppointmentHistory()} loading={appointmentHistoryLoading}>
                刷新历史
              </Button>
            </Space>
          </div>
          <div className="official-warehouse-metrics official-warehouse-history-metrics">
            <Metric label="约仓记录" value={appointmentHistorySummary.total} />
            <Metric label="约仓中" value={appointmentHistorySummary.pending} tone="blue" />
            <Metric label="成功" value={appointmentHistorySummary.scheduled} tone="green" />
            <Metric label="失败" value={appointmentHistorySummary.failed} tone="red" />
            <Metric label="待 Noon 对账" value={appointmentHistorySummary.reconciliationRequired} tone="red" />
            <Metric label="已取消" value={appointmentHistorySummary.canceled} />
            <Metric label="无仓位" value={appointmentHistorySummary.noCapacity} tone="red" />
          </div>
          <Table
            rowKey="id"
            size="small"
            loading={appointmentHistoryLoading}
            columns={appointmentColumns}
            dataSource={appointments}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 1420 }}
            locale={{ emptyText: <Empty description="暂无约仓历史" /> }}
          />
        </div>
      </Modal>


    </>
  )
}
