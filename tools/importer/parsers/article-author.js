/* eslint-disable */
/* global WebImporter */
/**
 * Parser for article-author. Base: article-author (custom WKND block).
 * Source: magazine article pages (author byline card)
 * Generated: 2026-08-10
 *
 * Structure (per the article-author decorator): a single row with 2 cells.
 *   Cell 1: avatar image (author headshot)
 *   Cell 2: name (heading) + role/title (paragraph)
 * The decorator locates the image cell, moves the other cell's contents into
 * the body, and tolerates a missing avatar or role.
 *
 * Deterministic extraction by known byline classes (with fallbacks). Works
 * whether the matched element is the inner `.cmp-byline` or an outer grid
 * wrapper (`div.byline.image`) around it.
 */
export default function parse(element, { document }) {
  const image = element.querySelector('.cmp-byline__image img, .cmp-image img, img');

  const nameNode = element.querySelector('.cmp-byline__name, h1, h2, h3, h4, h5, h6');

  // Role/occupations: the dedicated class, else the first paragraph that is not
  // part of the image wrapper.
  let roleNode = element.querySelector('.cmp-byline__occupations');
  if (!roleNode) {
    roleNode = Array.from(element.querySelectorAll('p'))
      .find((p) => p.textContent.trim() && !p.closest('.cmp-byline__image, .cmp-image'));
  }

  const body = [];
  if (nameNode) {
    const h = document.createElement('h2');
    h.textContent = nameNode.textContent.trim();
    body.push(h);
  }
  if (roleNode && roleNode.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = roleNode.textContent.trim();
    body.push(p);
  }

  if (!image && !body.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[image || '', body]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'article-author', cells });
  element.replaceWith(block);
}
