import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * article-list block
 *
 * Renders a grid of magazine article cards (image + title link + description).
 *
 * Two modes:
 *  1. DYNAMIC (default when authored with no rows, or with a config row naming
 *     an index): fetches the query index (default `/magazine/query-index.json`,
 *     produced by helix-query.yaml), sorts articles by publication date
 *     (newest first) and renders a card per article. New articles published to
 *     the index appear automatically with NO code change.
 *  2. STATIC: when the author provides content rows, those rows are rendered
 *     as-is (image + title link + description). Used on pages that want a
 *     hand-picked set rather than the live feed.
 *
 * Config: an author can scope/limit the feed by adding a single-cell row with
 * `key: value` lines, e.g. `source: /magazine/query-index.json` and `limit: 8`.
 */

const DEFAULT_INDEX = '/magazine/query-index.json';

/** Parse an optional config row of `key: value` lines into an object. */
function readConfig(block) {
  const config = {};
  const rows = [...block.children];
  // A config row is a single cell whose text contains "key:" style lines and
  // no images/links (so we don't mistake a content card for config).
  const first = rows[0];
  if (
    first
    && first.children.length === 1
    && !first.querySelector('img, picture, a')
    && /:/.test(first.textContent)
  ) {
    first.textContent.split('\n').forEach((line) => {
      const idx = line.indexOf(':');
      if (idx > 0) {
        const key = line.slice(0, idx).trim().toLowerCase();
        const value = line.slice(idx + 1).trim();
        if (key) config[key] = value;
      }
    });
    first.remove();
  }
  return config;
}

/** Build a single article card <li> from an index record. */
function buildCard(article) {
  const li = document.createElement('li');

  const path = article.path || article.url || '#';
  const title = article.title || path;

  // Image
  if (article.image) {
    const imageDiv = document.createElement('div');
    imageDiv.className = 'article-list-card-image';
    const link = document.createElement('a');
    link.href = path;
    link.setAttribute('aria-label', title);
    link.append(createOptimizedPicture(article.image, title, false, [{ width: '750' }]));
    imageDiv.append(link);
    li.append(imageDiv);
  }

  // Body: title link + description
  const bodyDiv = document.createElement('div');
  bodyDiv.className = 'article-list-card-body';

  const heading = document.createElement('h3');
  const titleLink = document.createElement('a');
  titleLink.href = path;
  titleLink.textContent = title;
  heading.append(titleLink);
  bodyDiv.append(heading);

  if (article.description) {
    const desc = document.createElement('p');
    desc.textContent = article.description;
    bodyDiv.append(desc);
  }

  if (article.author || article['publication-date']) {
    const meta = document.createElement('p');
    meta.className = 'article-list-card-meta';
    const bits = [];
    if (article.author) bits.push(article.author);
    if (article['publication-date']) {
      const d = new Date(article['publication-date']);
      if (!Number.isNaN(d.getTime())) {
        bits.push(d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }));
      }
    }
    meta.textContent = bits.join(' · ');
    bodyDiv.append(meta);
  }

  li.append(bodyDiv);
  return li;
}

/** Sort newest-first by publication-date (fallback: lastModified, then title). */
function sortArticles(articles) {
  return articles.slice().sort((a, b) => {
    const da = Date.parse(a['publication-date']) || (Number(a.lastModified) * 1000) || 0;
    const db = Date.parse(b['publication-date']) || (Number(b.lastModified) * 1000) || 0;
    if (db !== da) return db - da;
    return (a.title || '').localeCompare(b.title || '');
  });
}

/** Render authored static rows (image + title link + description). */
function renderStatic(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'article-list-card-image';
      else div.className = 'article-list-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.replaceChildren(ul);
}

export default async function decorate(block) {
  const config = readConfig(block);
  const hasAuthoredRows = block.children.length > 0;

  // STATIC mode: author supplied content rows and did not force dynamic.
  if (hasAuthoredRows && config.source !== 'index' && !config.dynamic) {
    renderStatic(block);
    return;
  }

  // DYNAMIC mode: fetch the query index.
  const source = (config.source && config.source !== 'index')
    ? config.source
    : DEFAULT_INDEX;
  const limit = config.limit ? parseInt(config.limit, 10) : 0;

  try {
    const resp = await fetch(source);
    if (!resp.ok) throw new Error(`query index ${resp.status}`);
    const json = await resp.json();
    let articles = Array.isArray(json.data) ? json.data : [];
    articles = sortArticles(articles);
    if (limit > 0) articles = articles.slice(0, limit);

    const ul = document.createElement('ul');
    articles.forEach((article) => ul.append(buildCard(article)));
    block.replaceChildren(ul);
  } catch (e) {
    // Fallback: if a fetch fails but authored rows exist, render them.
    // eslint-disable-next-line no-console
    console.warn('article-list: dynamic load failed, using authored fallback', e);
    if (hasAuthoredRows) renderStatic(block);
    else block.replaceChildren();
  }
}
