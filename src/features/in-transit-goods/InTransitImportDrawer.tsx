import { Alert, Button, Drawer, Space, Table, Tag, Typography, Upload } from 'antd'
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons'
import type { useInTransitImport } from './useInTransitImport'
import { stripedRowClassName } from './InTransitGoodsPage.utils'
import { useInTransitImportColumns } from './useInTransitImportColumns'

const { Text } = Typography

type InTransitImportDrawerProps = {
  importer: ReturnType<typeof useInTransitImport>
  statusLabel: Map<string, string>
  transportLabel: Map<string, string>
  formatDestination: (code?: string | null) => string
}

export function InTransitImportDrawer({
  importer,
  statusLabel,
  transportLabel,
  formatDestination
}: InTransitImportDrawerProps) {
  const { importIssueColumns, importLineColumns, importBatchColumns } = useInTransitImportColumns({
    statusLabel,
    transportLabel,
    formatDestination
  })
  const preview = importer.importPreview
  return (
    <Drawer
      title="历史数据导入预览"
      open={importer.importDrawerOpen}
      width={980}
      destroyOnClose
      onClose={() => importer.setImportDrawerOpen(false)}
      extra={
        <Space>
          <Button onClick={() => importer.setImportDrawerOpen(false)}>关闭</Button>
          <Button
            type="primary"
            loading={importer.confirmingImport}
            disabled={!preview || (preview.errorCount ?? 0) > 0}
            onClick={() => void importer.submitImportConfirm()}
          >
            确认导入
          </Button>
        </Space>
      }
    >
      <div className="in-transit-import">
        <div className="in-transit-import__upload">
          <Button icon={<DownloadOutlined />} loading={importer.downloadingTemplate} onClick={() => void importer.handleDownloadImportTemplate()}>
            下载模板
          </Button>
          <Upload
            accept=".csv,.xls,.xlsx"
            showUploadList={false}
            beforeUpload={(file) => {
              void importer.handleImportFile(file as File)
              return false
            }}
          >
            <Button icon={<UploadOutlined />} loading={importer.previewingImport}>选择文件</Button>
          </Upload>
          {preview?.fileName ? <Text type="secondary">{preview.fileName}</Text> : null}
        </div>

        {preview ? (
          <>
            <div className="in-transit-import__summary">
              <span className="in-transit-page__stat">行数 {preview.totalRowCount ?? 0}</span>
              <span className="in-transit-page__stat">有效 {preview.validRowCount ?? 0}</span>
              <span className="in-transit-page__stat">批次 {preview.willCreateBatchCount ?? 0}</span>
              <span className="in-transit-page__stat">商品 {preview.willUpsertLineCount ?? 0}</span>
              <Tag color={(preview.errorCount ?? 0) > 0 ? 'red' : 'green'}>错误 {preview.errorCount ?? 0}</Tag>
              <Tag color={(preview.warningCount ?? 0) > 0 ? 'gold' : 'green'}>提醒 {preview.warningCount ?? 0}</Tag>
            </div>
            {(preview.issues ?? []).length ? (
              <Table rowKey={(row) => `${row.level}-${row.code}-${row.rowNumber ?? 0}-${row.field ?? ''}`} rowClassName={stripedRowClassName} columns={importIssueColumns} dataSource={preview.issues} pagination={false} size="small" />
            ) : (
              <Alert type="success" showIcon message="预览校验通过" />
            )}
            <Table
              rowKey="batchKey"
              rowClassName={stripedRowClassName}
              columns={importBatchColumns}
              dataSource={preview.batches}
              pagination={false}
              size="small"
              scroll={{ x: 820 }}
              expandable={{
                expandedRowKeys: preview.batches.map((batch) => batch.batchKey),
                expandedRowRender: (batch) => (
                  <Table
                    rowKey={(row) => `${batch.batchKey}-${row.rowNumber}`}
                    rowClassName={stripedRowClassName}
                    columns={importLineColumns}
                    dataSource={batch.lines}
                    pagination={false}
                    size="small"
                    scroll={{ x: 990 }}
                  />
                )
              }}
            />
          </>
        ) : (
          <Alert type="info" showIcon message="未生成预览" />
        )}
      </div>
    </Drawer>
  )
}
