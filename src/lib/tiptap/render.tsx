import type { ReactNode } from "react";
import Image from "next/image";
import type { Locale } from "@/lib/locales";
import {
  type TipTapMark,
  type TipTapNode,
  isAllowedEmbed,
  sanitizeHref,
} from "./schema";

type MediaLookup = Record<
  string,
  { src: string; alt: string; caption: string; credit: string; width: number; height: number }
>;

function Marks({
  marks,
  children,
}: {
  marks?: TipTapMark[];
  children: ReactNode;
}): ReactNode {
  let node: ReactNode = children;
  for (const mark of marks ?? []) {
    if (mark.type === "bold") node = <strong>{node}</strong>;
    if (mark.type === "italic") node = <em>{node}</em>;
    if (mark.type === "underline") node = <u>{node}</u>;
    if (mark.type === "link") {
      const href = sanitizeHref(mark.attrs?.href);
      if (href) {
        const external = href.startsWith("http");
        node = (
          <a
            href={href}
            rel={external ? "noopener noreferrer" : undefined}
            target={external ? "_blank" : undefined}
          >
            {node}
          </a>
        );
      }
    }
  }
  return node;
}

function Figure({
  media,
}: {
  media: MediaLookup[string];
}) {
  return (
    <figure className="my-8">
      <Image
        src={media.src}
        alt={media.alt}
        width={media.width || 1600}
        height={media.height || 900}
        className="h-auto w-full"
      />
      {(media.caption || media.credit) && (
        <figcaption className="mt-2 text-sm text-on-surface-variant">
          {media.caption}
          {media.credit ? ` — ${media.credit}` : ""}
        </figcaption>
      )}
    </figure>
  );
}

function renderNode(
  node: TipTapNode,
  media: MediaLookup,
  key: string,
): ReactNode {
  if (node.type === "text") {
    return (
      <Marks key={key} marks={node.marks}>
        {node.text}
      </Marks>
    );
  }
  if (node.type === "hardBreak") return <br key={key} />;
  if (node.type === "horizontalRule") return <hr key={key} className="my-8 border-border-muted" />;
  if (node.type === "paragraph") {
    return (
      <p key={key} className="my-4 text-pretty">
        {node.content?.map((c, i) => renderNode(c, media, `${key}-${i}`))}
      </p>
    );
  }
  if (node.type === "heading") {
    const level = Math.min(4, Math.max(2, Number(node.attrs?.level) || 2));
    const Tag = `h${level}` as "h2" | "h3" | "h4";
    return (
      <Tag key={key} className="mt-8 mb-3 text-balance font-display">
        {node.content?.map((c, i) => renderNode(c, media, `${key}-${i}`))}
      </Tag>
    );
  }
  if (node.type === "blockquote") {
    return (
      <blockquote key={key} className="my-6 rounded-lg bg-surface-container-low p-6 font-display text-2xl font-medium italic leading-snug text-primary">
        {node.content?.map((c, i) => renderNode(c, media, `${key}-${i}`))}
      </blockquote>
    );
  }
  if (node.type === "pullquote") {
    return (
      <blockquote
        key={key}
        className="my-10 rounded-lg bg-surface-container-low p-8 font-display text-2xl leading-snug text-primary italic"
      >
        {node.content?.map((c, i) => renderNode(c, media, `${key}-${i}`))}
      </blockquote>
    );
  }
  if (node.type === "bulletList") {
    return (
      <ul key={key} className="my-4 list-disc ps-6">
        {node.content?.map((c, i) => renderNode(c, media, `${key}-${i}`))}
      </ul>
    );
  }
  if (node.type === "orderedList") {
    return (
      <ol key={key} className="my-4 list-decimal ps-6">
        {node.content?.map((c, i) => renderNode(c, media, `${key}-${i}`))}
      </ol>
    );
  }
  if (node.type === "listItem") {
    return (
      <li key={key}>{node.content?.map((c, i) => renderNode(c, media, `${key}-${i}`))}</li>
    );
  }
  if (node.type === "image") {
    const id = String(node.attrs?.mediaId ?? "");
    const m = media[id];
    if (!m) return null;
    return <Figure key={key} media={m} />;
  }
  if (node.type === "gallery") {
    const ids = Array.isArray(node.attrs?.mediaIds) ? (node.attrs!.mediaIds as string[]) : [];
    return (
      <div key={key} className="my-8 grid gap-4 md:grid-cols-2">
        {ids.map((id) => {
          const m = media[id];
          return m ? <Figure key={id} media={m} /> : null;
        })}
      </div>
    );
  }
  if (node.type === "embed") {
    const provider = node.attrs?.provider;
    const videoId = node.attrs?.videoId;
    if (!isAllowedEmbed(provider, videoId)) return null;
    const src =
      provider === "youtube"
        ? `https://www.youtube-nocookie.com/embed/${videoId}`
        : `https://player.vimeo.com/video/${videoId}`;
    return (
      <div key={key} className="my-8 aspect-video w-full">
        <iframe
          src={src}
          title="Video"
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  if (node.type === "doc") {
    return node.content?.map((c, i) => renderNode(c, media, `${key}-${i}`));
  }
  return null;
}

export function renderEditionBody(
  body: unknown,
  _locale: Locale,
  media: MediaLookup,
): ReactNode {
  const doc = body as TipTapNode;
  if (!doc || doc.type !== "doc") return null;
  return renderNode(doc, media, "root");
}
