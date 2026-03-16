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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('audio.importFile')}</h3>

      <button
        onClick={handleImport}
        disabled={analyzing}
        className="w-full py-2 bg-purple-600 text-white rounded font-medium text-sm hover:bg-purple-700 disabled:opacity-50 transition-colors"
      >
        {analyzing ? t('audio.analyzing') : t('audio.importFile')}
      </button>

      {fileName && !analyzing && (
        <p className="text-xs text-gray-500 mt-2 truncate">{fileName}</p>
      )}
    </div>
  )
}
