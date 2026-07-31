import { useEffect, useState } from 'react'
import type { AuthSession } from '../auth/session'
import { buildOfficialWarehouseAsnColumns } from './columns/officialWarehouseAsnColumns'
import { buildOfficialWarehouseAppointmentColumns } from './columns/officialWarehouseAppointmentColumns'
import { buildOfficialWarehouseCandidateColumns } from './columns/officialWarehouseCandidateColumns'
import { buildOfficialWarehouseInboundColumns } from './columns/officialWarehouseInboundColumns'
import { OfficialWarehouseAppointmentModal } from './components/OfficialWarehouseAppointmentModal'
import { OfficialWarehouseCorrectionModal } from './components/OfficialWarehouseCorrectionModal'
import { OfficialWarehouseCreateAsnModals } from './components/OfficialWarehouseCreateAsnModals'
import { OfficialWarehouseDetailDrawer } from './components/OfficialWarehouseDetailDrawer'
import { OfficialWarehouseListPanel } from './components/OfficialWarehouseListPanel'
import { useOfficialWarehouseAppointmentActions } from './hooks/useOfficialWarehouseAppointmentActions'
import { useOfficialWarehouseAppointmentHistory } from './hooks/useOfficialWarehouseAppointmentHistory'
import { useOfficialWarehouseAppointmentWorkflow } from './hooks/useOfficialWarehouseAppointmentWorkflow'
import { useOfficialWarehouseAsnState } from './hooks/useOfficialWarehouseAsnState'
import { useOfficialWarehouseCreateAsn } from './hooks/useOfficialWarehouseCreateAsn'
import { useOfficialWarehouseSpecEditor } from './hooks/useOfficialWarehouseSpecEditor'
import './OfficialWarehousePage.css'

type OfficialWarehousePageProps = {
  session?: AuthSession | null
}

