import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * cards-members block
 *
 * Renders the "Members Only" gated teaser cards (image + title + description + CTA)
 * in a compact 2-up grid. Structurally a cards variant; the gated/"secure" members-only
 * treatment (per-card "Read More" CTA, restrained 2-column layout) is handled via CSS.
 */
export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-members-card-image';
      else div.className = 'cards-members-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.replaceChildren(ul);
}
