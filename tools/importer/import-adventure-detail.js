/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import adventureDetailsParser from './parsers/adventure-details.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  'adventure-details': adventureDetailsParser,
};

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// Primary category per adventure (drives the adventures-landing filter tabs).
// Derived from the source's "Current Adventures" tab membership; adventures that
// only appear under "All" are mapped by their primary activity.
const ADVENTURE_CATEGORIES = {
  'climbing-new-zealand': 'Climbing',
  'colorado-rock-climbing': 'Climbing',
  'whistler-mountain-biking': 'Cycling',
  'cycling-tuscany': 'Cycling',
  'west-coast-cycling': 'Cycling',
  'cycling-southern-utah': 'Cycling',
  'downhill-skiing-wyoming': 'Skiing',
  'ski-touring-mont-blanc': 'Skiing',
  'tahoe-skiing': 'Skiing',
  'bali-surf-camp': 'Surfing',
  'surf-camp-costa-rica': 'Surfing',
  'beervana-portland': 'Travel',
  'gastronomic-marais-tour': 'Travel',
  'napa-wine-tasting': 'Travel',
  'riverside-camping-australia': 'Travel',
  'yosemite-backpacking': 'Travel',
};

function categoryForUrl(originalURL) {
  try {
    const m = new URL(originalURL).pathname.match(/\/adventures\/([a-z0-9-]+)(?:\.html?)?$/i);
    return m ? ADVENTURE_CATEGORIES[m[1]] : null;
  } catch (e) {
    return null;
  }
}

// PAGE TEMPLATE CONFIGURATION (embedded from page-templates.json)
const PAGE_TEMPLATE = {
  name: 'adventure-detail',
  description: 'Adventure detail page.',
  urls: [
    'https://wknd.site/us/en/adventures/bali-surf-camp.html',
    'https://wknd.site/us/en/adventures/beervana-portland.html',
    'https://wknd.site/us/en/adventures/climbing-new-zealand.html',
    'https://wknd.site/us/en/adventures/colorado-rock-climbing.html',
    'https://wknd.site/us/en/adventures/cycling-southern-utah.html',
    'https://wknd.site/us/en/adventures/cycling-tuscany.html',
    'https://wknd.site/us/en/adventures/downhill-skiing-wyoming.html',
    'https://wknd.site/us/en/adventures/gastronomic-marais-tour.html',
    'https://wknd.site/us/en/adventures/napa-wine-tasting.html',
    'https://wknd.site/us/en/adventures/riverside-camping-australia.html',
    'https://wknd.site/us/en/adventures/ski-touring-mont-blanc.html',
    'https://wknd.site/us/en/adventures/surf-camp-costa-rica.html',
    'https://wknd.site/us/en/adventures/tahoe-skiing.html',
    'https://wknd.site/us/en/adventures/west-coast-cycling.html',
    'https://wknd.site/us/en/adventures/whistler-mountain-biking.html',
    'https://wknd.site/us/en/adventures/yosemite-backpacking.html',
  ],
  blocks: [
    {
      name: 'adventure-details',
      instances: ['div.contentfragment.cmp-contentfragment--elements'],
    },
    // Note: the source "Share this Adventure" widget is rendered by third-party
    // JS SDKs (Facebook/Pinterest) with no static anchor links, so there is no
    // social-links block here — the heading remains as default content.
  ],
};

/**
 * Map a WKND source path to the clean EDS document path.
 * /us/en                 -> /index
 * /us/en/adventures      -> /adventures
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

    // Capture the adventure's lead/hero image before cleanup for og:image.
    const heroImg = main.querySelector('main .cmp-image img, main img')
      || [...main.querySelectorAll('img')].find(
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

    // Collect the article-body images into a single image CAROUSEL block placed
    // at the top of the content, so all photos display as a clickable gallery
    // (prev/next + dots) instead of scattered inline. The adventure-details
    // panel is already a block <table> by this point, so its image is excluded
    // by skipping any <img> inside a <table>.
    const bodyImages = [...main.querySelectorAll('img')].filter((img) => {
      if (img.closest('table')) return false; // inside the details/metadata block
      const src = img.getAttribute('src') || '';
      return src && !/logo|header|footer|\.svg(?:$|[?#])/i.test(src);
    });
    if (bodyImages.length > 1) {
      // Build the carousel block table: header row "carousel", then one image
      // per row (clone each image so it survives removal of its original <p>).
      const cells = [['carousel']];
      bodyImages.forEach((img) => {
        cells.push([img.cloneNode(true)]);
      });
      const carousel = WebImporter.Blocks.createBlock(document, { name: 'carousel', cells });

      // Remove the original inline image paragraphs/wrappers.
      bodyImages.forEach((img) => {
        const p = img.closest('p') || img.closest('picture') || img;
        (p || img).remove();
      });

      // Place the carousel at the very top of the main content.
      main.insertBefore(carousel, main.firstChild);
    }

    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);

    // Locate the Metadata block appended by createMetadata for augmentation.
    const metaTable = [...main.querySelectorAll('table')].find((t) => {
      const first = t.querySelector('th, td');
      return first && first.textContent.trim().toLowerCase() === 'metadata';
    });
    const addMetaRow = (key, valueNode) => {
      if (!metaTable) return;
      const tbody = metaTable.querySelector('tbody') || metaTable;
      const tr = document.createElement('tr');
      const k = document.createElement('td');
      k.textContent = key;
      const v = document.createElement('td');
      if (typeof valueNode === 'string') v.textContent = valueNode;
      else v.append(valueNode);
      tr.append(k, v);
      tbody.append(tr);
    };

    // Add a representative Image to the Metadata block (og:image) if the page
    // has a lead image and createMetadata didn't already capture one.
    if (heroImg && heroImg.src && metaTable && !/>\s*image\s*</i.test(metaTable.innerHTML)) {
      const img = document.createElement('img');
      img.src = heroImg.src;
      img.alt = heroImg.alt || document.title;
      addMetaRow('Image', img);
    }

    // Add the adventure's Category so it lands in the query index and drives the
    // adventures-landing filter tabs.
    const category = categoryForUrl(params.originalURL);
    if (category && metaTable && !/>\s*category\s*</i.test(metaTable.innerHTML)) {
      addMetaRow('Category', category);
    }

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
