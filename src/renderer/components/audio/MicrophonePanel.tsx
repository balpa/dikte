import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { MicPitchDetector, PitchResult } from '../../audio/pitch-detector'
import { PitchDisplay } from './PitchDisplay'
import { hzToDikteNote } from '../../core/pitch-to-note'
import { useScoreStore } from '../../store/score-store'

export function MicrophonePanel() {
  const { t } = useTranslation()
  const [listening, setListening] = useState(false)
  const [pitch, setPitch] = useState<PitchResult | null>(null)
  const [autoInsert, setAutoInsert] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const detectorRef = useRef<MicPitchDetector | null>(null)
  const stablePitchRef = useRef<{ frequency: number; count: number }>({ frequency: 0, count: 0 })

  const addNote = useScoreStore((s) => s.addNote)
  const selectedDuration = useScoreStore((s) => s.selectedDuration)

  const STABLE_THRESHOLD = 15
  const FREQUENCY_TOLERANCE = 5

  const handlePitch = useCallback(
    (result: PitchResult | null) => {
      setPitch(result)

      if (!autoInsert || !result) {
        stablePitchRef.current = { frequency: 0, count: 0 }
        return
      }

      const prev = stablePitchRef.current
      if (Math.abs(result.frequency - prev.frequency) < FREQUENCY_TOLERANCE) {
        prev.count++
        if (prev.count === STABLE_THRESHOLD) {
          const note = hzToDikteNote(result.frequency, selectedDuration)
          if (note) addNote(note)
          prev.count = 0
        }
      } else {
        stablePitchRef.current = { frequency: result.frequency, count: 1 }
      }
    },
    [autoInsert, addNote, selectedDuration]
  )

  const toggleListening = async () => {
    if (listening) {
      detectorRef.current?.stop()
      detectorRef.current = null
      setListening(false)
      setPitch(null)
    } else {
      try {
        setError(null)
        const detector = new MicPitchDetector()
        await detector.start(handlePitch)
        detectorRef.current = detector
        setListening(true)
      } catch {
        setError(t('audio.noMicAccess'))
      }
    }
  }

  return (
    <div>
      <PitchDisplay pitch={pitch} />

      <div className="flex flex-col gap-2 mt-3">
        <button
          onClick={toggleListening}
          className="w-full py-2.5 rounded-lg text-xs font-medium transition-all duration-150"
          style={{
            background: listening ? 'rgba(255, 69, 58, 0.12)' : 'rgba(255, 159, 10, 0.12)',
            color: listening ? '#ff453a' : '#ff9f0a',
            border: `1px solid ${listening ? 'rgba(255, 69, 58, 0.25)' : 'rgba(255, 159, 10, 0.25)'}`,
          }}
        >
          {listening ? t('audio.stopListening') : t('audio.startListening')}
        </button>

        <label className="flex items-center gap-2 text-xs cursor-pointer select-none" style={{ color: '#86868b' }}>
          <input
            type="checkbox"
            checked={autoInsert}
            onChange={(e) => setAutoInsert(e.target.checked)}
            className="rounded"
            style={{ accentColor: '#ff9f0a' }}
          />
          {t('audio.autoInsert')}
        </label>
      </div>

      {error && <p className="text-xs mt-2" style={{ color: '#ff453a' }}>{error}</p>}
    </div>
  )
}
