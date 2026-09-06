"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TiptapImage from "@tiptap/extension-image";
import { useEffect, useRef } from "react";
import { uploadMediaAction } from "@/server/actions/editorial";

const StoryImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      mediaId: { default: null },
    };
  },
});

export function NewsEditor({
  name,
  initial,
  dir,
  lang,
  labels,
}: {
  name: string;
  initial: unknown;
  dir: "ltr" | "rtl";
  lang?: string;
  labels?: {
    placeholder?: string;
    loading?: string;
    bold?: string;
    italic?: string;
    h2?: string;
    quote?: string;
    list?: string;
    link?: string;
    url?: string;
    image?: string;
  };
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: false }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: labels?.placeholder ?? "Write…" }),
      StoryImage.configure({ inline: false, allowBase64: false }),
    ],
    content: (initial as object) ?? { type: "doc", content: [{ type: "paragraph" }] },
    editorProps: {
      attributes: {
        lang: lang ?? "",
        class: "prose max-w-none p-4 min-h-64",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const input = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
    const sync = () => {
      if (input) input.value = JSON.stringify(editor.getJSON());
    };
    sync();
    editor.on("update", sync);
    return () => {
      editor.off("update", sync);
    };
  }, [editor, name]);

  if (!editor) return <p className="text-sm text-on-surface-variant">{labels?.loading ?? "Loading editor…"}</p>;

  return (
    <div className="overflow-hidden rounded border border-outline-variant bg-surface-container-lowest" lang={lang} data-edition-dir={dir}>
      <input type="hidden" name={name} defaultValue={JSON.stringify(initial)} />
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          const fd = new FormData();
          fd.set("file", file);
          fd.set("alt_en", file.name);
          fd.set("alt_ar", file.name);
          fd.set("alt_ckb", file.name);
          const res = await uploadMediaAction(fd);
          if (!res.ok) return;
          editor.chain().focus().insertContent({ type: "image", attrs: { mediaId: res.id, src: res.src, alt: file.name } }).run();
        }}
      />
      <div className="flex flex-wrap gap-1 border-b border-outline-variant bg-surface-container-low p-2 text-xs">
        {(
          [
            [labels?.bold ?? "Bold", () => editor.chain().focus().toggleBold().run()],
            [labels?.italic ?? "Italic", () => editor.chain().focus().toggleItalic().run()],
            [labels?.h2 ?? "H2", () => editor.chain().focus().toggleHeading({ level: 2 }).run()],
            [labels?.quote ?? "Quote", () => editor.chain().focus().toggleBlockquote().run()],
            [labels?.list ?? "List", () => editor.chain().focus().toggleBulletList().run()],
          ] as const
        ).map(([label, fn]) => (
          <button
            key={label}
            type="button"
            onClick={fn}
            className="rounded px-2 py-1 hover:bg-surface-container-lowest"
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          className="rounded px-2 py-1 hover:bg-surface-container-lowest"
          onClick={() => {
            const href = window.prompt(labels?.url ?? "URL");
            if (href) editor.chain().focus().setLink({ href }).run();
          }}
        >
          {labels?.link ?? "Link"}
        </button>
        <button
          type="button"
          className="rounded px-2 py-1 hover:bg-surface-container-lowest"
          onClick={() => fileRef.current?.click()}
        >
          {labels?.image ?? "Image"}
        </button>
      </div>
      <EditorContent editor={editor} className="min-h-64" />
    </div>
  );
}
