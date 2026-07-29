import {
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  TreeSelect
} from 'antd';
import type { MasterDataBoardModel } from './MasterDataBoard';

export function MasterDataRoleMenuModals({ model }: { model: MasterDataBoardModel['roleMenuModals'] }) {
  const {
    roleSubmitting,
    roleModalOpen,
    editingRole,
    setRoleModalOpen,
    submitRole,
    roleForm,
    roleTreeOptions,
    menuTreeData,
    menuSubmitting,
    menuModalOpen,
    editingMenu,
    setMenuModalOpen,
    submitMenu,
    menuForm
  } = model;
  return (
    <>
      <Modal
        destroyOnClose
        confirmLoading={roleSubmitting}
        open={roleModalOpen}
        title={editingRole ? '编辑角色' : '新增角色'}
        width={640}
        okButtonProps={{ 'data-testid': 'role-submit-button' }}
        cancelButtonProps={{ 'data-testid': 'role-cancel-button' }}
        onCancel={() => setRoleModalOpen(false)}
        onOk={() => void submitRole()}
      >
        <Form data-testid="role-form" form={roleForm} labelCol={{ span: 5 }} wrapperCol={{ span: 18 }} style={{ marginTop: 16 }}>
          <Form.Item label="角色名称" name="name" rules={[{ required: true, message: '请输入角色名称' }]}>
            <Input data-testid="role-name-input" placeholder="请输入角色名称" />
          </Form.Item>
          {!editingRole ? (
            <Form.Item label="角色编码" name="code" rules={[{ required: true, message: '请输入角色编码' }]}>
              <Input data-testid="role-code-input" placeholder="建议大写英文下划线，如 OPS_ASSIST" />
            </Form.Item>
          ) : null}
          <Form.Item label="说明" name="description">
            <Input data-testid="role-description-input" placeholder="请输入角色说明" />
          </Form.Item>
          <Form.Item label="上级角色" name="parentId">
            <Select data-testid="role-parent-select" allowClear options={roleTreeOptions} placeholder="请选择上级角色（顶级可不选）" />
          </Form.Item>
	          <Form.Item label="层级" name="level">
	            <InputNumber
	              data-testid="role-level-input"
	              min={0}
	              max={3}
	              disabled={Boolean(editingRole)}
	              style={{ width: '100%' }}
	              placeholder="0=超管 1=老板 2=主管 3=员工"
	            />
          </Form.Item>
          <Form.Item label="菜单权限" name="menuIds">
            <TreeSelect
              data-testid="role-menu-tree-select"
              allowClear
              treeCheckable
              showCheckedStrategy={TreeSelect.SHOW_PARENT}
              style={{ width: '100%' }}
              placeholder="请选择菜单权限"
              treeData={menuTreeData}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        destroyOnClose
        confirmLoading={menuSubmitting}
        open={menuModalOpen}
        title={editingMenu ? '编辑菜单' : '新增菜单'}
        width={560}
        okButtonProps={{ 'data-testid': 'menu-submit-button' }}
        cancelButtonProps={{ 'data-testid': 'menu-cancel-button' }}
        onCancel={() => setMenuModalOpen(false)}
        onOk={() => void submitMenu()}
      >
        <Form data-testid="menu-form" form={menuForm} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }} style={{ marginTop: 16 }}>
          <Form.Item label="菜单名称" name="name" rules={[{ required: true, message: '请输入菜单名称' }]}>
            <Input data-testid="menu-name-input" placeholder="请输入菜单名称" />
          </Form.Item>
          <Form.Item label="父菜单" name="parentId">
            <TreeSelect
              data-testid="menu-parent-tree-select"
              allowClear
              treeDefaultExpandAll
              placeholder="请选择父菜单（不选则为顶级）"
              treeData={menuTreeData}
            />
          </Form.Item>
          <Form.Item label="接口路径" name="urlPath">
            <Input data-testid="menu-url-path-input" placeholder="如 /system/menu 或 /api/xxx" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
