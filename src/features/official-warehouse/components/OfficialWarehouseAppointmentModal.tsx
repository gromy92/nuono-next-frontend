import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { Alert, Button, Checkbox, DatePicker, Modal, Select, Typography } from 'antd'
import dayjs from 'dayjs'
import type { Dispatch, SetStateAction } from 'react'
import type { OfficialWarehouseAppointmentAvailability, OfficialWarehouseAsn } from '../api'
import { officialWarehousePublicAsnNo } from '../domain'
import {
  availabilitySlotKey,
  splitSlotTime,
  type AppointmentFormState,
  type AppointmentOpenRequest,
  type AppointmentSubmitFeedback,
  type AppointmentSubmitMode
} from '../officialWarehouseFormModel'

const { Text } = Typography

type Props = {
  rescheduleConfirm?: AppointmentOpenRequest
  setRescheduleConfirm: Dispatch<SetStateAction<AppointmentOpenRequest | undefined>>
  confirmRescheduleAppointment: () => void
  appointmentTarget?: OfficialWarehouseAsn
  appointmentMode: AppointmentSubmitMode
  appointmentOpen: boolean
  setAppointmentOpen: Dispatch<SetStateAction<boolean>>
  submitAppointment: () => Promise<void>
  appointmentSubmitting: boolean
  appointmentForm: AppointmentFormState
  setAppointmentForm: Dispatch<SetStateAction<AppointmentFormState>>
  appointmentWarehouseOptions: Array<{ label: string; value: string; code?: string }>
  availabilitySlots: OfficialWarehouseAppointmentAvailability[]
  setAvailabilitySlots: Dispatch<SetStateAction<OfficialWarehouseAppointmentAvailability[]>>
  availabilityError?: string
  setAvailabilityError: Dispatch<SetStateAction<string | undefined>>
  appointmentSubmitFeedback?: AppointmentSubmitFeedback
  setAppointmentSubmitFeedback: Dispatch<SetStateAction<AppointmentSubmitFeedback | undefined>>
  manualMonthLabel: string
  manualVisibleDates: string[]
  selectedManualDate?: string
  availabilityLoading: boolean
  manualDateOffset: number
  setManualDateOffset: Dispatch<SetStateAction<number>>
  manualCalendarDates: string[]
  setManualSelectedDate: Dispatch<SetStateAction<string | undefined>>
  manualAvailabilityQueryKey: string
  manualSlotsForSelectedDate: OfficialWarehouseAppointmentAvailability[]
  appointmentTimeOptions: Array<{ label: string; value: string }>
}

