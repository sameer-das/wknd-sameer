/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import articleAuthorParser from './parsers/article-author.js';
import socialLinksParser from './parsers/social-links.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// HELPER IMPORTS
import augmentArticleMetadata from './helpers/article-metadata.js';

// PARSER REGISTRY
const parsers = {
  'article-author': articleAuthorParser,
  'social-links': socialLinksParser,
};

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION (embedded from page-templates.json)
const PAGE_TEMPLATE = {
  name: 'magazine-article',
  description: 'Magazine article detail page.',
  urls: [
    'https://wknd.site/us/en/magazine/arctic-surfing.html',
    'https://wknd.site/us/en/magazine/guide-la-skateparks.html',
    'https://wknd.site/us/en/magazine/san-diego-surf.html',
    'https://wknd.site/us/en/magazine/ski-touring.html',
    'https://wknd.site/us/en/magazine/western-australia.html',
  ],
  blocks: [
    {
      name: 'article-author',
      // Prefer the inner byline; the outer wrapper is a superset of the same
      // content, so matching only the inner selector avoids a duplicate block.
      instances: ['main .cmp-byline'],
    },
    {
      name: 'social-links',
      instances: ['main .buildingblock.cmp-buildingblock--btn-list'],
    },
  ],
};

/**
 * Map a WKND source path to the clean EDS document path.
 * /us/en                -> /index (root; empty path would crash the importer)
 * /us/en/magazine       -> /magazine
 * /us/en/magazine/<x>   -> /magazine/<x>
 * /us/en/about-us       -> /about
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
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
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

    // Capture the article's lead/hero image before cleanup + parsing move or
    // strip it, so it can be reused as the metadata (og:image) thumbnail.
    // Target the article body's lead image specifically — NOT the header logo,
    // which is the document's first <img>. The article hero lives in the main
    // content container's first image component.
    const heroImg = main.querySelector(
      'main .cmp-image img, main img, .cmp-article__lead img',
    ) || [...main.querySelectorAll('img')].find(
      (im) => im.src && !/logo|header|footer|\.svg(?:$|[?#])/i.test(im.src),
    ) || null;

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

    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    // Augment the Metadata block with Author / Publication Date / Image so the
    // query index and per-page SEO metadata are rich (runs AFTER createMetadata).
    augmentArticleMetadata(main, document, params.originalURL, heroImg);
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
