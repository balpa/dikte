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
    <div className="flex items-center gap-1.5">
      {DURATIONS.map((d) => {
        const isActive = selectedDuration === d.value
        return (
          <button
            key={d.value}
            onClick={() => setSelectedDuration(d.value)}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-lg transition-all duration-150"
            style={{
              background: isActive ? 'rgba(255, 159, 10, 0.15)' : 'rgba(255,255,255,0.04)',
              color: isActive ? '#ff9f0a' : '#a1a1a6',
              border: `1px solid ${isActive ? 'rgba(255, 159, 10, 0.3)' : 'rgba(255,255,255,0.06)'}`,
            }}
            title={t(d.label)}
          >
            {d.icon}
          </button>
        )
      })}
    </div>
  )
}
