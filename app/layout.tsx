import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IKA Platform",
  description: "International Kempo Association digital platform.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
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
