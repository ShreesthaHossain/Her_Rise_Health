type Article = {
  title_en: string;
  title_bn: string;
  body_en: string;
  topic: string;
  sources: { citation: string; url: string }[];
};

async function loadArticle(slug: string): Promise<Article | null> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  try {
    const response = await fetch(`${base}/api/v1/articles/${slug}`, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as Article;
  } catch {
    return null;
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await loadArticle(slug);
  if (!article) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl">Article unavailable</h1>
        <p className="mt-3 text-muted">This slug is not a published article, or the API is not running.</p>
      </section>
    );
  }
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-xs tracking-wide text-plum uppercase">{article.topic}</p>
      <h1 className="mt-2 text-4xl">{article.title_en}</h1>
      <p className="mt-2 text-muted">{article.title_bn}</p>
      <div className="mt-6 grid gap-4 leading-relaxed">
        {article.body_en.split("\n\n").map((paragraph) => (
          <p key={paragraph.slice(0, 32)}>{paragraph}</p>
        ))}
      </div>
      <h2 className="mt-8 text-lg">Sources</h2>
      <ul className="mt-2 grid gap-2 text-sm">
        {article.sources.map((source) => (
          <li key={source.url}>
            <a className="text-plum underline" href={source.url}>
              {source.citation}
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-muted">HerRise does not diagnose and does not recommend medicine.</p>
    </article>
  );
}
