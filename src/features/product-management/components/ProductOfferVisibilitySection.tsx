import { EyeOutlined } from '@ant-design/icons';
import { Space, Switch, Tag, Typography } from 'antd';
import type { ProductMasterSnapshotPayload, ProductSummarySurface } from '../types';
import { isLiveStatusActive, siteOfferCode } from '../utils';

const { Text } = Typography;

export function ProductOfferVisibilitySection(props: {
  activeProductSiteOffer?: Record<string, unknown>;
  currentProductSummarySurface: ProductSummarySurface | null;
  productSnapshotView?: ProductMasterSnapshotPayload;
  updateSiteOfferField: (storeCode: string, field: string, value: unknown) => void;
}) {
  const { activeProductSiteOffer, updateSiteOfferField } = props;
  const liveActive = isLiveStatusActive(activeProductSiteOffer?.liveStatus);
  const liveLabel = activeProductSiteOffer?.liveStatus === undefined ? '-' : liveActive ? 'Live' : 'Not Live';
  const liveTag = (
    <Tag color={liveActive ? 'success' : 'default'} style={{ marginInlineEnd: 0, borderRadius: 999, paddingInline: 12 }}>
      {liveLabel}
    </Tag>
  );

  return (
    <div>
      <Space wrap size={[14, 10]} align="center">
        <Space size={8} align="center">
          <EyeOutlined style={{ color: 'var(--pm-text-muted)', fontSize: 18 }} />
          <Text style={{ color: 'var(--pm-text-primary)' }}>在架状态</Text>
          <Switch
            checked={Boolean(activeProductSiteOffer?.isActive)}
            onChange={(checked) =>
              activeProductSiteOffer
                ? updateSiteOfferField(siteOfferCode(activeProductSiteOffer), 'isActive', checked)
                : undefined
            }
          />
        </Space>
        {liveTag}
      </Space>
    </div>
  );
}
