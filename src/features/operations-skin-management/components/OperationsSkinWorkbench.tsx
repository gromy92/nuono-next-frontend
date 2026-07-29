import { CloseOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Drawer, Empty, Form, Input, Select, Skeleton, Space } from 'antd'
import type { AuthSession } from '../../auth/session'
import { useOperationsSkinEditor } from '../hooks/useOperationsSkinEditor'
import { useOperationsSkinList } from '../hooks/useOperationsSkinList'
import { operationsSkinScopeKey } from '../skinScope'
import {
  STATUS_FILTER_OPTIONS,
  STATUS_OPTIONS,
  type SkinFormValues,
  type StatusFilter
} from '../skinPageModel'
import { OperationsSkinCard } from './OperationsSkinCard'
import { OperationsSkinDetailSuites } from './OperationsSkinDetailSuites'
import { SkinAssetsEditor } from './SkinAssetsEditor'

function OperationsSkinGallerySkeleton() {
  return (
    <div className="operations-skin-gallery">
      {Array.from({ length: 4 }, (_, index) => (
        <div className="operations-skin-card operations-skin-card--loading" key={index}>
          <Skeleton.Image active className="operations-skin-card-skeleton-image" />
          <Skeleton active paragraph={{ rows: 3 }} title={{ width: '60%' }} />
        </div>
      ))}
    </div>
  )
}

export function OperationsSkinWorkbench({ session }: { session: AuthSession }) {
  const currentStore = session.currentStore
  const storeCode = currentStore?.storeCode
  const storeScopeKey = operationsSkinScopeKey(currentStore)
  const list = useOperationsSkinList({ storeCode, storeScopeKey })
  const editor = useOperationsSkinEditor({
    storeCode,
    storeScopeKey,
    reload: list.loadSkins
  })
  const content = storeCode ? (
    <>
      <div className="operations-skin-toolbar">
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="搜索皮肤名称 / 备注"
            value={list.keywordInput}
            onChange={(event) => {
              list.setKeywordInput(event.target.value)
              if (!event.target.value) list.setKeyword('')
            }}
            onSearch={(value) => list.setKeyword(value.trim())}
            className="operations-skin-search"
          />
          <Select<StatusFilter>
            value={list.statusFilter}
            options={STATUS_FILTER_OPTIONS}
            onChange={list.setStatusFilter}
            className="operations-skin-status-filter"
          />
        </Space>
        <Space>
          <Button icon={<ReloadOutlined />} loading={list.loading} onClick={() => void list.loadSkins()}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={editor.openCreateDrawer}>
            新增皮肤
          </Button>
        </Space>
      </div>

      <div className="operations-skin-gallery-shell">
        {list.showInitialLoading ? (
          <OperationsSkinGallerySkeleton />
        ) : list.galleryRows.length ? (
          <div className="operations-skin-gallery">
            {list.galleryRows.map((row) => (
              <OperationsSkinCard
                key={row.id}
                row={row}
                statusUpdating={list.statusUpdatingId === row.id}
                deleting={list.deletingId === row.id}
                onEdit={editor.openEditDrawer}
                onToggleStatus={(nextRow) => void list.toggleStatus(nextRow)}
                onDelete={list.requestDelete}
              />
            ))}
          </div>
        ) : (
          <div className="operations-skin-empty-panel">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无皮肤" />
          </div>
        )}
      </div>
    </>
  ) : (
    <div className="operations-skin-empty-panel">
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请先在右上角选择店铺" />
    </div>
  )

  return (
    <div className="operations-skin-page">
      {content}
      <Drawer
        title={editor.editingSkin ? '皮肤详情' : '新增皮肤'}
        open={editor.visibleDrawerOpen}
        width="80vw"
        closable={false}
        onClose={editor.closeDrawer}
        extra={editor.editingSystemPreview ? (
          <Button icon={<CloseOutlined />} onClick={editor.closeDrawer}>关闭</Button>
        ) : (
          <Space>
            <Button type="primary" loading={editor.saving} onClick={() => void editor.submitDrawer()}>
              保存
            </Button>
            <Button icon={<CloseOutlined />} onClick={editor.closeDrawer} disabled={editor.saving}>
              关闭
            </Button>
          </Space>
        )}
      >
        {editor.editingSystemPreview && editor.editingSkin ? (
          <OperationsSkinDetailSuites
            components={editor.componentDrafts}
            editable={false}
            loading={editor.detailLoading}
            row={editor.editingSkin}
            storeCode={storeCode}
          />
        ) : null}

        {!editor.editingSystemPreview ? (
          <Form<SkinFormValues> form={editor.form} layout="vertical">
            <div className="operations-skin-basic-form">
              <Form.Item name="skinName" label="皮肤名称" rules={[{
                required: true, whitespace: true, message: '请输入皮肤名称'
              }]}>
                <Input maxLength={80} placeholder="例如：PAPERSAY 黄框品牌风" />
              </Form.Item>
              <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
                <Select options={STATUS_OPTIONS} />
              </Form.Item>
              <Form.Item name="coverImageUrl" hidden><Input /></Form.Item>
              <Form.Item name="styleDescription" label="套系描述">
                <Input.TextArea rows={2} maxLength={300} placeholder="例如：黄框品牌型，适合文具、办公和礼品类商品图" />
              </Form.Item>
            </div>

            {editor.drawerSkinRow ? (
              <OperationsSkinDetailSuites
                components={editor.componentDrafts}
                disabled={editor.saving || !storeCode}
                editable
                loading={editor.detailLoading}
                onComponentsChange={editor.setComponentDrafts}
                row={editor.drawerSkinRow}
                storeCode={storeCode}
              />
            ) : null}

            <div className="operations-skin-assets-panel">
              <Form.Item name="assets" label="参考图素材">
                <SkinAssetsEditor
                  storeCode={storeCode || ''}
                  coverImageUrl={editor.watchedCoverImageUrl}
                  disabled={editor.saving || !storeCode}
                  onCoverImageUrlChange={(url) => editor.form.setFieldValue('coverImageUrl', url)}
                />
              </Form.Item>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={2} maxLength={300} placeholder="内部备注" />
              </Form.Item>
            </div>
          </Form>
        ) : null}
      </Drawer>
    </div>
  )
}
