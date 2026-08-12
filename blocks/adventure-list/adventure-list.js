import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * adventure-list block
 *
 * Renders a grid of adventure cards (image + title link + description).
 * Cloned from the article-list block — same card structure — but scoped to a
 * SEPARATE query index (`/adventures/query-index.json`) so adventures never mix
 * with magazine articles.
 *
 * Two modes:
 *  1. DYNAMIC (default when authored with no rows, or with a config row naming
 *     an index): fetches the query index (default `/adventures/query-index.json`,
 *     produced by helix-query.yaml), sorts adventures (newest first) and renders
 *     a card per adventure. New adventures published to the index appear
 *     automatically with NO code change.
 *  2. STATIC: when the author provides content rows, those rows are rendered
 *     as-is (image + title link + description). Used on pages that want a
 *     hand-picked set rather than the live feed.
 *
 * Config: an author can scope/limit the feed by adding a single-cell row with
 * `key: value` lines, e.g. `source: /adventures/query-index.json` and `limit: 8`.
 */

const DEFAULT_INDEX = '/adventures/query-index.json';

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

/** Build a single adventure card <li> from an index record. */
function buildCard(adventure) {
  const li = document.createElement('li');

  const path = adventure.path || adventure.url || '#';
  const title = adventure.title || path;

  // Image
  if (adventure.image) {
    const imageDiv = document.createElement('div');
    imageDiv.className = 'adventure-list-card-image';
    const link = document.createElement('a');
    link.href = path;
    link.setAttribute('aria-label', title);
    link.append(createOptimizedPicture(adventure.image, title, false, [{ width: '750' }]));
    imageDiv.append(link);
    li.append(imageDiv);
  }

  // Body: title link + description
  const bodyDiv = document.createElement('div');
  bodyDiv.className = 'adventure-list-card-body';

  const heading = document.createElement('h3');
  const titleLink = document.createElement('a');
  titleLink.href = path;
  titleLink.textContent = title;
  heading.append(titleLink);
  bodyDiv.append(heading);

  if (adventure.description) {
    const desc = document.createElement('p');
    desc.textContent = adventure.description;
    bodyDiv.append(desc);
  }

  if (adventure.author || adventure['publication-date']) {
    const meta = document.createElement('p');
    meta.className = 'adventure-list-card-meta';
    const bits = [];
    if (adventure.author) bits.push(adventure.author);
    if (adventure['publication-date']) {
      const d = new Date(adventure['publication-date']);
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
function sortAdventures(adventures) {
  return adventures.slice().sort((a, b) => {
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
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'adventure-list-card-image';
      else div.className = 'adventure-list-card-body';
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

  // Category tabs are shown by default in dynamic mode; an author can disable
  // them with a `tabs: false` config line.
  const showTabs = config.tabs !== 'false' && config.tabs !== 'off';

  try {
    const resp = await fetch(source);
    if (!resp.ok) throw new Error(`query index ${resp.status}`);
    const json = await resp.json();
    let adventures = Array.isArray(json.data) ? json.data : [];
    adventures = sortAdventures(adventures);
    if (limit > 0) adventures = adventures.slice(0, limit);

    const ul = document.createElement('ul');
    adventures.forEach((adventure) => {
      const card = buildCard(adventure);
      const cat = (adventure.category || '').trim();
      if (cat) card.dataset.category = cat;
      ul.append(card);
    });

    // Build the category filter tabs from the categories present in the feed.
    const categories = [...new Set(
      adventures.map((a) => (a.category || '').trim()).filter(Boolean),
    )].sort();

    if (showTabs && categories.length > 1) {
      const tablist = document.createElement('div');
      tablist.className = 'adventure-list-tabs';
      tablist.setAttribute('role', 'tablist');
      tablist.setAttribute('aria-label', 'Filter adventures by category');

      const filterTo = (cat, tabEls) => {
        [...ul.children].forEach((li) => {
          const show = cat === 'All' || li.dataset.category === cat;
          li.hidden = !show;
        });
        tabEls.forEach((t) => {
          const active = t.dataset.category === cat;
          t.setAttribute('aria-selected', active ? 'true' : 'false');
          t.tabIndex = active ? 0 : -1;
        });
      };

      const labels = ['All', ...categories];
      const tabEls = labels.map((label) => {
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'adventure-list-tab';
        tab.textContent = label;
        tab.dataset.category = label;
        tab.setAttribute('role', 'tab');
        tab.addEventListener('click', () => filterTo(label, tabEls));
        tablist.append(tab);
        return tab;
      });

      // Keyboard navigation between tabs (left/right arrows).
      tablist.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const idx = tabEls.indexOf(document.activeElement);
        if (idx === -1) return;
        const next = e.key === 'ArrowRight'
          ? (idx + 1) % tabEls.length
          : (idx - 1 + tabEls.length) % tabEls.length;
        tabEls[next].focus();
      });

      filterTo('All', tabEls); // "All" selected by default
      block.replaceChildren(tablist, ul);
    } else {
      block.replaceChildren(ul);
    }
  } catch (e) {
    // Fallback: if a fetch fails but authored rows exist, render them.
    // eslint-disable-next-line no-console
    console.warn('adventure-list: dynamic load failed, using authored fallback', e);
    if (hasAuthoredRows) renderStatic(block);
    else block.replaceChildren();
  }
}
