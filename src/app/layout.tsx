import type { Metadata } from "next";
import { Roboto, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "@/components/theme/theme-script";
import { ToastViewport } from "@/components/ui/toast";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "700", "900"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Projex — Issue Tracker",
  description: "A focused, desktop-grade issue tracker for engineering teams.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${roboto.variable} ${plexMono.variable} antialiased`}>
        <ThemeScript />
        {children}
        <ToastViewport />
      </body>
    </html>
  );
}
