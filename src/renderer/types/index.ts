export type NaturalNote = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'

export type AccidentalType =
  | 'none'
  | 'fazla_sharp'     // +1 koma
  | 'bakiye_sharp'    // +4 koma
  | 'kucuk_sharp'     // +5 koma
  | 'buyuk_sharp'     // +8 koma
  | 'tanini_sharp'    // +9 koma (= 1 whole tone)
  | 'fazla_flat'      // -1 koma
  | 'bakiye_flat'     // -4 koma
  | 'kucuk_flat'      // -5 koma
  | 'buyuk_flat'      // -8 koma
  | 'tanini_flat'     // -9 koma

export type Duration = '1' | '2' | '4' | '8' | '16' | '32' | '64'

export interface DikteNote {
  id: string
  natural: NaturalNote
  octave: number         // 0-8, where 4 = middle octave
  accidental: AccidentalType
  komaFromC4: number     // Absolute koma position from C4
  duration: Duration
  dotted: boolean
  tied: boolean
  isRest: boolean
}

export interface Measure {
  id: string
  notes: DikteNote[]
  timeSignature?: [number, number]
}

export interface Score {
  title: string
  composer: string
  writer: string
  makam: string
  rhythm: string
  usul: string
  measuresPerLine: number
  measures: Measure[]
  timeSignature: [number, number]
  tempo: number
}

export interface DikteFile {
  version: string
  score: Score
}

// Accidental definition for the AEU system
export interface AccidentalDef {
  type: AccidentalType
  komaOffset: number
  nameTr: string
  nameEn: string
  symbol: string
}

// Window API type augmentation
declare global {
  interface Window {
    api: import('../../preload/index').DikteAPI
  }
}
