/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-profile. Base: cards.
 * Source: https://wknd.site/us/en/about-us.html (contributor / guide profile cards)
 * Generated: 2026-08-10
 *
 * The instance selector matches a single contributor experience-fragment (one
 * profile). The importer runs this parser per matched instance, so each profile
 * becomes a card row.
 *
 * Convention (cards): 2-column block. Row 1 = block name. Each row is one card:
 * cell 1 = profile image, cell 2 = text content (name heading, role, social
 * links). The cards-profile decorator turns the second cell's anchors into a
 * row of platform-keyed social icon links (link text = platform name).
 */
export default function parse(element, { document }) {
  const image = element.querySelector('.cmp-image img, .image img, img');
  // Name is the first title heading; role is the second (styled h5 / cmp-title--black).
  const headings = Array.from(element.querySelectorAll('.cmp-title__text, h1, h2, h3, h4, h5, h6'));
  const name = headings[0];
  const role = headings[1];

  const body = [];
  if (name) {
    const h = document.createElement('h3');
    h.textContent = name.textContent.trim();
    body.push(h);
  }

  // Accessibility: the source avatars have empty alt text. Use the person's
  // name (with role for extra context) so the image conveys meaning.
  if (image && !image.getAttribute('alt')) {
    const nameText = name ? name.textContent.trim() : '';
    const roleText = role ? role.textContent.trim() : '';
    if (nameText) {
      image.setAttribute('alt', roleText ? `${nameText}, ${roleText}` : nameText);
    }
  }
  if (role) {
    const p = document.createElement('p');
    p.textContent = role.textContent.trim();
    body.push(p);
  }

  // Social links: emit as a bulleted list of links (one <li> per platform).
  // A list keeps each link a separate block-level item, so multiple links that
  // share the same href (as several contributors do) are not merged into one
  // link during markdown serialization. The cards-profile decorator collects
  // these anchors into a social nav and removes the now-empty list wrapper.
  // Prefer per-platform label spans; fall back to plain anchors.
  const linkSpecs = [];
  const labelSpans = Array.from(element.querySelectorAll('.cmp-button__text'));
  if (labelSpans.length) {
    labelSpans.forEach((span) => {
      const label = span.textContent.trim();
      if (!label) return;
      const anchor = span.closest('a[href]');
      linkSpecs.push({ label, href: anchor ? anchor.getAttribute('href') || '#' : '#' });
    });
  } else {
    Array.from(element.querySelectorAll('a[href]')).forEach((anchor) => {
      const label = anchor.textContent.trim();
      if (label) linkSpecs.push({ label, href: anchor.getAttribute('href') || '#' });
    });
  }

  if (linkSpecs.length) {
    const ul = document.createElement('ul');
    linkSpecs.forEach(({ label, href }) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      li.append(a);
      ul.append(li);
    });
    body.push(ul);
  }

  if (!image && !body.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[image || '', body]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-profile', cells });
  element.replaceWith(block);
}
