import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  BoldOutlined,
  ClearOutlined,
  CodeOutlined,
  DisconnectOutlined,
  HighlightOutlined,
  ItalicOutlined,
  LinkOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  OrderedListOutlined,
  RedoOutlined,
  StrikethroughOutlined,
  UnderlineOutlined,
  UndoOutlined,
  UnorderedListOutlined
} from '@ant-design/icons';
import { Button, Select, Space, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';

const { Text } = Typography;
const COLOR_OPTIONS = [
  { value: '#111827', label: 'Black' },
  { value: '#dc2626', label: 'Red' },
  { value: '#2563eb', label: 'Blue' },
  { value: '#16a34a', label: 'Green' }
];
const BLOCK_OPTIONS = [
  { value: 'P', label: '段落' },
  { value: 'H2', label: 'H2' },
  { value: 'H3', label: 'H3' },
  { value: 'BLOCKQUOTE', label: '引用' }
];

const ALLOWED_RICH_TEXT_TAGS = new Set([
  'a',
  'b',
  'blockquote',
  'br',
  'div',
  'em',
  'font',
  'h2',
  'h3',
  'i',
  'li',
  'ol',
  'p',
  's',
  'span',
  'strike',
  'strong',
  'u',
  'ul'
]);
const DROP_WITH_CONTENT_TAGS = new Set(['script', 'style', 'iframe', 'object', 'embed', 'svg', 'math']);
const SAFE_COLOR_PATTERN = /^(#[0-9a-f]{3,8}|rgba?\([0-9\s.,%]+\)|[a-z]+)$/i;
const SAFE_ALIGN_VALUES = new Set(['left', 'center', 'right', 'justify']);

function normalizeHtml(value: unknown) {
  return sanitizeProductRichTextHtml(String(value ?? ''));
}

function sanitizeRichTextStyle(styleValue: string) {
  const safeRules: string[] = [];
  styleValue.split(';').forEach((rule) => {
    const [rawProperty, ...rawValueParts] = rule.split(':');
    const property = rawProperty?.trim().toLowerCase();
    const value = rawValueParts.join(':').trim();
    if (!property || !value || /expression|url\(|javascript:|data:/i.test(value)) {
      return;
    }
    if ((property === 'color' || property === 'background-color') && SAFE_COLOR_PATTERN.test(value)) {
      safeRules.push(`${property}: ${value}`);
      return;
    }
    if (property === 'text-align' && SAFE_ALIGN_VALUES.has(value.toLowerCase())) {
      safeRules.push(`${property}: ${value.toLowerCase()}`);
    }
  });
  return safeRules.join('; ');
}

function safeRichTextUrl(rawUrl: string) {
  const trimmed = rawUrl.trim();
  if (!trimmed || /[\u0000-\u001f]/.test(trimmed)) {
    return null;
  }
  try {
    const url = new URL(trimmed, window.location.origin);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) ? trimmed : null;
  } catch {
    return null;
  }
}

function sanitizeRichTextNode(node: Node) {
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return;
  }
  const element = node as HTMLElement;
  const tagName = element.tagName.toLowerCase();
  if (DROP_WITH_CONTENT_TAGS.has(tagName)) {
    element.remove();
    return;
  }

  Array.from(element.childNodes).forEach(sanitizeRichTextNode);

  if (!ALLOWED_RICH_TEXT_TAGS.has(tagName)) {
    element.replaceWith(...Array.from(element.childNodes));
    return;
  }

  Array.from(element.attributes).forEach((attribute) => {
    const name = attribute.name.toLowerCase();
    const value = attribute.value;
    element.removeAttribute(attribute.name);

    if (name === 'style') {
      const safeStyle = sanitizeRichTextStyle(value);
      if (safeStyle) {
        element.setAttribute('style', safeStyle);
      }
      return;
    }
    if (name === 'align' && SAFE_ALIGN_VALUES.has(value.toLowerCase())) {
      element.setAttribute('style', `text-align: ${value.toLowerCase()}`);
      return;
    }
    if (tagName === 'a' && name === 'href') {
      const safeUrl = safeRichTextUrl(value);
      if (safeUrl) {
        element.setAttribute('href', safeUrl);
        element.setAttribute('rel', 'noopener noreferrer');
        element.setAttribute('target', '_blank');
      }
      return;
    }
    if (tagName === 'font' && name === 'color' && SAFE_COLOR_PATTERN.test(value.trim())) {
      element.setAttribute('style', `color: ${value.trim()}`);
    }
  });
}

function sanitizeProductRichTextHtml(rawHtml: string) {
  if (typeof document === 'undefined') {
    return rawHtml;
  }
  const template = document.createElement('template');
  template.innerHTML = rawHtml;
  Array.from(template.content.childNodes).forEach(sanitizeRichTextNode);
  return template.innerHTML;
}

export function ProductRichTextEditor(props: {
  label: string;
  value: unknown;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  onChange: (value: string) => void;
}) {
  const { label, value, placeholder, minHeight = 180, maxHeight = 360, onChange } = props;
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [codeMode, setCodeMode] = useState(false);
  const htmlValue = normalizeHtml(value);

  useEffect(() => {
    if (!editorRef.current || codeMode) {
      return;
    }
    if (editorRef.current.innerHTML !== htmlValue) {
      editorRef.current.innerHTML = htmlValue;
    }
  }, [codeMode, htmlValue]);

  const emitChange = () => {
    const rawValue = codeMode ? editorRef.current?.innerText ?? '' : editorRef.current?.innerHTML ?? '';
    const nextValue = sanitizeProductRichTextHtml(rawValue);
    if (!codeMode && editorRef.current && editorRef.current.innerHTML !== nextValue) {
      editorRef.current.innerHTML = nextValue;
    }
    onChange(nextValue);
  };

  const runCommand = (command: string, value?: string) => {
    if (!editorRef.current) {
      return;
    }
    editorRef.current.focus();
    document.execCommand(command, false, value);
    emitChange();
  };

  const createLink = () => {
    const url = window.prompt('输入链接 URL');
    const safeUrl = url ? safeRichTextUrl(url) : null;
    if (!safeUrl) {
      return;
    }
    runCommand('createLink', safeUrl);
  };

  const toggleCodeMode = () => {
    const currentValue = sanitizeProductRichTextHtml(
      codeMode ? editorRef.current?.innerText ?? '' : editorRef.current?.innerHTML ?? ''
    );
    setCodeMode((current) => !current);
    window.requestAnimationFrame(() => {
      if (!editorRef.current) {
        return;
      }
      if (codeMode) {
        editorRef.current.innerHTML = currentValue;
      } else {
        editorRef.current.innerText = currentValue;
      }
      onChange(currentValue);
    });
  };

  return (
    <div>
      <Text style={{ display: 'block', color: 'var(--pm-text-muted)', marginBottom: 6 }}>{label}</Text>
      <Space wrap size={[4, 4]} style={{ width: '100%', marginBottom: 6 }}>
        <Space.Compact>
          <Button aria-label="Undo" disabled={codeMode} size="small" title="Undo" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand('undo')}>
            <UndoOutlined />
          </Button>
          <Button aria-label="Redo" disabled={codeMode} size="small" title="Redo" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand('redo')}>
            <RedoOutlined />
          </Button>
        </Space.Compact>
        <Select
          disabled={codeMode}
          options={BLOCK_OPTIONS}
          size="small"
          style={{ width: 86 }}
          value="P"
          onChange={(value) => runCommand('formatBlock', value)}
        />
        <Space.Compact>
          <Button
            aria-label="Bold"
            disabled={codeMode}
            size="small"
            title="Bold"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand('bold')}
          >
            <BoldOutlined />
          </Button>
          <Button
            aria-label="Italic"
            disabled={codeMode}
            size="small"
            title="Italic"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand('italic')}
          >
            <ItalicOutlined />
          </Button>
          <Button
            aria-label="Underline"
            disabled={codeMode}
            size="small"
            title="Underline"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand('underline')}
          >
            <UnderlineOutlined />
          </Button>
          <Button
            aria-label="Strikethrough"
            disabled={codeMode}
            size="small"
            title="Strikethrough"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand('strikeThrough')}
          >
            <StrikethroughOutlined />
          </Button>
        </Space.Compact>
        <Select
          disabled={codeMode}
          options={COLOR_OPTIONS}
          size="small"
          suffixIcon={<HighlightOutlined />}
          style={{ width: 90 }}
          value="#111827"
          onChange={(value) => runCommand('foreColor', value)}
        />
        <Space.Compact>
          <Button
            aria-label="Ordered list"
            disabled={codeMode}
            size="small"
            title="Ordered list"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand('insertOrderedList')}
          >
            <OrderedListOutlined />
          </Button>
          <Button
            aria-label="Bullet list"
            disabled={codeMode}
            size="small"
            title="Bullet list"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand('insertUnorderedList')}
          >
            <UnorderedListOutlined />
          </Button>
          <Button aria-label="Outdent" disabled={codeMode} size="small" title="Outdent" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand('outdent')}>
            <MenuFoldOutlined />
          </Button>
          <Button aria-label="Indent" disabled={codeMode} size="small" title="Indent" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand('indent')}>
            <MenuUnfoldOutlined />
          </Button>
        </Space.Compact>
        <Space.Compact>
          <Button aria-label="Align left" disabled={codeMode} size="small" title="Align left" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand('justifyLeft')}>
            <AlignLeftOutlined />
          </Button>
          <Button aria-label="Align center" disabled={codeMode} size="small" title="Align center" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand('justifyCenter')}>
            <AlignCenterOutlined />
          </Button>
          <Button aria-label="Align right" disabled={codeMode} size="small" title="Align right" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand('justifyRight')}>
            <AlignRightOutlined />
          </Button>
        </Space.Compact>
        <Space.Compact>
          <Button aria-label="Link" disabled={codeMode} size="small" title="Link" onMouseDown={(event) => event.preventDefault()} onClick={createLink}>
            <LinkOutlined />
          </Button>
          <Button aria-label="Unlink" disabled={codeMode} size="small" title="Unlink" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand('unlink')}>
            <DisconnectOutlined />
          </Button>
          <Button
            aria-label="Clear formatting"
            disabled={codeMode}
            size="small"
            title="Clear formatting"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand('removeFormat')}
          >
            <ClearOutlined />
          </Button>
        </Space.Compact>
        <Space.Compact>
          <Button
            aria-label="HTML source"
            size="small"
            title="HTML source"
            type={codeMode ? 'primary' : 'default'}
            onClick={toggleCodeMode}
          >
            <CodeOutlined />
          </Button>
        </Space.Compact>
      </Space>
      <div
        className="pm-rich-text-editor"
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onBlur={emitChange}
        onInput={emitChange}
        style={{
          minHeight,
          maxHeight,
          overflow: 'auto',
          padding: '8px 11px',
          border: '1px solid #d9d9d9',
          borderRadius: 6,
          background: '#ffffff',
          color: '#111827',
          outline: 'none',
          whiteSpace: codeMode ? 'pre-wrap' : 'normal'
        }}
      />
    </div>
  );
}
