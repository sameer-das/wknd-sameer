import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * cards-profile block
 *
 * A profile / team card grid variant of the cards block. Each card presents a
 * person: a round profile photo, a name, a role/eyebrow line, and a row of
 * social icon links.
 *
 * Expected content structure (one row per person, 2 cells):
 *   Cell 1: profile image (picture)
 *   Cell 2: name (heading) + role (paragraph) + a list of social links
 *           (link text is the platform name, e.g. Facebook / Twitter / Instagram)
 */

const ICON_PLATFORMS = ['facebook', 'twitter', 'x', 'instagram', 'linkedin', 'youtube'];

function platformKey(label = '') {
  const normalized = label.trim().toLowerCase();
  return ICON_PLATFORMS.find((p) => normalized.includes(p))
    || (normalized.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'link');
}

function decorateSocial(body) {
  // Collect all links in the card body and render them as an accessible
  // horizontal row of platform-keyed icon buttons.
  const anchors = [...body.querySelectorAll('a')];
  if (!anchors.length) return;

  const nav = document.createElement('nav');
  nav.className = 'cards-profile-social';
  nav.setAttribute('aria-label', 'Social links');

  anchors.forEach((anchor) => {
    const label = anchor.textContent.trim();
    const key = platformKey(label);
    anchor.className = `cards-profile-social-link cards-profile-social-${key}`;
    anchor.setAttribute('aria-label', label || key);
    anchor.rel = 'noopener';

    const icon = document.createElement('span');
    icon.className = `cards-profile-social-icon cards-profile-social-icon-${key}`;
    icon.setAttribute('aria-hidden', 'true');

    const text = document.createElement('span');
    text.className = 'cards-profile-social-text';
    text.textContent = label || key;

    anchor.textContent = '';
    anchor.append(icon, text);
    // Detach the anchor from whatever list wrapper it was in and re-home it.
    nav.append(anchor);
  });

  // Remove now-empty list wrappers left behind by the moved anchors.
  body.querySelectorAll('ul, ol').forEach((list) => {
    if (!list.querySelector('a')) list.remove();
  });

  body.append(nav);
}

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-profile-card-image';
      else div.className = 'cards-profile-card-body';
    });
    const body = li.querySelector('.cards-profile-card-body');
    if (body) decorateSocial(body);
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.replaceChildren(ul);
}
