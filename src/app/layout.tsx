import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "L9 Field Boss Alerts",
  description: "Field boss death timer and spawn tracker for Discord alerts.",
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
