/* eslint-disable */
/* global WebImporter */
/**
 * Parser for social-links. Base: social-links (custom WKND block).
 * Source: magazine article pages (share/follow button list)
 * Generated: 2026-08-10
 *
 * The social-links decorator supports two shapes; this parser emits Shape B:
 * a single cell containing a list of links whose link text is the platform
 * name (Facebook / Twitter / Instagram) and whose href is the destination.
 * The decorator reads every anchor in the row, so real link targets are
 * preserved. Each source button is an anchor with a `.cmp-button__text` label.
 */
export default function parse(element, { document }) {
  const anchors = Array.from(element.querySelectorAll('a[href]'));

  const list = document.createElement('ul');
  anchors.forEach((anchor) => {
    const labelNode = anchor.querySelector('.cmp-button__text');
    const label = (labelNode ? labelNode.textContent : anchor.textContent).trim();
    if (!label) return;
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = anchor.getAttribute('href') || '#';
    a.textContent = label;
    li.append(a);
    list.append(li);
  });

  if (!list.childElementCount) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Single-column block: one row, one cell holding the list of links.
  const cells = [[list]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'social-links', cells });
  element.replaceWith(block);
}
