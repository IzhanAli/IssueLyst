import { Fragment } from "react";
import { ArrowUpRight } from "lucide-react";

type Segment = { kind: "text"; value: string } | { kind: "link"; value: string; url: URL };

/** http(s) links and bare www. ones, up to the next whitespace. */
const LINK = /\b(?:https?:\/\/|www\.)[^\s<>"']+/gi;

/** Punctuation that ends a sentence rather than the link it follows. */
const TRAILING = /[.,;:!?'")\]}]+$/;

/** Splits text into plain runs and web links. A match that isn't a valid URL stays text. */
export function splitLinks(text: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    const value = match[0].replace(TRAILING, "");
    let url: URL;
    try {
      url = new URL(/^www\./i.test(value) ? `https://${value}` : value);
    } catch {
      continue;
    }
    const start = match.index;
    if (start > last) segments.push({ kind: "text", value: text.slice(last, start) });
    segments.push({ kind: "link", value, url });
    last = start + value.length;
  }
  if (last < text.length) segments.push({ kind: "text", value: text.slice(last) });
  return segments;
}

export const hasLinks = (text: string) => splitLinks(text).some((s) => s.kind === "link");

/**
 * A text object's content with each link drawn as a card. A card is a block
 * of its own, so the line break on either side of it would only add a blank
 * line; those are dropped.
 */
export function LinkCardText({ text }: { text: string }) {
  const segments = splitLinks(text);
  return segments.map((s, i) => {
    if (s.kind === "link") return <LinkCard key={i} url={s.url} />;
    let value = s.value;
    if (segments[i - 1]?.kind === "link") value = value.replace(/^\n/, "");
    if (segments[i + 1]?.kind === "link") value = value.replace(/\n$/, "");
    return value ? <Fragment key={i}>{value}</Fragment> : null;
  });
}

/**
 * The card body selects and drags like the rest of the text; only the arrow
 * opens the link, so a double-click to edit never opens a tab.
 */
function LinkCard({ url }: { url: URL }) {
  const host = url.hostname.replace(/^www\./, "");
  const rest = `${url.pathname === "/" ? "" : url.pathname}${url.search}${url.hash}`;
  return (
    <span
      data-wb-link-card=""
      className="my-1.5 flex items-center gap-3 rounded-[12px] border border-border-strong bg-surface p-2.5 font-normal tracking-normal text-text"
    >
      <span
        aria-hidden
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] bg-primary font-display text-[19px] font-extrabold uppercase text-primary-fg"
      >
        {host.charAt(0)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col leading-[1.3]">
        <span className="truncate font-display text-[17px] font-bold tracking-[-0.015em]">{host}</span>
        <span className="truncate text-[14px] text-text-muted">{rest || url.protocol.replace(/:$/, "")}</span>
      </span>
      <a
        href={url.href}
        target="_blank"
        rel="noopener noreferrer"
        draggable={false}
        aria-label={`Open ${host}`}
        title={url.href}
        // the canvas would treat the press as a select, drag or tool stroke
        onPointerDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] text-text-muted transition-[background-color,color,transform] duration-150 hover:bg-surface-hover hover:text-text active:scale-90"
      >
        <ArrowUpRight size={19} strokeWidth={2.4} />
      </a>
    </span>
  );
}
