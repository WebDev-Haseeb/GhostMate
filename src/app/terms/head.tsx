const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ghostmate.online";

export default function TermsHead() {
  const title = "GhostMate Terms of Use";
  const description =
    "Review the GhostMate terms covering community guidelines, acceptable use, and responsibilities for anonymous conversations.";
  const url = `${baseUrl}/terms`;

  return (
    <>
      <title>{`${title} | GhostMate`}</title>
      <link rel="canonical" href={url} />
      <meta name="description" content={description} />
      <meta name="keywords" content="ghostmate terms, anonymous chat rules, acceptable use policy" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="article" />
      <meta property="og:site_name" content="GhostMate" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </>
  );
}

