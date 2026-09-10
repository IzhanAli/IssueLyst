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
import { Popover } from "@/components/ui/popover";
import { toast } from "@/components/ui/toast";
import { isDriveConfigured, pickFromDrive, demoDriveFile } from "@/lib/integrations/google-drive";
import type { Attachment } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

function DriveGlyph({ size = 14 }: { size?: number }) {
  // A drive-style triangular mark in three tones — evokes cloud storage
  // without reproducing any real product logo.
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
      <path d="M6 2h4l4 7h-4z" fill="#3f74b0" />
      <path d="M6 2L2 9l2 3 4-7z" fill="#2f7d55" />
      <path d="M4 12h8l-2 3H6z" fill="#b5791b" />
    </svg>
  );
}

function localIcon(mime: string) {
  if (mime.startsWith("image/")) return <ImageIcon size={14} />;
  if (mime.includes("json")) return <FileJson size={14} />;
  if (mime.startsWith("text/")) return <FileText size={14} />;
  return <FileIcon size={14} />;
}

function driveKind(mime: string): string {
  if (mime.includes("spreadsheet")) return "Sheet";
  if (mime.includes("presentation")) return "Slides";
  if (mime.includes("document")) return "Doc";
  if (mime.startsWith("image/")) return "Image";
  return "Drive file";
}

export function Attachments({ issueId }: { issueId: string }) {
  const allAttachments = useStore((s) => s.attachments);
  const attachments = allAttachments.filter((a) => a.issueId === issueId);
  const addAttachment = useStore((s) => s.addAttachment);
  const removeAttachment = useStore((s) => s.removeAttachment);
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    for (const f of Array.from(files)) {
      addAttachment(issueId, { name: f.name, type: f.type || "application/octet-stream", size: f.size, url: URL.createObjectURL(f), source: "local" });
    }
  };

  const attachDrivePicked = (files: ReturnType<typeof demoDriveFile>[]) => {
    files.forEach((f) =>
      addAttachment(issueId, { name: f.name, type: f.mimeType, size: f.sizeBytes, url: f.url, source: "drive", externalId: f.id, iconUrl: f.iconUrl }),
    );
    if (files.length) toast.success(`Attached ${files.length} file${files.length > 1 ? "s" : ""} from Drive`);
  };

  const openPicker = async () => {
    setBusy(true);
    try {
      const files = await pickFromDrive();
      attachDrivePicked(files);
    } catch (e) {
      toast.error(`Google Drive: ${e instanceof Error ? e.message : "could not open picker"}`);
    } finally {
      setBusy(false);
    }
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
      </div>

      <input ref={inputRef} type="file" multiple hidden onChange={(e) => handleFiles(e.target.files)} />

      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        <button
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-md border border-dashed py-1.5 text-[11.5px] transition-colors",
            drag ? "border-ring bg-primary-soft text-primary" : "border-border-strong text-text-subtle hover:border-text-subtle hover:text-text-muted",
          )}
        >
          <Paperclip size={13} /> {drag ? "Drop to attach" : "Upload"}
        </button>

        {isDriveConfigured() ? (
          <button
            onClick={openPicker}
            disabled={busy}
            className="flex items-center justify-center gap-1.5 rounded-md border border-border bg-surface py-1.5 text-[11.5px] text-text-muted transition-colors hover:bg-surface-hover hover:text-text disabled:opacity-60"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <DriveGlyph />} Drive
          </button>
        ) : (
          <DriveDemoButton onPick={() => attachDrivePicked([demoDriveFile()])} />
        )}
      </div>
    </div>
  );
}

function AttachmentRow({ a, onRemove }: { a: Attachment; onRemove: () => void }) {
  const isDrive = a.source === "drive";
  return (
    <div className="group flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-1.5">
      <span className="shrink-0 text-text-muted">
        {isDrive ? <DriveGlyph /> : localIcon(a.mimeType)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] text-text">{a.filename}</span>
        <span className="block font-mono text-[10px] text-text-subtle">
          {isDrive ? `Google Drive · ${driveKind(a.mimeType)}` : formatBytes(a.size)}
        </span>
      </span>
      {isDrive ? (
        <a href={a.url} target="_blank" rel="noopener noreferrer" className="rounded p-1 text-text-subtle opacity-0 transition-opacity hover:bg-surface-hover hover:text-text group-hover:opacity-100" aria-label="Open in Drive">
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

function DriveDemoButton({ onPick }: { onPick: () => void }) {
  return (
    <Popover
      placement="bottom-end"
      className="w-64 p-3"
      render={({ close }) => (
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-medium text-text">
            <DriveGlyph size={15} /> Google Drive
          </div>
          <p className="mb-2 flex gap-1.5 text-[11.5px] leading-relaxed text-text-muted">
            <Info size={13} className="mt-0.5 shrink-0 text-text-subtle" />
            Live Drive picker activates once <code className="font-mono text-[10.5px]">VITE_GOOGLE_CLIENT_ID</code> and <code className="font-mono text-[10.5px]">VITE_GOOGLE_API_KEY</code> are set.
          </p>
          <button
            onClick={() => { onPick(); close(); }}
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary py-1.5 text-[12px] font-medium text-primary-fg hover:bg-primary-hover"
          >
            <DriveGlyph size={13} /> Attach a sample Drive file
          </button>
        </div>
      )}
    >
      <button className="flex items-center justify-center gap-1.5 rounded-md border border-border bg-surface py-1.5 text-[11.5px] text-text-muted transition-colors hover:bg-surface-hover hover:text-text data-[state=open]:bg-surface-hover">
        <DriveGlyph /> Drive
      </button>
    </Popover>
  );
}
