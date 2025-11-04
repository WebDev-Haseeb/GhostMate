import styles from "./page.module.css";

// Structured Data for SEO
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "GhostMate",
  "description": "Connect anonymously, chat freely, and disappear daily. GhostMate keeps your identity safe while you explore genuine human connections.",
  "applicationCategory": "SocialNetworkingApplication",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "100"
  }
};

export default function Home() {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.intro}>
            <h1>GhostMate</h1>
            <p>Anonymous Conversations, Real Connections</p>
            <p className={styles.tagline}>
              Connect anonymously, chat freely, and disappear daily.
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
