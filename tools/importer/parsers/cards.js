/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards. Base: cards.
 * Source: https://wknd.site/us/en.html ("Where do you want to go?" adventures grid)
 * Generated: 2026-08-10
 *
 * Convention (cards): 2-column block. Row 1 = block name. Each subsequent row
 * is one card: cell 1 = image, cell 2 = text content (title link + description).
 * The cards decorator wraps each row in a <li>, treating the image-only column
 * as the card image and the rest as the card body.
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('.cmp-image-list__item, li'));

  const cells = [];
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

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards', cells });
  element.replaceWith(block);
}
