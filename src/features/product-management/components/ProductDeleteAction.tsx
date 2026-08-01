import { DeleteOutlined } from '@ant-design/icons';
import { Button, Popconfirm, Tooltip } from 'antd';
import type { ProductListRowPayload } from '../types';
import { productDeleteActionState } from '../utils/productDeleteActionState';
import { ProductDeleteConfirmDescription } from './ProductListConfirmDescriptions';

type ProductDeleteActionProps = {
  record: ProductListRowPayload;
  deleting?: boolean;
  requestDeleteLocalProduct: (record: ProductListRowPayload) => void | Promise<void>;
};

export function ProductDeleteAction({
  record,
  deleting,
  requestDeleteLocalProduct
}: ProductDeleteActionProps) {
  const state = productDeleteActionState(record);
  const disabled = state.disabled || deleting;
  const label = deleting ? '删除中' : state.label;

  return (
    <Tooltip title={state.tooltip}>
      <span
        title={state.tooltip}
        aria-label={state.tooltip || label}
        style={{ display: 'inline-flex' }}
        onClick={(event) => event.stopPropagation()}
      >
        <Popconfirm
          disabled={disabled}
          title={state.continuing ? '确认继续删除？' : '确认删除商品？'}
          description={<ProductDeleteConfirmDescription record={record} continuing={state.continuing} />}
          okText={state.continuing ? '继续删除' : '删除'}
          cancelText="取消"
          okButtonProps={{ danger: true }}
          onConfirm={() => void requestDeleteLocalProduct(record)}
        >
          <Button
            danger
            type="link"
            size="small"
            icon={<DeleteOutlined />}
            loading={deleting}
            disabled={disabled}
            style={{ height: 20, padding: 0, fontSize: 12 }}
          >
            {label}
          </Button>
        </Popconfirm>
      </span>
    </Tooltip>
  );
}
