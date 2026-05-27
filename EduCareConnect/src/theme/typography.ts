/**
 * Typography tokens. Prefer Paper's `variant` prop (e.g. `bodyMedium`,
 * `labelSmall`) over inline `fontSize` literals; this file only carries
 * the few primitives that Paper doesn't expose directly.
 */

export const FONT_WEIGHTS = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  heavy: "800",
} as const;

export type FontWeightToken = keyof typeof FONT_WEIGHTS;

/**
 * Custom font sizes used in places where Paper's MD3 variants don't fit
 * (chip captions, hero numbers, etc). Keep this list small — adding here
 * should be the exception, not the rule.
 */
export const FONT_SIZES = {
  micro: 9,
  caption: 11,
  small: 12,
  body: 13,
  bodyLg: 14,
  title: 15,
  titleLg: 17,
  hero: 20,
} as const;

export type FontSizeToken = keyof typeof FONT_SIZES;
