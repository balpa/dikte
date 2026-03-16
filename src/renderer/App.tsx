import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { StaffCanvas } from './components/staff/StaffCanvas'
import { Sidebar } from './components/sidebar/Sidebar'
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
    <div className="h-screen flex" style={{ background: '#1c1c1e' }}>
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="h-12 flex items-center justify-between px-6 border-b"
          style={{ background: '#2c2c2e', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold tracking-widest" style={{ color: '#86868b' }}>
              DIKTE
            </span>
            <span style={{ color: 'rgba(255,255,255,0.1)' }}>/</span>
            <input
              type="text"
              value={score.title}
              onChange={(e) => setScore({ ...score, title: e.target.value })}
              placeholder={t('score.title')}
              className="text-sm bg-transparent outline-none w-40"
              style={{ color: '#f5f5f7', caretColor: '#0a84ff' }}
            />
            <span style={{ color: 'rgba(255,255,255,0.08)' }}>|</span>
            <input
              type="text"
              value={score.composer}
              onChange={(e) => setScore({ ...score, composer: e.target.value })}
              placeholder={t('score.composer')}
              className="text-sm bg-transparent outline-none w-36"
              style={{ color: '#86868b', caretColor: '#0a84ff' }}
            />
            {isDirty && (
              <div className="w-2 h-2 rounded-full" style={{ background: '#ff9f0a' }} />
            )}
          </div>
        </header>

        {/* Staff Area */}
        <div
          className="flex-1 overflow-auto content-scroll p-8"
          style={{ background: '#1c1c1e' }}
        >
          <StaffCanvas />
        </div>
      </main>

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
