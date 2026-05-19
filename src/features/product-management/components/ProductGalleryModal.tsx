import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Modal, Space, Typography } from 'antd';
import { useProductManagementWorkspace } from '../useProductManagementWorkspace';

const { Text } = Typography;

type ProductManagementWorkspace = ReturnType<typeof useProductManagementWorkspace>;

type ProductGalleryModalProps = {
  workspace: ProductManagementWorkspace;
};

export function ProductGalleryModal({ workspace }: ProductGalleryModalProps) {
  const {
    productGalleryOpen,
    setProductGalleryOpen,
    productGalleryImages,
    setProductGalleryImages,
    productGalleryIndex,
    setProductGalleryIndex,
    productGalleryTitle,
    setProductGalleryTitle,
    productGallerySubtitle,
    setProductGallerySubtitle,
    stepProductGallery
  } = workspace;

  return (
              <Modal
                open={productGalleryOpen}
                footer={null}
                onCancel={() => {
                  setProductGalleryOpen(false);
                  setProductGalleryImages([]);
                  setProductGalleryIndex(0);
                  setProductGalleryTitle(undefined);
                  setProductGallerySubtitle(undefined);
                }}
                width={720}
                centered
                destroyOnClose
              >
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {(productGalleryTitle || productGallerySubtitle) ? (
                    <div>
                      {productGalleryTitle ? (
                        <Text strong style={{ display: 'block', fontSize: 16, color: '#0f172a' }}>
                          {productGalleryTitle}
                        </Text>
                      ) : null}
                      {productGallerySubtitle ? <Text style={{ color: '#64748b' }}>{productGallerySubtitle}</Text> : null}
                    </div>
                  ) : null}

                  <div
                    style={{
                      width: '100%',
                      height: 420,
                      maxHeight: '58vh',
                      borderRadius: 8,
                      overflow: 'hidden',
                      background: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {productGalleryImages[productGalleryIndex] ? (
                      <img
                        src={productGalleryImages[productGalleryIndex]}
                        alt={`商品图 ${productGalleryIndex + 1}`}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          width: 'auto',
                          height: 'auto',
                          objectFit: 'contain'
                        }}
                      />
                    ) : null}
                  </div>

                  <Space wrap size={[8, 8]} style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#475569' }}>
                      第 {Math.min(productGalleryIndex + 1, productGalleryImages.length)} / {productGalleryImages.length} 张
                    </Text>
                    <Space wrap size={[8, 8]}>
                      <Button
                        shape="circle"
                        icon={<LeftOutlined />}
                        title="上一张"
                        aria-label="上一张"
                        onClick={() => stepProductGallery('prev')}
                        disabled={productGalleryImages.length <= 1}
                      />
                      <Button
                        shape="circle"
                        icon={<RightOutlined />}
                        title="下一张"
                        aria-label="下一张"
                        onClick={() => stepProductGallery('next')}
                        disabled={productGalleryImages.length <= 1}
                      />
                    </Space>
                  </Space>

                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      overflowX: 'auto',
                      paddingBottom: 2
                    }}
                  >
                    {productGalleryImages.map((item, index) => (
                      <button
                        key={`${item}-${index}`}
                        type="button"
                        onClick={() => setProductGalleryIndex(index)}
                        style={{
                          flex: '0 0 64px',
                          width: 64,
                          height: 64,
                          padding: 0,
                          border: index === productGalleryIndex ? '2px solid #0f766e' : '1px solid #dbe4ea',
                          borderRadius: 8,
                          overflow: 'hidden',
                          background: '#f8fafc',
                          cursor: 'pointer'
                        }}
                      >
                        <img
                          src={item}
                          alt={`商品缩略图 ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </Space>
              </Modal>
  );
}
