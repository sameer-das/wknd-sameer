/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-featured. Base: columns.
 * Source: https://wknd.site/us/en.html + .../magazine.html (featured article teaser)
 * Generated: 2026-08-10
 *
 * Convention (columns): first row = block name, subsequent rows split into
 * N columns based on visual grouping. The featured-article teaser is a single
 * 2-column row: text content (pretitle, title, description, "Full Article" CTA)
 * beside the article image. The columns-featured decorator reads the first
 * row's children as columns and flags the image-only column.
 */
export default function parse(element, { document }) {
  const image = element.querySelector('.cmp-teaser__image img, .cmp-image img, img');
  const pretitle = element.querySelector('.cmp-teaser__pretitle');
  const title = element.querySelector('.cmp-teaser__title, h1, h2, h3');
  const description = element.querySelector('.cmp-teaser__description');
  const cta = element.querySelector('.cmp-teaser__action-link, .cmp-teaser__action-container a');

  const textCol = [];
  if (pretitle) textCol.push(pretitle);
  if (title) textCol.push(title);
  if (description) textCol.push(description);
  if (cta) textCol.push(cta);

  if (!textCol.length && !image) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Two columns: text on the left, image on the right (matches source order).
  const cells = [[textCol, image || '']];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-featured', cells });
  element.replaceWith(block);
}
