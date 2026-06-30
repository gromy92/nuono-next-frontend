import { SearchOutlined } from '@ant-design/icons';
import { Button, Checkbox, Drawer, Empty, Input, Space, Spin, Tag, Typography, message } from 'antd';
import { useMemo, useState } from 'react';
import type { ProductListRowPayload } from '../types';
import { formatSnapshotValue, normalizeNoonImageUrl, textInputValue } from '../utils';
import { ProductBaselineIdentity } from '../../product-baseline';

const { Text } = Typography;

function productSearchText(product: ProductListRowPayload) {
  return [
    product.skuParent,
    product.partnerSku,
    product.pskuCode,
    product.title,
    product.brand
  ].map(textInputValue).join(' ').toLowerCase();
}

function productImage(product: ProductListRowPayload) {
  return textInputValue(product.imageUrl || product.galleryImages?.[0]);
}

function productImageCount(product: ProductListRowPayload) {
  return product.galleryImages?.length ?? (productImage(product) ? 1 : 0);
}

export function ProductGroupAddProductsDrawer(props: {
  open: boolean;
  loading?: boolean;
  candidates: ProductListRowPayload[];
  memberSkuSet: Set<string>;
  submitDisabled?: boolean;
  onClose: () => void;
  onSubmit: (products: ProductListRowPayload[]) => void;
}) {
  const { open, loading = false, candidates, memberSkuSet, submitDisabled = false, onClose, onSubmit } = props;
  const [query, setQuery] = useState('');
  const [selectedSkus, setSelectedSkus] = useState<string[]>([]);
  const normalizedQuery = query.trim().toLowerCase();
  const visibleCandidates = useMemo(
    () => candidates.filter((item) => !normalizedQuery || productSearchText(item).includes(normalizedQuery)),
    [candidates, normalizedQuery]
  );

  const toggleSku = (skuParent: string, checked: boolean) => {
    setSelectedSkus((current) =>
      checked
        ? current.includes(skuParent) ? current : [...current, skuParent]
        : current.filter((item) => item !== skuParent)
    );
  };

  const submit = () => {
    const selectedProducts = candidates.filter((item) => selectedSkus.includes(item.skuParent));
    if (!selectedProducts.length) {
      message.warning('请选择要加入分组的商品');
      return;
    }
    onSubmit(selectedProducts);
    setSelectedSkus([]);
    setQuery('');
  };

  const close = () => {
    setSelectedSkus([]);
    setQuery('');
    onClose();
  };

  return (
    <Drawer
      title="添加未分组商品"
      placement="right"
      width={460}
      open={open}
      onClose={close}
      destroyOnClose
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <Button onClick={close}>取消</Button>
          <Button type="primary" onClick={submit} disabled={submitDisabled || !selectedSkus.length}>加入分组</Button>
        </div>
      }
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div>
          <Text strong>选择要加入当前分组的未分组商品</Text>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索 SKU / Partner SKU / 品牌 / 标题"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            style={{ marginTop: 10 }}
          />
        </div>
        {loading ? (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <Spin />
          </div>
        ) : visibleCandidates.length ? (
          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            {visibleCandidates.map((product) => {
              const disabled = memberSkuSet.has(product.skuParent);
              const checked = selectedSkus.includes(product.skuParent);
              const imageUrl = productImage(product);
              return (
                <div
                  key={product.skuParent}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '28px minmax(0, 1fr)',
                    gap: 12,
                    alignItems: 'start',
                    width: '100%',
                    padding: '14px 0',
                    borderBottom: '1px solid var(--pm-subtle-border)',
                    opacity: disabled ? 0.55 : 1
                  }}
                >
                  <Checkbox
                    disabled={disabled}
                    checked={checked}
                    onChange={(event) => toggleSku(product.skuParent, event.target.checked)}
                    style={{ marginTop: 24 }}
                  />
                  <ProductBaselineIdentity
                    title={product.title || product.skuParent}
                    imageUrl={normalizeNoonImageUrl(imageUrl)}
                    imageCount={productImageCount(product)}
                    imageAlt={product.title || product.skuParent}
                    imageWidth={72}
                    compact
                    titleMaxWidth={300}
                    codes={[
                      {
                        label: 'PSKU',
                        value: formatSnapshotValue(product.partnerSku),
                        copyText: product.partnerSku
                      },
                      {
                        label: 'SKU',
                        value: formatSnapshotValue(product.skuParent),
                        copyText: product.skuParent
                      }
                    ]}
                    tags={product.brand ? <Tag style={{ marginInlineEnd: 0 }}>{product.brand}</Tag> : null}
                  />
                </div>
              );
            })}
          </Space>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有可加入的未分组商品" />
        )}
      </Space>
    </Drawer>
  );
}
