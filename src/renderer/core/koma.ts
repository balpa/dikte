/**
 * 53-TET (Koma) System Mathematics
 *
 * The Turkish classical music system divides the octave into 53 equal parts (koma).
 * Reference: D4 = 220 Hz, which is Re4 at koma position 9 from C4.
 */

// One koma = 2^(1/53) frequency ratio
const KOMA_RATIO = Math.pow(2, 1 / 53)

// D4 = 220 Hz, D4 is 9 koma above C4
const RE4_HZ = 220
const RE4_KOMA_FROM_C4 = 9

// Natural note koma offsets within one octave
export const NATURAL_KOMA: Record<string, number> = {
  C: 0,
  D: 9,
  E: 17,
  F: 22,
  G: 31,
  A: 40,
  B: 48
}

/**
 * Convert an absolute koma position (from C4) to frequency in Hz.
 */
export function komaToHz(komaFromC4: number): number {
  const komaFromRe4 = komaFromC4 - RE4_KOMA_FROM_C4
  return RE4_HZ * Math.pow(KOMA_RATIO, komaFromRe4)
}

/**
 * Convert a frequency in Hz to the nearest absolute koma position (from C4).
 */
export function hzToKoma(hz: number): number {
  if (hz <= 0) return 0
  const komaFromRe4 = Math.round(
    Math.log(hz / RE4_HZ) / Math.log(KOMA_RATIO)
  )
  return komaFromRe4 + RE4_KOMA_FROM_C4
}

/**
 * Get the cents deviation of an Hz value from its nearest koma.
 * Useful for tuner display.
 */
export function hzToKomaWithCents(hz: number): { koma: number; cents: number } {
  if (hz <= 0) return { koma: 0, cents: 0 }
  const exactKomaFromRe4 = Math.log(hz / RE4_HZ) / Math.log(KOMA_RATIO)
  const roundedKoma = Math.round(exactKomaFromRe4)
  const centsPerKoma = 1200 / 53 // ~22.64 cents
  const cents = (exactKomaFromRe4 - roundedKoma) * centsPerKoma
  return {
    koma: roundedKoma + RE4_KOMA_FROM_C4,
    cents: Math.round(cents * 10) / 10
  }
}

/**
 * Compute absolute koma from C4 given a natural note, octave, and koma offset from accidental.
 */
export function absoluteKoma(
  natural: string,
  octave: number,
  accidentalKomaOffset: number
): number {
  const baseKoma = NATURAL_KOMA[natural] ?? 0
  const octaveOffset = (octave - 4) * 53
  return baseKoma + octaveOffset + accidentalKomaOffset
}
