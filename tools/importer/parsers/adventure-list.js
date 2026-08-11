/* eslint-disable */
/* global WebImporter */
/**
 * Parser for adventure-list. Base: cards (dynamic variant, cloned from article-list).
 * Source: https://wknd.site/us/en/adventures.html ("Current Adventures" grid, 16 cards)
 * Generated: 2026-08-11
 *
 * The adventure-list block is DYNAMIC: it renders adventure cards from a SEPARATE
 * query index (/adventures/query-index.json, produced by helix-query.yaml) rather
 * than from authored rows, so the listing updates automatically when a new
 * adventure is published — no code change. It is a clone of article-list scoped to
 * the adventures index so adventures never mix with magazine articles.
 *
 * Emitted block structure:
 *   | adventure-list                          |
 *   | source: index                           |  <- row 1: config → dynamic mode
 *   | <img> | <h3><a>Title</a></h3><p>desc</p> |  <- rows 2+: static fallback
 *   | ...                                     |
 *
 * Row 1 (`source: index`) forces the block into DYNAMIC mode and reads the live
 * index (default /adventures/query-index.json). This is the adventures LANDING
 * page, which shows ALL adventures, so NO `limit` is emitted. Rows 2+ preserve the
 * source's 16 adventure cards as a static fallback the block renders only if the
 * index fetch fails — and they keep the imported document content-complete against
 * the source. Fallback links point at /us/en/adventures/<slug>.html (the source
 * hrefs); the dynamic index drives the real live links.
 */
export default function parse(element, { document }) {
  // --- Row 1: dynamic config cell (single cell, no img/link → treated as config) ---
  const configCell = document.createElement('div');
  configCell.append(document.createTextNode('source: index'));

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

  const block = WebImporter.Blocks.createBlock(document, { name: 'adventure-list', cells });
  element.replaceWith(block);
}
