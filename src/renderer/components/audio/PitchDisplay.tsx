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
      <div className="text-center py-3">
        <div className="text-2xl font-light" style={{ color: '#3a3a3c' }}>--</div>
        <div className="text-xs mt-1" style={{ color: '#48484a' }}>{t('audio.detectedNote')}</div>
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

  const centsAbs = Math.abs(cents)
  const centsColor = centsAbs < 5 ? '#30d158' : centsAbs < 10 ? '#ff9f0a' : '#ff453a'

  return (
    <div className="text-center py-2">
      <div className="text-2xl font-bold" style={{ color: '#f5f5f7' }}>
        {noteName}{note.octave}
        {accLabel && <span className="text-base ml-1" style={{ color: '#ff9f0a' }}>{accDef.symbol}</span>}
      </div>
      <div className="text-xs mt-1" style={{ color: '#636366' }}>
        {pitch.frequency.toFixed(1)} Hz
      </div>
      <div className="text-xs font-mono" style={{ color: centsColor }}>
        {cents > 0 ? '+' : ''}{cents.toFixed(1)} cents
      </div>
      <div
        className="w-full mt-2 h-1 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-150"
          style={{
            width: `${Math.round(pitch.clarity * 100)}%`,
            background: 'rgba(255, 159, 10, 0.5)',
          }}
        />
      </div>
      <div className="text-xs mt-1" style={{ color: '#48484a', fontSize: '10px' }}>
        {t('audio.clarity')}: {Math.round(pitch.clarity * 100)}%
      </div>
    </div>
  )
}
