/* eslint-disable */
/* global WebImporter */
/**
 * Parser for article-list. Base: cards (dynamic variant).
 * Source: https://wknd.site/us/en.html ("Recent Articles") + .../magazine.html ("All Articles")
 * Generated: 2026-08-10
 *
 * The article-list block is DYNAMIC: it renders magazine article cards from the
 * query index (/magazine/query-index.json, produced by helix-query.yaml) rather
 * than from authored rows, so the list updates automatically when a new article
 * is published — no code change.
 *
 * Emitted block structure:
 *   | article-list                          |
 *   | source: index [\n limit: 4]           |  <- row 1: config → dynamic mode
 *   | <img> | <h3><a>Title</a></h3><p>desc</p> |  <- rows 2+: static fallback
 *   | ...                                   |
 *
 * Row 1 tells the block to read the live index (and, on the home page, cap at
 * the 4 newest). Rows 2+ preserve the source's article cards as a static
 * fallback the block renders only if the index fetch fails — and they keep the
 * imported document content-complete against the source.
 */
export default function parse(element, { document, url, params } = {}) {
  const originalURL = (params && params.originalURL) || url || '';
  // Home page grid = curated "Recent Articles" strip → cap at 4.
  // Magazine landing grid = "All Articles" → no limit.
  const isHome = /\/us\/en(\.html?)?$/.test(originalURL) || /\/us\/en\/?$/.test(originalURL);

  // --- Row 1: dynamic config cell ---
  const configCell = document.createElement('div');
  const configLines = ['source: index'];
  if (isHome) configLines.push('limit: 4');
  configLines.forEach((line, i) => {
    if (i > 0) configCell.append(document.createElement('br'));
    configCell.append(document.createTextNode(line));
  });

  const cells = [[configCell]];

  // --- Rows 2+: static fallback cards (image | title link + description) ---
  const items = Array.from(element.querySelectorAll('.cmp-image-list__item, li'));
  items.forEach((item) => {
    const image = item.querySelector('.cmp-image-list__item-image img, .cmp-image img, img');
    const titleLink = item.querySelector('.cmp-image-list__item-title-link, a[class*="title"]');
    const titleText = item.querySelector('.cmp-image-list__item-title');
    const description = item.querySelector('.cmp-image-list__item-description');

    const body = [];
    if (titleLink) {
      const heading = document.createElement('h3');
      const a = document.createElement('a');
      a.href = titleLink.getAttribute('href') || '#';
      a.textContent = (titleText ? titleText.textContent : titleLink.textContent).trim();
      heading.append(a);
      body.push(heading);
    } else if (titleText) {
      const heading = document.createElement('h3');
      heading.textContent = titleText.textContent.trim();
      body.push(heading);
    }
    if (description) {
      const p = document.createElement('p');
      p.textContent = description.textContent.trim();
      body.push(p);
    }

    if (image || body.length) {
      cells.push([image || '', body]);
    }
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'article-list', cells });
  element.replaceWith(block);
}
