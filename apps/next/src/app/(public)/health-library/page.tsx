import Link from "next/link";

type Article = { slug: string; title_en: string; title_bn: string; topic: string };

async function loadArticles(): Promise<Article[]> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  try {
    const response = await fetch(`${base}/api/v1/articles`, { cache: "no-store" });
    if (!response.ok) return [];
    return (await response.json()) as Article[];
  } catch {
    return [];
  }
}

export default async function LibraryPage() {
  const articles = await loadArticles();
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-16 md:px-8">
      <h1 className="text-4xl">Health Library</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Published articles appear here after review. Nothing is invented to fill this list.
      </p>
      {articles.length === 0 ? (
        <p className="mt-8 rounded-3xl bg-surface p-6 text-sm text-muted ring-1 ring-line">
          No published article was returned. Start the API on port 8000 if you expect the reviewed seed article.
        </p>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {articles.map((article) => (
            <Link key={article.slug} href={`/health-library/${article.slug}`} className="rounded-3xl bg-surface p-6 ring-1 ring-line">
              <p className="text-xs tracking-wide text-plum uppercase">{article.topic}</p>
              <h2 className="mt-2 text-2xl">{article.title_en}</h2>
              <p className="mt-1 text-sm text-muted">{article.title_bn}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
