import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NoteSelector } from '../toolbar/NoteSelector'
import { AccidentalSelector } from '../toolbar/AccidentalSelector'
import { MicrophonePanel } from '../audio/MicrophonePanel'
import { FileImportPanel } from '../audio/FileImportPanel'
import { MakamSelector } from '../common/MakamSelector'
import { LanguageSwitcher } from '../common/LanguageSwitcher'
import { useScoreStore } from '../../store/score-store'
import { createRest } from '../../core/pitch-to-note'

function SidebarSection({
  title,
  testId,
  defaultOpen = true,
  children
}: {
  title: string
  testId?: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <button
        data-testid={testId}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 text-xs font-medium tracking-wide transition-colors"
        style={{ color: '#86868b' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#a1a1a6')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#86868b')}
      >
        <span className="uppercase">{title}</span>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className="overflow-hidden transition-all duration-200"
        style={{
          maxHeight: open ? '500px' : '0px',
          opacity: open ? 1 : 0,
        }}
      >
        <div className="px-5 pb-4">{children}</div>
      </div>
    </div>
  )
}

export function Sidebar() {
  const { t } = useTranslation()
  const addNote = useScoreStore((s) => s.addNote)
  const addMeasure = useScoreStore((s) => s.addMeasure)
  const undo = useScoreStore((s) => s.undo)
  const redo = useScoreStore((s) => s.redo)
  const deleteNote = useScoreStore((s) => s.deleteNote)
  const currentMeasureIndex = useScoreStore((s) => s.currentMeasureIndex)
  const currentNoteIndex = useScoreStore((s) => s.currentNoteIndex)
  const selectedDuration = useScoreStore((s) => s.selectedDuration)

  const handleRest = () => addNote(createRest(selectedDuration))
  const handleDelete = () => deleteNote(currentMeasureIndex, currentNoteIndex)

  const actionBtnStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    color: '#a1a1a6',
    borderRadius: '8px',
    fontSize: '11px',
    padding: '8px 4px',
    border: '1px solid rgba(255,255,255,0.06)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    transition: 'all 0.15s ease',
  }

  return (
    <aside
      data-testid="sidebar"
      className="w-64 flex flex-col h-full border-r"
      style={{ background: '#2c2c2e', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #ff9f0a, #ff6723)',
              boxShadow: '0 2px 8px rgba(255, 159, 10, 0.3)',
            }}
          >
            <span className="text-white text-sm font-bold">D</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold" style={{ color: '#f5f5f7' }}>
              Dikte
            </h1>
            <p className="text-xs" style={{ color: '#636366' }}>
              53-TET Note Dictation
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto sidebar-scroll">
        <SidebarSection title={t('score.makam')}>
          <MakamSelector />
        </SidebarSection>

        <SidebarSection title={t('toolbar.duration')}>
          <NoteSelector />
        </SidebarSection>

        <SidebarSection title={t('toolbar.accidental')}>
          <AccidentalSelector />
        </SidebarSection>

        <SidebarSection title={t('toolbar.tools')}>
          <div className="grid grid-cols-2 gap-2">
            <button
              data-testid="add-rest-button"
              style={actionBtnStyle}
              onClick={handleRest}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.color = '#f5f5f7'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.color = '#a1a1a6'
              }}
            >
              <span style={{ fontSize: '14px' }}>𝄾</span>
              {t('toolbar.rest')}
            </button>
            <button
              data-testid="add-measure-button"
              style={actionBtnStyle}
              onClick={addMeasure}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.color = '#f5f5f7'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.color = '#a1a1a6'
              }}
            >
              <span style={{ fontSize: '13px' }}>+</span>
              {t('score.addMeasure')}
            </button>
            <button
              data-testid="undo-button"
              style={actionBtnStyle}
              onClick={undo}
              title="Ctrl+Z"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.color = '#f5f5f7'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.color = '#a1a1a6'
              }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" />
              </svg>
              {t('toolbar.undo')}
            </button>
            <button
              data-testid="redo-button"
              style={actionBtnStyle}
              onClick={redo}
              title="Ctrl+Shift+Z"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.color = '#f5f5f7'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.color = '#a1a1a6'
              }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a5 5 0 00-5 5v2M21 10l-4-4M21 10l-4 4" />
              </svg>
              {t('toolbar.redo')}
            </button>
            <button
              data-testid="delete-note-button"
              className="col-span-2"
              style={{
                ...actionBtnStyle,
                background: 'rgba(255, 69, 58, 0.08)',
                color: '#ff453a',
                borderColor: 'rgba(255, 69, 58, 0.15)',
              }}
              onClick={handleDelete}
              title="Delete"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 69, 58, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 69, 58, 0.08)'
              }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {t('toolbar.delete')}
            </button>
          </div>
        </SidebarSection>

        <SidebarSection title={t('audio.microphone')}>
          <MicrophonePanel />
        </SidebarSection>

        <SidebarSection
          title={t('audio.importFile')}
          testId="import-audio-section-toggle"
          defaultOpen={false}
        >
          <FileImportPanel />
        </SidebarSection>
      </div>

      {/* Bottom */}
      <div
        className="px-5 py-3 border-t flex items-center justify-between"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <LanguageSwitcher />
      </div>
    </aside>
  )
}
