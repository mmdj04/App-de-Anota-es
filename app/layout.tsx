import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { PwaRegister } from "./pwa-register";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "Minhas Anotações",
  description: "Um lugar simples para guardar o que é importante.",
  manifest: "/manifest.webmanifest",
  themeColor: "#b86f82",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
