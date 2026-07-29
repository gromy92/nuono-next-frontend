import { UploadOutlined } from '@ant-design/icons';
import { Button, Drawer, Space } from 'antd';
import { ProductImageManagerList } from './ProductImageManagerList';
import type { ProductImageManagerDrawerProps } from './productImageManagerTypes';
import { useProductImageManagerController } from './useProductImageManagerController';

export function ProductImageManagerDrawer(props: ProductImageManagerDrawerProps) {
  const controller = useProductImageManagerController(props);

  return (
    <Drawer
      title="图片管理"
      width={860}
      open={props.open}
      onClose={props.onClose}
      extra={
        <Space>
          <Button onClick={props.onClose}>取消</Button>
          <Button type="primary" onClick={controller.saveImages}>
            保存到草稿
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size={14} style={{ width: '100%' }}>
        <Space>
          <input
            ref={controller.uploadInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={controller.uploadLocalImages}
          />
          <Button
            type="primary"
            icon={<UploadOutlined />}
            loading={controller.uploading}
            onClick={() => controller.uploadInputRef.current?.click()}
          >
            上传本地图片
          </Button>
        </Space>
        <ProductImageManagerList
          draftState={controller.draftState}
          imageMetadataByUrl={controller.imageMetadataByUrl}
          imageDimensionReadErrorsByUrl={controller.imageDimensionReadErrorsByUrl}
          adaptingImageUrl={controller.adaptingImageUrl}
          autoAdaptFeedback={controller.autoAdaptFeedback}
          onAdapt={controller.adaptImageForNoon}
          onMove={controller.moveImageTo}
          onRemove={controller.removeImage}
          onMarkUnused={controller.markImageUnused}
          onRestoreUnused={controller.restoreUnused}
          onRemoveUnused={controller.removeUnused}
          onSetRole={controller.setImageRole}
        />
      </Space>
    </Drawer>
  );
}