export function OfficialWarehouseAppointmentModal(props: Props) {
  const {
    rescheduleConfirm, setRescheduleConfirm, confirmRescheduleAppointment,
    appointmentTarget, appointmentMode, appointmentOpen, setAppointmentOpen,
    submitAppointment, appointmentSubmitting, appointmentForm, setAppointmentForm,
    appointmentWarehouseOptions, availabilitySlots, setAvailabilitySlots,
    availabilityError, setAvailabilityError, appointmentSubmitFeedback,
    setAppointmentSubmitFeedback, manualMonthLabel, manualVisibleDates,
    selectedManualDate, availabilityLoading, manualDateOffset, setManualDateOffset,
    manualCalendarDates, setManualSelectedDate, manualAvailabilityQueryKey,
    manualSlotsForSelectedDate, appointmentTimeOptions
  } = props
  return (
    <>
      <Modal
        title="确认重新约仓"
        open={Boolean(rescheduleConfirm)}
        onCancel={() => setRescheduleConfirm(undefined)}
        onOk={confirmRescheduleAppointment}
        okText={rescheduleConfirm?.mode === 'manual' ? '继续手动约仓' : '继续自动约仓'}
        cancelText="取消"
        destroyOnClose
      >
        <Text>
          当前 ASN 已约仓成功。继续操作会取消当前约仓，并按新的仓库和时间重新约仓。
        </Text>
      </Modal>

      <Modal
        title={appointmentTarget ? `${officialWarehousePublicAsnNo(appointmentTarget)} ${appointmentMode === 'manual' ? '手动约仓' : '自动约仓'}` : appointmentMode === 'manual' ? '手动约仓' : '自动约仓'}
        open={appointmentOpen}
        width={appointmentMode === 'manual' ? 980 : 560}
        onCancel={() => setAppointmentOpen(false)}
        onOk={() => void submitAppointment()}
        confirmLoading={appointmentSubmitting}
        okText={appointmentMode === 'manual' ? '立即约仓' : '提交自动约仓'}
        destroyOnClose
      >
        {appointmentMode === 'manual' ? (
          <div className="official-warehouse-manual-picker">
            <div className="official-warehouse-appointment-form official-warehouse-manual-basic-form">
              <label className="official-warehouse-field">
                <span>到达仓库</span>
                <Select
                  value={appointmentForm.warehouseToPartnerCode || undefined}
                  options={appointmentWarehouseOptions}
                  placeholder="请选择 Noon 路由仓"
                  onChange={(value, option) => {
                    const selected = Array.isArray(option) ? option[0] : option
                    setAppointmentForm((current) => ({
                      ...current,
                      warehouseToPartnerCode: value,
                      warehouseToCode: selected?.code,
                      selectedSlotKey: undefined
                    }))
                    setAvailabilitySlots([])
                    setAvailabilityError(undefined)
                    setAppointmentSubmitFeedback(undefined)
                    setManualSelectedDate(undefined)
                  }}
                />
              </label>
            </div>
            <div className="official-warehouse-month-label">
              <span>{manualMonthLabel}</span>
            </div>
            <div className="official-warehouse-date-row">
              <Button
                shape="circle"
                className="official-warehouse-date-arrow"
                icon={<LeftOutlined />}
                disabled={availabilityLoading || manualDateOffset <= 0}
                onClick={() => setManualDateOffset((current) => Math.max(0, current - 1))}
              />
              <div className="official-warehouse-date-pills">
                {manualVisibleDates.map((date) => {
                  const active = date === selectedManualDate
                  return (
                    <button
                      key={date}
                      type="button"
                      disabled={availabilityLoading}
                      className={`official-warehouse-date-pill${active ? ' official-warehouse-date-pill-active' : ''}`}
                      onClick={() => {
                        const firstSlot = availabilitySlots.find((slot) => slot.date === date)
                        setManualSelectedDate(date)
                        setAppointmentSubmitFeedback(undefined)
                        setAppointmentForm((current) => ({
                          ...current,
                          selectedSlotKey: firstSlot ? availabilitySlotKey(firstSlot) : undefined
                        }))
                      }}
                    >
                      {dayjs(date).format('D')}
                    </button>
                  )
                })}
              </div>
              <Button
                shape="circle"
                className="official-warehouse-date-arrow"
                icon={<RightOutlined />}
                disabled={availabilityLoading || manualDateOffset + 5 >= manualCalendarDates.length}
                onClick={() =>
                  setManualDateOffset((current) => Math.min(Math.max(0, manualCalendarDates.length - 5), current + 1))
                }
              />
            </div>
            {availabilityLoading ? (
              <div className="official-warehouse-slot-empty">正在查询 Noon 仓位...</div>
            ) : null}
            {availabilityError ? <Alert type="error" showIcon message={availabilityError} /> : null}
            {appointmentSubmitFeedback ? (
              <Alert type={appointmentSubmitFeedback.type} showIcon message={appointmentSubmitFeedback.message} />
            ) : null}
            {!availabilityLoading && !availabilityError && manualAvailabilityQueryKey && !availabilitySlots.length ? (
              <Alert
                type="warning"
                showIcon
                message="当前仓库和时间暂无可用仓位，可调整时间范围后再手动约仓，或另行提交自动约仓。"
              />
            ) : null}
            <div className="official-warehouse-slot-grid">
              {manualSlotsForSelectedDate.map((slot) => {
                const active = availabilitySlotKey(slot) === appointmentForm.selectedSlotKey
                const [from, to] = splitSlotTime(slot.time)
                return (
                  <button
                    key={availabilitySlotKey(slot)}
                    type="button"
                    className={`official-warehouse-slot-card${active ? ' official-warehouse-slot-card-active' : ''}`}
                    onClick={() => {
                      setAppointmentSubmitFeedback(undefined)
                      setAppointmentForm((current) => ({ ...current, selectedSlotKey: availabilitySlotKey(slot) }))
                    }}
                  >
                    <span className="official-warehouse-slot-caption">From</span>
                    <span className="official-warehouse-slot-caption official-warehouse-slot-caption-to">To</span>
                    <span className="official-warehouse-slot-time">{from}</span>
                    <span className="official-warehouse-slot-dash">-</span>
                    <span className="official-warehouse-slot-time">{to}</span>
                  </button>
                )
              })}
            </div>
            {!availabilityLoading && !availabilityError && manualAvailabilityQueryKey && selectedManualDate && !manualSlotsForSelectedDate.length ? (
              <div className="official-warehouse-slot-empty">当前日期暂无可用时段</div>
            ) : null}
          </div>
        ) : (
          <div className="official-warehouse-appointment-form">
            <label className="official-warehouse-field">
              <span>到达仓库</span>
              <Select
                value={appointmentForm.warehouseToPartnerCode || undefined}
                options={appointmentWarehouseOptions}
                placeholder="请选择 Noon 路由仓"
                onChange={(value, option) => {
                  const selected = Array.isArray(option) ? option[0] : option
                  setAppointmentForm((current) => ({
                    ...current,
                    warehouseToPartnerCode: value,
                    warehouseToCode: selected?.code
                  }))
                }}
              />
            </label>
            <label className="official-warehouse-field">
              <span>约仓日期</span>
              <DatePicker.RangePicker
                value={appointmentForm.apDates}
                disabledDate={(current) => Boolean(current && current < dayjs().startOf('day'))}
                onChange={(dates) =>
                  setAppointmentForm((current) => ({
                    ...current,
                    apDates: dates?.[0] && dates?.[1] ? [dates[0], dates[1]] : null
                  }))
                }
              />
            </label>
            <label className="official-warehouse-field">
              <span>约仓时间</span>
              <Select
                mode="multiple"
                allowClear
                maxTagCount={4}
                value={appointmentForm.apTimeRange}
                options={appointmentTimeOptions}
                placeholder="不选表示全天"
                onChange={(values) =>
                  setAppointmentForm((current) => ({ ...current, apTimeRange: values }))
                }
              />
            </label>
            <Checkbox
              checked={appointmentForm.availableToday}
              onChange={(event) =>
                setAppointmentForm((current) => ({ ...current, availableToday: event.target.checked }))
              }
            >
              可约当天
            </Checkbox>
            {appointmentSubmitFeedback ? (
              <Alert type={appointmentSubmitFeedback.type} showIcon message={appointmentSubmitFeedback.message} />
            ) : null}
          </div>
        )}
      </Modal>


    </>
  )
}
