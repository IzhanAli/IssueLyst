/// <reference types="vite/client" />

/** True when DATABASE_URL was set at build time — see vite.config.ts. */
declare const __DB_CONFIGURED__: boolean;

interface ImportMetaEnv {
  /** Cloudinary cloud name — with the preset below, enables hosted uploads. */
  readonly VITE_CLOUDINARY_CLOUD_NAME?: string;
  /** An *unsigned* Cloudinary upload preset; public by design. */
  readonly VITE_CLOUDINARY_UPLOAD_PRESET?: string;
  /** POST target for the landing page's "Request access" form. */
  readonly VITE_REQUEST_ACCESS_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
