import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Video Browser",
  description:
    "Browse and filter music videos by title, artist, year and genre.",
};

interface RootLayoutProps {
  readonly children: React.ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps): React.ReactNode {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} h-full font-sans antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
