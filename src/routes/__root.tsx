import type { ReactNode } from "react";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { ThemeScript } from "@/components/theme/theme-script";
import { ToastViewport } from "@/components/ui/toast";
import fontsCss from "@/styles/fonts.css?url";
import globalsCss from "@/styles/globals.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "IssueLyst — Issue Tracker" },
      {
        name: "description",
        content:
          "A focused, desktop-grade issue tracker for engineering teams.",
      },
    ],
    links: [
      { rel: "stylesheet", href: fontsCss },
      { rel: "stylesheet", href: globalsCss },
      { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
      { rel: "icon", type: "image/png", href: "/favicon-96x96.png", sizes: "96x96" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      { rel: "manifest", href: "/site.webmanifest" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* First thing in the document: sets data-theme before any paint. */}
        <ThemeScript />
        <HeadContent />
      </head>
      <body className="antialiased">
        {children}
        <ToastViewport />
        <Scripts />
      </body>
    </html>
  );
}
