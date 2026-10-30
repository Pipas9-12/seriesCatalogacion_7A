import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mi Serie — Catálogo personal",
  description: "Organiza tus series, plataformas y valoraciones en un solo lugar.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
