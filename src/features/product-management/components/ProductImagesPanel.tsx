import { EditOutlined } from '@ant-design/icons';
import { App as AntdApp, Button, Space, Typography } from 'antd';
import { useState } from 'react';
import { importProductImageAsset, uploadProductImageAsset } from '../api';
import type { ProductFieldDomainSurface, ProductMasterSnapshotPayload } from '../types';
import { textInputValue } from '../utils';
import { ProductDetailSection } from './ProductDetailSection';
import { ProductImageAssetPreview } from './ProductImageAssetPreview';
import { ProductImageManagerDrawer } from './ProductImageManagerDrawer';
import type { ProductImageRoleAssignment, ProductImageUsageRole } from '../types/productImageRole';
import type { NoonImageAssetMetadata } from '../utils/noonImageRequirements';

const { Text } = Typography;

export function ProductImagesPanel(props: {
  productContentDomain?: ProductFieldDomainSurface;
  productSnapshotView?: ProductMasterSnapshotPayload;
  productImageUrls: string[];
  productImageRoleAssignments?: ProductImageRoleAssignment[];
  productImageAssetMetadata?: NoonImageAssetMetadata[];
  allowEmptyImages?: boolean;
  openCurrentProductGallery: (index: number) => void;
  onImagesChange: (
    images: string[],
    imageRoleAssignments?: ProductImageRoleAssignment[],
    imageAssetMetadata?: NoonImageAssetMetadata[]
  ) => void;
}) {
  const { message: messageApi } = AntdApp.useApp();
  const {
    allowEmptyImages,
    productContentDomain,
    productImageAssetMetadata = [],
    productImageRoleAssignments = [],
    productSnapshotView,
    productImageUrls,
    openCurrentProductGallery,
    onImagesChange
  } = props;
  const [managerOpen, setManagerOpen] = useState(false);
  const imageRolesByUrl = new Map(productImageRoleAssignments.map((item) => [item.imageUrl, item.imageRole]));

  const saveImages = (
    images: string[],
    imageRoleAssignments: ProductImageRoleAssignment[],
    imageAssetMetadata: NoonImageAssetMetadata[]
  ) => {
    onImagesChange(images, imageRoleAssignments, imageAssetMetadata);
    setManagerOpen(false);
    messageApi.success('已更新商品图片，记得保存草稿');
  };

  const uploadImage = async (file: File) => {
    const context = imageAssetContext(productSnapshotView);
    const response = await uploadProductImageAsset(file, context);
    if (!response.url) {
      throw new Error('上传图片未返回地址');
    }
    if (response.warnings?.length) {
      messageApi.warning(response.warnings[0]);
    }
    return response.url;
  };

  const importRemoteImage = async (imageUrl: string) => {
    const response = await importProductImageAsset(imageUrl, imageAssetContext(productSnapshotView));
    if (!response.url) {
      throw new Error('转存图片未返回地址');
    }
    if (response.warnings?.length) {
      messageApi.warning(response.warnings[0]);
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
                <ProductImageAssetPreview
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
                  {index === 0 ? '头图' : `商品图 ${index + 1}`} · {imageRoleLabel(imageRolesByUrl.get(item), index)}
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
        imageRoleAssignments={productImageRoleAssignments}
        imageAssetMetadata={productImageAssetMetadata}
        allowEmptyImages={allowEmptyImages}
        messageApi={messageApi}
        onClose={() => setManagerOpen(false)}
        onSave={saveImages}
        onUploadImage={uploadImage}
        onImportRemoteImage={importRemoteImage}
      />
    </ProductDetailSection>
  );
}

function imageAssetContext(productSnapshotView?: ProductMasterSnapshotPayload) {
  const ownerUserId = Number(productSnapshotView?.storeContext.ownerUserId);
  return {
    ownerUserId: Number.isFinite(ownerUserId) ? ownerUserId : undefined,
    storeCode: textInputValue(productSnapshotView?.storeContext.storeCode),
    skuParent: textInputValue(productSnapshotView?.identity.skuParent)
  };
}

function imageRoleLabel(imageRole: ProductImageUsageRole | undefined, index: number) {
  const normalized = imageRole ?? (index === 0 ? 'MAIN' : 'DETAIL');
  if (normalized === 'MAIN') {
    return '主图';
  }
  if (normalized === 'SIZE') {
    return '尺寸图';
  }
  if (normalized === 'PACKAGE') {
    return '包装图';
  }
  return '细节图';
}
