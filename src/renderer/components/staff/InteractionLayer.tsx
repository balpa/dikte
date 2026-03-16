import { useCallback } from 'react'
import { useScoreStore } from '../../store/score-store'
import { createNote } from '../../core/pitch-to-note'
import { NaturalNote } from '../../types'

interface Props {
  stavePositions: Array<{ x: number; y: number; width: number; noteStartX: number }>
  staveWidth: number
  startY: number
}

// Treble staff positions from top line downward, including spaces and nearby ledger positions.
const STAFF_NOTES: NaturalNote[] = ['F', 'E', 'D', 'C', 'B', 'A', 'G', 'F', 'E', 'D', 'C', 'B', 'A', 'G', 'F']
const STAFF_OCTAVES = [5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 4, 3, 3, 3, 3]
const STAFF_TOP_OFFSET = 0
const NOTE_STEP = 5
const NOTE_END_PADDING = 20

/**
 * Transparent overlay that handles click-to-place notes on the staff.
 */
export function InteractionLayer({ stavePositions, staveWidth, startY }: Props) {
  const addNote = useScoreStore((s) => s.addNote)
  const setCursor = useScoreStore((s) => s.setCursor)
  const selectedDuration = useScoreStore((s) => s.selectedDuration)
  const selectedAccidental = useScoreStore((s) => s.selectedAccidental)
  const measures = useScoreStore((s) => s.score.measures)

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top

      // Find which measure was clicked
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

      if (measureIndex === -1) return

      const stavePos = stavePositions[measureIndex]
      const measure = measures[measureIndex]

      const staffTop = stavePos.y + STAFF_TOP_OFFSET
      const relY = clickY - staffTop
      const pitchIndex = Math.round(relY / NOTE_STEP)
      const clampedIndex = Math.max(0, Math.min(STAFF_NOTES.length - 1, pitchIndex))

      const natural = STAFF_NOTES[clampedIndex]
      const octave = STAFF_OCTAVES[clampedIndex]
      const noteAreaStart = stavePos.noteStartX
      const noteAreaWidth = Math.max(40, stavePos.x + staveWidth - noteAreaStart - NOTE_END_PADDING)
      const slotCount = Math.max(1, measure.notes.length + 1)
      const relativeX = Math.max(0, Math.min(noteAreaWidth, clickX - noteAreaStart))
      const insertIndex = Math.max(
        0,
        Math.min(measure.notes.length, Math.round((relativeX / noteAreaWidth) * slotCount))
      )

      setCursor(measureIndex, insertIndex)

      const note = createNote(natural, octave, selectedAccidental, selectedDuration)
      addNote(note, insertIndex)
    },
    [stavePositions, measures, staveWidth, selectedDuration, selectedAccidental, addNote, setCursor]
  )

  return (
    <div
      className="absolute inset-0 cursor-crosshair"
      onClick={handleClick}
      style={{ zIndex: 10 }}
    />
  )
}
