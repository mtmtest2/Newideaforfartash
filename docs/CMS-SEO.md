# SEO

- Every public type has an SEO group: title (≤70), description (≤170), focus keyword (editorial only, never output),
  canonical URL, noindex, Open Graph image/title/description. Empty fields fall back to title/excerpt/cover.
- Server-rendered head per page: `<title>` with the site suffix, description, canonical, robots, Open Graph, Twitter card.
- JSON-LD generated from published data only: EducationalOrganization (home), BlogPosting + BreadcrumbList (articles),
  Person (teachers), Event, Course, FAQPage (pages with an FAQ block).
- `/sitemap.xml` is dynamic: static routes + published, indexable articles, active teachers, events, languages, pages,
  and offline courses only when the feature is on. `noindex` content is excluded.
- `robots.txt` disallows the app panels and `/__data`.
- Redirects (301/302) are managed in the dashboard (`/blog → /magazine` is pre-configured).
- Drafts, previews, panels and 404 pages are `noindex`.
- Seeded articles and language pages are `noindex` until their full text is written (they only have summaries).
