import { useTranslation } from 'react-i18next'
import { MAKAMLAR } from '../../core/makam'
import { useScoreStore } from '../../store/score-store'

export function MakamSelector() {
  const { t } = useTranslation()
  const makam = useScoreStore((s) => s.score.makam)
  const setScore = useScoreStore((s) => s.setScore)
  const score = useScoreStore((s) => s.score)

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setScore({ ...score, makam: e.target.value })
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-gray-500">{t('score.makam')}:</label>
      <select
        value={makam}
        onChange={handleChange}
        className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
      >
        {MAKAMLAR.map((m) => (
          <option key={m.id} value={m.id}>
            {t(`makam.${m.id}`)}
          </option>
        ))}
      </select>
    </div>
  )
}
