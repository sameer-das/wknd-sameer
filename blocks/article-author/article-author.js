import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * article-author block
 *
 * Renders an author byline card for magazine articles: a circular avatar
 * image alongside the author's name and role/title.
 *
 * Expected content structure (authored as a single block):
 *   Row 1, Cell 1: avatar image (author headshot)
 *   Row 1, Cell 2: name (heading) + role/title (paragraph)
 *
 * The decorator is tolerant of missing fields: an author with no avatar or no
 * role still renders cleanly.
 */
export default function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;

  const cells = [...row.children];

  // Identify the image cell (the cell whose only content is a picture/img).
  const imageCell = cells.find((cell) => cell.querySelector('picture, img'));
  const bodyCell = cells.find((cell) => cell !== imageCell) || cells[cells.length - 1];

  const avatar = document.createElement('div');
  avatar.className = 'article-author-avatar';
  if (imageCell) {
    const img = imageCell.querySelector('img');
    if (img) {
      const pic = createOptimizedPicture(img.src, img.alt || '', false, [{ width: '200' }]);
      avatar.append(pic);
    }
  }

  const body = document.createElement('div');
  body.className = 'article-author-body';
  if (bodyCell) {
    while (bodyCell.firstElementChild) body.append(bodyCell.firstElementChild);
    // Fallback: promote a bare text node into a heading if no elements exist.
    if (!body.childElementCount && bodyCell.textContent.trim()) {
      const name = document.createElement('h2');
      name.textContent = bodyCell.textContent.trim();
      body.append(name);
    }
  }

  block.replaceChildren();
  if (avatar.childElementCount) block.append(avatar);
  block.append(body);
}
