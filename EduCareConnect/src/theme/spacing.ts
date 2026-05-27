/**
 * Spacing tokens used across the app. Prefer these over inline pixel values
 * so that future global adjustments are a one-line change.
 *
 * Naming follows a t-shirt scale; the values match the pixel grid the
 * existing screens already use (4 / 8 / 12 / 16 / 20 / 24 / 32).
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export type SpacingToken = keyof typeof SPACING;

/**
 * Border-radius tokens. Mirrors the spacing scale where it's commonly used.
 */
export const RADIUS = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  xxl: 16,
  pill: 20,
  round: 9999,
} as const;

export type RadiusToken = keyof typeof RADIUS;
