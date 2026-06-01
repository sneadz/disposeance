import type { Metadata } from "next";
import { Space_Grotesk, Anton, Archivo } from "next/font/google";
import "./globals.css";

const font = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DispoSéance",
  description: "Organisez votre prochaine sortie ciné avec vos amis",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${anton.variable} ${archivo.variable}`}>
      <body className={font.className}>{children}</body>
    </html>
  );
}
