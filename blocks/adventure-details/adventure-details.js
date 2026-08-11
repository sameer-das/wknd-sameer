/*
 * adventure-details block
 *
 * Renders a compact "trip details" info card of labeled key/value fields
 * (e.g. Activity, Adventure Type, Trip Length, Group Size, Difficulty, Price)
 * as an accessible definition list.
 *
 * Expected content structure (authored as a table):
 *   Each row has two cells:
 *     Cell 1: field label (e.g. "Activity")
 *     Cell 2: field value (e.g. "Surfing")
 *
 * A single-cell row is treated as a caption/heading for the panel and is
 * rendered above the list. Empty rows and empty cells are skipped gracefully.
 *
 * Output: a <dl> with one <dt> (label) + <dd> (value) per field. Labels are
 * uppercased via CSS; markup stays semantic for screen readers.
 */

export default function decorate(block) {
  const captions = [];
  const dl = document.createElement('dl');
  dl.className = 'adventure-details-list';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (!cells.length) return;

    const label = cells[0] ? cells[0].textContent.trim() : '';

    // Single-cell row → optional panel caption/heading.
    if (cells.length === 1) {
      if (!label) return;
      const caption = document.createElement('p');
      caption.className = 'adventure-details-caption';
      caption.textContent = label;
      captions.push(caption);
      return;
    }

    const value = cells[1] ? cells[1].textContent.trim() : '';
    if (!label && !value) return;

    const item = document.createElement('div');
    item.className = 'adventure-details-row';

    const dt = document.createElement('dt');
    dt.className = 'adventure-details-label';
    dt.textContent = label;

    const dd = document.createElement('dd');
    dd.className = 'adventure-details-value';
    dd.textContent = value;

    item.append(dt, dd);
    dl.append(item);
  });

  block.replaceChildren(...captions, dl);
}
