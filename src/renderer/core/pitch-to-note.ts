import { DikteNote, AccidentalType, Duration, NaturalNote } from '../types'
import { hzToKoma, NATURAL_KOMA } from './koma'
import { ACCIDENTALS } from './accidentals'
import { NATURAL_NOTES } from './note-names'

let nextId = 0
function generateId(): string {
  return `note_${Date.now()}_${nextId++}`
}

/**
 * Convert a frequency in Hz to a DikteNote.
 * Finds the closest note in the 53-TET system.
 */
export function hzToDikteNote(
  hz: number,
  duration: Duration = '4',
  dotted = false
): DikteNote | null {
  if (hz <= 0) return null

  const absoluteKoma = hzToKoma(hz)
  return komaToDikteNote(absoluteKoma, duration, dotted)
}

/**
 * Convert an absolute koma position (from C4) to a DikteNote.
 */
export function komaToDikteNote(
  komaFromC4: number,
  duration: Duration = '4',
  dotted = false
): DikteNote {
  // Determine octave and position within octave
  let octave = 4
  let komaInOctave = komaFromC4

  while (komaInOctave >= 53) {
    komaInOctave -= 53
    octave++
  }
  while (komaInOctave < 0) {
    komaInOctave += 53
    octave--
  }

  // Find the best natural note + accidental combination
  let bestNatural: NaturalNote = 'C'
  let bestAccidental: AccidentalType = 'none'
  let bestDiff = Infinity

  for (const natural of NATURAL_NOTES) {
    const naturalKoma = NATURAL_KOMA[natural]
    const diff = komaInOctave - naturalKoma

    // Check if any accidental matches this difference
    for (const acc of ACCIDENTALS) {
      if (acc.komaOffset === diff) {
        // Exact match
        return {
          id: generateId(),
          natural,
          octave,
          accidental: acc.type,
          komaFromC4,
          duration,
          dotted,
          tied: false,
          isRest: false
        }
      }
    }

    // Track closest natural note
    if (Math.abs(diff) < Math.abs(bestDiff)) {
      bestDiff = diff
      bestNatural = natural
    }
  }

  // No exact accidental match, find the closest accidental
  let closestAccidental: AccidentalType = 'none'
  let closestAccDiff = Infinity

  for (const acc of ACCIDENTALS) {
    const accDiff = Math.abs(bestDiff - acc.komaOffset)
    if (accDiff < closestAccDiff) {
      closestAccDiff = accDiff
      closestAccidental = acc.type
    }
  }

  return {
    id: generateId(),
    natural: bestNatural,
    octave,
    accidental: closestAccidental,
    komaFromC4,
    duration,
    dotted,
    tied: false,
    isRest: false
  }
}

/**
 * Create a rest note.
 */
export function createRest(duration: Duration = '4', dotted = false): DikteNote {
  return {
    id: generateId(),
    natural: 'B',
    octave: 4,
    accidental: 'none',
    komaFromC4: 0,
    duration,
    dotted,
    tied: false,
    isRest: true
  }
}

/**
 * Create a DikteNote from natural + accidental + octave.
 */
export function createNote(
  natural: NaturalNote,
  octave: number,
  accidental: AccidentalType,
  duration: Duration = '4',
  dotted = false
): DikteNote {
  const accDef = ACCIDENTALS.find((a) => a.type === accidental)
  const komaOffset = accDef?.komaOffset ?? 0
  const naturalKoma = NATURAL_KOMA[natural]
  const komaFromC4 = naturalKoma + (octave - 4) * 53 + komaOffset

  return {
    id: generateId(),
    natural,
    octave,
    accidental,
    komaFromC4,
    duration,
    dotted,
    tied: false,
    isRest: false
  }
}
