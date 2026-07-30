import type { ThemeConfig } from 'antd';
import {
  NUONO_BLUE,
  NUONO_PRIMARY,
  NUONO_PRIMARY_DARK,
  NUONO_PRIMARY_SOFT,
  NUONO_PRIMARY_SOFT_ACTIVE
} from '../../shared/themePalette';

export const SHELL_PRIMARY = NUONO_PRIMARY;

const SHELL_BORDER = '#dfe5e1';
const SHELL_BORDER_SECONDARY = '#e9eeeb';
const SHELL_TEXT = '#172033';
const SHELL_TEXT_SECONDARY = '#667085';

export const AUTHENTICATED_SHELL_THEME: ThemeConfig = {
  token: {
    colorPrimary: SHELL_PRIMARY,
    colorInfo: NUONO_BLUE,
    colorSuccess: '#168553',
    colorSuccessBg: '#effaf3',
    colorSuccessBgHover: '#e2f6e9',
    colorSuccessBorder: '#a8ddb9',
    colorSuccessBorderHover: '#7bc898',
    colorSuccessText: '#177245',
    colorSuccessTextHover: '#115b36',
    colorSuccessTextActive: '#0c482a',
    colorWarning: '#d97706',
    colorError: '#dc2626',
    colorBgLayout: '#f5f7f6',
    colorBgContainer: '#ffffff',
    colorBorder: SHELL_BORDER,
    colorBorderSecondary: SHELL_BORDER_SECONDARY,
    colorText: SHELL_TEXT,
    colorTextSecondary: SHELL_TEXT_SECONDARY,
    borderRadius: 6,
    borderRadiusLG: 8,
    controlHeight: 32,
    controlHeightLG: 38,
    fontSize: 14,
    boxShadowSecondary: '0 8px 24px rgba(23, 32, 51, 0.08)'
  },
  components: {
    Button: {
      primaryShadow: '0 3px 8px rgba(22, 133, 83, 0.18)',
      defaultBorderColor: '#d9e1dc',
      defaultHoverBorderColor: '#86b99c',
      defaultHoverColor: NUONO_PRIMARY_DARK,
      paddingInline: 12,
      paddingInlineSM: 8
    },
    Card: {
      headerBg: '#ffffff',
      headerFontSize: 14,
      headerFontSizeSM: 13,
      headerHeight: 44,
      headerHeightSM: 38,
      bodyPadding: 16,
      bodyPaddingSM: 12,
      headerPadding: 16,
      headerPaddingSM: 12
    },
    Input: {
      hoverBorderColor: '#86b99c',
      activeBorderColor: SHELL_PRIMARY,
      activeShadow: '0 0 0 2px rgba(22, 133, 83, 0.1)',
      paddingBlock: 4,
      paddingBlockSM: 2
    },
    Menu: {
      itemHeight: 44,
      itemBorderRadius: 14,
      itemColor: '#2b2f42',
      itemHoverColor: SHELL_PRIMARY,
      itemHoverBg: NUONO_PRIMARY_SOFT,
      itemSelectedColor: SHELL_PRIMARY,
      itemSelectedBg: NUONO_PRIMARY_SOFT_ACTIVE,
      subMenuItemBg: '#f7faf8',
      activeBarBorderWidth: 0
    },
    Select: {
      hoverBorderColor: '#86b99c',
      activeBorderColor: SHELL_PRIMARY,
      activeOutlineColor: 'rgba(22, 133, 83, 0.1)',
      optionSelectedColor: NUONO_PRIMARY_DARK,
      optionSelectedBg: NUONO_PRIMARY_SOFT,
      optionSelectedFontWeight: 600,
      optionActiveBg: '#f6faf7',
      optionHeight: 30
    },
    Table: {
      headerBg: '#f4f6f5',
      headerColor: '#475467',
      headerSortActiveBg: '#edf2ef',
      headerSortHoverBg: '#e8eeea',
      bodySortBg: '#fbfcfb',
      rowHoverBg: '#f8fbf9',
      rowSelectedBg: NUONO_PRIMARY_SOFT,
      rowSelectedHoverBg: NUONO_PRIMARY_SOFT_ACTIVE,
      borderColor: '#e3e8e5',
      headerSplitColor: '#e3e8e5',
      cellPaddingBlock: 10,
      cellPaddingInline: 12,
      cellPaddingBlockMD: 8,
      cellPaddingInlineMD: 10,
      cellPaddingBlockSM: 6,
      cellPaddingInlineSM: 8,
      cellFontSize: 13,
      cellFontSizeMD: 13,
      cellFontSizeSM: 12
    },
    Tabs: {
      itemColor: '#4b5563',
      itemActiveColor: NUONO_PRIMARY_DARK,
      itemSelectedColor: SHELL_PRIMARY,
      itemHoverColor: SHELL_PRIMARY,
      inkBarColor: SHELL_PRIMARY,
      titleFontSize: 14,
      titleFontSizeSM: 13,
      horizontalItemPadding: '8px 0',
      horizontalItemPaddingSM: '6px 0'
    },
    Tag: {
      defaultBg: '#f4f6f5',
      defaultColor: '#475467'
    }
  }
};
