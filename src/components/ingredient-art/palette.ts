/**
 * Food colours for the ingredient illustrations.
 *
 * Produce colours aren't theme tokens: a tomato is red whatever the accent
 * is. They live here, once, so every drawing pulls from the same small box
 * of crayons and the set reads as one family. Tuned to sit on the near-white
 * ground — saturated enough to pop at 32px, never neon.
 */
export const INK = '#3b2a22' // warm near-black outline, shared by every icon
export const STROKE = 2 // outline width in the 48×48 viewBox

export const C = {
  red: '#e5574a',
  redDark: '#b93b31',
  pink: '#f3a59b',
  orange: '#f28d35',
  orangeLight: '#f8b465',
  yellow: '#f6cd4c',
  yellowLight: '#fbe7a1',
  cream: '#fdf4dc',
  white: '#fffdf8',
  green: '#7dbb57',
  greenDark: '#4e8f3e',
  greenLight: '#b4d97a',
  avocadoFlesh: '#e3e89a',
  brown: '#b9794a',
  brownDark: '#86502f',
  rose: '#c0614f', // sweet potato skin
  tan: '#e4b77c',
  tanLight: '#f1d4a4',
  purple: '#7b5aa6',
  blue: '#5b78cf',
  grey: '#9aa0a6',
  greyLight: '#d9dcde',
  /** Soft white sheen on rounded produce. */
  shine: 'rgb(255 255 255 / 0.55)',
} as const
