import { AccidentalDef, AccidentalType } from '../types'

/**
 * Arel-Ezgi-Uzdilek (AEU) accidental definitions.
 * Each accidental raises or lowers a note by a specific number of koma.
 */
export const ACCIDENTALS: AccidentalDef[] = [
  { type: 'none', komaOffset: 0, nameTr: 'Natürel', nameEn: 'Natural', symbol: '' },
  // Sharps (raising)
  { type: 'fazla_sharp', komaOffset: 1, nameTr: 'Fazla diyez', nameEn: 'Fazla sharp', symbol: '𝄪¹' },
  { type: 'bakiye_sharp', komaOffset: 4, nameTr: 'Bakiye diyez', nameEn: 'Bakiye sharp', symbol: '♯ᵇ' },
  { type: 'kucuk_sharp', komaOffset: 5, nameTr: 'Küçük mücenneb diyez', nameEn: 'Kücük müc. sharp', symbol: '♯ᵏ' },
  { type: 'buyuk_sharp', komaOffset: 8, nameTr: 'Büyük mücenneb diyez', nameEn: 'Büyük müc. sharp', symbol: '♯ᴮ' },
  { type: 'tanini_sharp', komaOffset: 9, nameTr: 'Tanini diyez', nameEn: 'Tanini sharp', symbol: '♯♯' },
  // Flats (lowering)
  { type: 'fazla_flat', komaOffset: -1, nameTr: 'Fazla bemol', nameEn: 'Fazla flat', symbol: '♭¹' },
  { type: 'bakiye_flat', komaOffset: -4, nameTr: 'Bakiye bemol', nameEn: 'Bakiye flat', symbol: '♭ᵇ' },
  { type: 'kucuk_flat', komaOffset: -5, nameTr: 'Küçük mücenneb bemol', nameEn: 'Kücük müc. flat', symbol: '♭ᵏ' },
  { type: 'buyuk_flat', komaOffset: -8, nameTr: 'Büyük mücenneb bemol', nameEn: 'Büyük müc. flat', symbol: '♭ᴮ' },
  { type: 'tanini_flat', komaOffset: -9, nameTr: 'Tanini bemol', nameEn: 'Tanini flat', symbol: '♭♭' }
]

export const ACCIDENTAL_MAP: Record<AccidentalType, AccidentalDef> = Object.fromEntries(
  ACCIDENTALS.map((a) => [a.type, a])
) as Record<AccidentalType, AccidentalDef>

export function getAccidentalOffset(type: AccidentalType): number {
  return ACCIDENTAL_MAP[type]?.komaOffset ?? 0
}

/**
 * Get sharps only (for the toolbar palette).
 */
export function getSharps(): AccidentalDef[] {
  return ACCIDENTALS.filter((a) => a.komaOffset > 0)
}

/**
 * Get flats only.
 */
export function getFlats(): AccidentalDef[] {
  return ACCIDENTALS.filter((a) => a.komaOffset < 0)
}
