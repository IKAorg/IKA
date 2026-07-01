import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IKA Platform",
  description: "International Kempo Association digital platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
