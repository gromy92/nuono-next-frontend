import { Alert, Checkbox, DatePicker, Input, InputNumber, Modal, Select } from 'antd'
import type { Dispatch, SetStateAction } from 'react'
import type { OfficialWarehouseAppointment } from '../api'
import { officialWarehousePublicAsnNo } from '../domain'
import {
  OFFICIAL_WAREHOUSE_RECONCILIATION_STATUS_OPTIONS,
  officialWarehouseAppointmentRequiresReconciliation
} from '../officialWarehouseAppointmentLifecycle'
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
  const reconciliationRequired =
    officialWarehouseAppointmentRequiresReconciliation(correctionTarget)
  return (
      <Modal
        title={
          correctionTarget
            ? `${officialWarehousePublicAsnNo(correctionTarget)} ${
                reconciliationRequired ? 'Noon 对账订正' : '约仓订正'
              }`
            : '约仓订正'
        }
        open={correctionOpen}
        width={560}
        onCancel={() => setCorrectionOpen(false)}
        onOk={() => void submitCorrection()}
        confirmLoading={correctionSubmitting}
        okText={reconciliationRequired ? '确认对账并订正' : '保存订正'}
        okButtonProps={{
          disabled: reconciliationRequired && !correctionForm.reconciliationConfirmed
        }}
        destroyOnClose
      >
        <div className="official-warehouse-appointment-form">
          {reconciliationRequired ? (
            <Alert
              type="warning"
              showIcon
              message="Noon 约仓结果未知，当前记录已暂停自动重试"
              description="请先在 Noon 后台按 ASN 核对实际约仓状态，再让本地状态与远端结果保持一致。"
            />
          ) : null}
          <label className="official-warehouse-field">
            <span>订正状态</span>
            <Select
              value={correctionForm.status}
              options={
                reconciliationRequired
                  ? OFFICIAL_WAREHOUSE_RECONCILIATION_STATUS_OPTIONS
                  : APPOINTMENT_CORRECTION_STATUS_OPTIONS
              }
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
          {correctionForm.status === 'FAILED' && !reconciliationRequired ? (
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
            </>
          ) : null}
          {correctionForm.status === 'FAILED' ? (
            <label className="official-warehouse-field official-warehouse-field-wide">
              <span>{reconciliationRequired ? 'Noon 对账结论' : '说明'}</span>
              <Input.TextArea
                rows={3}
                value={correctionForm.errorMessage}
                onChange={(event) => setCorrectionForm((current) => ({ ...current, errorMessage: event.target.value }))}
                placeholder={
                  reconciliationRequired
                    ? '说明 Noon 后台未约成功的核对结果'
                    : '记录人工核对或 Noon 后台原因'
                }
              />
            </label>
          ) : null}
          {reconciliationRequired ? (
            <Checkbox
              checked={correctionForm.reconciliationConfirmed}
              onChange={(event) =>
                setCorrectionForm((current) => ({
                  ...current,
                  reconciliationConfirmed: event.target.checked
                }))
              }
            >
              我已在 Noon 后台核对该 ASN 当前约仓结果，并确认以上订正与远端一致
            </Checkbox>
          ) : null}
        </div>
      </Modal>


  )
}
