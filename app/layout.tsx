import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LMCS Member Assistant",
  description:
    "A proof-of-concept AI member assistant for Lion Multipurpose Cooperative Society.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
