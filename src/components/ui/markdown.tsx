import { Fragment } from "react";

/** Minimal, safe markdown: **bold**, `code`, - bullets, and line breaks. No HTML passthrough. */
export function Markdown({ text, className }: { text: string; className?: string }) {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];

  const flush = (key: number) => {
    if (list.length) {
      blocks.push(
        <ul key={`ul-${key}`} className="my-1.5 ml-4 list-disc space-y-0.5 marker:text-text-subtle">
          {list.map((li, i) => (
            <li key={i}>{inline(li)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };

  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    if (/^\s*[-*]\s+/.test(line)) {
      list.push(line.replace(/^\s*[-*]\s+/, ""));
      return;
    }
    flush(i);
    if (line.trim() === "") {
      blocks.push(<div key={`sp-${i}`} className="h-2" />);
    } else if (/^#{1,3}\s/.test(line)) {
      blocks.push(
        <div key={`h-${i}`} className="mt-2 text-[13.5px] font-semibold text-text">
          {inline(line.replace(/^#{1,3}\s/, ""))}
        </div>,
      );
    } else {
      blocks.push(
        <p key={`p-${i}`} className="leading-relaxed">
          {inline(line)}
        </p>,
      );
    }
  });
  flush(lines.length);

  return <div className={className}>{blocks}</div>;
}

function inline(text: string): React.ReactNode {
  // split on `code` and **bold**
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return <strong key={i} className="font-semibold text-text">{p.slice(2, -2)}</strong>;
    }
    if (p.startsWith("`") && p.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[11.5px] text-text">
          {p.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={i}>{p}</Fragment>;
  });
}
