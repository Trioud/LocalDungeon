'use client';

import { useState, useRef, useEffect } from 'react';

interface InlineEditProps {
  value: string | number;
  onSave: (value: string) => Promise<void> | void;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
  type?: 'text' | 'number';
}

export default function InlineEdit({ value, onSave, multiline = false, className = '', placeholder, type = 'text' }: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState(String(value));
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setCurrent(String(value));
  }, [value]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      if (inputRef.current) {
        const len = current.length;
        (inputRef.current as HTMLInputElement).setSelectionRange(len, len);
      }
    }
  }, [editing]);

  const handleSave = async () => {
    if (current === String(value)) {
      setEditing(false);
      return;
    }
    try {
      await onSave(current);
      setError(false);
      setEditing(false);
    } catch {
      setError(true);
      setCurrent(String(value));
      setEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setCurrent(String(value));
      setEditing(false);
    }
  };

  if (editing) {
    const sharedProps = {
      ref: inputRef as React.Ref<HTMLInputElement & HTMLTextAreaElement>,
      value: current,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCurrent(e.target.value),
      onBlur: handleSave,
      onKeyDown: handleKeyDown,
      placeholder,
      className: `bg-gray-700 text-white border border-yellow-400 rounded px-2 py-1 w-full outline-none text-sm ${className}`,
    };
    return multiline ? (
      <textarea {...sharedProps} rows={3} />
    ) : (
      <input {...sharedProps} type={type} />
    );
  }

  return (
    <span
      className={`group inline-flex items-center gap-1 cursor-pointer hover:opacity-80 ${error ? 'text-red-400' : ''} ${className}`}
      onClick={() => setEditing(true)}
      title="Click to edit"
    >
      {String(value) || <span className="text-gray-500 italic">{placeholder ?? 'Click to edit'}</span>}
      <span className="opacity-0 group-hover:opacity-60 text-xs ml-1 transition-opacity">✏️</span>
    </span>
  );
}
