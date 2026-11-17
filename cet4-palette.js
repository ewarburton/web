/* Verdict palette, shared by index.html and palette-preview.html.
   One source of truth: edit here, not in either page.

   The left colour of a verdict box is the verdict (green = unhalting side,
   red = halting side). The right colour is the step axis, and only appears
   when the tier actually has a halting verdict. Text is black on the colour;
   every swatch clears WCAG AA (4.5:1). */
window.CET4_PALETTE = {
  verdict: [
    { h: 145, s: 52, l: 64, name: 'unhalting' },
    { h: 85,  s: 52, l: 63, name: 'likely unhalting' },
    { h: 45,  s: 68, l: 64, name: 'no clue' },
    { h: 26,  s: 78, l: 63, name: 'likely halting' },
    { h: 14,  s: 78, l: 62, name: '>99% halting' },
    { h: 2,   s: 72, l: 63, name: 'halting' }
  ],
  step: [
    { h: 180, s: 52, l: 60, name: 'Unclaimed step' },
    { h: 220, s: 60, l: 68, name: 'Claimed step, unlikely true' },
    { h: 260, s: 52, l: 70, name: 'Claimed step, likely true' },
    { h: 300, s: 52, l: 70, name: 'Proven step' }
  ]
};
