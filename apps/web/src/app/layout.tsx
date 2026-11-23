import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Stack Plus Studio - SaaS Futsal & Mini Soccer",
  description: "Platform Manajemen Venue, Pemesanan Lapangan & Matchmaking Komunitas Futsal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={inter.className}>
        {children}
        <Toaster position="top-center" reverseOrder={false} />
        {/* Midtrans Snap JS SDK (Sandbox mode by default) */}
        <Script
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key={
            process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ||
            "SB-Mid-client-placeholder"
          }
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}