import { useRef, useState } from "react";
import {
  Paperclip,
  Download,
  Trash2,
  FileText,
  ImageIcon,
  FileJson,
  File as FileIcon,
  ExternalLink,
  Loader2,
  Info,
} from "lucide-react";
import { useStore } from "@/lib/store/store";
import { formatBytes } from "@/lib/utils/format";
import { toast } from "@/components/ui/toast";
import { isCloudinaryConfigured, uploadToCloudinary } from "@/lib/integrations/cloudinary";
import type { Attachment } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

interface PendingUpload {
  id: string;
  name: string;
  pct: number;
}

function fileIcon(mime: string) {
  if (mime.startsWith("image/")) return <ImageIcon size={15} strokeWidth={2.1} />;
  if (mime.includes("json")) return <FileJson size={15} strokeWidth={2.1} />;
  if (mime.startsWith("text/")) return <FileText size={15} strokeWidth={2.1} />;
  return <FileIcon size={15} strokeWidth={2.1} />;
}

export function Attachments({ issueId }: { issueId: string }) {
  const allAttachments = useStore((s) => s.attachments);
  const attachments = allAttachments.filter((a) => a.issueId === issueId);
  const addAttachment = useStore((s) => s.addAttachment);
  const removeAttachment = useStore((s) => s.removeAttachment);
  const inputRef = useRef<HTMLInputElement>(null);
  const uid = useRef(0);
  const [drag, setDrag] = useState(false);
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const hosted = isCloudinaryConfigured();

  /**
   * Without credentials the file never leaves the tab: an object URL is good
   * enough to demo the row, but it dies on reload, so say so in the UI rather
   * than leaving a dead Download link behind.
   */
  const attach = async (file: File) => {
    if (!hosted) {
      addAttachment(issueId, {
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        url: URL.createObjectURL(file),
        source: "local",
      });
      return;
    }

    const id = `up_${(uid.current += 1)}`;
    setUploads((u) => [...u, { id, name: file.name, pct: 0 }]);
    try {
      const up = await uploadToCloudinary(file, (pct) =>
        setUploads((u) => u.map((x) => (x.id === id ? { ...x, pct } : x))),
      );
      addAttachment(issueId, {
        name: up.name,
        type: up.mimeType,
        size: up.sizeBytes,
        url: up.url,
        source: "cloudinary",
        externalId: up.publicId,
      });
    } catch (e) {
      toast.error(`${file.name}: ${e instanceof Error ? e.message : "upload failed"}`);
    } finally {
      setUploads((u) => u.filter((x) => x.id !== id));
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    for (const f of Array.from(files)) void attach(f);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
    >
      <div className="space-y-1.5">
        {attachments.map((a) => (
          <AttachmentRow key={a.id} a={a} onRemove={() => removeAttachment(a.id)} />
        ))}
        {uploads.map((u) => (
          <UploadingRow key={u.id} upload={u} />
        ))}
      </div>

      <input ref={inputRef} type="file" multiple hidden onChange={(e) => handleFiles(e.target.files)} />

      <div className="mt-2">
        <button
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex h-9 w-full items-center justify-center gap-1.5 rounded-[12px] border-[1.5px] border-dashed font-display text-[12.5px] font-semibold transition-colors",
            drag ? "border-accent bg-accent-soft text-accent" : "border-border-strong text-text-muted hover:border-text-subtle hover:bg-surface hover:text-text",
          )}
        >
          <Paperclip size={14} strokeWidth={2.25} /> {drag ? "Drop to attach" : "Upload"}
        </button>

        {!hosted && (
          <p className="mt-2 flex gap-1.5 text-[11.5px] leading-relaxed text-text-subtle">
            <Info size={12} className="mt-[3px] shrink-0" />
            <span>
              Files stay in this tab until{" "}
              <code className="font-mono text-[10.5px]">VITE_CLOUDINARY_CLOUD_NAME</code> and{" "}
              <code className="font-mono text-[10.5px]">VITE_CLOUDINARY_UPLOAD_PRESET</code> are set.
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

function UploadingRow({ upload }: { upload: PendingUpload }) {
  return (
    <div className="flex items-center gap-2.5 rounded-[12px] bg-surface p-1.5 pr-2.5 shadow-[inset_0_0_0_1px_var(--border)]">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-accent-soft text-accent">
        <Loader2 size={15} strokeWidth={2.25} className="animate-spin" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[12.5px] font-semibold text-text">{upload.name}</span>
        <span className="mt-1.5 block h-[4px] overflow-hidden rounded-full bg-surface-hover">
          <span
            className="block h-full rounded-full bg-accent transition-[width] duration-200"
            style={{ width: `${upload.pct}%` }}
          />
        </span>
      </span>
      <span className="shrink-0 font-display text-[11.5px] font-bold text-text-subtle">{upload.pct}%</span>
    </div>
  );
}

function AttachmentRow({ a, onRemove }: { a: Attachment; onRemove: () => void }) {
  const isHosted = a.source === "cloudinary";
  return (
    <div className="group relative flex items-center gap-2 rounded-[12px] bg-surface p-1.5 pr-2 shadow-[inset_0_0_0_1px_var(--border)] transition-shadow hover:shadow-[inset_0_0_0_1px_var(--border-strong)]">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-surface-2 text-text">{fileIcon(a.mimeType)}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[12.5px] font-semibold text-text">{a.filename}</span>
        <span className="block truncate font-display text-[11px] font-medium text-text-subtle">
          {formatBytes(a.size)}{isHosted ? " · Hosted" : ""}
        </span>
      </span>
      {/* Actions float over the row's end on hover, so they never squeeze the name */}
      <span className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded-[8px] bg-surface p-0.5 opacity-0 shadow-[var(--shadow-md)] transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
      {isHosted ? (
        // A cross-origin `download` attribute is ignored by browsers, so a
        // hosted file opens in a tab and the browser handles it from there.
        <a href={a.url} target="_blank" rel="noopener noreferrer" className="rounded-[6px] p-1 text-text-subtle hover:bg-surface-hover hover:text-text" aria-label="Open">
          <ExternalLink size={13} strokeWidth={2.25} />
        </a>
      ) : (
        <a href={a.url} download={a.filename} className="rounded-[6px] p-1 text-text-subtle hover:bg-surface-hover hover:text-text" aria-label="Download">
          <Download size={13} strokeWidth={2.25} />
        </a>
      )}
      <button onClick={onRemove} className="rounded-[6px] p-1 text-text-subtle hover:bg-danger-soft hover:text-danger" aria-label="Remove">
        <Trash2 size={13} strokeWidth={2.25} />
      </button>
      </span>
    </div>
  );
}
