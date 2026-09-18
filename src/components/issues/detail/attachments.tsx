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
  if (mime.startsWith("image/")) return <ImageIcon size={14} />;
  if (mime.includes("json")) return <FileJson size={14} />;
  if (mime.startsWith("text/")) return <FileText size={14} />;
  return <FileIcon size={14} />;
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
      <div className="space-y-1">
        {attachments.map((a) => (
          <AttachmentRow key={a.id} a={a} onRemove={() => removeAttachment(a.id)} />
        ))}
        {uploads.map((u) => (
          <UploadingRow key={u.id} upload={u} />
        ))}
      </div>

      <input ref={inputRef} type="file" multiple hidden onChange={(e) => handleFiles(e.target.files)} />

      <div className="mt-1.5">
        <button
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed py-1.5 text-[11.5px] transition-colors",
            drag ? "border-ring bg-primary-soft text-primary" : "border-border-strong text-text-subtle hover:border-text-subtle hover:text-text-muted",
          )}
        >
          <Paperclip size={13} /> {drag ? "Drop to attach" : "Upload"}
        </button>

        {!hosted && (
          <p className="mt-1.5 flex gap-1.5 text-[11px] leading-relaxed text-text-subtle">
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
    <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-1.5">
      <Loader2 size={14} className="shrink-0 animate-spin text-text-subtle" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] text-text">{upload.name}</span>
        <span className="mt-1 block h-[3px] overflow-hidden rounded-full bg-surface-hover">
          <span
            className="block h-full rounded-full bg-primary transition-[width] duration-200"
            style={{ width: `${upload.pct}%` }}
          />
        </span>
      </span>
      <span className="shrink-0 font-mono text-[10px] text-text-subtle">{upload.pct}%</span>
    </div>
  );
}

function AttachmentRow({ a, onRemove }: { a: Attachment; onRemove: () => void }) {
  const isHosted = a.source === "cloudinary";
  return (
    <div className="group flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-1.5">
      <span className="shrink-0 text-text-muted">{fileIcon(a.mimeType)}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] text-text">{a.filename}</span>
        <span className="block font-mono text-[10px] text-text-subtle">
          {formatBytes(a.size)}{isHosted ? " · Hosted" : ""}
        </span>
      </span>
      {isHosted ? (
        // A cross-origin `download` attribute is ignored by browsers, so a
        // hosted file opens in a tab and the browser handles it from there.
        <a href={a.url} target="_blank" rel="noopener noreferrer" className="rounded p-1 text-text-subtle opacity-0 transition-opacity hover:bg-surface-hover hover:text-text group-hover:opacity-100" aria-label="Open">
          <ExternalLink size={12} />
        </a>
      ) : (
        <a href={a.url} download={a.filename} className="rounded p-1 text-text-subtle opacity-0 transition-opacity hover:bg-surface-hover hover:text-text group-hover:opacity-100" aria-label="Download">
          <Download size={12} />
        </a>
      )}
      <button onClick={onRemove} className="rounded p-1 text-text-subtle opacity-0 transition-opacity hover:bg-danger-soft hover:text-danger group-hover:opacity-100" aria-label="Remove">
        <Trash2 size={12} />
      </button>
    </div>
  );
}
