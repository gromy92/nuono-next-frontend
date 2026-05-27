import { EditOutlined } from '@ant-design/icons';
import { Button, Space, Typography, message } from 'antd';
import { useState } from 'react';
import { ImageGalleryDisplay } from '../../../shared/components/ImageGalleryDisplay';
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
        <ImageGalleryDisplay
          images={productImageUrls}
          altPrefix="商品图"
          getLabel={(index) => (index === 0 ? '头图' : `商品图 ${index + 1}`)}
          onOpenImage={openCurrentProductGallery}
        />
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
