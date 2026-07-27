import { CopyOutlined, HistoryOutlined, PictureOutlined, SaveOutlined } from '@ant-design/icons'
import { App, Button, Empty, Space, Tag, Typography } from 'antd'
import { useState } from 'react'
import type { AuthSession } from '../auth/session'
import { groupProductImageAssetsByRole } from './assetRoleSections'
import { ProductImageProfileSidebar, imageSummaryStatusMeta } from './ProductImageProfileSidebar'
import { ProductListThumb } from './ProductImageAssetPreview'
import {
  activeAssets,
  isSelectableAsset,
  profileCompleteness,
  samePhysicalAsset,
  uniquePhysicalAssets
} from './productImageAssetModel'
import { imageRoleOptions } from './productImageProfileConstants'
import type { ProductImageProfileTabKey, ProfileAsset } from './productImageProfileTypes'
import { summarizeImageStatus } from './profileSummaryStatus'
import { ProductImageAiDialogs } from './ProductImageAiDialogs'
import { ProductImageAssetCard } from './ProductImageAssetCard'
import { ProductImageAssetDialogs } from './ProductImageAssetDialogs'
import { createProductImageClipboardActions } from './productImageClipboard'
import { ProductImageProfileTabs } from './ProductImageProfileTabs'
import { ProductImageSuiteDialogs } from './ProductImageSuiteDialogs'
import { useProductImageAssetCollection } from './useProductImageAssetCollection'
import { useProductImageAssetUsage } from './useProductImageAssetUsage'
import { useProductImageFactsWorkflow } from './useProductImageFactsWorkflow'
import { useProductImageProfileData } from './useProductImageProfileData'
import { useProductImageSourceWorkflow } from './useProductImageSourceWorkflow'
import { useProductImageSuiteWorkflow } from './useProductImageSuiteWorkflow'
import './ProductImageProfilePage.css'

const { Text } = Typography

type ProductImageProfilePageProps = {
  session: AuthSession
  activeOwnerId?: number
}

