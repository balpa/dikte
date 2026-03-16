import { useTranslation } from 'react-i18next'
import { useScoreStore } from '../../store/score-store'
import { Duration } from '../../types'

const DURATIONS: { value: Duration; label: string; icon: string }[] = [
  { value: '1', label: 'toolbar.whole', icon: '𝅝' },
  { value: '2', label: 'toolbar.half', icon: '𝅗𝅥' },
  { value: '4', label: 'toolbar.quarter', icon: '♩' },
  { value: '8', label: 'toolbar.eighth', icon: '♪' },
  { value: '16', label: 'toolbar.sixteenth', icon: '𝅘𝅥𝅯' }
]

export function NoteSelector() {
  const { t } = useTranslation()
  const selectedDuration = useScoreStore((s) => s.selectedDuration)
  const setSelectedDuration = useScoreStore((s) => s.setSelectedDuration)

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-gray-500 mr-1">{t('toolbar.duration')}:</span>
      {DURATIONS.map((d) => (
        <button
          key={d.value}
          onClick={() => setSelectedDuration(d.value)}
          className={`w-9 h-9 flex items-center justify-center rounded text-lg transition-colors
            ${
              selectedDuration === d.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          title={t(d.label)}
        >
          {d.icon}
        </button>
      ))}
    </div>
  )
}
