import { AccidentalType, NaturalNote } from '../types'

/**
 * Makam (mode) definitions for Turkish classical music.
 * Each makam is defined by its ascending scale intervals in koma.
 */

export interface MakamDef {
  id: string
  nameTr: string
  nameEn: string
  // Intervals in koma between successive notes (ascending)
  intervals: number[]
  // Seyir (melodic progression) direction
  seyir: 'ascending' | 'descending' | 'mixed'
}

export interface MakamSignatureEntry {
  natural: NaturalNote
  accidental: AccidentalType
}

export const MAKAMLAR: MakamDef[] = [
  {
    id: 'rast',
    nameTr: 'Rast',
    nameEn: 'Rast',
    intervals: [9, 8, 5, 9, 9, 8, 5],
    seyir: 'ascending'
  },
  {
    id: 'ussak',
    nameTr: 'Uşşak',
    nameEn: 'Uşşak',
    intervals: [8, 5, 9, 9, 4, 5, 9],
    seyir: 'ascending'
  },
  {
    id: 'hicaz',
    nameTr: 'Hicaz',
    nameEn: 'Hicaz',
    intervals: [5, 12, 5, 9, 4, 5, 9],
    seyir: 'ascending'
  },
  {
    id: 'segah',
    nameTr: 'Segâh',
    nameEn: 'Segâh',
    intervals: [5, 9, 9, 8, 5, 9, 8],
    seyir: 'descending'
  },
  {
    id: 'huseyni',
    nameTr: 'Hüseyni',
    nameEn: 'Hüseyni',
    intervals: [8, 5, 9, 9, 8, 5, 9],
    seyir: 'ascending'
  },
  {
    id: 'kurdilihicazkar',
    nameTr: 'Kürdilihicazkâr',
    nameEn: 'Kürdilihicazkâr',
    intervals: [9, 4, 9, 9, 4, 9, 9],
    seyir: 'descending'
  },
  {
    id: 'nihavend',
    nameTr: 'Nihavend',
    nameEn: 'Nihavend',
    intervals: [9, 4, 9, 9, 4, 9, 9],
    seyir: 'ascending'
  },
  {
    id: 'buselik',
    nameTr: 'Buselik',
    nameEn: 'Buselik',
    intervals: [9, 4, 9, 9, 4, 9, 9],
    seyir: 'ascending'
  },
  {
    id: 'karcigar',
    nameTr: 'Karcığar',
    nameEn: 'Karcığar',
    intervals: [8, 5, 9, 5, 8, 4, 5],
    seyir: 'ascending'
  },
  {
    id: 'saba',
    nameTr: 'Sabâ',
    nameEn: 'Sabâ',
    intervals: [8, 5, 4, 5, 9, 4, 9],
    seyir: 'ascending'
  }
]

export function getMakam(id: string): MakamDef | undefined {
  return MAKAMLAR.find((m) => m.id === id)
}

const MAKAM_SIGNATURES: Record<string, MakamSignatureEntry[]> = {
  rast: [
    { natural: 'B', accidental: 'fazla_flat' },
    { natural: 'F', accidental: 'bakiye_sharp' }
  ],
  ussak: [
    { natural: 'B', accidental: 'fazla_flat' }
  ],
  hicaz: [
    { natural: 'B', accidental: 'bakiye_flat' },
    { natural: 'C', accidental: 'bakiye_sharp' }
  ],
  segah: [
    { natural: 'B', accidental: 'fazla_flat' },
    { natural: 'F', accidental: 'bakiye_sharp' }
  ],
  huseyni: [
    { natural: 'B', accidental: 'fazla_flat' },
    { natural: 'F', accidental: 'bakiye_sharp' }
  ],
  kurdilihicazkar: [
    { natural: 'B', accidental: 'kucuk_flat' },
    { natural: 'E', accidental: 'kucuk_flat' }
  ],
  nihavend: [
    { natural: 'B', accidental: 'kucuk_flat' },
    { natural: 'E', accidental: 'kucuk_flat' }
  ],
  buselik: [],
  karcigar: [
    { natural: 'B', accidental: 'fazla_flat' },
    { natural: 'E', accidental: 'bakiye_flat' },
    { natural: 'F', accidental: 'bakiye_sharp' }
  ],
  saba: [
    { natural: 'B', accidental: 'fazla_flat' },
    { natural: 'D', accidental: 'bakiye_flat' }
  ]
}

export function getMakamSignature(makamId: string): MakamSignatureEntry[] {
  return MAKAM_SIGNATURES[makamId] ?? []
}

/**
 * Generate the koma positions for a makam starting from a given base koma.
 */
export function makamScale(makamId: string, baseKoma: number): number[] {
  const makam = getMakam(makamId)
  if (!makam) return []

  const scale = [baseKoma]
  let current = baseKoma
  for (const interval of makam.intervals) {
    current += interval
    scale.push(current)
  }
  return scale
}
