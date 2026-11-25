import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BookOpen, MapPin, MessageCircle, CalendarDays, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NextSteps } from "../page-links";
import { api } from "../api";
import { text, type Locale } from "../i18n";
import { useSession } from "../session";

type Article = { slug: string; title_bn: string; title_en: string; topic: string };

function title(locale: Locale, article: Article) {
  return locale === "bn" ? article.title_bn : article.title_en;
}

export function HomePage() {
  const { locale, user } = useSession();
  const [articles, setArticles] = useState(0);
  const [lead, setLead] = useState<Article | null>(null);
  const [facilities, setFacilities] = useState(0);

  useEffect(() => {
    void api<Article[]>("/api/v1/articles").then((rows) => {
      setArticles(rows.length);
      setLead(rows[0] ?? null);
    });
    void api<{ id: string }[]>("/api/v1/facilities?district=Dhaka").then((rows) => setFacilities(rows.length));
  }, []);

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 xl:grid-cols-5">
        <section className="relative min-h-60 overflow-hidden rounded-[1.6rem] xl:col-span-3">
          <div className="absolute inset-0 bg-linear-to-br from-[#2f5481] via-[#4e7da6] to-[#91b7d9]" />
          <div className="absolute -bottom-10 -left-6 h-32 w-[120%] rounded-[50%] bg-[#1e3a5c]/35" />
          <div className="absolute right-[-10%] -bottom-16 h-40 w-[80%] rounded-[50%] bg-white/25" />
          <div className="relative flex h-full flex-col justify-between p-6 text-white md:p-8">
            <p className="text-[11px] tracking-[0.22em] uppercase text-white/80">
              {locale === "bn" ? "আজকের নোট" : "Today's note"}
            </p>
            <div>
              <h2 className="font-heading max-w-md text-3xl leading-tight md:text-4xl">
                {locale === "bn" ? "তথ্য পড়ুন, নিজের লগ রাখুন।" : "Read clearly. Keep your own log."}
              </h2>
              <p className="mt-2 max-w-sm text-sm text-white/85">{text(locale, "disclaimer")}</p>
              <Button asChild className="mt-5 h-10 rounded-full bg-white px-4 text-primary hover:bg-white/90">
                <Link to="/articles">{text(locale, "library")}</Link>
              </Button>
            </div>
          </div>
        </section>

        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{locale === "bn" ? "আজকের হিসাব" : "Today's count"}</CardTitle>
            <Link className="text-xs text-muted-foreground" to="/facilities">
              {text(locale, "care")}
            </Link>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Donut value={facilities} max={12} />
            <div>
              <p className="font-medium text-foreground">{locale === "bn" ? "ঢাকার তালিকা" : "Dhaka listings"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{text(locale, "unverified")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <section className="xl:col-span-3">
          <SectionTitle title={locale === "bn" ? "আজকের যত্ন" : "Your care today"} to="/articles" action={text(locale, "library")} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Tile icon={BookOpen} tint="bg-[#e7f3fa]" bar="bg-[#4e7da6]" value={String(articles)} label={text(locale, "library")} width={Math.min(100, articles * 20)} />
            <Tile icon={MapPin} tint="bg-[#f3f7fb]" bar="bg-[#2f5481]" value={String(facilities)} label={text(locale, "care")} width={Math.min(100, facilities * 8)} />
            <Tile icon={CalendarDays} tint="bg-[#eef5f8]" bar="bg-[#91b7d9]" value={user ? "1" : "0"} label={text(locale, "tracker")} width={user ? 70 : 12} />
            <Tile icon={MessageCircle} tint="bg-[#f7fafc]" bar="bg-[#4e7da6]" value={locale === "bn" ? "নিয়ম" : "Rules"} label={text(locale, "ask")} width={45} />
          </div>
        </section>
        <section className="xl:col-span-2">
          <SectionTitle title={locale === "bn" ? "দ্রুত পথ" : "Quick actions"} to="/tracker" action={text(locale, "tracker")} />
          <div className="grid grid-cols-2 gap-3">
            <ActionTile to="/tracker" icon={CalendarDays} label={text(locale, "tracker")} className="bg-[#d5e7f2]" />
            <ActionTile to="/articles" icon={BookOpen} label={text(locale, "library")} className="bg-[#e7f3fa]" />
            <ActionTile to="/facilities" icon={MapPin} label={text(locale, "care")} className="bg-[#f4f8fb]" />
            <ActionTile to="/chat" icon={MessageCircle} label={text(locale, "ask")} className="bg-[#e3eef6]" />
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <section className="xl:col-span-3">
          <SectionTitle title={locale === "bn" ? "পড়ার জন্য" : "Recommended for you"} to="/articles" action={text(locale, "library")} />
          <div className="grid gap-3 sm:grid-cols-3">
            <Recommend
              to={lead ? `/articles/${lead.slug}` : "/articles"}
              kicker={lead?.topic ?? text(locale, "library")}
              title={lead ? title(locale, lead) : text(locale, "library")}
              wash="from-[#2f5481] to-[#4e7da6]"
            />
            <Recommend to="/facilities" kicker={text(locale, "care")} title={locale === "bn" ? "কাছের সেবা" : "Nearby care"} wash="from-[#4e7da6] to-[#91b7d9]" />
            <Recommend to="/chat" kicker={text(locale, "ask")} title={locale === "bn" ? "সংরক্ষিত উত্তর" : "A guided answer"} wash="from-[#48555b] to-[#4e7da6]" />
          </div>
        </section>
        <div className="grid gap-4 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{locale === "bn" ? "মনে রাখুন" : "Keep in mind"}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <Note line={locale === "bn" ? "জরুরি লক্ষণে কাছের সেবা খুঁজুন।" : "For urgent signs, look up nearby care."} />
              <Note line={text(locale, "unverified")} />
              <Note line={locale === "bn" ? "লগ শুধু আপনার অ্যাকাউন্টে থাকে।" : "Logs stay on your account."} />
            </CardContent>
          </Card>
          <Card className="bg-[#d5e7f2]">
            <CardContent>
              <p className="font-heading text-lg leading-snug text-primary">{text(locale, "disclaimer")}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Donut({ value, max }: { value: number; max: number }) {
  const radius = 42;
  const circ = 2 * Math.PI * radius;
  const dash = Math.min(1, value / max) * circ;
  return (
    <svg viewBox="0 0 120 120" className="size-28 shrink-0" aria-hidden>
      <circle cx="60" cy="60" r={radius} fill="none" stroke="#d5e7f2" strokeWidth="12" />
      <circle
        cx="60"
        cy="60"
        r={radius}
        fill="none"
        stroke="#4e7da6"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ - dash}`}
        transform="rotate(-90 60 60)"
      />
      <text x="60" y="66" textAnchor="middle" fill="#2f5481" fontSize="26" fontFamily="inherit">
        {value}
      </text>
    </svg>
  );
}

function SectionTitle({ title, to, action }: { title: string; to: string; action: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-medium">{title}</h2>
      <Link className="text-xs text-muted-foreground" to={to}>
        {action}
      </Link>
    </div>
  );
}

function Tile({
  icon: Icon,
  tint,
  bar,
  value,
  label,
  width,
}: {
  icon: LucideIcon;
  tint: string;
  bar: string;
  value: string;
  label: string;
  width: number;
}) {
  return (
    <div className={`rounded-2xl p-4 ${tint}`}>
      <Icon className="size-4 text-primary" />
      <p className="font-heading mt-3 text-2xl text-primary">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/80">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function ActionTile({ to, icon: Icon, label, className }: { to: string; icon: LucideIcon; label: string; className: string }) {
  return (
    <Link to={to} className={`flex flex-col items-start gap-3 rounded-2xl p-4 text-primary ${className}`}>
      <Icon className="size-5" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

function Recommend({ to, kicker, title, wash }: { to: string; kicker: string; title: string; wash: string }) {
  return (
    <Link to={to} className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#d5e7f2]">
      <div className={`h-24 bg-linear-to-br ${wash}`} />
      <div className="p-3">
        <p className="text-[11px] tracking-wide text-muted-foreground uppercase">{kicker}</p>
        <p className="mt-1 text-sm font-medium">{title}</p>
      </div>
    </Link>
  );
}

function Note({ line }: { line: string }) {
  return (
    <p className="border-l-2 border-[#91b7d9] pl-3 text-muted-foreground">{line}</p>
  );
}

export function ArticlesPage() {
  const { locale } = useSession();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setQuery(params.get("q") ?? "");
  }, [params]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      api<Article[]>(`/api/v1/articles?q=${encodeURIComponent(query)}`)
        .then(setItems)
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <section className="grid gap-4">
      <Input
        className="h-10 max-w-md rounded-full bg-card px-4"
        placeholder={text(locale, "search")}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {loading && <p className="text-muted-foreground">{text(locale, "loading")}</p>}
      {!loading && items.length === 0 && <p className="text-muted-foreground">{text(locale, "emptyArticles")}</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((article) => (
          <Link key={article.slug} to={`/articles/${article.slug}`}>
            <Card className="rounded-2xl bg-card shadow-sm transition-colors hover:bg-secondary">
              <CardHeader>
                <CardTitle>{title(locale, article)}</CardTitle>
                <CardDescription>{article.topic}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
      <NextSteps
        locale={locale}
        items={[
          { to: "/", label: text(locale, "home") },
          { to: "/tracker", label: text(locale, "tracker") },
          { to: "/chat", label: text(locale, "ask") },
        ]}
      />
    </section>
  );
}

export function ArticlePage({ slug }: { slug: string }) {
  const { locale } = useSession();
  const [article, setArticle] = useState<{
    title_bn: string;
    title_en: string;
    body_bn: string;
    body_en: string;
    sources: { citation: string; url: string }[];
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<NonNullable<typeof article>>(`/api/v1/articles/${slug}`)
      .then(setArticle)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Error"));
  }, [slug]);

  const steps = (
    <NextSteps
      locale={locale}
      items={[
        { to: "/articles", label: text(locale, "library") },
        { to: "/chat", label: text(locale, "ask") },
        { to: "/facilities", label: text(locale, "care") },
      ]}
    />
  );
  if (error) {
    return (
      <div className="grid gap-4">
        <p className="text-primary">{error}</p>
        {steps}
      </div>
    );
  }
  if (!article) return <p className="text-muted-foreground">{text(locale, "loading")}</p>;
  const body = locale === "bn" ? article.body_bn : article.body_en;
  return (
    <div className="grid max-w-3xl gap-4">
    <Card className="rounded-2xl bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">{locale === "bn" ? article.title_bn : article.title_en}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 text-base">
        {body.split("\n\n").map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">{text(locale, "sources")}</h2>
          <ul className="mt-1 grid gap-1">
            {article.sources.map((source) => (
              <li key={source.url}>
                <a className="text-primary underline" href={source.url}>
                  {source.citation}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
    {steps}
    </div>
  );
}
