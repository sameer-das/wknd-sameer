# WKND Magazine Migration to AEM Edge Delivery Services

## Objective
Migrate the WKND site (**https://wknd.site/us/en.html**) into this AEM Edge Delivery Services project as a **DA (Document Authoring) project**, delivering a home page, a Magazine section (dynamic article list + article pages), and an About section — with custom blocks, content indexing, redirects, metadata, and SEO tuned to hit the acceptance rubric (Lighthouse 100 mobile, A11y 100, valid SEO, DA content workflow, clean PR).

## Scope (confirmed)
- **Coverage:** Home page, Magazine landing + a set of real Magazine article pages, About page.
- **Elements:** Page content & blocks · Navigation/header · Footer · Design & styling.
- **Content target:** Document Authoring (`admin.da.live`) for `sameer-das/wknd-sameer`.

## Must-Have Features → Deliverables
| Requirement | Deliverable |
|---|---|
| Home page with header + footer | `/` page; `header` + `footer` blocks instrumented from source |
| Magazine section | `/magazine` landing + `/magazine/<slug>` article pages |
| About section | `/about` page |
| Social links block | New `social-links` block (JS+CSS) |
| Writer/photographer details block | New `article-author` block (name, avatar, title) |
| Dynamic article list from query index | New `article-list` block reading `/magazine/query-index.json` ("Day 4" block, rebuilt to Block Collection patterns) |
| Content indexing | `helix-query.yaml` indexing `/magazine/**` |
| Redirects (≥2, 301) | `redirects.json` sheet mapping old→new paths |
| Per-page + bulk metadata | Page metadata + bulk `metadata` sheet for `/magazine/*` |

## Current State
- Project: `sameer-das/wknd-sameer` (AEM Boilerplate base); preview org/site in `.migration/project.json`.
- Existing blocks: `cards`, `columns`, `footer`, `fragment`, `header`, `hero`, `widget`.
- No migrated content yet (only boilerplate `content/` samples).
- **Note:** No "Day 4" block exists in this repo — the dynamic article-list block will be built fresh to Block Collection standards.

## Checklist

### Phase 0 — Setup
- [ ] Confirm project type = DA; establish target paths (`/`, `/magazine`, `/magazine/<slug>`, `/about`)
- [ ] Create a feature branch (no direct commits to `main`)
- [ ] (Optional) Enable `modern-web-guidance` plugin — see Decisions Needed

### Phase 1 — Discovery & Capture
- [ ] Scrape source pages: home, magazine landing, 3–4 magazine articles, about (HTML, metadata, images)
- [ ] Extract design tokens (colors, typography, spacing) from the source site

### Phase 2 — Design System
- [ ] Apply design tokens to `styles/styles.css`, `styles/fonts.css`
- [ ] Verify base typography/spacing against source

### Phase 3 — Custom Blocks
- [ ] Build `social-links` block (accessible links/share, ARIA labels)
- [ ] Build `article-author` block (name, avatar with alt text, title)
- [ ] Build `article-list` block driven by `/magazine/query-index.json` (client-side fetch, no hardcoded articles)
- [ ] Instrument `header`/navigation from source (desktop + mobile, keyboard-navigable)
- [ ] Build/instrument `footer` from source
- [ ] Reuse `hero`, `cards`, `columns` where they fit; add variants only as needed

### Phase 4 — Content Modeling & Import
- [ ] Analyze sections/sequences per page; map default content vs. blocks
- [ ] Generate parsers/transformers + bundled import script
- [ ] Run bulk import to produce content files
- [ ] Preview locally and confirm rendering per page
- [ ] Upload content into DA (`admin.da.live` source API — credentials injected)

### Phase 5 — Indexing & Dynamic List
- [ ] Author `helix-query.yaml` to index `/magazine/**` (title, description, image, author, date)
- [ ] Wire `article-list` to the live index; sort by date
- [ ] Verify: adding a new article to the index makes it appear with **no code change**

### Phase 6 — SEO, Metadata & Redirects
- [ ] Per-page metadata (title, description, `og:`, `twitter:`, image) on all pages
- [ ] Bulk `metadata` sheet applying shared metadata to `/magazine/*`
- [ ] Ensure valid `sitemap.xml` is exposed (config/query-driven)
- [ ] Add `robots.txt` referencing the sitemap
- [ ] Configure `redirects.json` with ≥2 old→new mappings returning **301**

### Phase 7 — Performance & Accessibility
- [ ] Optimize LCP (eager hero image, proper `loading`/sizing), minimize CLS
- [ ] Confirm all images have meaningful alt text; correct heading hierarchy
- [ ] Verify full keyboard navigation (nav, article list, social links)
- [ ] Run PageSpeed Insights (mobile) on home + an article page → target **100 / 100 / 100 / 100** and CWV "good"

### Phase 8 — Content Workflow (DA)
- [ ] Confirm content is authored/imported in DA
- [ ] Ship at least one content update via **snapshot → review → publish** before going live

### Phase 9 — Validation & Delivery
- [ ] Post-import content-completeness check (source vs. output) per page
- [ ] Visual critique per block/section against original; iterate
- [ ] `npm run lint` passes (JS + CSS)
- [ ] Open PR to `main` with preview links (`https://<branch>--wknd-sameer--sameer-das.aem.page/...`)
- [ ] `gh pr checks` green (code sync, lint, performance)

## Decisions Needed
- **`modern-web-guidance` plugin:** An optional plugin ("keep the agent current on web best practices") is available and is relevant to the Lighthouse-100 performance/accessibility goals. I can enable it by writing `.agents/settings.json` — **only with your OK**. Let me know if you'd like it on before I begin execution.
- **Article set:** I'll import a representative set of real WKND magazine articles (≈3–4) unless you want a specific list or count.
- **Redirect pairs:** I'll map the original WKND paths (e.g. `/us/en/magazine/<article>`) to the new `/magazine/<slug>` structure for the 301s unless you specify particular legacy URLs.

---
*Plan is execution-ready. Running it (scraping, block development, import, DA upload, PR) requires switching to **Execute mode**. Approve to begin — and tell me whether to enable the `modern-web-guidance` plugin first.*
