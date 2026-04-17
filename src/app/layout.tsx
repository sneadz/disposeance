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
      <body className={font.className}>{children}</body>
    </html>
  );
}
