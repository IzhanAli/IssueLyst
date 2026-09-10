/**
 * Google Drive attachment pipeline (client-side, no backend required).
 *
 * Uses Google Identity Services for the OAuth token and the Google Picker
 * API to let the user choose files. Configure with public env vars:
 *   VITE_GOOGLE_CLIENT_ID   OAuth 2.0 Web client id
 *   VITE_GOOGLE_API_KEY     Browser API key (Picker API enabled)
 *   VITE_GOOGLE_APP_ID      (optional) Cloud project number
 *
 * When unset, `isDriveConfigured()` returns false and the UI offers a
 * demo flow instead — so the pipeline is fully wired and demonstrable
 * before real credentials exist.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY ?? "";
const APP_ID = import.meta.env.VITE_GOOGLE_APP_ID ?? "";
const SCOPE = "https://www.googleapis.com/auth/drive.readonly";

export interface DrivePickedFile {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  iconUrl?: string;
}

export function isDriveConfigured(): boolean {
  return Boolean(CLIENT_ID && API_KEY);
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const el = document.createElement("script");
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(el);
  });
}

let pickerReady: Promise<void> | null = null;
function ensurePicker(): Promise<void> {
  if (pickerReady) return pickerReady;
  pickerReady = (async () => {
    await loadScript("https://apis.google.com/js/api.js");
    await new Promise<void>((resolve) => (window as any).gapi.load("picker", resolve));
    await loadScript("https://accounts.google.com/gsi/client");
  })();
  return pickerReady;
}

function requestToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (resp: any) => {
        if (resp?.access_token) resolve(resp.access_token);
        else reject(new Error(resp?.error ?? "Authorization was cancelled"));
      },
    });
    client.requestAccessToken({ prompt: "" });
  });
}

/** Opens the Google Picker and resolves with the chosen files (or [] if cancelled). */
export async function pickFromDrive(): Promise<DrivePickedFile[]> {
  if (!isDriveConfigured()) throw new Error("Google Drive is not configured");
  await ensurePicker();
  const token = await requestToken();
  const google = (window as any).google;

  return new Promise<DrivePickedFile[]>((resolve) => {
    const view = new google.picker.DocsView(google.picker.ViewId.DOCS)
      .setIncludeFolders(true)
      .setSelectFolderEnabled(false);

    const builder = new google.picker.PickerBuilder()
      .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
      .setDeveloperKey(API_KEY)
      .setOAuthToken(token)
      .addView(view)
      .addView(new google.picker.DocsUploadView())
      .setCallback((data: any) => {
        if (data.action === google.picker.Action.PICKED) {
          const files: DrivePickedFile[] = (data.docs ?? []).map((d: any) => ({
            id: d.id,
            name: d.name,
            mimeType: d.mimeType,
            sizeBytes: Number(d.sizeBytes ?? 0),
            url: d.url,
            iconUrl: d.iconUrl,
          }));
          resolve(files);
        } else if (data.action === google.picker.Action.CANCEL) {
          resolve([]);
        }
      });

    if (APP_ID) builder.setAppId(APP_ID);
    builder.build().setVisible(true);
  });
}

/** A realistic sample Drive file for the demo flow when creds are absent. */
export function demoDriveFile(): DrivePickedFile {
  const samples = [
    { name: "Repro steps & logs", mimeType: "application/vnd.google-apps.document" },
    { name: "Design spec v3", mimeType: "application/vnd.google-apps.document" },
    { name: "Perf trace.csv", mimeType: "text/csv" },
    { name: "Crash screenshot", mimeType: "image/png" },
    { name: "QA checklist", mimeType: "application/vnd.google-apps.spreadsheet" },
  ];
  const s = samples[Math.floor(Math.random() * samples.length)];
  const id = `demo-${Math.random().toString(36).slice(2, 9)}`;
  return { id, name: s.name, mimeType: s.mimeType, sizeBytes: 0, url: `https://drive.google.com/file/d/${id}/view` };
}
