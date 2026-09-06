"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";

export function FileDropzone({
  name,
  accept = ACCEPT,
  required,
  previewSrc,
  previewAlt = "",
  className = "",
  labels,
}: {
  name: string;
  accept?: string;
  required?: boolean;
  previewSrc?: string | null;
  previewAlt?: string;
  className?: string;
  labels: {
    drop: string;
    browse: string;
    selected?: string;
  };
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);
  const [picked, setPicked] = useState<{ name: string; url: string } | null>(null);
  const shown = picked?.url || previewSrc || null;

  useEffect(() => {
    return () => {
      if (picked?.url) URL.revokeObjectURL(picked.url);
    };
  }, [picked?.url]);

  function previewFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    setPicked((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return { name: file.name, url: URL.createObjectURL(file) };
    });
  }

  function assign(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    const input = inputRef.current;
    if (!input) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    previewFile(file);
  }

  return (
    <label
      htmlFor={id}
      className={`file-dropzone ${hover ? "file-dropzone-hot" : ""} ${className}`.trim()}
      onDragEnter={(e) => {
        e.preventDefault();
        setHover(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setHover(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        assign(e.dataTransfer.files[0]);
      }}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        name={name}
        accept={accept}
        required={required}
        aria-label={labels.drop}
        className="sr-only"
        onChange={(e) => previewFile(e.target.files?.[0])}
      />
      {shown ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shown} alt={previewAlt} className="file-dropzone-preview" />
      ) : (
        <Icon name="image" size={32} className="text-secondary" />
      )}
      <span className="file-dropzone-copy">
        <span className="file-dropzone-title">{labels.drop}</span>
      </span>
      <span className="admin-btn-primary h-9 px-4">{labels.browse}</span>
      {picked ? (
        <span aria-live="polite" className="max-w-full truncate font-mono-num text-[11px] text-on-surface">
          {labels.selected ? `${labels.selected}: ${picked.name}` : picked.name}
        </span>
      ) : null}
    </label>
  );
}