export function OfficialWarehousePage({ session }: OfficialWarehousePageProps) {
  const activeStoreCode = session?.currentStore?.storeCode || session?.userStores?.[0]?.storeCode || ''
  const activeSiteCode = (session?.currentStore?.site || session?.userStores?.[0]?.site || 'SA').toUpperCase()
  const initialStore = activeStoreCode
  const initialSite = activeSiteCode
  const [storeCode, setStoreCode] = useState(initialStore)
  const [siteCode, setSiteCode] = useState(initialSite)
  const {
    createOpen, setCreateOpen, candidateKeyword, setCandidateKeyword,
    candidateLoading, candidates, shippingBatches, selectedShippingBatchIds,
    setSelectedShippingBatchIds, selectedCandidateKeys, quantityByCandidateKey,
    setQuantityByCandidateKey, submitting, createSubmitFeedback,
    setCreateSubmitFeedback, createAsnConfirmation, setCreateAsnConfirmation,
    shippingBatchKeyword, shippingBatchLoading, shippingBatchLoadError,
    loadShippingBatches, handleShippingBatchSearch, shippingBatchOptions,
    selectedAlreadyAppointedBatches, candidateEmptyDescription, loadCandidates,
    updateCandidateSelection, clearCandidateSelection, submitCreateAsn,
    confirmCreateAsn, batchSummary, batchSummaryLoading, batchSummaryError,
    reloadBatchSummary, batchSummaryBlocked
  } = useOfficialWarehouseCreateAsn({
    sessionUserId: String(session?.userId || ''),
    storeCode,
    siteCode,
    reloadAll: reloadWarehouseData
  })
  const {
    specTarget, setSpecTarget, specDraft, setSpecDraft, specSaving,
    openSpecEditor, saveAli1688Spec
  } = useOfficialWarehouseSpecEditor({
    storeCode,
    selectedShippingBatchIds,
    candidateKeyword,
    reloadCandidates: loadCandidates
  })
  const {
    appointments, appointmentHistoryLoading, appointmentHistoryOpen,
    setAppointmentHistoryOpen, appointmentStatusFilter,
    setAppointmentStatusFilter, appointmentKeyword, setAppointmentKeyword,
    appointmentHistorySummary, loadAppointmentHistory
  } = useOfficialWarehouseAppointmentHistory({ storeCode, siteCode })
  const {
    keyword, setKeyword, loading, loadError, asnSyncing, asnSyncFeedback,
    setAsnSyncFeedback, selectedAsn, selectedInboundDetail,
    selectedInboundLoading, selectedInboundError, inboundDiscrepancyFilter,
    setInboundDiscrepancyFilter, asnAppointmentStatusFilters,
    setAsnAppointmentStatusFilters, asnInboundStatusFilters,
    setAsnInboundStatusFilters, visibleAsns, visibleInboundLines, loadAsns,
    syncNoonAsnList, openDetail, closeDetail
  } = useOfficialWarehouseAsnState({
    storeCode,
    siteCode,
    reloadHistory: loadAppointmentHistory
  })
  const {
    appointmentOpen, setAppointmentOpen, appointmentTarget, appointmentMode,
    appointmentSubmitting, rescheduleConfirm, setRescheduleConfirm,
    requestOpenAppointment, confirmRescheduleAppointment, submitAppointment,
    appointmentForm, setAppointmentForm, appointmentSubmitFeedback,
    setAppointmentSubmitFeedback, availabilityLoading, availabilitySlots,
    setAvailabilitySlots, availabilityError, setAvailabilityError,
    manualDateOffset, setManualDateOffset, setManualSelectedDate,
    appointmentTimeOptions, appointmentWarehouseOptions, manualCalendarDates,
    selectedManualDate, manualVisibleDates, manualSlotsForSelectedDate,
    manualMonthLabel, manualAvailabilityQueryKey
  } = useOfficialWarehouseAppointmentWorkflow({
    reloadAll: reloadWarehouseData
  })
  const {
    durationNow, appointmentRunFeedback, setAppointmentRunFeedback,
    appointmentRunningId, pdfPrintingAsnId, correctionOpen, setCorrectionOpen,
    correctionTarget, correctionForm, setCorrectionForm, correctionSubmitting,
    runAppointmentNow, cancelAppointment, downloadFbnTransferPdf,
    openCorrection, submitCorrection
  } = useOfficialWarehouseAppointmentActions({
    reloadAll: reloadWarehouseData,
    reloadHistory: loadAppointmentHistory
  })
  useEffect(() => {
    setStoreCode(activeStoreCode)
    setSiteCode(activeSiteCode)
  }, [activeStoreCode, activeSiteCode])

  async function reloadWarehouseData() {
    await loadAsns()
    await loadAppointmentHistory()
  }

  const asnColumns = buildOfficialWarehouseAsnColumns({
    durationNow,
    pdfPrintingAsnId,
    appointmentRunningId,
    openDetail,
    downloadFbnTransferPdf,
    requestOpenAppointment,
    runAppointmentNow,
    cancelAppointment
  })

  const appointmentColumns = buildOfficialWarehouseAppointmentColumns({
    durationNow,
    openCorrection
  })

  const candidateColumns = buildOfficialWarehouseCandidateColumns({
    selectedShippingBatchIds,
    quantityByCandidateKey,
    setQuantityByCandidateKey,
    openSpecEditor
  })

  const inboundProductColumns = buildOfficialWarehouseInboundColumns()

  return (
    <div className="official-warehouse-page">
      <OfficialWarehouseListPanel
        keyword={keyword}
        setKeyword={setKeyword}
        loadAsns={loadAsns}
        asnAppointmentStatusFilters={asnAppointmentStatusFilters}
        setAsnAppointmentStatusFilters={setAsnAppointmentStatusFilters}
        asnInboundStatusFilters={asnInboundStatusFilters}
        setAsnInboundStatusFilters={setAsnInboundStatusFilters}
        loading={loading}
        syncNoonAsnList={syncNoonAsnList}
        asnSyncing={asnSyncing}
        setAppointmentHistoryOpen={setAppointmentHistoryOpen}
        setCreateOpen={setCreateOpen}
        loadError={loadError}
        asnSyncFeedback={asnSyncFeedback}
        setAsnSyncFeedback={setAsnSyncFeedback}
        appointmentRunFeedback={appointmentRunFeedback}
        setAppointmentRunFeedback={setAppointmentRunFeedback}
        asnColumns={asnColumns}
        visibleAsns={visibleAsns}
        appointmentHistoryOpen={appointmentHistoryOpen}
        appointmentStatusFilter={appointmentStatusFilter}
        setAppointmentStatusFilter={setAppointmentStatusFilter}
        appointmentKeyword={appointmentKeyword}
        setAppointmentKeyword={setAppointmentKeyword}
        loadAppointmentHistory={loadAppointmentHistory}
        appointmentHistoryLoading={appointmentHistoryLoading}
        appointmentHistorySummary={appointmentHistorySummary}
        appointmentColumns={appointmentColumns}
        appointments={appointments}
      />
      <OfficialWarehouseCreateAsnModals
        createOpen={createOpen}
        setCreateOpen={setCreateOpen}
        createSubmitFeedback={createSubmitFeedback}
        setCreateSubmitFeedback={setCreateSubmitFeedback}
        createAsnConfirmation={createAsnConfirmation}
        setCreateAsnConfirmation={setCreateAsnConfirmation}
        submitCreateAsn={submitCreateAsn}
        submitting={submitting}
        selectedAlreadyAppointedBatches={selectedAlreadyAppointedBatches}
        shippingBatchLoadError={shippingBatchLoadError}
        loadShippingBatches={loadShippingBatches}
        shippingBatchKeyword={shippingBatchKeyword}
        shippingBatchLoading={shippingBatchLoading}
        shippingBatches={shippingBatches}
        selectedShippingBatchIds={selectedShippingBatchIds}
        batchSummary={batchSummary}
        batchSummaryLoading={batchSummaryLoading}
        batchSummaryError={batchSummaryError}
        reloadBatchSummary={reloadBatchSummary}
        batchSummaryBlocked={batchSummaryBlocked}
        setSelectedShippingBatchIds={setSelectedShippingBatchIds}
        shippingBatchOptions={shippingBatchOptions}
        handleShippingBatchSearch={handleShippingBatchSearch}
        clearCandidateSelection={clearCandidateSelection}
        setQuantityByCandidateKey={setQuantityByCandidateKey}
        loadCandidates={loadCandidates}
        candidateKeyword={candidateKeyword}
        setCandidateKeyword={setCandidateKeyword}
        candidateLoading={candidateLoading}
        selectedCandidateKeys={selectedCandidateKeys}
        candidateColumns={candidateColumns}
        candidates={candidates}
        updateCandidateSelection={updateCandidateSelection}
        candidateEmptyDescription={candidateEmptyDescription}
        confirmCreateAsn={confirmCreateAsn}
        specTarget={specTarget}
        setSpecTarget={setSpecTarget}
        saveAli1688Spec={saveAli1688Spec}
        specSaving={specSaving}
        specDraft={specDraft}
        setSpecDraft={setSpecDraft}
      />
      <OfficialWarehouseAppointmentModal
        rescheduleConfirm={rescheduleConfirm}
        setRescheduleConfirm={setRescheduleConfirm}
        confirmRescheduleAppointment={confirmRescheduleAppointment}
        appointmentTarget={appointmentTarget}
        appointmentMode={appointmentMode}
        appointmentOpen={appointmentOpen}
        setAppointmentOpen={setAppointmentOpen}
        submitAppointment={submitAppointment}
        appointmentSubmitting={appointmentSubmitting}
        appointmentForm={appointmentForm}
        setAppointmentForm={setAppointmentForm}
        appointmentWarehouseOptions={appointmentWarehouseOptions}
        availabilitySlots={availabilitySlots}
        setAvailabilitySlots={setAvailabilitySlots}
        availabilityError={availabilityError}
        setAvailabilityError={setAvailabilityError}
        appointmentSubmitFeedback={appointmentSubmitFeedback}
        setAppointmentSubmitFeedback={setAppointmentSubmitFeedback}
        manualMonthLabel={manualMonthLabel}
        manualVisibleDates={manualVisibleDates}
        selectedManualDate={selectedManualDate}
        availabilityLoading={availabilityLoading}
        manualDateOffset={manualDateOffset}
        setManualDateOffset={setManualDateOffset}
        manualCalendarDates={manualCalendarDates}
        setManualSelectedDate={setManualSelectedDate}
        manualAvailabilityQueryKey={manualAvailabilityQueryKey}
        manualSlotsForSelectedDate={manualSlotsForSelectedDate}
        appointmentTimeOptions={appointmentTimeOptions}
      />
      <OfficialWarehouseCorrectionModal
        correctionTarget={correctionTarget}
        correctionOpen={correctionOpen}
        setCorrectionOpen={setCorrectionOpen}
        submitCorrection={submitCorrection}
        correctionSubmitting={correctionSubmitting}
        correctionForm={correctionForm}
        setCorrectionForm={setCorrectionForm}
      />
      <OfficialWarehouseDetailDrawer
        selectedAsn={selectedAsn}
        closeDetail={closeDetail}
        selectedInboundDetail={selectedInboundDetail}
        selectedInboundLoading={selectedInboundLoading}
        selectedInboundError={selectedInboundError}
        inboundProductColumns={inboundProductColumns}
        visibleInboundLines={visibleInboundLines}
        inboundDiscrepancyFilter={inboundDiscrepancyFilter}
        setInboundDiscrepancyFilter={setInboundDiscrepancyFilter}
      />
    </div>
  )

}
