import Script from "next/script";
import { THEME_KEY } from "@/lib/constants";

/**
 * Runs before hydration to set data-theme from storage (or system),
 * avoiding a flash of the wrong theme. `beforeInteractive` lets Next
 * inject it ahead of paint without the client-render script warning.
 */
export function ThemeScript() {
  const js = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');if(!t||t==='system'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;
  return (
    <Script id="projex-theme-init" strategy="beforeInteractive">
      {js}
    </Script>
  );
}
