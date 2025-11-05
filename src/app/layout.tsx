import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#1a1a2e",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://ghostmate.online'),
  title: {
    default: "GhostMate - Anonymous Conversations, Real Connections",
    template: "%s | GhostMate"
  },
  description: "Connect anonymously, chat freely, and disappear daily. GhostMate keeps your identity safe while you explore genuine human connections.",
  keywords: ["anonymous chat", "daily ID chat", "secure conversations", "anonymous messaging", "ghostmate", "private chat", "ephemeral messaging"],
  authors: [{ name: "GhostMate" }],
  creator: "GhostMate",
  publisher: "GhostMate",
  applicationName: "GhostMate",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GhostMate",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "GhostMate",
    title: "GhostMate - Anonymous Conversations, Real Connections",
    description: "Connect anonymously, chat freely, and disappear daily. GhostMate keeps your identity safe while you explore genuine human connections.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "GhostMate - Anonymous Conversations, Real Connections",
    description: "Connect anonymously, chat freely, and disappear daily. GhostMate keeps your identity safe while you explore genuine human connections.",
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
