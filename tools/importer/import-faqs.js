/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import accordionParser from './parsers/accordion.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  accordion: accordionParser,
};

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION (embedded from page-templates.json)
const PAGE_TEMPLATE = {
  name: 'faqs',
  description: 'FAQs page.',
  urls: ['https://wknd.site/us/en/faqs.html'],
  blocks: [
    {
      name: 'accordion',
      instances: ['div.accordion.cmp-accordion', 'div.cmp-accordion'],
    },
  ],
};

/**
 * Map a WKND source path to the clean EDS document path.
 * /us/en                 -> /index
 * /us/en/faqs            -> /faqs
 * /us/en/adventures/<x>  -> /adventures/<x>
 * /us/en/about-us        -> /about
 */
function toEdsPath(originalURL) {
  let p = new URL(originalURL).pathname.replace(/\/$/, '').replace(/\.html?$/, '');
  p = p.replace(/^\/us\/en\/about-us$/, '/about');
  p = p.replace(/^\/us\/en(\/.*)?$/, (m, rest) => (rest || ''));
  if (p === '') p = '/index';
  return WebImporter.FileUtils.sanitizePath(p);
}

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    // Use the first selector that matches, so a primary + fallback selector pair
    // doesn't produce duplicate blocks.
    let matched = false;
    blockDef.instances.forEach((selector) => {
      if (matched) return;
      const elements = document.querySelectorAll(selector);
      if (elements.length) {
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name, selector, element, section: blockDef.section || null,
          });
        });
        matched = true;
      }
    });
    if (!matched) console.warn(`Block "${blockDef.name}" selector not found`);
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    executeTransformers('afterTransform', main, payload);

    // FAQ-specific accessibility tidy-ups on the "Need more help?" default
    // content (it is not in a block, so we adjust it here):
    //  - the source marks it up as an <h3> directly under the page <h1>, which
    //    trips Lighthouse's sequential-heading rule; promote it to <h2>.
    //  - the phone/email are dead href="#" anchors; make them tel:/mailto: so
    //    they are meaningful, functional links.
    const helpHeading = [...main.querySelectorAll('h3')].find(
      (h) => /need more help/i.test(h.textContent),
    );
    if (helpHeading) {
      const h2 = document.createElement('h2');
      h2.id = helpHeading.id;
      while (helpHeading.firstChild) h2.append(helpHeading.firstChild);
      helpHeading.replaceWith(h2);
    }
    main.querySelectorAll('a[href="#"]').forEach((a) => {
      const text = a.textContent.trim();
      const telMatch = text.match(/[\d][\d\s\-().]{5,}\d/);
      if (/@/.test(text)) {
        // The email is split across text + anchor ("info" + "@wknd.com"); use a
        // best-effort mailto built from the visible address fragment.
        const addr = text.replace(/^[^a-z0-9@._-]*/i, '');
        a.setAttribute('href', `mailto:info${addr.startsWith('@') ? '' : '@'}${addr}`);
      } else if (telMatch) {
        a.setAttribute('href', `tel:${telMatch[0].replace(/[^\d+]/g, '')}`);
      }
    });

    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const path = toEdsPath(params.originalURL);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
