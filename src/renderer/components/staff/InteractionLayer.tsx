import { useCallback, useState } from 'react'
import { useScoreStore } from '../../store/score-store'
import { createNote } from '../../core/pitch-to-note'
import { NaturalNote } from '../../types'

interface Props {
  stavePositions: Array<{
    x: number
    y: number
    width: number
    noteStartX: number
    noteEndX: number
    noteLayouts: Array<{ absoluteX: number; beginX: number; endX: number }>
    topLineY: number
    lineSpacing: number
  }>
  staveWidth: number
  startY: number
  scale: number
}

const MAX_LEDGER_STEPS_ABOVE = 4
const MAX_LEDGER_STEPS_BELOW = 10

interface PointerData {
  measureIndex: number
  insertIndex: number
  natural: NaturalNote
  octave: number
  cursorX: number
  cursorY: number
}

const PITCH_SEQUENCE: Array<{ natural: NaturalNote; octave: number }> = [
  { natural: 'C', octave: 6 },
  { natural: 'B', octave: 5 },
  { natural: 'A', octave: 5 },
  { natural: 'G', octave: 5 },
  { natural: 'F', octave: 5 },
  { natural: 'E', octave: 5 },
  { natural: 'D', octave: 5 },
  { natural: 'C', octave: 5 },
  { natural: 'B', octave: 4 },
  { natural: 'A', octave: 4 },
  { natural: 'G', octave: 4 },
  { natural: 'F', octave: 4 },
  { natural: 'E', octave: 4 },
  { natural: 'D', octave: 4 },
  { natural: 'C', octave: 4 },
  { natural: 'B', octave: 3 },
  { natural: 'A', octave: 3 },
  { natural: 'G', octave: 3 },
  { natural: 'F', octave: 3 }
] as const

const TOP_LINE_INDEX = 4

function getInsertIndex(
  clickX: number,
  noteStartX: number,
  noteEndX: number,
  noteLayouts: Array<{ absoluteX: number; beginX: number; endX: number }>
): number {
  if (noteLayouts.length === 0) return 0

  const insertionXs: number[] = []
  for (let i = 0; i <= noteLayouts.length; i++) {
    if (i === 0) {
      insertionXs.push((noteStartX + noteLayouts[0].beginX) / 2)
      continue
    }
    if (i === noteLayouts.length) {
      insertionXs.push((noteLayouts[i - 1].endX + noteEndX) / 2)
      continue
    }
    insertionXs.push((noteLayouts[i - 1].endX + noteLayouts[i].beginX) / 2)
  }

  let closestIndex = 0
  let closestDistance = Math.abs(clickX - insertionXs[0])
  for (let i = 1; i < insertionXs.length; i++) {
    const distance = Math.abs(clickX - insertionXs[i])
    if (distance < closestDistance) {
      closestDistance = distance
      closestIndex = i
    }
  }

  return closestIndex
}

/**
 * Transparent overlay that handles click-to-place notes on the staff.
 */
export function InteractionLayer({ stavePositions, staveWidth: _staveWidth, startY: _startY, scale }: Props) {
  const addNote = useScoreStore((s) => s.addNote)
  const setCursor = useScoreStore((s) => s.setCursor)
  const selectedDuration = useScoreStore((s) => s.selectedDuration)
  const selectedAccidental = useScoreStore((s) => s.selectedAccidental)
  const measures = useScoreStore((s) => s.score.measures)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null)

  const getPointerData = useCallback(
    (clientX: number, clientY: number, rect: DOMRect): PointerData | null => {
      const rawX = (clientX - rect.left) / scale
      const rawY = (clientY - rect.top) / scale

      let measureIndex = -1
      for (let i = 0; i < stavePositions.length; i++) {
        const pos = stavePositions[i]
        if (
          rawX >= pos.x &&
          rawX < pos.x + pos.width &&
          rawY >= pos.y - 20 &&
          rawY < pos.y + 100
        ) {
          measureIndex = i
          break
        }
      }

      if (measureIndex === -1) return null

      const stavePos = stavePositions[measureIndex]
      const noteStep = stavePos.lineSpacing / 2
      const minY = stavePos.topLineY - MAX_LEDGER_STEPS_ABOVE * noteStep
      const maxY =
        stavePos.topLineY + (PITCH_SEQUENCE.length - TOP_LINE_INDEX - 1 + MAX_LEDGER_STEPS_BELOW) * noteStep
      const clampedY = Math.max(minY, Math.min(maxY, rawY))
      const relY = clampedY - stavePos.topLineY
      const staffRelativeIndex = Math.round(relY / noteStep)
      const sequenceIndex = Math.max(
        0,
        Math.min(PITCH_SEQUENCE.length - 1, TOP_LINE_INDEX + staffRelativeIndex)
      )
      const snappedY = stavePos.topLineY + (sequenceIndex - TOP_LINE_INDEX) * noteStep

      const clampedX = Math.max(stavePos.noteStartX, Math.min(stavePos.noteEndX, rawX))
      const insertIndex = getInsertIndex(
        clampedX,
        stavePos.noteStartX,
        stavePos.noteEndX,
        stavePos.noteLayouts
      )

      return {
        measureIndex,
        insertIndex,
        natural: PITCH_SEQUENCE[sequenceIndex].natural,
        octave: PITCH_SEQUENCE[sequenceIndex].octave,
        cursorX: rawX,
        cursorY: snappedY,
      }
    },
    [measures, scale, stavePositions]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const data = getPointerData(e.clientX, e.clientY, rect)
      setCursorPos(data ? { x: data.cursorX, y: data.cursorY } : null)
    },
    [getPointerData]
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
      addNote(note, pointerData.insertIndex, pointerData.measureIndex)
    },
    [getPointerData, selectedDuration, selectedAccidental, addNote, setCursor]
  )

  return (
    <div
      className="absolute inset-0"
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setCursorPos(null)}
      style={{ zIndex: 10, cursor: 'none' }}
    >
      {cursorPos && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: cursorPos.x,
            top: cursorPos.y,
            width: 12,
            height: 8,
            borderRadius: '50%',
            border: '1.5px solid rgba(59,130,246,0.85)',
            background: 'rgba(59,130,246,0.18)',
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}
    </div>
  )
}
