import { Alert, Table, Typography } from 'antd'
import {
  asnProductPreflightReasonText,
  type AsnProductPreflightInvalidLine
} from '../asnProductPreflightFailure'

const { Text } = Typography

export function OfficialWarehouseAsnPreflightFailureNotice({
  preflightInvalidLines
}: {
  preflightInvalidLines: AsnProductPreflightInvalidLine[]
}) {
  return (
    <Alert
      className="official-warehouse-asn-preflight-alert"
      type="error"
      showIcon
      message={`以下 ${preflightInvalidLines.length} 个商品未通过 Noon 预检，未创建 ASN`}
      description={
        <Table<AsnProductPreflightInvalidLine>
          className="official-warehouse-asn-preflight-table"
          rowKey={(row, index) => `${row.partnerSku || '-'}:${row.pskuCode || '-'}:${row.reasonCode}:${index}`}
          size="small"
          pagination={false}
          dataSource={preflightInvalidLines}
          columns={[
            { title: 'SKU', width: 190, render: (_, row) => row.partnerSku || '-' },
            { title: 'PSKU', width: 190, render: (_, row) => row.pskuCode || '-' },
            {
              title: '失败原因',
              render: (_, row) => (
                <div className="official-warehouse-stack">
                  <Text type="danger">{asnProductPreflightReasonText(row)}</Text>
                  {row.message && row.message !== asnProductPreflightReasonText(row) ? <Text type="secondary">{row.message}</Text> : null}
                </div>
              )
            }
          ]}
        />
      }
    />
  )
}
