import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";
import { GrainOverlay } from "@/components/GrainOverlay";

const neutral = localFont({
  src: "./fonts/NeutralFace.woff",
  variable: "--font-neutral",
  display: "optional",
});
const nonBureau = localFont({
  src: "./fonts/NonBureau-Regular.otf",
  variable: "--font-nonbureau",
  display: "optional",
});
const geologica = localFont({
  src: "./fonts/Geologica.ttf",
  variable: "--font-geologica",
  display: "optional",
});

export const metadata: Metadata = {
  title: "HPL // VISUAL RESEARCH",
  description: "Portfolio of Matvey Lukin — visual research, 3D, branding and creative coding.",
  metadataBase: new URL("https://hhppll.online"),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ru"
      className={`${neutral.variable} ${nonBureau.variable} ${geologica.variable}`}
    >
      <body>
        <LanguageProvider>
          <GrainOverlay />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
