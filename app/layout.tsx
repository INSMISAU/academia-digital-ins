import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Academia Digital do INS",
  description: "Formação, aprendizagem e gestão institucional. Ambiente de desenvolvimento e demonstração.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-MZ">
      <body className="antialiased">{children}</body>
    </html>
  );
}
