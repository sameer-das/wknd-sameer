/*
 * Accordion Block
 * Transforms a table of question/answer rows into an accessible, no-JS-toggle
 * accordion built on native <details>/<summary> elements.
 * Content model: each block row = one item; cell 1 = question, cell 2 = answer.
 * https://www.aem.live/developer/block-collection/accordion
 */

/**
 * loads and decorates the accordion block
 * @param {Element} block The accordion block element
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const label = row.children[0];
    const body = row.children[1];
    // Skip malformed rows that don't have both a question and an answer cell.
    if (!label || !body) return;

    // decorate accordion item label (the question / summary)
    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    summary.append(...label.childNodes);

    // decorate accordion item body (the answer / panel)
    body.className = 'accordion-item-body';

    // decorate accordion item as a native disclosure widget
    const details = document.createElement('details');
    details.className = 'accordion-item';
    details.append(summary, body);
    row.replaceWith(details);
  });
}
