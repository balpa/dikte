import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { analyzeAudioFile } from '../../audio/audio-file-analyzer'
import { useScoreStore } from '../../store/score-store'

export function FileImportPanel() {
  const { t } = useTranslation()
  const [analyzing, setAnalyzing] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const addNote = useScoreStore((s) => s.addNote)
  const tempo = useScoreStore((s) => s.score.tempo)

  const handleImport = async () => {
    try {
      const result = await window.api.importAudio()
      if (!result) return

      setFileName(result.filePath.split(/[/\\]/).pop() ?? result.filePath)
      setAnalyzing(true)

      const analysis = await analyzeAudioFile(result.buffer, tempo)

      for (const note of analysis.notes) {
        addNote(note)
      }

      setAnalyzing(false)
    } catch (err) {
      console.error('Audio import failed:', err)
      setAnalyzing(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleImport}
        disabled={analyzing}
        className="w-full py-2.5 rounded-lg text-xs font-medium transition-all duration-150 disabled:opacity-40"
        style={{
          background: 'rgba(255,255,255,0.04)',
          color: '#a1a1a6',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {analyzing ? t('audio.analyzing') : t('audio.importFile')}
      </button>

      {fileName && !analyzing && (
        <p className="mt-2 truncate" style={{ fontSize: '10px', color: '#48484a' }}>{fileName}</p>
      )}
    </div>
  )
}
