import { useTranslation } from 'react-i18next'
import { hzToKomaWithCents } from '../../core/koma'
import { komaToDikteNote } from '../../core/pitch-to-note'
import { TURKISH_NOTE_NAMES } from '../../core/note-names'
import { ACCIDENTAL_MAP } from '../../core/accidentals'
import { PitchResult } from '../../audio/pitch-detector'

interface Props {
  pitch: PitchResult | null
}

export function PitchDisplay({ pitch }: Props) {
  const { t, i18n } = useTranslation()
  const isTr = i18n.language === 'tr'

  if (!pitch) {
    return (
      <div className="text-center text-gray-400 py-4">
        <div className="text-2xl">—</div>
        <div className="text-sm">{t('audio.detectedNote')}</div>
      </div>
    )
  }

  const { koma, cents } = hzToKomaWithCents(pitch.frequency)
  const note = komaToDikteNote(koma)
  const noteName = isTr ? TURKISH_NOTE_NAMES[note.natural] : note.natural
  const accDef = ACCIDENTAL_MAP[note.accidental]
  const accLabel = accDef && accDef.komaOffset !== 0
    ? (isTr ? accDef.nameTr : accDef.nameEn)
    : ''

  const centsColor = Math.abs(cents) < 5 ? 'text-green-600' : Math.abs(cents) < 10 ? 'text-yellow-600' : 'text-red-500'

  return (
    <div className="text-center py-2">
      <div className="text-3xl font-bold">
        {noteName}{note.octave}
        {accLabel && <span className="text-lg ml-1 text-purple-600">{accDef.symbol}</span>}
      </div>
      <div className="text-sm text-gray-500 mt-1">
        {pitch.frequency.toFixed(1)} Hz
      </div>
      <div className={`text-sm font-mono ${centsColor}`}>
        {cents > 0 ? '+' : ''}{cents.toFixed(1)} cents
      </div>
      <div className="w-full max-w-48 mx-auto mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all"
          style={{ width: `${Math.round(pitch.clarity * 100)}%` }}
        />
      </div>
      <div className="text-xs text-gray-400 mt-1">
        {t('audio.clarity')}: {Math.round(pitch.clarity * 100)}%
      </div>
    </div>
  )
}
