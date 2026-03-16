import { useTranslation } from 'react-i18next'
import { useScoreStore } from '../../store/score-store'
import { Duration } from '../../types'

const DURATIONS: { value: Duration; label: string; icon: string }[] = [
  { value: '1', label: 'toolbar.whole', icon: '\uD834\uDD5D' },
  { value: '2', label: 'toolbar.half', icon: '\uD834\uDD5E' },
  { value: '4', label: 'toolbar.quarter', icon: '\u2669' },
  { value: '8', label: 'toolbar.eighth', icon: '\u266A' },
  { value: '16', label: 'toolbar.sixteenth', icon: '\u266C' },
  { value: '32', label: 'toolbar.thirtySecond', icon: '\uD834\uDD61' },
  { value: '64', label: 'toolbar.sixtyFourth', icon: '\uD834\uDD62' }
]

export function NoteSelector() {
  const { t } = useTranslation()
  const selectedDuration = useScoreStore((s) => s.selectedDuration)
  const setSelectedDuration = useScoreStore((s) => s.setSelectedDuration)

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {DURATIONS.map((d) => {
        const isActive = selectedDuration === d.value
        return (
          <button
            key={d.value}
            onClick={() => setSelectedDuration(d.value)}
            className="w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-150 font-semibold"
            style={{
              background: isActive ? 'rgba(255, 159, 10, 0.15)' : 'rgba(255,255,255,0.04)',
              color: isActive ? '#ff9f0a' : '#a1a1a6',
              border: `1px solid ${isActive ? 'rgba(255, 159, 10, 0.3)' : 'rgba(255,255,255,0.06)'}`,
              fontSize: d.value === '1' || d.value === '2' ? '22px' : d.value === '32' || d.value === '64' ? '20px' : '18px',
              lineHeight: 1
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
