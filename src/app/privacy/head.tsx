const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ghostmate.online";

export default function PrivacyHead() {
  const title = "GhostMate Privacy Policy";
  const description =
    "Learn how GhostMate protects your anonymity, handles daily IDs, and deletes chats every midnight for true privacy.";
  const url = `${baseUrl}/privacy`;

  return (
    <>
      <title>{`${title} | GhostMate`}</title>
      <link rel="canonical" href={url} />
      <meta name="description" content={description} />
      <meta name="keywords" content="ghostmate privacy policy, anonymous chat privacy, data retention" />
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

