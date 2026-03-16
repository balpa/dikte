import { useTranslation } from 'react-i18next'
import { MAKAM_OPTIONS, normalizeMakamId } from '../../core/music-dataset'
import { useScoreStore } from '../../store/score-store'

export function MakamSelector() {
  const { t } = useTranslation()
  const makam = useScoreStore((s) => s.score.makam)
  const setScore = useScoreStore((s) => s.setScore)
  const score = useScoreStore((s) => s.score)

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setScore({ ...score, makam: normalizeMakamId(e.target.value) })
  }

  return (
    <select
      value={makam}
      onChange={handleChange}
      data-testid="sidebar-makam-select"
      className="w-full text-xs rounded-lg px-3 py-2.5 outline-none cursor-pointer appearance-none"
      style={{
        background: 'rgba(255,255,255,0.04)',
        color: '#f5f5f7',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {MAKAM_OPTIONS.map((m) => (
        <option key={m.id} value={m.id} style={{ background: '#2c2c2e', color: '#f5f5f7' }}>
          {m.label}
        </option>
      ))}
    </select>
  )
}
