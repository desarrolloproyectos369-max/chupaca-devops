import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trámites Documentarios | DevOps Chupaca",
  description: "Plataforma web bajo prácticas DevOps para optimizar la gestión de trámites documentarios en la Municipalidad Provincial de Chupaca.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body>
        <main className="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
