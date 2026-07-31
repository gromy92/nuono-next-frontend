import {
  appointmentStatusDisplayMeta,
  buildAppointmentRunOnceFeedback,
  officialWarehouseAppointmentCanCancel,
  officialWarehouseAppointmentCanRun,
  officialWarehouseAppointmentRequiresReconciliation,
  officialWarehouseBusinessErrorText
} from './domain'

const reconciliationAppointment = {
  status: 'FAILED',
  failureType: 'NOON_WRITE_RECONCILIATION_REQUIRED'
}

if (!officialWarehouseAppointmentRequiresReconciliation(reconciliationAppointment)) {
  throw new Error('expected unknown Noon write results to require reconciliation')
}

if (
  appointmentStatusDisplayMeta(
    reconciliationAppointment.status,
    reconciliationAppointment.failureType
  ).label !== '待 Noon 对账'
) {
  throw new Error('expected unknown Noon write results to display as reconciliation required')
}

if (
  officialWarehouseAppointmentCanRun(reconciliationAppointment) ||
  officialWarehouseAppointmentCanCancel(reconciliationAppointment)
) {
  throw new Error('expected quarantined appointments to block run and cancel actions')
}

if (
  officialWarehouseAppointmentCanRun({ status: 'RUNNING' }) ||
  officialWarehouseAppointmentCanCancel({ status: 'RUNNING' })
) {
  throw new Error('expected running appointments to hide actions rejected by the backend state machine')
}

if (
  !officialWarehouseAppointmentCanRun({ status: 'PENDING' }) ||
  !officialWarehouseAppointmentCanCancel({
    status: 'FAILED',
    failureType: 'NO_CAPACITY'
  })
) {
  throw new Error('expected ordinary pending or failed appointments to retain valid actions')
}

const reconciliationBusinessError = officialWarehouseBusinessErrorText(
  'Socket closed after SCHEDULE_APPOINTMENT',
  reconciliationAppointment.failureType
)
if (
  reconciliationBusinessError.includes('NOON_WRITE_RECONCILIATION_REQUIRED') ||
  !reconciliationBusinessError.includes('禁止自动重试')
) {
  throw new Error('expected unknown Noon write errors to explain the safe recovery action')
}

const reconciliationRunFeedback = buildAppointmentRunOnceFeedback({
  ...reconciliationAppointment,
  errorMessage: 'response lost'
})
if (
  reconciliationRunFeedback.type !== 'warning' ||
  !reconciliationRunFeedback.message.includes('禁止自动重试')
) {
  throw new Error('expected an unknown write result to direct the operator to reconciliation')
}
