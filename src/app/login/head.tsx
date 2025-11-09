const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ghostmate.online";

export default function LoginHead() {
  const title = "Sign in to GhostMate";
  const description =
    "Access GhostMate to connect anonymously, manage your daily ID, and jump back into private conversations.";
  const url = `${baseUrl}/login`;

  return (
    <>
      <title>{`${title} | GhostMate`}</title>
      <link rel="canonical" href={url} />
      <meta name="description" content={description} />
      <meta name="keywords" content="ghostmate login, anonymous chat sign in, daily id access" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="GhostMate" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </>
  );
}

