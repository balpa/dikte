export interface RhythmOption {
  id: string
  label: string
  timeSignature: [number, number]
}

export const RHYTHM_OPTIONS: RhythmOption[] = [
  { id: 'sofyan', label: 'Sofyan', timeSignature: [4, 4] },
  { id: 'semai', label: 'Semai', timeSignature: [3, 4] },
  { id: 'turk-aksagi', label: 'Turk Aksagi', timeSignature: [5, 8] },
  { id: 'yuruk-semai', label: 'Yuruk Semai', timeSignature: [6, 8] },
  { id: 'devr-i-hindi', label: 'Devr-i Hindi', timeSignature: [7, 8] },
  { id: 'mucenneb', label: 'Mucenneb', timeSignature: [8, 8] },
  { id: 'aksak', label: 'Aksak', timeSignature: [9, 8] },
  { id: 'evfer', label: 'Evfer', timeSignature: [9, 8] },
  { id: 'curcuna', label: 'Curcuna', timeSignature: [10, 8] },
  { id: 'devr-i-kebir', label: 'Devr-i Kebir', timeSignature: [28, 4] }
]

export function getRhythmOption(value: string): RhythmOption | undefined {
  return RHYTHM_OPTIONS.find((option) => option.id === value || option.label === value)
}

export function getRhythmLabel(value: string): string {
  return getRhythmOption(value)?.label ?? value
}
