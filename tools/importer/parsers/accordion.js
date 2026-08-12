/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion. Base: accordion.
 * Source: https://wknd.site/us/en/faqs.html (AEM core-components cmp-accordion, FAQ Q&A)
 * Generated: 2026-08-12
 *
 * Convention (accordion): 2-column block. Row 1 = block name. Each subsequent
 * row is one accordion item: cell 1 = the question/title (plain text/heading),
 * cell 2 = the answer (rich content — paragraphs, links, lists, formatting).
 * The accordion decorator turns each row into
 * <details><summary>question</summary><div>answer</div></details>.
 *
 * Source structure (per item):
 *   .cmp-accordion__item
 *     > h3.cmp-accordion__header > button.cmp-accordion__button
 *         > span.cmp-accordion__title   (the question)
 *     > .cmp-accordion__panel
 *         > .container > .cmp-container > .text > .cmp-text > <p>… (the answer)
 */
export default function parse(element, { document }) {
  // Each accordion item is one Q&A row. Fallbacks cover markup variations.
  const items = Array.from(
    element.querySelectorAll('.cmp-accordion__item, [class*="accordion__item"]'),
  );

  const cells = [];
  items.forEach((item) => {
    // --- Cell 1: the question / title ---
    const titleEl = item.querySelector(
      '.cmp-accordion__title, .cmp-accordion__button, [class*="accordion__title"], [class*="accordion__button"]',
    );
    const question = titleEl ? titleEl.textContent.replace(/\s+/g, ' ').trim() : '';

    // --- Cell 2: the answer / panel content (preserve rich HTML) ---
    const panel = item.querySelector(
      '.cmp-accordion__panel, [class*="accordion__panel"]',
    );

    const answerContent = [];
    if (panel) {
      // Prefer the inner rich-text blocks; append their real content children
      // (paragraphs, headings, lists) so links/formatting are preserved.
      const textBlocks = Array.from(panel.querySelectorAll('.cmp-text, [class*="cmp-text"]'));
      if (textBlocks.length) {
        textBlocks.forEach((tb) => {
          Array.from(tb.children).forEach((child) => {
            // Drop empty spacer elements (e.g. <h3>&nbsp;</h3>).
            if (child.textContent.trim() || child.querySelector('img, a')) {
              answerContent.push(child);
            }
          });
        });
      }
      // Fallback: no .cmp-text wrapper — grab semantic content directly.
      if (!answerContent.length) {
        Array.from(
          panel.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, img, blockquote'),
        ).forEach((el) => {
          if (el.textContent.trim() || el.querySelector('img, a') || el.tagName === 'IMG') {
            answerContent.push(el);
          }
        });
      }
      // Last resort: wrap the panel's plain text in a paragraph.
      if (!answerContent.length && panel.textContent.trim()) {
        const p = document.createElement('p');
        p.textContent = panel.textContent.replace(/\s+/g, ' ').trim();
        answerContent.push(p);
      }
    }

    // Only emit rows that carry a question or an answer.
    if (question || answerContent.length) {
      cells.push([question, answerContent.length ? answerContent : '']);
    }
  });

  // Empty-block guard: nothing extractable — unwrap in place.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion', cells });
  element.replaceWith(block);
}
