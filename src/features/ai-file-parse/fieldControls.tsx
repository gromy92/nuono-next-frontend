import { Input, InputNumber, Select } from 'antd';
import type { AiParseStandardField } from './types';

export function makeFieldInput(field: AiParseStandardField) {
  const commonStyle = { width: '100%' };
  if (field.type === 'number' || field.type === 'money') {
    return <InputNumber min={0} precision={field.type === 'money' ? 2 : undefined} style={commonStyle} />;
  }
  if (field.type === 'enum') {
    return <Select options={(field.options ?? []).map((value) => ({ label: value, value }))} />;
  }
  if (field.type === 'boolean') {
    return (
      <Select
        options={[
          { label: '是', value: true },
          { label: '否', value: false }
        ]}
      />
    );
  }
  if (field.type === 'json') {
    return <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} />;
  }
  return <Input />;
}
