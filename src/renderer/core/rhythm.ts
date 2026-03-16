import { USUL_OPTIONS, normalizeUsulId } from './music-dataset'

export interface RhythmOption {
  id: string
  label: string
  timeSignature?: [number, number]
}

const KNOWN_TIME_SIGNATURES: Record<string, [number, number]> = {
  sofyan: [4, 4],
  semai: [3, 4],
  turkaksagi: [5, 8],
  yuruksemai: [6, 8],
  devrihindi: [7, 8],
  aksak: [9, 8],
  evfer: [9, 8],
  curcuna: [10, 8],
  devrikebir: [28, 4]
}

export const RHYTHM_OPTIONS: RhythmOption[] = USUL_OPTIONS.map((usul) => ({
  id: usul.id,
  label: usul.label,
  timeSignature: KNOWN_TIME_SIGNATURES[usul.id]
}))

export function getRhythmOption(value: string): RhythmOption | undefined {
  const normalized = normalizeUsulId(value)
  return RHYTHM_OPTIONS.find(
    (option) => option.id === normalized || option.label.toLowerCase() === value.trim().toLowerCase()
  )
}

export function getRhythmLabel(value: string): string {
  return getRhythmOption(value)?.label ?? value
}
