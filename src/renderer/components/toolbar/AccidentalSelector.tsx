import { useTranslation } from 'react-i18next'
import { useScoreStore } from '../../store/score-store'
import { ACCIDENTALS } from '../../core/accidentals'
import { AccidentalType } from '../../types'

export function AccidentalSelector() {
  const { t } = useTranslation()
  const selectedAccidental = useScoreStore((s) => s.selectedAccidental)
  const setSelectedAccidental = useScoreStore((s) => s.setSelectedAccidental)

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="text-xs text-gray-500 mr-1">{t('toolbar.accidental')}:</span>
      {ACCIDENTALS.map((acc) => (
        <button
          key={acc.type}
          onClick={() => setSelectedAccidental(acc.type as AccidentalType)}
          className={`px-2 h-8 flex items-center justify-center rounded text-xs transition-colors
            ${
              selectedAccidental === acc.type
                ? 'bg-blue-600 text-white'
                : acc.komaOffset > 0
                  ? 'bg-red-50 text-red-700 hover:bg-red-100'
                  : acc.komaOffset < 0
                    ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          title={t(`accidentals.${acc.type}`)}
        >
          {acc.symbol || '♮'}
          {acc.komaOffset !== 0 && (
            <span className="ml-0.5 text-[10px]">
              {acc.komaOffset > 0 ? '+' : ''}{acc.komaOffset}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
