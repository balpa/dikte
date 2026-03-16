import { DikteNote, Duration, Measure } from '../types'

const DURATION_UNITS: Record<Duration, number> = {
  '1': 64,
  '2': 32,
  '4': 16,
  '8': 8,
  '16': 4,
  '32': 2,
  '64': 1
}

export function getNoteUnits(note: DikteNote): number {
  const baseUnits = DURATION_UNITS[note.duration]
  return note.dotted ? baseUnits + baseUnits / 2 : baseUnits
}

export function getMeasureCapacity(timeSignature: [number, number]): number {
  const [beats, beatValue] = timeSignature
  const beatUnits = DURATION_UNITS[String(beatValue) as Duration]
  return beats * beatUnits
}

export function getMeasureUnits(measure: Measure): number {
  return measure.notes.reduce((total, note) => total + getNoteUnits(note), 0)
}

export function canAddNoteToMeasure(
  measure: Measure,
  note: DikteNote,
  timeSignature: [number, number]
): boolean {
  return getMeasureUnits(measure) + getNoteUnits(note) <= getMeasureCapacity(timeSignature)
}
