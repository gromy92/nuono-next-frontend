import { Card, Form, Space } from 'antd'
import { useState } from 'react'
import { ManualSelectionTable } from './components/ManualSelectionTable'
import { ManualSelectionDetailModal } from './components/ManualSelectionDetailModal'
import { ManualSelectionToolbar } from './components/ManualSelectionToolbar'
import { NewCollectionModal } from './components/NewCollectionModal'
import { useManualSelectionCollections } from './hooks/useManualSelectionCollections'
import { saveManualSelectionListingPrefill } from '../product-listing/sourcePrefill'
import { PURCHASE_LISTING_PATH, withCurrentWorkspaceDevQuery } from '../app-shell/WorkspaceRouting'
import type {
  ManualSelectionPageProps,
  ManualSelectionSearchValues,
  NewCollectionValues
} from './types'
import type { ProductSelectionSourceCollection } from '../source-collection/types'

export function ManualSelectionPage(props: ManualSelectionPageProps) {
  const [searchForm] = Form.useForm<ManualSelectionSearchValues>()
  const [newCollectionForm] = Form.useForm<NewCollectionValues>()
  const [newCollectionModalOpen, setNewCollectionModalOpen] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<ProductSelectionSourceCollection | null>(null)

  const {
    filteredCollections,
    loading,
    submitting,
    createNewCollection,
    loadCollections,
    recollect,
    setFilters
  } = useManualSelectionCollections(props)

  const handleSearch = () => {
    setFilters(searchForm.getFieldsValue())
  }

  const handleCreateNewCollection = async (values: NewCollectionValues) => {
    const created = await createNewCollection(values)
    if (created) {
      newCollectionForm.resetFields()
      setNewCollectionModalOpen(false)
    }
  }

  const handleOpenListing = (record: ProductSelectionSourceCollection) => {
    saveManualSelectionListingPrefill(record, props.storeCode)
    const params = new URLSearchParams({
      listingSource: 'manual-selection',
      sourceCollectionId: record.id
    })
    window.location.assign(withCurrentWorkspaceDevQuery(`${PURCHASE_LISTING_PATH}?${params.toString()}`))
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card bordered={false} bodyStyle={{ padding: 0 }} style={{ border: '1px solid #e5e7eb' }}>
        <ManualSelectionToolbar
          form={searchForm}
          loading={loading}
          onOpenNewCollection={() => setNewCollectionModalOpen(true)}
          onRefresh={() => void loadCollections()}
          onSearch={handleSearch}
        />
        <ManualSelectionTable
          dataSource={filteredCollections}
          loading={loading}
          recollecting={submitting}
          onOpenDetail={setSelectedCollection}
          onOpenListing={handleOpenListing}
          onRecollect={(record) => void recollect(record)}
        />
      </Card>

      <ManualSelectionDetailModal
        record={selectedCollection}
        onCancel={() => setSelectedCollection(null)}
      />

      <NewCollectionModal
        open={newCollectionModalOpen}
        form={newCollectionForm}
        submitting={submitting}
        onCancel={() => setNewCollectionModalOpen(false)}
        onSubmit={(values) => void handleCreateNewCollection(values)}
      />
    </Space>
  )
}
