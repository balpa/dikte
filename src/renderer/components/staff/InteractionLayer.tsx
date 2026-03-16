import { useCallback } from 'react'
import { useScoreStore } from '../../store/score-store'
import { createNote, createRest } from '../../core/pitch-to-note'
import { NaturalNote } from '../../types'

interface Props {
  stavePositions: Array<{ x: number; y: number; width: number }>
  staveWidth: number
  startY: number
}

// Staff line positions (from top): F5, D5, B4, G4, E4
// Ledger lines above/below extend the range
const STAFF_NOTES: NaturalNote[] = ['F', 'E', 'D', 'C', 'B', 'A', 'G', 'F', 'E', 'D', 'C']
const STAFF_OCTAVES = [5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 4]
const LINE_SPACING = 10 // pixels between staff positions (line + space)

/**
 * Transparent overlay that handles click-to-place notes on the staff.
 */
export function InteractionLayer({ stavePositions, staveWidth, startY }: Props) {
  const addNote = useScoreStore((s) => s.addNote)
  const setCursor = useScoreStore((s) => s.setCursor)
  const selectedDuration = useScoreStore((s) => s.selectedDuration)
  const selectedAccidental = useScoreStore((s) => s.selectedAccidental)

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

      // Determine pitch from Y position
      // Top of staff (first line) is at stavePos.y
      const staffTop = stavePos.y
      const relY = clickY - staffTop
      const noteIndex = Math.round(relY / LINE_SPACING)
      const clampedIndex = Math.max(0, Math.min(STAFF_NOTES.length - 1, noteIndex))

      const natural = STAFF_NOTES[clampedIndex]
      const octave = STAFF_OCTAVES[clampedIndex]

      setCursor(measureIndex, -1)

      const note = createNote(natural, octave, selectedAccidental, selectedDuration)
      addNote(note)
    },
    [stavePositions, selectedDuration, selectedAccidental, addNote, setCursor]
  )

  return (
    <div
      className="absolute inset-0 cursor-crosshair"
      onClick={handleClick}
      style={{ zIndex: 10 }}
    />
  )
}
