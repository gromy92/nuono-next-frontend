import { Space, Tabs, Tag, Tooltip } from 'antd';
import {
  productFieldDomainStatusMeta,
  type ProductFieldDomainSurface
} from './productFieldDomain';
import type { ProductDetailEditorHostProps } from './productDetailEditorTypes';
import { ProductOfferTab } from './ProductOfferTab';
import { ProductContentTab } from './ProductContentTab';
import { ProductInsightsTab } from './ProductInsightsTab';
import { ProductSizesTab } from './ProductSizesTab';

const PRODUCT_INSIGHTS_ENABLED = true;

function ProductDetailTabLabel(props: { title: string; badge?: React.ReactNode }) {
  const { title, badge } = props;
  return (
    <Space size={4} wrap={false}>
      <span>{title}</span>
      {badge}
    </Space>
  );
}

function ProductDomainStatusBadge({ domain }: { domain?: ProductFieldDomainSurface }) {
  if (!domain) {
    return null;
  }
  const meta = productFieldDomainStatusMeta(domain.status);
  return (
    <Tooltip title={meta.label}>
      <Tag color={meta.color} style={{ marginInlineEnd: 0, fontSize: 11, lineHeight: '18px' }}>
        {meta.label}
      </Tag>
    </Tooltip>
  );
}

export function ProductDetailOfficialTabs(props: ProductDetailEditorHostProps) {
  const {
    defaultActiveKey,
    productSiteDomain,
    productSharedDomainDirtyCount
  } = props;
  const listingCreatePresentation = props.offerPresentation === 'listing-create';

  const items = [
    {
      key: 'offer',
      label: (
        <ProductDetailTabLabel
          title="Offer"
          badge={listingCreatePresentation ? undefined : <ProductDomainStatusBadge domain={productSiteDomain} />}
        />
      ),
      children: <ProductOfferTab {...props} />
    },
    {
      key: 'content',
      label: (
        <ProductDetailTabLabel
          title="Content"
          badge={
            productSharedDomainDirtyCount ? (
              <Tooltip title={`${productSharedDomainDirtyCount} 个字段域已改`}>
                <Tag color="processing" style={{ marginInlineEnd: 0, fontSize: 11, lineHeight: '18px' }}>
                  改 {productSharedDomainDirtyCount}
                </Tag>
              </Tooltip>
            ) : null
          }
        />
      ),
      children: <ProductContentTab {...props} />
    }
  ];

  if (!listingCreatePresentation) {
    items.push({
      key: 'sizes',
      label: <ProductDetailTabLabel title="Sizes" />,
      children: <ProductSizesTab {...props} />
    });
    if (PRODUCT_INSIGHTS_ENABLED) {
      items.push({
        key: 'product-insights',
        label: <ProductDetailTabLabel title="Product Insights" />,
        children: <ProductInsightsTab {...props} />
      });
    }
  }

  return (
    <Tabs
      className={props.offerPresentation === 'listing-create' ? 'product-listing-editor-tabs' : undefined}
      defaultActiveKey={defaultActiveKey ?? 'offer'}
      items={items}
      tabBarExtraContent={props.tabBarExtraContent}
    />
  );
}
