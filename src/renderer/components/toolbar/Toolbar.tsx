import { useTranslation } from 'react-i18next'
import { NoteSelector } from './NoteSelector'
import { AccidentalSelector } from './AccidentalSelector'
import { useScoreStore } from '../../store/score-store'
import { createRest } from '../../core/pitch-to-note'

export function Toolbar() {
  const { t } = useTranslation()
  const addNote = useScoreStore((s) => s.addNote)
  const addMeasure = useScoreStore((s) => s.addMeasure)
  const undo = useScoreStore((s) => s.undo)
  const redo = useScoreStore((s) => s.redo)
  const deleteNote = useScoreStore((s) => s.deleteNote)
  const currentMeasureIndex = useScoreStore((s) => s.currentMeasureIndex)
  const currentNoteIndex = useScoreStore((s) => s.currentNoteIndex)
  const selectedDuration = useScoreStore((s) => s.selectedDuration)

  const handleRest = () => {
    addNote(createRest(selectedDuration))
  }

  const handleDelete = () => {
    deleteNote(currentMeasureIndex, currentNoteIndex)
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex flex-col gap-2">
      <div className="flex items-center gap-4 flex-wrap">
        <NoteSelector />

        <div className="h-6 w-px bg-gray-300" />

        <button
          onClick={handleRest}
          className="px-3 h-9 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-sm"
          title={t('toolbar.rest')}
        >
          {t('toolbar.rest')}
        </button>

        <div className="h-6 w-px bg-gray-300" />

        <button
          onClick={undo}
          className="px-3 h-9 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-sm"
          title="Ctrl+Z"
        >
          ↶
        </button>
        <button
          onClick={redo}
          className="px-3 h-9 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-sm"
          title="Ctrl+Shift+Z"
        >
          ↷
        </button>
        <button
          onClick={handleDelete}
          className="px-3 h-9 bg-red-50 text-red-700 hover:bg-red-100 rounded text-sm"
          title="Delete"
        >
          ✕
        </button>

        <div className="h-6 w-px bg-gray-300" />

        <button
          onClick={addMeasure}
          className="px-3 h-9 bg-green-50 text-green-700 hover:bg-green-100 rounded text-sm"
        >
          + {t('score.addMeasure')}
        </button>
      </div>

      <AccidentalSelector />
    </div>
  )
}
