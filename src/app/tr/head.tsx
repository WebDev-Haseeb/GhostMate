const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ghostmate.online";

export default function TurkishRedirectHead() {
  const title = "GhostMate Terms (Redirect)";
  const description =
    "Redirecting to the GhostMate Terms of Use. Review guidelines for anonymous conversations and community safety.";
  const url = `${baseUrl}/tr`;

  return (
    <>
      <title>{`${title} | GhostMate`}</title>
      <link rel="canonical" href={url} />
      <meta name="description" content={description} />
      <meta name="robots" content="noindex, follow" />
      <meta property="og:url" content={url} />
    </>
  );
}

