import { useTranslation } from 'react-i18next'
import { useScoreStore } from '../../store/score-store'
import { ACCIDENTALS } from '../../core/accidentals'
import { AccidentalType } from '../../types'

export function AccidentalSelector() {
  const { t } = useTranslation()
  const selectedAccidental = useScoreStore((s) => s.selectedAccidental)
  const setSelectedAccidental = useScoreStore((s) => s.setSelectedAccidental)

  return (
    <div className="flex flex-wrap gap-1.5">
      {ACCIDENTALS.map((acc) => {
        const isSelected = selectedAccidental === acc.type
        const isSharp = acc.komaOffset > 0
        const isFlat = acc.komaOffset < 0

        let bg: string, color: string, border: string
        if (isSelected) {
          bg = 'rgba(255, 159, 10, 0.15)'
          color = '#ff9f0a'
          border = 'rgba(255, 159, 10, 0.3)'
        } else if (isSharp) {
          bg = 'rgba(255, 69, 58, 0.06)'
          color = '#ff6961'
          border = 'rgba(255, 69, 58, 0.1)'
        } else if (isFlat) {
          bg = 'rgba(10, 132, 255, 0.06)'
          color = '#64d2ff'
          border = 'rgba(10, 132, 255, 0.1)'
        } else {
          bg = 'rgba(255,255,255,0.04)'
          color = '#a1a1a6'
          border = 'rgba(255,255,255,0.06)'
        }

        return (
          <button
            key={acc.type}
            onClick={() => setSelectedAccidental(acc.type as AccidentalType)}
            className="h-8 px-2 flex items-center justify-center rounded-md text-xs transition-all duration-150"
            style={{ background: bg, color, border: `1px solid ${border}` }}
            title={t(`accidentals.${acc.type}`)}
          >
            {acc.symbol || '♮'}
            {acc.komaOffset !== 0 && (
              <span className="ml-0.5" style={{ fontSize: '9px', opacity: 0.7 }}>
                {acc.komaOffset > 0 ? '+' : ''}{acc.komaOffset}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
