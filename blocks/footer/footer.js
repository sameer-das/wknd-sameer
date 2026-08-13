import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // Accessibility: the footer's "Follow Us" label is authored as an <h4>, which
  // skips heading levels (Lighthouse/axe `heading-order`) on pages whose last
  // content heading is above H3. Promote any footer heading to H2 so the global
  // outline never jumps — every page has an H1, so H1 -> H2 is always valid.
  footer.querySelectorAll('h1, h3, h4, h5, h6').forEach((h) => {
    const h2 = document.createElement('h2');
    [...h.attributes].forEach((a) => h2.setAttribute(a.name, a.value));
    while (h.firstChild) h2.append(h.firstChild);
    h.replaceWith(h2);
  });

  block.append(footer);
}
