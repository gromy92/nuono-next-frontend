import { useCallback } from 'react';
import { Modal, Space, Typography } from 'antd';

const { Text } = Typography;

export function useProductDetailSwitchConfirm() {
  const [modal, contextHolder] = Modal.useModal();

  const confirmProductDetailSwitch = useCallback(
    (mode: 'close' | 'switch', nextSkuParent?: string) =>
      new Promise<boolean>((resolve) => {
        let settled = false;
        const settle = (value: boolean) => {
          if (settled) {
            return;
          }
          settled = true;
          resolve(value);
        };

        modal.confirm({
          title: '当前商品还有未发布修改',
          content: (
            <Space direction="vertical" size={8}>
              <Text style={{ color: '#0f172a' }}>
                {mode === 'switch'
                  ? `切到${nextSkuParent ? `“${nextSkuParent}”` : '另一条商品'}前，先处理当前商品的修改。`
                  : '关闭详情前，先确认当前商品的修改是否暂时先放下。'}
              </Text>
              <Text style={{ color: '#64748b' }}>
                这些修改不会自动发布；如果还要继续处理，建议先保存草稿。
              </Text>
            </Space>
          ),
          okText: mode === 'switch' ? '仍然切换' : '仍然关闭',
          cancelText: '继续编辑',
          onOk: () => settle(true),
          onCancel: () => settle(false),
          afterClose: () => settle(false)
        });
      }),
    [modal]
  );

  return {
    confirmProductDetailSwitch,
    productDetailSwitchConfirmModal: contextHolder
  };
}
