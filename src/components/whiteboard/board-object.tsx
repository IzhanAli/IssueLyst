import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import type { ShapeObject, User, WhiteboardObject } from "@/lib/types";
import { relativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { FILL, INK, INK_LINE, INK_WIDTH, SELECTION_RING, STICKY_SHADOW, TEXT_SIZE } from "./constants";

export interface ObjectHandlers {
  onPointerDown: (e: React.PointerEvent, obj: WhiteboardObject) => void;
  onDoubleClick: (obj: WhiteboardObject) => void;
  onContextMenu: (e: React.MouseEvent, obj: WhiteboardObject) => void;
  onCommitText: (id: string, value: string) => void;
}

/** "2h ago" → "2h", the way a sticky signs itself. */
function compactAgo(iso: string) {
  const s = relativeTime(iso);
  return s === "just now" ? "now" : s.replace(/ ago$/, "");
}

/** One object on the sheet. Coordinates are sheet pixels; the sheet applies zoom. */
export function BoardObject({
  obj,
  selected,
  editing,
  grabbable,
  author,
  handlers,
}: {
  obj: WhiteboardObject;
  selected: boolean;
  editing: boolean;
  /** true while the select tool is active */
  grabbable: boolean;
  author?: User;
  handlers: ObjectHandlers;
}) {
  const onPointerDown = (e: React.PointerEvent) => handlers.onPointerDown(e, obj);
  const onDoubleClick = () => handlers.onDoubleClick(obj);
  const onContextMenu = (e: React.MouseEvent) => handlers.onContextMenu(e, obj);
  const commit = (value: string) => handlers.onCommitText(obj.id, value);
  const cursor = grabbable ? "grab" : undefined;
  const ring = selected ? SELECTION_RING : undefined;

  switch (obj.kind) {
    case "sticky":
      return (
        <div
          data-wb-object={obj.id}
          onPointerDown={onPointerDown}
          onDoubleClick={onDoubleClick}
          onContextMenu={onContextMenu}
          className="absolute box-border flex flex-col gap-2 rounded-[4px] p-[15px] text-[19px] leading-[1.3] text-text"
          style={{
            left: obj.x,
            top: obj.y,
            width: obj.w,
            minHeight: obj.h,
            background: FILL[obj.color],
            transform: `rotate(${obj.rotation}deg)`,
            boxShadow: ring ?? STICKY_SHADOW,
            cursor,
          }}
        >
          <div className="flex-1 whitespace-pre-wrap break-words">
            {editing ? (
              <TextEditor initial={obj.text} placeholder="New note" onCommit={commit} />
            ) : (
              obj.text || <span className="text-text-subtle">New note</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {author && <Avatar user={author} className="h-[22px] w-[22px] text-[10px]" />}
            <span className="font-mono text-[12.5px] text-text-muted">{compactAgo(obj.createdAt)}</span>
          </div>
        </div>
      );

    case "text":
      return (
        <div
          data-wb-object={obj.id}
          onPointerDown={onPointerDown}
          onDoubleClick={onDoubleClick}
          onContextMenu={onContextMenu}
          className="absolute box-border whitespace-pre-wrap break-words rounded-[5px] px-[5px] py-[3px] leading-[1.3] tracking-[-0.01em]"
          style={{
            left: obj.x,
            top: obj.y,
            width: obj.w,
            fontSize: TEXT_SIZE[obj.size],
            fontWeight: obj.weight,
            color: INK[obj.color],
            boxShadow: ring,
            cursor,
          }}
        >
          {editing ? <TextEditor initial={obj.text} placeholder="Type here" onCommit={commit} /> : obj.text}
        </div>
      );

    case "shape":
      if (obj.shape === "ellipse") {
        return (
          <svg
            className="pointer-events-none absolute overflow-visible"
            style={{ left: obj.x, top: obj.y }}
            width={obj.w}
            height={obj.h}
          >
            {selected && (
              <path
                d={ellipsePath(obj)}
                fill="none"
                stroke="var(--primary)"
                strokeOpacity={0.2}
                strokeWidth={10}
                strokeLinejoin="round"
              />
            )}
            {/* painted area only: a click in the box's corners, outside the ellipse, reaches what's underneath */}
            <path
              d={ellipsePath(obj)}
              data-wb-object={obj.id}
              onPointerDown={onPointerDown}
              onContextMenu={onContextMenu}
              fill={FILL[obj.color]}
              stroke={selected ? "var(--primary)" : "var(--border-strong)"}
              strokeWidth={selected ? 3 : 2}
              strokeLinejoin="round"
              style={{ pointerEvents: "visiblePainted", cursor }}
            />
          </svg>
        );
      }
      return (
        <div
          data-wb-object={obj.id}
          onPointerDown={onPointerDown}
          onContextMenu={onContextMenu}
          className="absolute box-border rounded-[12px] border-2 border-border-strong"
          style={{
            left: obj.x,
            top: obj.y,
            width: obj.w,
            height: obj.h,
            background: FILL[obj.color],
            boxShadow: ring,
            cursor,
          }}
        />
      );

    case "ellipse": {
      const shape = {
        cx: obj.w / 2,
        cy: obj.h / 2,
        rx: Math.max(obj.w / 2 - 1, 0),
        ry: Math.max(obj.h / 2 - 1, 0),
      };
      return (
        <svg
          className="pointer-events-none absolute overflow-visible"
          style={{ left: obj.x, top: obj.y }}
          width={obj.w}
          height={obj.h}
        >
          {selected && <ellipse {...shape} fill="none" stroke="var(--primary)" strokeOpacity={0.2} strokeWidth={10} />}
          <ellipse {...shape} fill="none" stroke="var(--primary)" strokeWidth={selected ? 3 : 2} />
          {/* Hit area is the outline only, so notes inside the ring stay clickable. */}
          <ellipse
            {...shape}
            data-wb-object={obj.id}
            onPointerDown={onPointerDown}
            onContextMenu={onContextMenu}
            fill="none"
            stroke="transparent"
            strokeWidth={16}
            style={{ pointerEvents: "stroke", cursor }}
          />
        </svg>
      );
    }

    case "image":
      return (
        <div
          data-wb-object={obj.id}
          onPointerDown={onPointerDown}
          onDoubleClick={onDoubleClick}
          onContextMenu={onContextMenu}
          className="absolute box-border flex items-end rounded-[5px] p-2.5"
          style={{
            left: obj.x,
            top: obj.y,
            width: obj.w,
            height: obj.h,
            backgroundColor: "var(--surface-2)",
            backgroundImage: "repeating-linear-gradient(135deg, var(--surface-hover) 0 6px, var(--surface-2) 6px 12px)",
            boxShadow: ring,
            cursor,
          }}
        >
          <span
            className={cn(
              "max-w-full rounded bg-surface px-1.5 py-[3px] font-mono text-[14px] text-text-muted",
              editing && "min-w-[190px]",
            )}
          >
            {editing ? <TextEditor initial={obj.caption} placeholder="Caption" onCommit={commit} /> : obj.caption}
          </span>
        </div>
      );

    case "ink":
      return (
        <svg
          className="pointer-events-none absolute overflow-visible"
          style={{ left: obj.x, top: obj.y }}
          width={Math.max(obj.w, 1)}
          height={Math.max(obj.h, 1)}
        >
          {selected && (
            <path d={obj.d} {...INK_LINE} stroke="var(--primary)" strokeOpacity={0.25} strokeWidth={INK_WIDTH[obj.size] + 7} />
          )}
          <path d={obj.d} {...INK_LINE} stroke={INK[obj.color]} strokeWidth={INK_WIDTH[obj.size]} />
          <path
            d={obj.d}
            {...INK_LINE}
            data-wb-object={obj.id}
            onPointerDown={onPointerDown}
            onContextMenu={onContextMenu}
            stroke="transparent"
            strokeWidth={INK_WIDTH[obj.size] + 12}
            style={{ pointerEvents: "stroke", cursor }}
          />
        </svg>
      );
  }
}

/** An ellipse filling the shape's box, inset so its 2px stroke stays inside. */
function ellipsePath({ w, h }: ShapeObject) {
  const rx = Math.max(w / 2 - 1, 0);
  const ry = Math.max(h / 2 - 1, 0);
  return `M ${w / 2 - rx} ${h / 2} A ${rx} ${ry} 0 1 0 ${w / 2 + rx} ${h / 2} A ${rx} ${ry} 0 1 0 ${w / 2 - rx} ${h / 2} Z`;
}

/**
 * In-place text editing. Commits once, on blur; Escape and ⌘↵ blur. The
 * canvas blurs it by hand when a gesture starts elsewhere, since canvas
 * pointerdowns call preventDefault and so never move focus themselves.
 */
function TextEditor({
  initial,
  placeholder,
  onCommit,
}: {
  initial: string;
  placeholder: string;
  onCommit: (value: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(initial);
  const committed = useRef(false);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  // Grow with the text rather than scroll inside the note.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  const commit = () => {
    if (committed.current) return;
    committed.current = true;
    onCommit(value);
  };

  return (
    <textarea
      ref={ref}
      value={value}
      rows={1}
      placeholder={placeholder}
      aria-label="Edit text"
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      // the browser's own menu (copy, paste, spelling) while editing
      onContextMenu={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === "Escape" || (e.key === "Enter" && (e.metaKey || e.ctrlKey))) {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.blur();
        }
      }}
      className="block w-full select-text resize-none overflow-hidden border-0 bg-transparent p-0 placeholder:text-text-subtle focus:outline-none"
      style={{ font: "inherit", letterSpacing: "inherit", lineHeight: "inherit", color: "inherit" }}
    />
  );
}
