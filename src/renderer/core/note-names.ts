import { NaturalNote } from '../types'

/**
 * Turkish note names (Türkçe nota isimleri)
 */
export const TURKISH_NOTE_NAMES: Record<NaturalNote, string> = {
  C: 'Do',
  D: 'Re',
  E: 'Mi',
  F: 'Fa',
  G: 'Sol',
  A: 'La',
  B: 'Si'
}

/**
 * VexFlow key mapping for natural notes.
 * VexFlow uses lowercase letters with octave: "c/4", "d/5", etc.
 */
export function noteToVexFlowKey(natural: NaturalNote, octave: number): string {
  return `${natural.toLowerCase()}/${octave}`
}

/**
 * Natural notes in order from C.
 */
export const NATURAL_NOTES: NaturalNote[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

/**
 * Convert a koma position within an octave (0-52) to the nearest natural note and accidental offset.
 */
export function komaToNatural(komaInOctave: number): {
  natural: NaturalNote
  accidentalKoma: number
} {
  // Natural koma positions within an octave
  const positions: [NaturalNote, number][] = [
    ['C', 0],
    ['D', 9],
    ['E', 17],
    ['F', 22],
    ['G', 31],
    ['A', 40],
    ['B', 48]
  ]

  let bestNote: NaturalNote = 'C'
  let bestDiff = Infinity

  for (const [note, koma] of positions) {
    const diff = komaInOctave - koma
    if (Math.abs(diff) < Math.abs(bestDiff)) {
      bestDiff = diff
      bestNote = note
    }
  }

  return { natural: bestNote, accidentalKoma: bestDiff }
}
