const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ghostmate.online";

export default function TrueAdminLoginHead() {
  const title = "GhostMate Admin Login";
  const description =
    "Authenticate with your GhostMate admin credentials to review queued stories, manage highlights, and perform maintenance safely.";
  const url = `${baseUrl}/trueadmin/login`;

  return (
    <>
      <title>{`${title} | GhostMate`}</title>
      <link rel="canonical" href={url} />
      <meta name="description" content={description} />
      <meta name="keywords" content="ghostmate admin login, moderation access, story approval login" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="GhostMate" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="robots" content="noindex, nofollow" />
    </>
  );
}

