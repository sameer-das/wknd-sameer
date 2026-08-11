/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-hero. Base: carousel.
 * Source: https://wknd.site/us/en.html (hero carousel)
 * Generated: 2026-08-10
 *
 * Convention (carousel): 2-column block. Row 1 = block name. Each subsequent
 * row is one slide: cell 1 = image, cell 2 = text content (title heading,
 * description, CTA link). The carousel-hero decorator reads each row's first
 * column as the slide image and second column as the slide content.
 */
export default function parse(element, { document }) {
  // Each slide is a carousel item; fall back to teaser wrappers if the item
  // class differs on other pages.
  let slides = Array.from(element.querySelectorAll('.cmp-carousel__item'));
  if (!slides.length) slides = Array.from(element.querySelectorAll('.teaser, .cmp-teaser'));

  const cells = [];
  slides.forEach((slide) => {
    const image = slide.querySelector('.cmp-teaser__image img, .cmp-image img, img');
    const title = slide.querySelector('.cmp-teaser__title, h1, h2, h3');
    const description = slide.querySelector('.cmp-teaser__description');
    const cta = slide.querySelector('.cmp-teaser__action-link, .cmp-teaser__action-container a');

    const content = [];
    if (title) content.push(title);
    if (description) content.push(description);
    if (cta) content.push(cta);

    // Only emit a slide row when it has an image or some content.
    if (image || content.length) {
      cells.push([image || '', content]);
    }
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-hero', cells });
  element.replaceWith(block);
}
