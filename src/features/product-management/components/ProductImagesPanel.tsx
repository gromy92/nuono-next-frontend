import { EditOutlined } from '@ant-design/icons';
import { Button, Space, Typography, message } from 'antd';
import { useState } from 'react';
import { uploadProductImageAsset } from '../api';
import type { ProductFieldDomainSurface, ProductMasterSnapshotPayload } from '../types';
import { textInputValue } from '../utils';
import { ProductDetailSection } from './ProductDetailSection';
import { ProductImageManagerDrawer } from './ProductImageManagerDrawer';

const { Text } = Typography;

export function ProductImagesPanel(props: {
  productContentDomain?: ProductFieldDomainSurface;
  productSnapshotView?: ProductMasterSnapshotPayload;
  productImageUrls: string[];
  openCurrentProductGallery: (index: number) => void;
  onImagesChange: (images: string[]) => void;
}) {
  const { productContentDomain, productSnapshotView, productImageUrls, openCurrentProductGallery, onImagesChange } = props;
  const [managerOpen, setManagerOpen] = useState(false);

  const saveImages = (images: string[]) => {
    onImagesChange(images);
    setManagerOpen(false);
    message.success('已更新商品图片，记得保存草稿');
  };

  const uploadImage = async (file: File) => {
    const ownerUserId = Number(productSnapshotView?.storeContext.ownerUserId);
    const response = await uploadProductImageAsset(file, {
      ownerUserId: Number.isFinite(ownerUserId) ? ownerUserId : undefined,
      storeCode: textInputValue(productSnapshotView?.storeContext.storeCode),
      skuParent: textInputValue(productSnapshotView?.identity.skuParent)
    });
    if (!response.url) {
      throw new Error('上传图片未返回地址');
    }
    if (response.warnings?.length) {
      message.warning(response.warnings[0]);
    }
    return response.url;
  };

  return (
    <ProductDetailSection
      title="Product Images"
      domain={productContentDomain}
      extra={
        <Button size="small" icon={<EditOutlined />} onClick={() => setManagerOpen(true)}>
          管理图片
        </Button>
      }
    >
      {productImageUrls.length ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 12
          }}
        >
          {productImageUrls.map((item, index) => (
            <div
              key={`${item}-${index}`}
              role="button"
              tabIndex={0}
              onClick={() => openCurrentProductGallery(index)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openCurrentProductGallery(index);
                }
              }}
              style={{
                padding: 0,
                border: '1px solid var(--pm-subtle-border)',
                borderRadius: 8,
                overflow: 'hidden',
                background: 'var(--pm-subtle-bg)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  minHeight: 220,
                  background: 'var(--pm-subtle-bg)'
                }}
              >
                <img
                  src={item}
                  alt={`商品图 ${index + 1}`}
                  style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 'auto 0 0 0',
                    padding: '8px 10px',
                    background: 'rgba(15, 23, 42, 0.62)',
                    color: '#ffffff',
                    fontSize: 12
                  }}
                >
                  {index === 0 ? '头图' : `商品图 ${index + 1}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Space>
          <Text style={{ color: 'var(--pm-text-faint)' }}>暂无图片</Text>
          <Button size="small" icon={<EditOutlined />} onClick={() => setManagerOpen(true)}>
            管理图片
          </Button>
        </Space>
      )}
      <ProductImageManagerDrawer
        open={managerOpen}
        images={productImageUrls}
        onClose={() => setManagerOpen(false)}
        onSave={saveImages}
        onUploadImage={uploadImage}
      />
    </ProductDetailSection>
  );
}
