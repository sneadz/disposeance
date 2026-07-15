import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Anton, Archivo, Cinzel } from "next/font/google";
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

const cinzel = Cinzel({
  weight: ["500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DispoSéance",
  description: "Organisez votre prochaine sortie ciné avec vos amis",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1a1e",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${anton.variable} ${archivo.variable} ${cinzel.variable} bg-base`}>
      <body className={`${font.className} bg-base`}>{children}</body>
    </html>
  );
}
