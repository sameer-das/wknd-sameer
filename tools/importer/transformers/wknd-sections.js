/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND section boundaries.
 *
 * Establishes EDS section boundaries (rendered as `---` thematic breaks in the
 * imported document) at the points where the WKND source authored a visible
 * separator component. The importer converts a top-level <hr> into a section
 * break, so this transformer normalizes each authored source separator into a
 * clean <hr>.
 *
 * Section boundaries are taken directly from the archived page-structure.json
 * analysis (not guessed):
 *   - home  (migration-work/templates/home/page-structure.json): the notes
 *     state the many grid components "collapse into logical authoring sections
 *     delimited by the two source separators (indices 6 and 12)". Those are the
 *     two authored div.separator components after 'All Articles' and after
 *     'All Trips' -> 3 logical sections.
 *   - magazine-article (migration-work/templates/magazine-article/page-structure.json):
 *     section 5 records the <hr> separator that divides the article body from
 *     the author bio + social links block -> 2 logical sections.
 *   - magazine-landing: the visible div.separator.cmp-separator--space-medium
 *     before the 'Members Only' teaser row -> boundary before the gated cards.
 *   - about: no authored content separators between its sections -> no breaks
 *     inserted (the only separators are the hidden footer spacer, which is
 *     chrome and excluded below).
 *
 * Source separator markup (verified in cleaned.html), e.g. home lines 351-355:
 *   <div class="separator aem-GridColumn ...">
 *     <div id="separator-xxx" class="cmp-separator">
 *       <hr class="cmp-separator__horizontal-rule">
 *     </div>
 *   </div>
 *
 * Excluded (chrome / non-content), verified in cleaned.html:
 *   - .cmp-separator--hidden : footer spacing separators (home line 542) that
 *     are visually hidden and not content boundaries.
 *   - separators inside .cmp-experiencefragment--header / --footer : shared
 *     experience-fragment chrome (removed entirely by wknd-cleanup.js; skipped
 *     here so this transformer is also correct when run standalone).
 *
 * Note on Section Metadata: the page analysis does not assign EDS section
 * styles (no background/appearance styles an author would set via a Section
 * Metadata block), so no Section Metadata blocks are fabricated here. This
 * transformer emits section breaks only, as required.
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.afterTransform) {
    const doc = element.ownerDocument || document;

    // Every authored separator carries an <hr class="cmp-separator__horizontal-rule">.
    element.querySelectorAll('hr.cmp-separator__horizontal-rule').forEach((hr) => {
      // Resolve the authored separator component wrapper (div.separator).
      const wrapper = hr.closest('.separator') || hr.parentElement;
      if (!wrapper) return;

      // Skip hidden footer spacing separators (not content boundaries).
      if (wrapper.classList && wrapper.classList.contains('cmp-separator--hidden')) return;

      // Skip separators that belong to the shared header/footer experience
      // fragments (site chrome, migrated separately).
      if (hr.closest('.cmp-experiencefragment--header, .cmp-experiencefragment--footer')) return;

      // Replace the authored separator component with a single clean, top-level
      // <hr> so the importer renders an EDS section break ("---").
      const sectionBreak = doc.createElement('hr');
      wrapper.replaceWith(sectionBreak);
    });
  }
}
