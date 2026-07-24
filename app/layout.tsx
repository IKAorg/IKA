import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IKA Platform",
  description: "International Kempo Association digital platform.",
  icons: {
    icon: "/images/ika-logo.webp",
    shortcut: "/images/ika-logo.webp",
    apple: "/images/ika-logo.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
