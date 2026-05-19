import { ExportOutlined } from '@ant-design/icons';
import { Button, Space, Table, Typography } from 'antd';
import { warehouseStockColumns } from '../productDetailColumns';
import type { ProductMasterSnapshotPayload } from '../types';
import { textInputValue } from '../utils';

const { Text } = Typography;

function resolveProjectCode(
  productSnapshotView: ProductMasterSnapshotPayload | undefined,
  activeProductSiteOffer: Record<string, unknown> | undefined
) {
  const explicitProjectCode = textInputValue(productSnapshotView?.storeContext.projectCode ?? activeProductSiteOffer?.projectCode);
  if (explicitProjectCode) {
    return explicitProjectCode;
  }

  const storeCode = textInputValue(productSnapshotView?.storeContext.storeCode ?? activeProductSiteOffer?.storeCode);
  const storeCodeProjectMatch = storeCode.match(/STR(\d+)/i);
  return storeCodeProjectMatch ? `PRJ${storeCodeProjectMatch[1]}` : '';
}

function resolveSiteCode(
  productSnapshotView: ProductMasterSnapshotPayload | undefined,
  activeProductSiteOffer: Record<string, unknown> | undefined
) {
  const explicitSiteCode = textInputValue(activeProductSiteOffer?.site ?? productSnapshotView?.storeContext.site).toLowerCase();
  if (explicitSiteCode) {
    return explicitSiteCode;
  }

  const storeCode = textInputValue(activeProductSiteOffer?.storeCode ?? productSnapshotView?.storeContext.storeCode);
  const storeCodeSiteMatch = storeCode.match(/-N?([A-Z]{2})$/i);
  return storeCodeSiteMatch ? storeCodeSiteMatch[1].toLowerCase() : '';
}

function buildInventoryUrl(
  productSnapshotView: ProductMasterSnapshotPayload | undefined,
  activeProductSiteOffer: Record<string, unknown> | undefined
) {
  const projectCode = resolveProjectCode(productSnapshotView, activeProductSiteOffer);
  const siteCode = resolveSiteCode(productSnapshotView, activeProductSiteOffer);
  if (!projectCode || !siteCode) {
    return '';
  }

  return `https://fbn.noon.partners/en-${encodeURIComponent(siteCode)}/inventory?mp=noon&project=${encodeURIComponent(projectCode)}`;
}

export function ProductOfferStockSection(props: {
  productSnapshotView?: ProductMasterSnapshotPayload;
  activeProductSiteOffer?: Record<string, unknown>;
  productWarehouseStockRows: Array<Record<string, unknown>>;
}) {
  const { productSnapshotView, activeProductSiteOffer, productWarehouseStockRows } = props;
  const inventoryUrl = buildInventoryUrl(productSnapshotView, activeProductSiteOffer);

  return (
    <div>
      <Space wrap size={[8, 8]} align="center" style={{ marginBottom: 12 }}>
        <Text strong style={{ color: '#0f172a' }}>
          库存信息
        </Text>
        {inventoryUrl ? (
          <Button href={inventoryUrl} target="_blank" rel="noreferrer" size="small" icon={<ExportOutlined />}>
            查看 FBN 库存
          </Button>
        ) : null}
      </Space>
      <Table
        size="small"
        pagination={false}
        dataSource={productWarehouseStockRows}
        rowKey={(record) =>
          [
            record.warehouseCode ?? record.warehouse ?? record.skuParent ?? record.partnerSku ?? 'stock',
            record.stockType ?? record.lastStockUpdate ?? record.netStock ?? 'row'
          ].join('-')
        }
        columns={warehouseStockColumns}
        scroll={{ x: 900 }}
      />
    </div>
  );
}
