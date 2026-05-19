import {
  DeleteOutlined,
  StarFilled,
  UploadOutlined
} from '@ant-design/icons';
import { Button, Drawer, Empty, Space, Tag, Typography, message } from 'antd';
import { type ChangeEvent, useEffect, useRef, useState } from 'react';

const { Text } = Typography;

type ProductImageManagerDrawerProps = {
  open: boolean;
  images: string[];
  onClose: () => void;
  onSave: (images: string[]) => void;
  onUploadImage: (file: File) => Promise<string>;
};

function validImageUrl(value: string) {
  const source = value.trim();
  return /^https?:\/\/\S+$/i.test(source) || /^\/api\/product-master\/image-assets\/[\w.-]+$/i.test(source);
}

function normalizeImages(images: string[]) {
  const seen = new Set<string>();
  return images.map((item) => item.trim()).filter((item) => item && !seen.has(item) && seen.add(item));
}

export function ProductImageManagerDrawer(props: ProductImageManagerDrawerProps) {
  const { open, images, onClose, onSave } = props;
  const [draftImages, setDraftImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setDraftImages(normalizeImages(images));
  }, [images, open]);

  const moveImageTo = (index: number, nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= draftImages.length || nextIndex === index) {
      return;
    }
    setDraftImages((current) => {
      const nextImages = [...current];
      const [targetImage] = nextImages.splice(index, 1);
      nextImages.splice(nextIndex, 0, targetImage);
      return nextImages;
    });
  };

  const setMainImage = (index: number) => {
    moveImageTo(index, 0);
  };

  const removeImage = (index: number) => {
    if (draftImages.length <= 1) {
      message.warning('商品至少需要保留 1 张图片');
      return;
    }
    setDraftImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const uploadLocalImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) {
      return;
    }

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          message.warning(`${file.name} 不是图片文件`);
          continue;
        }
        const uploadedUrl = await props.onUploadImage(file);
        uploadedUrls.push(uploadedUrl);
      }
      if (uploadedUrls.length) {
        setDraftImages((current) => normalizeImages([...current, ...uploadedUrls]));
        message.success(`已上传 ${uploadedUrls.length} 张图片`);
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '上传图片失败');
    } finally {
      setUploading(false);
    }
  };

  const saveImages = () => {
    const nextImages = normalizeImages(draftImages);
    if (!nextImages.length) {
      message.warning('商品至少需要保留 1 张图片');
      return;
    }
    const invalidIndex = nextImages.findIndex((item) => !validImageUrl(item));
    if (invalidIndex >= 0) {
      message.warning(`商品图 ${invalidIndex + 1} 不是有效图片 URL`);
      return;
    }
    onSave(nextImages);
    message.success('图片已写入当前商品草稿');
  };

  return (
    <Drawer
      title="图片管理"
      width={860}
      open={open}
      onClose={onClose}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={saveImages}>
            保存到草稿
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size={14} style={{ width: '100%' }}>
        <Space>
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={uploadLocalImages}
          />
          <Button type="primary" icon={<UploadOutlined />} loading={uploading} onClick={() => uploadInputRef.current?.click()}>
            上传本地图片
          </Button>
        </Space>

        {draftImages.length ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {draftImages.map((item, index) => (
              <div
                key={`${item}-${index}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '140px minmax(0, 1fr)',
                  gap: 12,
                  padding: 12,
                  border: '1px solid var(--pm-subtle-border)',
                  borderRadius: 8,
                  background: '#fff'
                }}
              >
                <div style={{ height: 140, borderRadius: 6, overflow: 'hidden', background: 'var(--pm-subtle-bg)' }}>
                  <img src={item} alt={`商品图 ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Space wrap>
                    {index === 0 ? <Tag icon={<StarFilled />} color="gold">头图</Tag> : <Tag>商品图 {index + 1}</Tag>}
                    <Button size="small" disabled={index === 0} onClick={() => setMainImage(index)}>
                      设为头图
                    </Button>
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeImage(index)}>
                      删除
                    </Button>
                  </Space>
                  <Space size={6} wrap>
                    <Text style={{ color: 'var(--pm-text-muted)', fontSize: 12 }}>编号</Text>
                    {draftImages.map((_, targetIndex) => (
                      <Button
                        key={targetIndex}
                        size="small"
                        type={targetIndex === index ? 'primary' : 'default'}
                        aria-label={`将商品图 ${index + 1} 排到第 ${targetIndex + 1} 位`}
                        onClick={() => moveImageTo(index, targetIndex)}
                      >
                        {targetIndex + 1}
                      </Button>
                    ))}
                  </Space>
                  <Text copyable style={{ color: item && !validImageUrl(item) ? '#b91c1c' : 'var(--pm-text-faint)' }}>
                    {item}
                  </Text>
                </Space>
              </div>
            ))}
          </Space>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无图片" />
        )}
      </Space>
    </Drawer>
  );
}
