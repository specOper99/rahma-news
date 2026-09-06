export type TipTapMark = { type: string; attrs?: Record<string, unknown> };
export type TipTapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  marks?: TipTapMark[];
  text?: string;
};

export const ALLOWED_MARKS = new Set(["bold", "italic", "link", "underline"]);
export const ALLOWED_NODES = new Set([
  "doc",
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "pullquote",
  "horizontalRule",
  "image",
  "embed",
  "gallery",
  "text",
  "hardBreak",
]);

export function emptyDoc(): TipTapNode {
  return {
    type: "doc",
    content: [{ type: "paragraph" }],
  };
}

export function plainText(node: TipTapNode | null | undefined): string {
  if (!node) return "";
  if (node.text) return node.text;
  return (node.content ?? []).map(plainText).join(node.type === "paragraph" ? "\n" : " ");
}

const SAFE_PROTO = /^(https?:|mailto:)/i;

export function sanitizeHref(href: unknown): string | null {
  if (typeof href !== "string") return null;
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (!SAFE_PROTO.test(href)) return null;
  if (/javascript:/i.test(href)) return null;
  return href;
}

export function isAllowedEmbed(provider: unknown, id: unknown): boolean {
  if (typeof id !== "string" || !/^[A-Za-z0-9_-]+$/.test(id)) return false;
  return provider === "youtube" || provider === "vimeo";
}

export function collectMediaIds(node: TipTapNode | null | undefined, into = new Set<string>()): Set<string> {
  if (!node) return into;
  if (node.type === "image" && typeof node.attrs?.mediaId === "string" && node.attrs.mediaId) {
    into.add(node.attrs.mediaId);
  }
  if (node.type === "gallery" && Array.isArray(node.attrs?.mediaIds)) {
    for (const id of node.attrs.mediaIds) {
      if (typeof id === "string" && id) into.add(id);
    }
  }
  for (const child of node.content ?? []) collectMediaIds(child, into);
  return into;
}

export function walkRejectsXss(node: TipTapNode): string | null {
  if (!ALLOWED_NODES.has(node.type) && node.type !== "text") {
    return `unknown-node:${node.type}`;
  }
  if (node.type === "embed") {
    if (!isAllowedEmbed(node.attrs?.provider, node.attrs?.videoId)) {
      return "bad-embed";
    }
  }
  if (node.type === "image" && typeof node.attrs?.mediaId !== "string") {
    return "bad-image";
  }
  for (const mark of node.marks ?? []) {
    if (!ALLOWED_MARKS.has(mark.type)) return `unknown-mark:${mark.type}`;
    if (mark.type === "link") {
      const href = sanitizeHref(mark.attrs?.href);
      if (!href) return "bad-link";
    }
  }
  for (const child of node.content ?? []) {
    const err = walkRejectsXss(child);
    if (err) return err;
  }
  return null;
}
