/* eslint-disable */
/* global WebImporter */
/**
 * Parser for adventure-details. Base: adventure-details.
 * Source: https://wknd.site/us/en/adventures/*.html ("TRIP DETAILS" panel)
 * Generated: 2026-08-11
 *
 * The adventure-details block is a compact "trip details" key/value panel. The
 * decorator (blocks/adventure-details/adventure-details.js) expects a 2-column
 * table: one row per field where cell 1 = label and cell 2 = value. It builds a
 * <dl> with one <dt> (label) + <dd> (value) per row. Single-cell rows are treated
 * as an optional caption/heading.
 *
 * Source is an AEM content-fragment element list:
 *   <dl class="cmp-contentfragment__elements">
 *     <div class="cmp-contentfragment__element">
 *       <dt class="cmp-contentfragment__element-title">Activity</dt>
 *       <dd class="cmp-contentfragment__element-value">Surfing</dd>
 *     </div>
 *     ... (6 elements: Activity, Adventure Type, Trip Length, Group Size,
 *          Difficulty, Price)
 *   </dl>
 *
 * Emitted block structure (one row per field, 2 columns):
 *   | adventure-details       |
 *   | Activity | Surfing      |
 *   | Difficulty | Beginner   |
 *   | Price | 5000.0          |
 *   | ...                     |
 */
export default function parse(element, { document }) {
  // Each field is a content-fragment element with a title (label) and a value.
  const fields = Array.from(element.querySelectorAll('.cmp-contentfragment__element'));

  const cells = [];
  fields.forEach((field) => {
    const labelEl = field.querySelector('.cmp-contentfragment__element-title, dt');
    const valueEl = field.querySelector('.cmp-contentfragment__element-value, dd');

    const label = labelEl ? labelEl.textContent.trim() : '';
    const value = valueEl ? valueEl.textContent.trim() : '';

    // Skip fields with no label and no value; pad missing sides so every row
    // keeps 2 columns (matches the decorator's label|value contract).
    if (!label && !value) return;
    cells.push([label, value]);
  });

  // Empty-block guard: no recognizable fields → unwrap rather than emit an empty block.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'adventure-details', cells });
  element.replaceWith(block);
}
