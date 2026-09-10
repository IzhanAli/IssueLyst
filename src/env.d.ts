/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Google OAuth 2.0 web client id — enables the real Drive picker. */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** Browser API key with the Picker API enabled. */
  readonly VITE_GOOGLE_API_KEY?: string;
  /** Optional Cloud project number, for per-app Drive file scoping. */
  readonly VITE_GOOGLE_APP_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
