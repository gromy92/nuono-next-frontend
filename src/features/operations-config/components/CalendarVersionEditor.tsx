import { Button, DatePicker, Drawer, Input, InputNumber, Modal, Select, Space, Typography } from 'antd'
import { calendarDateRangeText, calendarFactorValue, calendarPresetFor, calendarScopeLabel, calendarScopeRequiresValue,
  calendarScopeUsesDimensionOptions, composeCalendarDefaultValue, formatCalendarScope, formatDateRangeValue,
  isCalendarDateRangeItem, parseCalendarScope, parseDateRangeValue } from '../calendarConfigDomain'
import { CALENDAR_SCOPE_OPTIONS, type CalendarScopeType } from '../versionLibraryTypes'
import { configTypeTag, statusTag } from '../versionLibraryPresentation'
import type { useOperationConfigEditorActions } from '../hooks/useOperationConfigEditorActions'
import type { useOperationConfigLibraryController } from '../hooks/useOperationConfigLibraryController'

const { Text } = Typography

export function CalendarVersionEditor({ state, actions }: {
  state: ReturnType<typeof useOperationConfigLibraryController>
  actions: ReturnType<typeof useOperationConfigEditorActions>
}) {
  const { calendarEditor, editorLoading, editorSaving, calendarDimensionOptions, calendarScopePicker,
    setCalendarScopePicker, calendarScopePickerOptions, calendarScopePickerSelectedValue, closeCalendarVersionEditor } = state
  const { updateCalendarEditorMeta, addCalendarItem, updateCalendarItem, removeCalendarItem, saveCalendarEditor } = actions
  return <>
        <Drawer
          title={calendarEditor?.displayName || '日历配置'}
          open={Boolean(calendarEditor)}
          onClose={closeCalendarVersionEditor}
          width={1040}
          loading={editorLoading}
        >
          {calendarEditor ? (
            <Space direction="vertical" size={16} className="operations-config-suite-layout" data-testid="operation-config-calendar-editor">
              <div className="operation-config-calendar-version-editor-header" data-testid="operation-config-calendar-editor-header">
                <div className="operation-config-version-editor-header-main">
                  <Space>
                    {configTypeTag(calendarEditor)}
                    {statusTag(calendarEditor)}
                  </Space>
                  <div className="operation-config-version-editor-meta">
                    <Input
                      data-testid="operation-config-calendar-display-name"
                      value={calendarEditor.displayName || ''}
                      placeholder="版本名称"
                      onChange={(event) => updateCalendarEditorMeta({ displayName: event.target.value })}
                    />
                    <Input
                      data-testid="operation-config-calendar-summary"
                      value={calendarEditor.summary || ''}
                      placeholder="摘要"
                      onChange={(event) => updateCalendarEditorMeta({ summary: event.target.value })}
                    />
                  </div>
                </div>
                <Button data-testid="operation-config-calendar-add" onClick={addCalendarItem}>
                  增加日历项
                </Button>
              </div>
              <Space direction="vertical" size={12}>
                {calendarEditor.items.map((item, index) => (
                  <div className="operation-config-calendar-version-editor-row" key={`${item.groupName || 'row'}-${index}`}>
                    <Input
                      data-testid={`operation-config-calendar-item-name-${index}`}
                      value={item.itemName || ''}
                      placeholder="节日"
                      onChange={(event) => {
                        const nextItemName = event.target.value
                        const preset = calendarPresetFor(nextItemName)
                        updateCalendarItem(index, {
                          itemName: nextItemName,
                          groupName: preset?.groupName ?? '业务日历',
                          cadence: null,
                          valueType: preset?.valueType ?? '日期范围',
                          defaultValue: composeCalendarDefaultValue(calendarDateRangeText(item.defaultValue), calendarFactorValue(item.defaultValue)),
                          resultShape: preset?.resultShape ?? item.resultShape ?? 'all_products'
                        })
                      }}
                    />
                    {isCalendarDateRangeItem(item) ? (
                      <>
                        <div data-testid={`operation-config-calendar-item-date-range-${index}`}>
                          <DatePicker.RangePicker
                            className="operation-config-calendar-date-range"
                            placeholder={['开始日期', '结束日期']}
                            value={parseDateRangeValue(item.defaultValue)}
                            onChange={(dates) =>
                              updateCalendarItem(index, {
                                defaultValue: composeCalendarDefaultValue(formatDateRangeValue(dates), calendarFactorValue(item.defaultValue))
                              })
                            }
                          />
                        </div>
                        <div data-testid={`operation-config-calendar-item-factor-${index}`}>
                          <InputNumber<string>
                            className="operation-config-calendar-factor-input"
                            min="0"
                            step="0.01"
                            stringMode
                            value={calendarFactorValue(item.defaultValue) ?? undefined}
                            placeholder="爆发系数"
                            onChange={(value) =>
                              updateCalendarItem(index, {
                                defaultValue: composeCalendarDefaultValue(calendarDateRangeText(item.defaultValue), value)
                              })
                            }
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <Input
                          data-testid={`operation-config-calendar-item-default-value-${index}`}
                          value={item.defaultValue || ''}
                          placeholder="默认值"
                          onChange={(event) => updateCalendarItem(index, { defaultValue: event.target.value })}
                        />
                        <Input
                          data-testid={`operation-config-calendar-item-result-shape-${index}`}
                          value={item.resultShape || ''}
                          placeholder="结果形态"
                          onChange={(event) => updateCalendarItem(index, { resultShape: event.target.value })}
                        />
                      </>
                    )}
                    <Select<CalendarScopeType>
                      data-testid={`operation-config-calendar-item-scope-type-${index}`}
                      value={parseCalendarScope(item.resultShape).type}
                      options={CALENDAR_SCOPE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
                      onChange={(scopeType) => {
                        const currentScope = parseCalendarScope(item.resultShape)
                        updateCalendarItem(index, {
                          resultShape: formatCalendarScope(scopeType, scopeType === currentScope.type ? currentScope.value : null)
                        })
                      }}
                    />
                    {calendarScopeRequiresValue(parseCalendarScope(item.resultShape).type) ? (
                      calendarScopeUsesDimensionOptions(parseCalendarScope(item.resultShape).type) ? (
                        <Button
                          data-testid={`operation-config-calendar-item-scope-value-${index}`}
                          className="operation-config-calendar-scope-picker-trigger"
                          loading={calendarDimensionOptions.loading}
                          onClick={() =>
                            setCalendarScopePicker({
                              index,
                              type: parseCalendarScope(item.resultShape).type,
                              query: ''
                            })
                          }
                        >
                          <span>{parseCalendarScope(item.resultShape).value || `选择${calendarScopeLabel(parseCalendarScope(item.resultShape).type)}`}</span>
                        </Button>
                      ) : (
                        <Input
                          data-testid={`operation-config-calendar-item-scope-value-${index}`}
                          value={parseCalendarScope(item.resultShape).value || ''}
                          placeholder={`${calendarScopeLabel(parseCalendarScope(item.resultShape).type)}值`}
                          onChange={(event) =>
                            updateCalendarItem(index, {
                              resultShape: formatCalendarScope(parseCalendarScope(item.resultShape).type, event.target.value)
                            })
                          }
                        />
                      )
                    ) : null}
                    <Button
                      danger
                      data-testid={`operation-config-calendar-item-delete-${index}`}
                      disabled={calendarEditor.items.length <= 1}
                      onClick={() => removeCalendarItem(index)}
                    >
                      删除
                    </Button>
                  </div>
                ))}
              </Space>
              <Space>
                <Button onClick={closeCalendarVersionEditor} disabled={editorSaving}>
                  取消
                </Button>
                <Button type="primary" data-testid="operation-config-calendar-save" loading={editorSaving} onClick={saveCalendarEditor}>
                  保存
                </Button>
              </Space>
            </Space>
          ) : null}
        </Drawer>
        <Modal
          title={calendarScopePicker ? `选择${calendarScopeLabel(calendarScopePicker.type)}` : '选择范围'}
          open={Boolean(calendarScopePicker)}
          onCancel={() => setCalendarScopePicker(null)}
          footer={null}
          width={720}
          destroyOnClose
        >
          {calendarScopePicker ? (
            <Space direction="vertical" size={12} className="operation-config-calendar-scope-picker" data-testid="operation-config-calendar-scope-picker-modal">
              <Input
                data-testid="operation-config-calendar-scope-picker-search"
                allowClear
                placeholder={`搜索${calendarScopeLabel(calendarScopePicker.type)}`}
                value={calendarScopePicker.query}
                onChange={(event) =>
                  setCalendarScopePicker((current) => current ? { ...current, query: event.target.value } : current)
                }
              />
              <div className="operation-config-calendar-scope-picker-list">
                {calendarScopePickerOptions.length ? (
                  calendarScopePickerOptions.map((option) => (
                    <Button
                      key={option.value}
                      type={option.value === calendarScopePickerSelectedValue ? 'primary' : 'text'}
                      data-testid={`operation-config-calendar-scope-picker-option-${option.value}`}
                      className="operation-config-calendar-scope-picker-option"
                      onClick={() => {
                        updateCalendarItem(calendarScopePicker.index, {
                          resultShape: formatCalendarScope(calendarScopePicker.type, option.value)
                        })
                        setCalendarScopePicker(null)
                      }}
                    >
                      <span>{option.label}</span>
                    </Button>
                  ))
                ) : (
                  <div className="operation-config-calendar-scope-picker-empty">
                    <Text type="secondary">没有可选择的{calendarScopeLabel(calendarScopePicker.type)}</Text>
                  </div>
                )}
              </div>
            </Space>
          ) : null}
        </Modal>
  </>
}
