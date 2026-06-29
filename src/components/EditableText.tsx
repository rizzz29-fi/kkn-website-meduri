import React, { useState, useEffect, useRef } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { getTextContent, saveTextContent, loadAllTextContent, textCacheLoaded } from '@/lib/storage';

interface EditableTextProps {
  id: string;
  defaultText: string | React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: keyof JSX.IntrinsicElements;
  multiline?: boolean;
}

// Trigger a single global load of all text content from Supabase when first component mounts
let globalLoadTriggered = false;
const globalLoadCallbacks: Array<() => void> = [];

function triggerGlobalLoad() {
  if (globalLoadTriggered) return;
  globalLoadTriggered = true;
  loadAllTextContent().then(() => {
    // Notify all mounted EditableText components to re-read from cache
    globalLoadCallbacks.forEach(cb => cb());
    globalLoadCallbacks.length = 0;
  });
}

export function EditableText({ 
  id, 
  defaultText, 
  className = '', 
  style,
  as: Component = 'span',
  multiline = false
}: EditableTextProps) {
  const { isAdmin } = useAdmin();
  const [text, setText] = useState<string>('');
  const [isClient, setIsClient] = useState(false);
  
  // Ref to avoid re-render loop while typing
  const contentRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setIsClient(true);

    // 1. Immediately read from memory cache or localStorage for instant render
    const cached = getTextContent(id);
    if (cached !== null) {
      setText(cached);
    } else if (typeof defaultText === 'string') {
      setText(defaultText);
    }

    // 2. If Supabase cache not yet loaded, register callback to update once loaded
    if (!textCacheLoaded) {
      const updateFromSupabase = () => {
        const fresh = getTextContent(id);
        if (fresh !== null) setText(fresh);
      };
      globalLoadCallbacks.push(updateFromSupabase);
      triggerGlobalLoad();
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    if (!isAdmin) return;
    
    const target = e.target as HTMLElement;
    const newText = multiline ? target.innerHTML : target.innerText;
    
    if (newText.trim() === '') return;

    setText(newText);
    // Save to Supabase (+ localStorage + memory cache)
    saveTextContent(id, newText);
  };

  // Prevent paste carrying external styling
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const plain = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, plain);
  };

  // Prevent newlines in single-line mode
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      (e.currentTarget as HTMLElement).blur();
    }
  };

  // SSR guard
  if (!isClient) {
    return React.createElement(Component, { className, style }, defaultText);
  }

  // If no text saved and defaultText is a ReactNode, render as-is (not editable)
  if (!text && typeof defaultText !== 'string') {
    return React.createElement(Component, { className, style }, defaultText);
  }

  const editableClassName = `${className} ${isAdmin ? 'hover:outline hover:outline-dashed hover:outline-2 hover:outline-red-500/50 transition-all cursor-text focus:outline-red-500 rounded-sm relative z-10' : ''}`;

  return React.createElement(Component, {
    ref: contentRef as React.Ref<never>,
    contentEditable: isAdmin,
    suppressContentEditableWarning: true,
    onBlur: handleBlur as React.FocusEventHandler<never>,
    onPaste: handlePaste as React.ClipboardEventHandler<never>,
    onKeyDown: handleKeyDown as React.KeyboardEventHandler<never>,
    className: editableClassName,
    style,
    dangerouslySetInnerHTML: { __html: text || (typeof defaultText === 'string' ? defaultText : '') },
  });
}
