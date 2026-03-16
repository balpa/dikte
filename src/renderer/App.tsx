import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { StaffCanvas } from './components/staff/StaffCanvas'
import { Toolbar } from './components/toolbar/Toolbar'
import { MicrophonePanel } from './components/audio/MicrophonePanel'
import { FileImportPanel } from './components/audio/FileImportPanel'
import { LanguageSwitcher } from './components/common/LanguageSwitcher'
import { MakamSelector } from './components/common/MakamSelector'
import { Modal } from './components/common/Modal'
import { useScoreStore } from './store/score-store'

export default function App() {
  const { t } = useTranslation()
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    action: (() => void) | null
  }>({ open: false, action: null })

  const score = useScoreStore((s) => s.score)
  const setScore = useScoreStore((s) => s.setScore)
  const newScore = useScoreStore((s) => s.newScore)
  const isDirty = useScoreStore((s) => s.isDirty)
  const filePath = useScoreStore((s) => s.filePath)
  const setFilePath = useScoreStore((s) => s.setFilePath)
  const setDirty = useScoreStore((s) => s.setDirty)
  const serialize = useScoreStore((s) => s.serialize)
  const deserialize = useScoreStore((s) => s.deserialize)
  const undo = useScoreStore((s) => s.undo)
  const redo = useScoreStore((s) => s.redo)
  const deleteNote = useScoreStore((s) => s.deleteNote)
  const currentMeasureIndex = useScoreStore((s) => s.currentMeasureIndex)
  const currentNoteIndex = useScoreStore((s) => s.currentNoteIndex)

  const confirmIfDirty = useCallback(
    (action: () => void) => {
      if (isDirty) {
        setConfirmModal({ open: true, action })
      } else {
        action()
      }
    },
    [isDirty]
  )

  const handleNew = useCallback(() => {
    confirmIfDirty(() => newScore())
  }, [confirmIfDirty, newScore])

  const handleOpen = useCallback(async () => {
    const doOpen = async () => {
      const result = await window.api.openFile()
      if (result) {
        deserialize(result.content)
        setFilePath(result.filePath)
      }
    }
    confirmIfDirty(doOpen)
  }, [confirmIfDirty, deserialize, setFilePath])

  const handleSave = useCallback(async () => {
    const content = serialize()
    if (filePath) {
      await window.api.saveFile(filePath, content)
      setDirty(false)
    } else {
      const path = await window.api.saveFileAs(content)
      if (path) {
        setFilePath(path)
        setDirty(false)
      }
    }
  }, [serialize, filePath, setFilePath, setDirty])

  const handleSaveAs = useCallback(async () => {
    const content = serialize()
    const path = await window.api.saveFileAs(content)
    if (path) {
      setFilePath(path)
      setDirty(false)
    }
  }, [serialize, setFilePath, setDirty])

  // Register menu event handlers
  useEffect(() => {
    const cleanups = [
      window.api.onMenuNew(handleNew),
      window.api.onMenuOpen(handleOpen),
      window.api.onMenuSave(handleSave),
      window.api.onMenuSaveAs(handleSaveAs),
      window.api.onMenuUndo(undo),
      window.api.onMenuRedo(redo),
      window.api.onMenuDeleteNote(() => deleteNote(currentMeasureIndex, currentNoteIndex))
    ]
    return () => cleanups.forEach((fn) => fn())
  }, [handleNew, handleOpen, handleSave, handleSaveAs, undo, redo, deleteNote, currentMeasureIndex, currentNoteIndex])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteNote(currentMeasureIndex, currentNoteIndex)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [deleteNote, currentMeasureIndex, currentNoteIndex])

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-gray-800">Dikte</h1>
          <input
            type="text"
            value={score.title}
            onChange={(e) => setScore({ ...score, title: e.target.value })}
            placeholder={t('score.title')}
            className="text-sm border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none px-1 py-0.5"
          />
          <input
            type="text"
            value={score.composer}
            onChange={(e) => setScore({ ...score, composer: e.target.value })}
            placeholder={t('score.composer')}
            className="text-sm border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none px-1 py-0.5"
          />
          <MakamSelector />
        </div>
        <div className="flex items-center gap-3">
          {isDirty && <span className="text-xs text-orange-500">*</span>}
          <LanguageSwitcher />
        </div>
      </header>

      {/* Toolbar */}
      <Toolbar />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Staff area */}
        <main className="flex-1 p-4 overflow-auto">
          <StaffCanvas />
        </main>

        {/* Side panel */}
        <aside className="w-72 border-l border-gray-200 p-4 overflow-y-auto flex flex-col gap-4">
          <MicrophonePanel />
          <FileImportPanel />
        </aside>
      </div>

      {/* Confirm modal */}
      <Modal
        open={confirmModal.open}
        message={t('common.unsavedChanges')}
        onConfirm={() => {
          confirmModal.action?.()
          setConfirmModal({ open: false, action: null })
        }}
        onCancel={() => setConfirmModal({ open: false, action: null })}
      />
    </div>
  )
}
