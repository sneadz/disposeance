import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const font = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "DispoSéance",
  description: "Organisez votre prochaine sortie ciné avec vos amis",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo:ital,wght@0,400..900;1,400..900&family=Archivo+Expanded:wght@600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className={font.className}>{children}</body>
    </html>
  );
}
