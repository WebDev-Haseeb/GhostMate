import type { Metadata } from "next";
import HomePageClient from "@/components/pages/HomePageClient";

const BASE_TITLE = "GhostMate - Anonymous Conversations, Real Connections";
const BASE_DESCRIPTION =
  "Connect anonymously, chat freely, and disappear daily. GhostMate keeps your identity safe while you explore genuine human connections.";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://ghostmate.online";

export const metadata: Metadata = {
  title: {
    default: BASE_TITLE,
    template: "%s | GhostMate",
  },
  description: BASE_DESCRIPTION,
  openGraph: {
    title: BASE_TITLE,
    description: BASE_DESCRIPTION,
    type: "website",
    siteName: "GhostMate",
  },
  twitter: {
    card: "summary_large_image",
    title: BASE_TITLE,
    description: BASE_DESCRIPTION,
  },
};

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "GhostMate",
    url: BASE_URL,
    applicationCategory: "CommunicationApplication",
    description: BASE_DESCRIPTION,
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    inLanguage: "en",
    creator: {
      "@type": "Organization",
      name: "GhostMate",
      url: BASE_URL,
    },
    featureList: [
      "Anonymous daily IDs that reset at midnight PKT",
      "Ephemeral chat history and highlights",
      "Realtime online presence",
      "Story highlights curated by admins",
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HomePageClient />
    </>
  );
}