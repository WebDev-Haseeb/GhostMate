import type { Metadata, Viewport } from "next";
import { Space_Grotesk, DM_Sans, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

// Display font for headings - Bold, modern, tech-forward
const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Body font - Clean, readable, friendly
const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

// Monospace font for IDs and code
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
      { url: "/favicon.svg", type: "image/svg+xml" },
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
      <body className={`${spaceGrotesk.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
