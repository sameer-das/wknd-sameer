/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-members. Base: cards.
 * Source: https://wknd.site/us/en/magazine.html ("Members Only" gated teaser cards)
 * Generated: 2026-08-10
 *
 * The instance selector matches a single "secure" teaser (one card). This
 * parser emits one card row for the matched element; the importer runs it per
 * matched instance so multiple members-only teasers each become a card row.
 *
 * Convention (cards): 2-column block. Row 1 = block name. Each subsequent row
 * is one card: cell 1 = image, cell 2 = text content (title heading,
 * description, "Read More" CTA). The cards-members decorator wraps each row in
 * a <li>, treating the image-only column as the card image and the rest as body.
 */
export default function parse(element, { document }) {
  const image = element.querySelector('.cmp-teaser__image img, .cmp-image img, img');
  const title = element.querySelector('.cmp-teaser__title, h1, h2, h3');
  const description = element.querySelector('.cmp-teaser__description');
  const actionContainer = element.querySelector('.cmp-teaser__action-container');
  const actionLink = element.querySelector('.cmp-teaser__action-link, .cmp-teaser__action-container a');

  const body = [];
  if (title) body.push(title);
  if (description) body.push(description);
  if (actionLink) {
    body.push(actionLink);
  } else if (actionContainer && actionContainer.textContent.trim()) {
    // "Read More" is plain text in the source; preserve it as a CTA-styled link.
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = image ? '#' : '#';
    a.textContent = actionContainer.textContent.trim();
    p.append(a);
    body.push(p);
  }

  if (!image && !body.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[image || '', body]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-members', cells });
  element.replaceWith(block);
}
