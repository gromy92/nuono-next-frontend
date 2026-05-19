import type { CSSProperties } from 'react';

export const shellHeaderStyle: CSSProperties = {
  height: 54,
  lineHeight: 'normal',
  background: '#ffffff',
  borderBottom: '1px solid #eceff7',
  padding: '0 20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  boxShadow: '0 1px 0 rgba(15, 23, 42, 0.02)'
};

export const shellHeaderTitleAreaStyle: CSSProperties = {
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 10
};

export const shellHeaderMenuMarkStyle: CSSProperties = {
  color: '#2f3447',
  fontSize: 18,
  fontWeight: 700
};

export const shellHeaderPathLabelStyle: CSSProperties = {
  color: '#4b5563',
  fontSize: 14,
  fontWeight: 500,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
};

export const shellHeaderUserButtonStyle: CSSProperties = {
  height: 36,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  paddingInline: 8
};

export const shellHeaderRoleTagStyle: CSSProperties = {
  marginInlineEnd: 0,
  paddingInline: 7,
  fontSize: 12,
  fontWeight: 600,
  lineHeight: '22px'
};

export const shellHeaderUserNameStyle: CSSProperties = {
  color: '#1f1f1f',
  maxWidth: 108
};

export const shellHeaderChevronStyle: CSSProperties = {
  color: '#8c8c8c',
  fontSize: 11
};
