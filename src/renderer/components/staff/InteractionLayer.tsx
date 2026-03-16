import { useCallback, useMemo, useState } from 'react'
import { useScoreStore } from '../../store/score-store'
import { createNote } from '../../core/pitch-to-note'
import { Duration, NaturalNote } from '../../types'

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
const NOTE_END_PADDING = 20

interface PreviewPosition {
  x: number
  y: number
  ledgerLines: number[]
}

interface PointerData {
  measureIndex: number
  insertIndex: number
  natural: NaturalNote
  octave: number
  previewX: number
  previewY: number
  ledgerLines: number[]
}

const DURATION_ICONS: Record<Duration, string> = {
  '1': '\uD834\uDD5D',
  '2': '\uD834\uDD5E',
  '4': '\u2669',
  '8': '\u266A',
  '16': '\u266C',
  '32': '\uD834\uDD61',
  '64': '\uD834\uDD62'
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

function getInsertionPreview(
  clickX: number,
  noteStartX: number,
  noteEndX: number,
  noteLayouts: Array<{ absoluteX: number; beginX: number; endX: number }>
): { insertIndex: number; previewX: number } {
  if (noteLayouts.length === 0) {
    return {
      insertIndex: 0,
      previewX: (noteStartX + noteEndX) / 2
    }
  }

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

  return {
    insertIndex: closestIndex,
    previewX: insertionXs[closestIndex]
  }
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
export function InteractionLayer({ stavePositions, staveWidth, startY: _startY, scale }: Props) {
  const addNote = useScoreStore((s) => s.addNote)
  const setCursor = useScoreStore((s) => s.setCursor)
  const selectedDuration = useScoreStore((s) => s.selectedDuration)
  const selectedAccidental = useScoreStore((s) => s.selectedAccidental)
  const measures = useScoreStore((s) => s.score.measures)
  const [preview, setPreview] = useState<PreviewPosition | null>(null)

  const getPointerData = useCallback(
    (clientX: number, clientY: number, rect: DOMRect): PointerData | null => {
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
      const maxY =
        stavePos.topLineY + (PITCH_SEQUENCE.length - TOP_LINE_INDEX - 1 + MAX_LEDGER_STEPS_BELOW) * noteStep
      const clampedY = Math.max(minY, Math.min(maxY, clickY))
      const relY = clampedY - stavePos.topLineY
      const staffRelativeIndex = Math.round(relY / noteStep)
      const sequenceIndex = Math.max(
        0,
        Math.min(PITCH_SEQUENCE.length - 1, TOP_LINE_INDEX + staffRelativeIndex)
      )
      const noteY = stavePos.topLineY + (sequenceIndex - TOP_LINE_INDEX) * noteStep

      const clampedX = Math.max(stavePos.noteStartX, Math.min(stavePos.noteEndX, clickX))
      const { insertIndex } = getInsertionPreview(
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
        previewX: clampedX,
        previewY: noteY,
        ledgerLines: getLedgerLines(sequenceIndex - TOP_LINE_INDEX, stavePos.topLineY, noteStep)
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
      addNote(note, pointerData.insertIndex, pointerData.measureIndex)
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
            left: `${preview.x}px`,
            top: `${preview.y}px`
          }
        : null,
    [preview]
  )

  return (
    <div
      className="absolute inset-0"
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setPreview(null)}
      style={{ zIndex: 10, cursor: 'none' }}
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
          className="absolute"
          style={{
            ...previewStyle,
            color: 'rgba(59,130,246,0.9)',
            fontSize: '30px',
            lineHeight: 1,
            opacity: 0.45,
            pointerEvents: 'none',
            transform: 'translate(-50%, -60%) scale(1.9)'
          }}
        >
          <div>{DURATION_ICONS[selectedDuration]}</div>
        </div>
      )}
    </div>
  )
}
