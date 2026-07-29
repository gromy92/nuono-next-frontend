import { DatePicker, Input, InputNumber, Modal, Select } from 'antd'
import type { Dispatch, SetStateAction } from 'react'
import type { OfficialWarehouseAppointment } from '../api'
import { officialWarehousePublicAsnNo } from '../domain'
import { APPOINTMENT_CORRECTION_STATUS_OPTIONS } from '../officialWarehouseAsnPresentation'
import type { CorrectionFormState } from '../officialWarehouseFormModel'

type Props = {
  correctionTarget?: OfficialWarehouseAppointment
  correctionOpen: boolean
  setCorrectionOpen: Dispatch<SetStateAction<boolean>>
  submitCorrection: () => Promise<void>
  correctionSubmitting: boolean
  correctionForm: CorrectionFormState
  setCorrectionForm: Dispatch<SetStateAction<CorrectionFormState>>
}

export function OfficialWarehouseCorrectionModal({
  correctionTarget,
  correctionOpen,
  setCorrectionOpen,
  submitCorrection,
  correctionSubmitting,
  correctionForm,
  setCorrectionForm
}: Props) {
  return (
      <Modal
        title={correctionTarget ? `${officialWarehousePublicAsnNo(correctionTarget)} 约仓订正` : '约仓订正'}
        open={correctionOpen}
        width={560}
        onCancel={() => setCorrectionOpen(false)}
        onOk={() => void submitCorrection()}
        confirmLoading={correctionSubmitting}
        okText="保存订正"
        destroyOnClose
      >
        <div className="official-warehouse-appointment-form">
          <label className="official-warehouse-field">
            <span>订正状态</span>
            <Select
              value={correctionForm.status}
              options={APPOINTMENT_CORRECTION_STATUS_OPTIONS}
              onChange={(value) => setCorrectionForm((current) => ({ ...current, status: value }))}
            />
          </label>
          {correctionForm.status === 'SCHEDULED' ? (
            <>
              <label className="official-warehouse-field">
                <span>约仓日期</span>
                <DatePicker
                  value={correctionForm.appointmentDate}
                  onChange={(date) => setCorrectionForm((current) => ({ ...current, appointmentDate: date }))}
                />
              </label>
              <label className="official-warehouse-field">
                <span>Slot ID</span>
                <InputNumber
                  min={1}
                  value={correctionForm.appointmentSlotId}
                  onChange={(value) => setCorrectionForm((current) => ({ ...current, appointmentSlotId: value || undefined }))}
                />
              </label>
              <label className="official-warehouse-field">
                <span>约仓时段</span>
                <Input
                  value={correctionForm.appointmentTime}
                  onChange={(event) => setCorrectionForm((current) => ({ ...current, appointmentTime: event.target.value }))}
                  placeholder="例如 9am-10am"
                />
              </label>
            </>
          ) : null}
          {correctionForm.status === 'FAILED' ? (
            <>
              <label className="official-warehouse-field">
                <span>失败类型</span>
                <Input
                  value={correctionForm.failureType}
                  onChange={(event) => setCorrectionForm((current) => ({ ...current, failureType: event.target.value }))}
                  placeholder="例如 NO_CAPACITY"
                />
              </label>
              <label className="official-warehouse-field">
                <span>失败阶段</span>
                <Input
                  value={correctionForm.errorStage}
                  onChange={(event) => setCorrectionForm((current) => ({ ...current, errorStage: event.target.value }))}
                  placeholder="例如 MANUAL_CORRECTION"
                />
              </label>
              <label className="official-warehouse-field official-warehouse-field-wide">
                <span>说明</span>
                <Input.TextArea
                  rows={3}
                  value={correctionForm.errorMessage}
                  onChange={(event) => setCorrectionForm((current) => ({ ...current, errorMessage: event.target.value }))}
                  placeholder="记录人工核对或 Noon 后台原因"
                />
              </label>
            </>
          ) : null}
        </div>
      </Modal>


  )
}
