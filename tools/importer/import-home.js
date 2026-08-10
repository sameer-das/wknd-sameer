/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import carouselHeroParser from './parsers/carousel-hero.js';
import columnsFeaturedParser from './parsers/columns-featured.js';
import articleListParser from './parsers/article-list.js';
import heroParser from './parsers/hero.js';
import cardsParser from './parsers/cards.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  'carousel-hero': carouselHeroParser,
  'columns-featured': columnsFeaturedParser,
  'article-list': articleListParser,
  hero: heroParser,
  cards: cardsParser,
};

// TRANSFORMER REGISTRY (cleanup first, then section boundaries)
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION (embedded from page-templates.json)
const PAGE_TEMPLATE = {
  name: 'home',
  description: 'WKND site homepage.',
  urls: ['https://wknd.site/us/en.html'],
  blocks: [
    {
      name: 'carousel-hero',
      instances: ['div.carousel.cmp-carousel--hero'],
    },
    {
      name: 'columns-featured',
      instances: ['div.teaser.cmp-teaser--featured'],
    },
    {
      name: 'article-list',
      instances: ['main.cmp-layout-container--fixed:nth-of-type(1) div.image-list.list'],
    },
    {
      name: 'hero',
      instances: ['div.teaser.cmp-teaser--hero.cmp-teaser--imagebottom'],
    },
    {
      name: 'cards',
      instances: ['main.cmp-layout-container--fixed:nth-of-type(2) div.image-list.list'],
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

    // 1. beforeTransform cleanup
    executeTransformers('beforeTransform', main, payload);

    // 2. find blocks
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. parse each block (skip elements already replaced by a prior parser)
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

    // 4. afterTransform cleanup + section breaks
    executeTransformers('afterTransform', main, payload);

    // 5. built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. path
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
