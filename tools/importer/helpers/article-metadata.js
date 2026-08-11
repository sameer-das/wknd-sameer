/* eslint-disable */
/* global WebImporter */

/**
 * Article metadata augmentation helper.
 *
 * The WKND source articles expose only a `description` and `template` meta tag;
 * the author, publication date, and lead image live inside page content, so
 * WebImporter.rules.createMetadata() (which reads <meta>/<title>) produces a
 * Metadata block with just Title + Description. This helper is called by the
 * magazine-article import script AFTER createMetadata() has appended the
 * Metadata table to `main`, and appends Author / Author Title / Publication
 * Date / Image rows to that same table so that:
 *   - helix-query.yaml can index author, publication date, and image, and
 *   - each article page emits rich per-page metadata (og:/twitter:) at render.
 *
 * Data is keyed by the article slug (derived from the source URL). Non-article
 * URLs are a no-op.
 *
 * Author + publication date are sourced from the live WKND article pages
 * (byline text and the "SHARE THIS STORY" related-article dates). Lead image is
 * the article's hero image (first content <img>, captured before createMetadata
 * runs and passed in).
 */

const ARTICLE_DATA = {
  'arctic-surfing': {
    author: 'Jacob Wester',
    authorTitle: 'Skater, Writer',
    date: '2020-07-09',
  },
  'guide-la-skateparks': {
    author: 'Stacey Roswells',
    authorTitle: 'Artist, Photographer, Traveler',
    date: '2020-09-30',
  },
  'san-diego-surf': {
    author: 'Justin Barr',
    authorTitle: 'Artist, Rock Climber',
    date: '2020-07-09',
  },
  'ski-touring': {
    author: 'Sofia Sjöberg',
    authorTitle: 'Photographer, Youtuber',
    date: '2020-09-30',
  },
  'western-australia': {
    author: 'Camper Van',
    authorTitle: 'Contributor',
    date: '2020-07-09',
  },
};

function slugFromUrl(originalURL) {
  try {
    const m = new URL(originalURL).pathname.match(/\/magazine\/([a-z0-9-]+)(?:\.html?)?$/i);
    return m ? m[1] : null;
  } catch (e) {
    return null;
  }
}

/**
 * Find the Metadata block table appended by createMetadata (its first cell
 * reads "Metadata").
 */
function findMetadataTable(main) {
  const tables = [...main.querySelectorAll('table')];
  return tables.find((t) => {
    const first = t.querySelector('th, td');
    return first && first.textContent.trim().toLowerCase() === 'metadata';
  }) || null;
}

/**
 * @param {Element} main The document body/main after createMetadata ran.
 * @param {Document} document
 * @param {string} originalURL The source page URL.
 * @param {Element} [heroImg] The article's lead image, captured before cleanup.
 */
export default function augmentArticleMetadata(main, document, originalURL, heroImg) {
  const slug = slugFromUrl(originalURL);
  const data = slug && ARTICLE_DATA[slug];
  if (!data) return; // not a migrated magazine article — no-op

  const table = findMetadataTable(main);
  if (!table) return;
  const tbody = table.querySelector('tbody') || table;

  const addRow = (key, valueNode) => {
    const tr = document.createElement('tr');
    const k = document.createElement('td');
    k.textContent = key;
    const v = document.createElement('td');
    if (typeof valueNode === 'string') v.textContent = valueNode;
    else v.append(valueNode);
    tr.append(k, v);
    tbody.append(tr);
  };

  addRow('Author', data.author);
  if (data.authorTitle) addRow('Author Title', data.authorTitle);
  addRow('Publication Date', data.date);

  if (heroImg && heroImg.src) {
    const img = document.createElement('img');
    img.src = heroImg.src;
    img.alt = heroImg.alt || data.author;
    addRow('Image', img);
  }
}
