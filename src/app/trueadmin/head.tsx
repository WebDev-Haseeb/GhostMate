const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ghostmate.online";

export default function TrueAdminHead() {
  const title = "GhostMate Admin Console";
  const description =
    "Manage highlighted stories, run maintenance actions, and monitor GhostMate health from the secure admin console.";
  const url = `${baseUrl}/trueadmin`;

  return (
    <>
      <title>{`${title} | GhostMate`}</title>
      <link rel="canonical" href={url} />
      <meta name="description" content={description} />
      <meta
        name="keywords"
        content="ghostmate admin, moderation dashboard, story approvals, maintenance console"
      />
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

