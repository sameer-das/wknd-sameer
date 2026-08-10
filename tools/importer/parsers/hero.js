/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero. Base: hero.
 * Source: https://wknd.site/us/en.html (Climbing New Zealand promotional teaser)
 * Generated: 2026-08-10
 *
 * Convention (hero): 1-column block. Row 1 = block name. Row 2 = background
 * image (single cell). Row 3 = title (heading) + subheading + CTA link (single
 * cell holding all content elements).
 */
export default function parse(element, { document }) {
  const image = element.querySelector('.cmp-teaser__image img, .cmp-image img, img');
  const title = element.querySelector('.cmp-teaser__title, h1, h2, h3');
  const description = element.querySelector('.cmp-teaser__description');
  const cta = element.querySelector('.cmp-teaser__action-link, .cmp-teaser__action-container a');

  const content = [];
  if (title) content.push(title);
  if (description) content.push(description);
  if (cta) content.push(cta);

  if (!image && !content.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  // Row 2: background image (single cell).
  if (image) cells.push([image]);
  // Row 3: all text content in one cell (1-column block).
  cells.push([content]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero', cells });
  element.replaceWith(block);
}
