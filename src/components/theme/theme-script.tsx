import { THEME_KEY } from "@/lib/constants";

const js = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');if(!t||t==='system'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

/**
 * Sets `data-theme` from storage before first paint, avoiding a flash of the
 * wrong theme. Rendered as the first child of `<head>` in the root route, so
 * the parser executes it ahead of the stylesheets and body — the same
 * guarantee Next's `beforeInteractive` strategy gave.
 */
export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
