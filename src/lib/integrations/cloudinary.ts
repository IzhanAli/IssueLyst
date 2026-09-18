/**
 * Cloudinary attachment pipeline (client-side, no backend required).
 *
 * Files go straight from the browser to Cloudinary through an *unsigned*
 * upload preset, so no API secret and no generated signature ever reach the
 * client. Configure with public env vars:
 *   VITE_CLOUDINARY_CLOUD_NAME     cloud name from the Cloudinary console
 *   VITE_CLOUDINARY_UPLOAD_PRESET  an unsigned upload preset
 *
 * Both are public by design — an unsigned preset is meant to be readable in
 * the bundle. That also means the preset *is* the security boundary: cap the
 * allowed formats and max file size on the preset itself, because anyone who
 * reads the bundle can post to it.
 *
 * When unset, `isCloudinaryConfigured()` returns false and the UI falls back
 * to an in-browser object URL, so the pipeline stays demonstrable before any
 * credentials exist — but those URLs die with the tab.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? "";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ?? "";

/** `auto` lets one endpoint take images, video and arbitrary (`raw`) files. */
const ENDPOINT = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

export interface UploadedFile {
  name: string;
  mimeType: string;
  sizeBytes: number;
  /** Permanent https URL — survives reloads, unlike an object URL. */
  url: string;
  /** Cloudinary public_id, kept so the asset can be addressed later. */
  publicId: string;
}

/** The subset of Cloudinary's upload response this app relies on. */
interface UploadResponse {
  secure_url?: string;
  public_id?: string;
  bytes?: number;
  error?: { message?: string };
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(CLOUD_NAME && UPLOAD_PRESET);
}

/**
 * Uploads one file and resolves with its hosted location.
 *
 * XHR rather than fetch: only XHR reports upload progress, and attachments
 * are big enough that a progress bar is worth the older API.
 */
export async function uploadToCloudinary(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<UploadedFile> {
  if (!isCloudinaryConfigured()) throw new Error("Cloudinary is not configured");

  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", UPLOAD_PRESET);

  return new Promise<UploadedFile>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", ENDPOINT);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));

    xhr.onload = () => {
      let payload: UploadResponse;
      try {
        payload = JSON.parse(xhr.responseText) as UploadResponse;
      } catch {
        return reject(new Error(`Unexpected response (${xhr.status})`));
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        return reject(new Error(payload.error?.message ?? `Upload failed (${xhr.status})`));
      }
      if (!payload.secure_url || !payload.public_id) {
        return reject(new Error("Upload succeeded but returned no file URL"));
      }
      resolve({
        // Prefer the local name: Cloudinary sanitises `original_filename`
        // and drops the extension on raw uploads.
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: Number(payload.bytes ?? file.size),
        url: payload.secure_url,
        publicId: payload.public_id,
      });
    };

    xhr.send(body);
  });
}
