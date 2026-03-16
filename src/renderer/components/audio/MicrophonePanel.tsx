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

  const STABLE_THRESHOLD = 15 // frames of stable pitch before auto-insert
  const FREQUENCY_TOLERANCE = 5 // Hz tolerance for "same pitch"

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
          prev.count = 0 // Reset after insert
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('audio.microphone')}</h3>

      <PitchDisplay pitch={pitch} />

      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={toggleListening}
          className={`flex-1 py-2 rounded font-medium text-sm transition-colors ${
            listening
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {listening ? t('audio.stopListening') : t('audio.startListening')}
        </button>

        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={autoInsert}
            onChange={(e) => setAutoInsert(e.target.checked)}
            className="rounded"
          />
          {t('audio.autoInsert')}
        </label>
      </div>

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  )
}