export function ProductImageProfilePage({ session }: ProductImageProfilePageProps) {
  const { message, modal } = App.useApp()
  const {
    aiCopyText, aiPromptSections, filteredProfiles, filteredSidebarItems, imageStatusFilter,
    commitSelectedProfile, keyword, loadError, loading, operatorName, patchSelectedProfile, patchSelectedProfileDraft,
    profilesById, readinessFilter,
    recordAssetNaturalSize, replaceSelectedProfile, requestOwnerId, sidebarItems, selectedDetailLoading,
    selectedProfile, selectedProfileId, selectedSkinId, setImageStatusFilter, setKeyword,
    setReadinessFilter, setSelectedProfileId, setSelectedSkinId, storeCode, storeName, validActiveSkins
  } = useProductImageProfileData(session)
  const [activeProfileTab, setActiveProfileTab] = useState<ProductImageProfileTabKey>('assets')
  const [previewAsset, setPreviewAsset] = useState<ProfileAsset | null>(null)

  const {
    acceptAiSuggestionField, acceptAllAiSuggestions, aiCopyModalOpen, aiExtractionSuggestion,
    aiSuggestionDecisions, closeAiSuggestion, ensureProfileReadyForAssets, extractCurrentImageFacts,
    extractingImageFacts, ignoreAiSuggestionField, persistProfile, saveCurrentProfile, saving,
    setAiCopyModalOpen, updateProductImageFacts
  } = useProductImageFactsWorkflow({
    commitSelectedProfile, feedback: message, patchSelectedProfileDraft, requestOwnerId, selectedProfile, storeCode
  })

  const {
    assetImportOpen, assetImportTab, assetUrlText, collectSourceLink, collectingSourceLink,
    importAssetUrlText, importSelectedSourceCandidates, importingAssetUrls, refreshSourceCandidates,
    selectedSourceCandidates, setAssetImportOpen, setAssetImportTab, setAssetUrlText,
    sourceCandidates, sourceCollectionStatus, sourceLinkUrl, toggleSourceCandidate, updateSourceLink
  } = useProductImageSourceWorkflow({
    ensureProfileReadyForAssets, feedback: message, operatorName, replaceSelectedProfile,
    requestOwnerId, selectedProfileId, storeCode, storeName
  })

  const {
    changeAssetRole, changingAssetRoleId, clearAssetSelection, handleUpload, removeAsset,
    removeAssets, removingAssets, selectAssets, selectedAssetIds, toggleAssetSelection, uploading
  } = useProductImageAssetCollection({
    ensureProfileReadyForAssets, feedback: message, patchSelectedProfile, persistProfile,
    replaceSelectedProfile, requestOwnerId, selectedProfile, storeCode
  })
  const {
    openProcessingAsset, openReuseAsset, processingAsset, processingNote, processingStatus,
    reuseAsset, reuseAssetForRoles, reuseRoles, saveAssetProcessing, savingAssetWorkflow,
    setProcessingAsset, setProcessingNote, setProcessingStatus, setReuseAsset, setReuseRoles
  } = useProductImageAssetUsage({
    feedback: message, persistProfile, replaceSelectedProfile, requestOwnerId, selectedProfile, storeCode
  })

  const {
    approveSuite, changingSuiteAssetId, createSuiteDraft, creatingSuiteDraft, deletingSuiteId,
    moveSuiteAsset, openRejectSuite, previewSuiteAsset, removeSuite, removeSuiteAsset, retrySuite,
    reviewAssetFeedback, reviewOverallComment, reviewingSuite, setPreviewSuiteAsset,
    setReviewAssetFeedback, setReviewOverallComment, setReviewingSuite,
    submitRejectSuite, submittingSuiteAction
  } = useProductImageSuiteWorkflow({
    feedback: message, modal, onMissingProfile: setActiveProfileTab, patchSelectedProfile,
    persistProfile, replaceSelectedProfile, requestOwnerId, selectedProfile, selectedSkinId,
    storeCode, validSkinCount: validActiveSkins.length
  })

  const { copyAiCopyText, copyAiPromptSection, copyPskuCode, copySuiteDraftText } =
    createProductImageClipboardActions(message, aiCopyText)

  if (!selectedProfile) {
    return <Empty description={loading ? '商品图资料加载中' : loadError || '暂无商品图档案'} />
  }

  const selectedCompleteness = profileCompleteness(selectedProfile)
  const selectedImageStatus = imageSummaryStatusMeta[
    selectedProfile.imageStatus ?? summarizeImageStatus(selectedProfile.suites.map((suite) => suite.suiteStatus))
  ]
  const selectedProfileAssets = activeAssets(selectedProfile)
  const selectedProfileAssetGroups = groupProductImageAssetsByRole(selectedProfileAssets)
  const selectableAssets = selectedProfileAssets.filter(isSelectableAsset)
  const selectedAssets = selectableAssets.filter((asset) => selectedAssetIds.has(asset.id))
  const allAssetsSelected = selectableAssets.length > 0 && selectedAssets.length === selectableAssets.length
  const selectedProfileReady = Boolean(selectedProfile.detailLoaded || !selectedProfile.backendId)
  const selectedAssetCount = selectedProfile.detailLoaded
    ? uniquePhysicalAssets(selectedProfileAssets).length
    : selectedProfile.assetCount ?? selectedProfileAssets.length
  const selectedAssetUsageCount = selectedProfile.detailLoaded ? selectedProfileAssets.length : selectedAssetCount
  const selectedSuiteCount = selectedProfile.detailLoaded
    ? selectedProfile.suites.length
    : selectedProfile.suiteCount ?? selectedProfile.suites.length
  const reuseUsedRoles = new Set(reuseAsset
    ? selectedProfileAssets.filter((asset) => samePhysicalAsset(asset, reuseAsset)).map((asset) => asset.imageRole)
    : [])
  const availableReuseRoleOptions = imageRoleOptions.filter((option) => !reuseUsedRoles.has(option.value))

  const renderAssetCard = (asset: ProfileAsset) => (
    <ProductImageAssetCard
      allAssets={selectedProfileAssets}
      asset={asset}
      changingRole={changingAssetRoleId === asset.id}
      key={asset.id}
      removing={removingAssets}
      selected={selectedAssetIds.has(asset.id)}
      onChangeRole={(assetId, role) => void changeAssetRole(assetId, role)}
      onNaturalSize={recordAssetNaturalSize}
      onOpenProcessing={openProcessingAsset}
      onOpenReuse={openReuseAsset}
      onPreview={setPreviewAsset}
      onRemove={(target) => void removeAsset(target)}
      onSelect={toggleAssetSelection}
    />
  )

  return (
    <div className="product-image-profile-page">
      <div className="product-image-profile-layout">
        <ProductImageProfileSidebar
          allItems={sidebarItems}
          imageStatusFilter={imageStatusFilter}
          items={filteredSidebarItems}
          keyword={keyword}
          loading={loading}
          readinessFilter={readinessFilter}
          selectedId={filteredProfiles.length ? selectedProfile.id : undefined}
          onCopyPsku={copyPskuCode}
          onImageStatusFilterChange={setImageStatusFilter}
          onKeywordChange={setKeyword}
          onReadinessFilterChange={setReadinessFilter}
          onSelect={setSelectedProfileId}
          renderThumbnail={(item) => {
            const profile = profilesById.get(item.id)
            return profile ? <ProductListThumb profile={profile} /> : null
          }}
        />

        <main className="product-image-profile-main">
          {!filteredProfiles.length ? (
            <div className="product-image-profile-filter-empty">
              <Empty description="没有符合当前资料状态和图片状态的 PSKU" />
              <Button onClick={() => {
                setKeyword('')
                setReadinessFilter('ALL')
                setImageStatusFilter('ALL')
              }}>
                清除筛选
              </Button>
            </div>
          ) : (
            <>
          <div className="product-image-profile-summary">
            <div>
              <div className="product-image-profile-psku">{selectedProfile.pskuCode}</div>
            </div>
            <Space wrap>
              <Tag color={selectedCompleteness.color}>{selectedCompleteness.label}</Tag>
              <Tag color={selectedImageStatus.color}>图片：{selectedImageStatus.label}</Tag>
              <Tag icon={<PictureOutlined />}>
                基础图 {selectedAssetCount}{selectedAssetUsageCount > selectedAssetCount ? ` / ${selectedAssetUsageCount} 用途` : ''}
              </Tag>
              <Tag icon={<HistoryOutlined />}>AI 套图 {selectedSuiteCount}</Tag>
              <Button disabled={!selectedProfileReady} icon={<CopyOutlined />} onClick={() => setAiCopyModalOpen(true)}>
                AI 指令预览
              </Button>
              <Button
                disabled={!selectedProfileReady}
                icon={<SaveOutlined />}
                loading={saving || selectedDetailLoading}
                type="primary"
                onClick={() => void saveCurrentProfile()}
              >
                保存
              </Button>
            </Space>
          </div>

          <ProductImageProfileTabs
            activeKey={activeProfileTab}
            onChange={setActiveProfileTab}
            assets={{
              allAssetsSelected,
              assetGroups: selectedProfileAssetGroups,
              assets: selectedProfileAssets,
              profileReady: selectedProfileReady,
              removing: removingAssets,
              selectableAssets,
              selectedAssets,
              onClearSelection: clearAssetSelection,
              onOpenImport: () => setAssetImportOpen(true),
              onRemoveAssets: (assets) => void removeAssets(assets),
              onSelectAssets: selectAssets,
              renderAsset: renderAssetCard
            }}
            elements={{
              aiPromptSections,
              extracting: extractingImageFacts,
              facts: {
                specSummary: selectedProfile.specSummary,
                titleEn: selectedProfile.titleEn,
                titleAr: selectedProfile.titleAr,
                sizeAttributesText: selectedProfile.sizeSection.attributesText ?? '',
                heroSellingPoints: selectedProfile.heroSellingPoints,
                packageAttributesText: selectedProfile.packageList.attributesText ?? ''
              },
              profileReady: selectedProfileReady,
              onChangeFacts: updateProductImageFacts,
              onCopyAll: copyAiCopyText,
              onCopySection: copyAiPromptSection,
              onExtract: () => void extractCurrentImageFacts()
            }}
            suites={{
              changingAssetId: changingSuiteAssetId,
              creating: creatingSuiteDraft,
              deletingSuiteId,
              profile: selectedProfile,
              selectedSkinId,
              skins: validActiveSkins,
              submitting: submittingSuiteAction,
              onApprove: (suite) => void approveSuite(suite),
              onCopyDraft: copySuiteDraftText,
              onCreate: () => void createSuiteDraft(),
              onMoveAsset: (suite, asset, options) => void moveSuiteAsset(suite, asset, options),
              onOpenReject: openRejectSuite,
              onPreviewAsset: setPreviewSuiteAsset,
              onRemoveAsset: (suite, asset) => void removeSuiteAsset(suite, asset),
              onRemoveSuite: (suite) => void removeSuite(suite),
              onRetry: (suite) => void retrySuite(suite),
              onSelectSkin: setSelectedSkinId
            }}
          />
            </>
          )}
        </main>
      </div>
      <ProductImageAssetDialogs
        assetImportOpen={assetImportOpen}
        assetImportTab={assetImportTab}
        assetUrlText={assetUrlText}
        availableReuseRoleOptions={availableReuseRoleOptions}
        collectingSourceLink={collectingSourceLink}
        importingAssetUrls={importingAssetUrls}
        previewAsset={previewAsset}
        processingAsset={processingAsset}
        processingNote={processingNote}
        processingStatus={processingStatus}
        productMasterId={selectedProfile.productMasterId}
        requestOwnerId={requestOwnerId}
        reuseAsset={reuseAsset}
        reuseRoles={reuseRoles}
        savingAssetWorkflow={savingAssetWorkflow}
        selectedSourceCandidates={selectedSourceCandidates}
        sourceCandidates={sourceCandidates}
        sourceCollectionStatus={sourceCollectionStatus}
        sourceLinkUrl={sourceLinkUrl}
        storeCode={storeCode}
        uploading={uploading}
        onCloseImport={() => setAssetImportOpen(false)}
        onClosePreview={() => setPreviewAsset(null)}
        onCloseProcessing={() => setProcessingAsset(null)}
        onCloseReuse={() => { setReuseAsset(null); setReuseRoles([]) }}
        onCollectSource={() => void collectSourceLink()}
        onImportSelected={() => void importSelectedSourceCandidates()}
        onImportUrls={() => void importAssetUrlText()}
        onRefreshSource={() => void refreshSourceCandidates()}
        onSaveProcessing={() => void saveAssetProcessing()}
        onSaveReuse={() => void reuseAssetForRoles()}
        onSelectImportTab={setAssetImportTab}
        onSetAssetUrlText={setAssetUrlText}
        onSetProcessingNote={setProcessingNote}
        onSetProcessingStatus={setProcessingStatus}
        onSetReuseRoles={setReuseRoles}
        onToggleCandidate={toggleSourceCandidate}
        onUpdateSourceLink={updateSourceLink}
        onUpload={(file) => void handleUpload(file)}
      />
      <ProductImageAiDialogs
        aiCopyModalOpen={aiCopyModalOpen}
        aiPromptSections={aiPromptSections}
        decisions={aiSuggestionDecisions}
        profile={selectedProfile}
        suggestion={aiExtractionSuggestion}
        onAcceptAll={acceptAllAiSuggestions}
        onAcceptField={acceptAiSuggestionField}
        onCloseCopy={() => setAiCopyModalOpen(false)}
        onCloseSuggestion={closeAiSuggestion}
        onCopyAll={copyAiCopyText}
        onCopySection={copyAiPromptSection}
        onIgnoreField={ignoreAiSuggestionField}
      />
      <ProductImageSuiteDialogs
        previewAsset={previewSuiteAsset}
        reviewAssetFeedback={reviewAssetFeedback}
        reviewOverallComment={reviewOverallComment}
        reviewingSuite={reviewingSuite}
        submitting={submittingSuiteAction}
        onClosePreview={() => setPreviewSuiteAsset(null)}
        onCloseReview={() => setReviewingSuite(null)}
        onSetReviewAssetFeedback={setReviewAssetFeedback}
        onSetReviewOverallComment={setReviewOverallComment}
        onSubmitReview={() => void submitRejectSuite()}
      />
    </div>
  )
}
