# Content Hub

The Support Dashboard (`https://cms.<domain>/support`) is the only place where public content is managed. Persian, RTL.

## Modules
| Module | Collection/global | Public route | Notes |
|---|---|---|---|
| Magazine | `articles` (+ `authors`, `categories`, `tags`) | `/magazine`, `/magazine/:slug` | Lexical editor (H2–H6, lists, tables, quotes, images, links, code, tips, vocabulary, dialogues, video embeds), automatic TOC and reading time, related articles |
| Teachers | `teachers` | `/teachers`, `/teachers/:slug`, home carousel | drag-and-drop order = carousel/directory order; `showOnHome`; active/inactive/archived |
| Offline courses | `courses` | `/courses`, `/courses/:slug`, home carousel | hidden unless the feature flag is on (see OFFLINE-COURSES.md) |
| Workshops & events | `events` | `/events`, `/events/:slug`, optional home section | upcoming/past by end date; registration status/URL; meeting links never public |
| Languages | `languages` | `/languages/:slug` | levels A1–C2, exams, resources; related teachers/articles joined automatically |
| Public pages | `pages` | `/:slug` (e.g. `/about`) | predefined blocks only: intro, rich text, FAQ, CTA, contact, announcement; reserved slugs blocked |
| Media | `media`, `private-files` | `/api/media/file/*` (public), private never | see Media below |
| SEO | `seo` group on every public type, `redirects` | — | see CMS-SEO.md |
| Homepage | `home-layout` global | `/` | section titles, course carousel selection/position, events section |
| Navigation | `navigation` global | header + footer | |
| Site info | `site-settings` global | footer, contact block, JSON-LD | |
| Feature switches | `feature-flags` global | — | `offlineCoursesEnabled` |

## Publishing workflow
- **Drafts & autosave** (every 1.5 s) on all publishable types; the public never sees drafts.
- **Publish / unpublish / schedule publish** from the publish button; scheduled jobs run every minute in the CMS
  process (`jobs.autoRun`); a future `publishedAt` also embargoes content until that time.
- **Versions**: up to 50 per document, compare and restore from the "versions" tab.
- **Preview**: the preview button opens the real site page with a signed 30-minute token; shows the draft with a
  "پیش‌نمایش" bar; never cached or indexed.
- Every change triggers site revalidation (`POST /__revalidate`) and an audit record.

## Public API (server-to-server)
`GET /api/public/{site|home|teachers|teachers/:slug|articles[?page,category,tag]|articles/:slug|languages|languages/:slug|events|events/:slug|courses|courses/:slug|pages/:slug|redirects|sitemap|preview?token=}`
— `Authorization: Bearer $CONTENT_API_SECRET`. Only published + date-reached + not archived/inactive. DTOs are
documented in `src/content/types.ts`; the site never depends on Payload internals.

## Media
Images are converted to WebP with `thumb` (400), `card` (800) and `wide` (1600) variants and a focal point; pages use
`srcset`. Large course videos are not uploaded: lessons store a provider + asset id for a private streaming service.
