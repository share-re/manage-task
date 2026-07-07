// Fetches short plant descriptions from the Japanese Wikipedia REST API.
// Read-only, no API key, CORS-enabled. Only the article title is sent.

export type WikiSummary = {
  title: string;
  extract: string;
  thumbnail?: string;
  pageUrl?: string;
};

const cache = new Map<string, Promise<WikiSummary>>();

export function fetchWikiSummary(title: string): Promise<WikiSummary> {
  const cached = cache.get(title);
  if (cached) return cached;

  const url = `https://ja.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    title,
  )}`;
  const p = fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`wiki request failed: ${res.status}`);
      return res.json();
    })
    .then(
      (d): WikiSummary => ({
        title: d?.title ?? title,
        extract: d?.extract ?? "",
        thumbnail: d?.thumbnail?.source,
        pageUrl: d?.content_urls?.desktop?.page,
      }),
    )
    .catch((): WikiSummary => {
      // Don't let a transient failure poison the cache: drop the entry so a
      // later hover refetches instead of showing this fallback text forever.
      cache.delete(title);
      return { title, extract: "情報を取得できませんでした。" };
    });

  cache.set(title, p);
  return p;
}
