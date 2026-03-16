import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StaffCanvas } from './components/staff/StaffCanvas'
import { Sidebar } from './components/sidebar/Sidebar'
import { Modal } from './components/common/Modal'
import { useScoreStore } from './store/score-store'
import { MAKAMLAR } from './core/makam'
import { RHYTHM_OPTIONS, getRhythmOption } from './core/rhythm'

function HeaderButton({
  label,
  onClick
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
      style={{
        background: 'rgba(255,255,255,0.04)',
        color: '#a1a1a6',
        border: '1px solid rgba(255,255,255,0.06)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
        e.currentTarget.style.color = '#f5f5f7'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
        e.currentTarget.style.color = '#a1a1a6'
      }}
    >
      {label}
    </button>
  )
}

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
  const pageZoom = useScoreStore((s) => s.pageZoom)
  const setPageZoom = useScoreStore((s) => s.setPageZoom)
  const zoomIn = useScoreStore((s) => s.zoomIn)
  const zoomOut = useScoreStore((s) => s.zoomOut)
  const resetZoom = useScoreStore((s) => s.resetZoom)
  const deleteNote = useScoreStore((s) => s.deleteNote)
  const currentMeasureIndex = useScoreStore((s) => s.currentMeasureIndex)
  const currentNoteIndex = useScoreStore((s) => s.currentNoteIndex)

  const updateScore = useCallback(
    (updates: Partial<typeof score>) => {
      const nextScore = { ...score, ...updates }
      if (updates.rhythm !== undefined && updates.usul === undefined) {
        nextScore.usul = updates.rhythm
      }
      setScore(nextScore)
    },
    [score, setScore]
  )

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
      window.api.onMenuDeleteNote(() => deleteNote(currentMeasureIndex, currentNoteIndex)),
      window.api.onMenuZoomIn(zoomIn),
      window.api.onMenuZoomOut(zoomOut),
      window.api.onMenuResetZoom(resetZoom)
    ]
    return () => cleanups.forEach((fn) => fn())
  }, [
    handleNew,
    handleOpen,
    handleSave,
    handleSaveAs,
    undo,
    redo,
    zoomIn,
    zoomOut,
    resetZoom,
    deleteNote,
    currentMeasureIndex,
    currentNoteIndex
  ])

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
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <header
          className="min-h-14 flex items-center justify-between px-6 py-2 border-b gap-6"
          style={{ background: '#2c2c2e', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-xs font-semibold tracking-widest" style={{ color: '#86868b' }}>
              DIKTE
            </span>
            <span style={{ color: 'rgba(255,255,255,0.1)' }}>/</span>
            <div className="flex items-center gap-2">
              <HeaderButton label={t('menu.file')} onClick={handleNew} />
              <HeaderButton label={t('menu.edit')} onClick={undo} />
              <HeaderButton label={t('menu.view')} onClick={resetZoom} />
            </div>
            {isDirty && <div className="w-2 h-2 rounded-full" style={{ background: '#ff9f0a' }} />}
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-end">
            <input
              type="text"
              value={score.genre}
              onChange={(e) => updateScore({ genre: e.target.value })}
              placeholder={t('score.genre')}
              className="text-sm bg-transparent outline-none rounded-lg px-3 py-1.5 w-32"
              style={{
                color: '#f5f5f7',
                caretColor: '#0a84ff',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
            />
            <input
              type="text"
              value={score.title}
              onChange={(e) => updateScore({ title: e.target.value })}
              placeholder={t('score.title')}
              className="text-sm bg-transparent outline-none rounded-lg px-3 py-1.5 w-40"
              style={{
                color: '#f5f5f7',
                caretColor: '#0a84ff',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
            />
            <input
              type="text"
              value={score.subtitle}
              onChange={(e) => updateScore({ subtitle: e.target.value })}
              placeholder={t('score.subtitle')}
              className="text-sm bg-transparent outline-none rounded-lg px-3 py-1.5 w-32"
              style={{
                color: '#f5f5f7',
                caretColor: '#0a84ff',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
            />
            <input
              type="text"
              value={score.composer}
              onChange={(e) => updateScore({ composer: e.target.value })}
              placeholder={t('score.composer')}
              className="text-sm bg-transparent outline-none rounded-lg px-3 py-1.5 w-36"
              style={{
                color: '#f5f5f7',
                caretColor: '#0a84ff',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
            />
            <input
              type="text"
              value={score.writer}
              onChange={(e) => updateScore({ writer: e.target.value })}
              placeholder={t('score.writer')}
              className="text-sm bg-transparent outline-none rounded-lg px-3 py-1.5 w-36"
              style={{
                color: '#f5f5f7',
                caretColor: '#0a84ff',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
            />
            <input
              type="text"
              value={score.source}
              onChange={(e) => updateScore({ source: e.target.value })}
              placeholder={t('score.source')}
              className="text-sm bg-transparent outline-none rounded-lg px-3 py-1.5 w-36"
              style={{
                color: '#f5f5f7',
                caretColor: '#0a84ff',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
            />
            <select
              value={score.rhythm}
              onChange={(e) => {
                const rhythm = getRhythmOption(e.target.value)
                updateScore({
                  rhythm: e.target.value,
                  usul: rhythm?.label ?? e.target.value,
                  timeSignature: rhythm?.timeSignature ?? score.timeSignature
                })
              }}
              className="text-sm bg-transparent outline-none rounded-lg px-3 py-1.5 w-32 appearance-none"
              style={{
                color: '#f5f5f7',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
            >
              <option value="" style={{ background: '#2c2c2e', color: '#f5f5f7' }}>
                {t('score.rhythm')}
              </option>
              {RHYTHM_OPTIONS.map((option) => (
                <option
                  key={option.id}
                  value={option.id}
                  style={{ background: '#2c2c2e', color: '#f5f5f7' }}
                >
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={score.makam}
              onChange={(e) => updateScore({ makam: e.target.value })}
              className="text-sm bg-transparent outline-none rounded-lg px-3 py-1.5 w-28 appearance-none"
              style={{
                color: '#f5f5f7',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
            >
              {MAKAMLAR.map((option) => (
                <option
                  key={option.id}
                  value={option.id}
                  style={{ background: '#2c2c2e', color: '#f5f5f7' }}
                >
                  {t(`makam.${option.id}`)}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={8}
              value={score.measuresPerLine}
              onChange={(e) =>
                updateScore({
                  measuresPerLine: Math.max(1, Math.min(8, Number(e.target.value) || 4))
                })
              }
              placeholder={t('score.measuresPerLine')}
              className="text-sm bg-transparent outline-none rounded-lg px-3 py-1.5 w-24"
              style={{
                color: '#f5f5f7',
                caretColor: '#0a84ff',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
            />
            <div
              className="flex items-center rounded-lg overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
            >
              <button
                type="button"
                onClick={zoomOut}
                className="px-3 py-1.5 text-sm"
                style={{ color: '#f5f5f7' }}
              >
                -
              </button>
              <input
                type="number"
                min={50}
                max={200}
                step={10}
                value={Math.round(pageZoom * 100)}
                onChange={(e) => setPageZoom((Number(e.target.value) || 100) / 100)}
                className="text-sm bg-transparent outline-none w-16 text-center"
                style={{ color: '#f5f5f7', caretColor: '#0a84ff' }}
                aria-label={t('menu.view')}
              />
              <span className="text-sm pr-2" style={{ color: '#a1a1a6' }}>%</span>
              <button
                type="button"
                onClick={zoomIn}
                className="px-3 py-1.5 text-sm"
                style={{ color: '#f5f5f7' }}
              >
                +
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto content-scroll p-8" style={{ background: '#1c1c1e' }}>
          <StaffCanvas />
        </div>
      </main>

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
