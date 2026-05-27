import { Card, Form, Space } from 'antd'
import { useState } from 'react'
import { ManualSelectionTable } from './components/ManualSelectionTable'
import { ManualSelectionDetailModal } from './components/ManualSelectionDetailModal'
import { ManualSelectionToolbar } from './components/ManualSelectionToolbar'
import { NewCollectionModal } from './components/NewCollectionModal'
import { useManualSelectionCollections } from './hooks/useManualSelectionCollections'
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
    pagination,
    submitting,
    changePage,
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
      void loadCollections({
        page: 1,
        filters: searchForm.getFieldsValue()
      })
    }
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
          pagination={pagination}
          recollecting={submitting}
          onOpenDetail={setSelectedCollection}
          onPageChange={changePage}
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
