/*
 * social-links block
 *
 * Renders a horizontal list of accessible social / follow links as icon
 * buttons (Facebook, Twitter/X, Instagram, etc.).
 *
 * Expected content structure (either shape is supported):
 *   A) One row per platform, 2 cells:
 *        Cell 1: platform name (e.g. "Facebook") - used as the label + icon key
 *        Cell 2: destination URL
 *   B) A single cell containing a list of links whose link text is the
 *      platform name.
 *
 * Each link is rendered as an <a> with an aria-label and a platform-keyed
 * icon span so styling/icons can be attached via CSS.
 */

// Platforms with a built-in icon glyph. Extend as needed.
const ICON_PLATFORMS = ['facebook', 'twitter', 'x', 'instagram'];
// Wider set of recognized platform names (icon may or may not exist yet).
const PLATFORMS = [...ICON_PLATFORMS, 'linkedin', 'youtube', 'pinterest', 'tiktok'];

function platformKey(label = '') {
  const normalized = label.trim().toLowerCase();
  const match = PLATFORMS.find((p) => normalized.includes(p));
  return match || (normalized.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'link');
}

function buildLink(label, href) {
  const name = (label || '').trim();
  const key = platformKey(name);
  const hasIcon = ICON_PLATFORMS.includes(key);
  const a = document.createElement('a');
  a.className = `social-links-link social-links-${key} ${hasIcon ? 'social-links-has-icon' : 'social-links-generic'}`;
  a.href = href || '#';
  a.setAttribute('aria-label', name || key);
  a.rel = 'noopener';
  if (href && /^https?:/i.test(href)) a.target = '_blank';

  const icon = document.createElement('span');
  icon.className = `social-links-icon social-links-icon-${key}`;
  icon.setAttribute('aria-hidden', 'true');

  const text = document.createElement('span');
  text.className = 'social-links-text';
  text.textContent = name || key;

  a.append(icon, text);
  return a;
}

export default function decorate(block) {
  const links = [];

  [...block.children].forEach((row) => {
    // Shape B: a cell containing anchors.
    const anchors = row.querySelectorAll('a');
    if (anchors.length) {
      anchors.forEach((anchor) => {
        links.push(buildLink(anchor.textContent, anchor.getAttribute('href')));
      });
      return;
    }

    // Shape A: platform name + URL cells.
    const cells = [...row.children];
    if (!cells.length) return;
    const label = cells[0] ? cells[0].textContent.trim() : '';
    const href = cells[1] ? cells[1].textContent.trim() : '#';
    if (label) links.push(buildLink(label, href));
  });

  const nav = document.createElement('nav');
  nav.className = 'social-links-list';
  nav.setAttribute('aria-label', 'Social links');
  links.forEach((link) => nav.append(link));

  block.replaceChildren(nav);
}
