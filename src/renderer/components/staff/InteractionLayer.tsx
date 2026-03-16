import { useCallback, useMemo, useState } from 'react'
import { useScoreStore } from '../../store/score-store'
import { createNote } from '../../core/pitch-to-note'
import { NaturalNote } from '../../types'

interface Props {
  stavePositions: Array<{
    x: number
    y: number
    width: number
    noteStartX: number
    topLineY: number
    lineSpacing: number
  }>
  staveWidth: number
  startY: number
  scale: number
}

// Treble staff positions from top line downward, including spaces and nearby ledger positions.
const STAFF_NOTES: NaturalNote[] = ['F', 'E', 'D', 'C', 'B', 'A', 'G', 'F', 'E', 'D', 'C', 'B', 'A', 'G', 'F']
const STAFF_OCTAVES = [5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 4, 3, 3, 3, 3]
const MAX_LEDGER_STEPS_ABOVE = 4
const MAX_LEDGER_STEPS_BELOW = 10
const NOTE_END_PADDING = 20

interface PreviewPosition {
  x: number
  y: number
  ledgerLines: number[]
}

function getLedgerLines(
  pitchIndex: number,
  topLineY: number,
  noteStep: number
): number[] {
  const ledgerLines: number[] = []

  if (pitchIndex < 0) {
    for (let lineIndex = -2; lineIndex >= pitchIndex; lineIndex -= 2) {
      ledgerLines.push(topLineY + lineIndex * noteStep)
    }
  }

  if (pitchIndex > 8) {
    for (let lineIndex = 10; lineIndex <= pitchIndex; lineIndex += 2) {
      ledgerLines.push(topLineY + lineIndex * noteStep)
    }
  }

  return ledgerLines
}

/**
 * Transparent overlay that handles click-to-place notes on the staff.
 */
export function InteractionLayer({ stavePositions, staveWidth, startY, scale }: Props) {
  const addNote = useScoreStore((s) => s.addNote)
  const setCursor = useScoreStore((s) => s.setCursor)
  const selectedDuration = useScoreStore((s) => s.selectedDuration)
  const selectedAccidental = useScoreStore((s) => s.selectedAccidental)
  const measures = useScoreStore((s) => s.score.measures)
  const [preview, setPreview] = useState<PreviewPosition | null>(null)

  const getPointerData = useCallback(
    (clientX: number, clientY: number, rect: DOMRect) => {
      const clickX = (clientX - rect.left) / scale
      const clickY = (clientY - rect.top) / scale

      let measureIndex = -1
      for (let i = 0; i < stavePositions.length; i++) {
        const pos = stavePositions[i]
        if (
          clickX >= pos.x &&
          clickX < pos.x + pos.width &&
          clickY >= pos.y - 20 &&
          clickY < pos.y + 100
        ) {
          measureIndex = i
          break
        }
      }

      if (measureIndex === -1) return null

      const stavePos = stavePositions[measureIndex]
      const measure = measures[measureIndex]
      const noteStep = stavePos.lineSpacing / 2
      const minY = stavePos.topLineY - MAX_LEDGER_STEPS_ABOVE * noteStep
      const maxY = stavePos.topLineY + (STAFF_NOTES.length - 1 + MAX_LEDGER_STEPS_BELOW) * noteStep
      const clampedY = Math.max(minY, Math.min(maxY, clickY))
      const relY = clampedY - stavePos.topLineY
      const pitchIndex = Math.round(relY / noteStep)
      const clampedIndex = Math.max(0, Math.min(STAFF_NOTES.length - 1, pitchIndex))
      const noteY = stavePos.topLineY + clampedIndex * noteStep

      const noteAreaStart = stavePos.noteStartX
      const noteAreaWidth = Math.max(40, stavePos.x + staveWidth - noteAreaStart - NOTE_END_PADDING)
      const slotCount = Math.max(1, measure.notes.length + 1)
      const relativeX = Math.max(0, Math.min(noteAreaWidth, clickX - noteAreaStart))
      const insertIndex = Math.max(
        0,
        Math.min(measure.notes.length, Math.floor((relativeX / noteAreaWidth) * slotCount))
      )
      const slotWidth = noteAreaWidth / slotCount
      const previewX = noteAreaStart + insertIndex * slotWidth + slotWidth / 2

      return {
        measureIndex,
        insertIndex,
        natural: STAFF_NOTES[clampedIndex],
        octave: STAFF_OCTAVES[clampedIndex],
        previewX,
        previewY: noteY,
        ledgerLines: getLedgerLines(clampedIndex, stavePos.topLineY, noteStep)
      }
    },
    [measures, scale, stavePositions, staveWidth]
  )

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const pointerData = getPointerData(e.clientX, e.clientY, rect)
      if (!pointerData) return

      setCursor(pointerData.measureIndex, pointerData.insertIndex)

      const note = createNote(
        pointerData.natural,
        pointerData.octave,
        selectedAccidental,
        selectedDuration
      )
      addNote(note, pointerData.insertIndex)
    },
    [getPointerData, selectedDuration, selectedAccidental, addNote, setCursor]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const pointerData = getPointerData(e.clientX, e.clientY, rect)

      if (!pointerData) {
        setPreview(null)
        return
      }

      setPreview({
        x: pointerData.previewX,
        y: pointerData.previewY,
        ledgerLines: pointerData.ledgerLines
      })
    },
    [getPointerData]
  )

  const previewStyle = useMemo(
    () =>
      preview
        ? {
            left: `${preview.x - 8}px`,
            top: `${preview.y - 6}px`
          }
        : null,
    [preview]
  )

  return (
    <div
      className="absolute inset-0 cursor-crosshair"
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setPreview(null)}
      style={{ zIndex: 10 }}
    >
      {preview &&
        preview.ledgerLines.map((lineY) => (
          <div
            key={lineY}
            className="absolute"
            style={{
              left: `${preview.x - 14}px`,
              top: `${lineY}px`,
              width: '28px',
              borderTop: '1.5px solid rgba(17,24,39,0.5)',
              transform: 'translateY(-0.75px)'
            }}
          />
        ))}
      {previewStyle && (
        <div
          className="absolute rounded-full"
          style={{
            ...previewStyle,
            width: '16px',
            height: '12px',
            border: '1.5px solid rgba(59,130,246,0.9)',
            background: 'rgba(59,130,246,0.18)',
            pointerEvents: 'none'
          }}
        />
      )}
    </div>
  )
}
