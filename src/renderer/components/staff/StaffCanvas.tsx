import { useEffect, useRef, useCallback } from 'react'
import { Renderer } from 'vexflow'
import { useScoreStore } from '../../store/score-store'
import { renderMeasures } from './NoteRenderer'
import { InteractionLayer } from './InteractionLayer'

const START_X = 10
const START_Y = 140
const STAVE_LINE_HEIGHT = 120
const HORIZONTAL_GAP = 0
const PAGE_MIN_WIDTH = 760
const PAGE_MAX_WIDTH = 1280

export function StaffCanvas() {
  const svgRef = useRef<HTMLDivElement>(null)
  const stavePositionsRef = useRef<Array<{ x: number; y: number; width: number; noteStartX: number }>>([])

  const measures = useScoreStore((s) => s.score.measures)
  const score = useScoreStore((s) => s.score)
  const timeSignature = useScoreStore((s) => s.score.timeSignature)
  const makam = useScoreStore((s) => s.score.makam)
  const measuresPerLine = useScoreStore((s) => s.score.measuresPerLine)
  const currentMeasureIndex = useScoreStore((s) => s.currentMeasureIndex)
  const currentNoteIndex = useScoreStore((s) => s.currentNoteIndex)

  const draw = useCallback(() => {
    const container = svgRef.current
    if (!container) return

    container.innerHTML = ''

    const width = Math.max(
      PAGE_MIN_WIDTH,
      Math.min(PAGE_MAX_WIDTH, container.clientWidth || PAGE_MAX_WIDTH)
    )
    const normalizedMeasuresPerLine = Math.max(1, measuresPerLine)
    const availableWidth = width - START_X * 2 - HORIZONTAL_GAP * (normalizedMeasuresPerLine - 1)
    const staveWidth = Math.max(140, Math.floor(availableWidth / normalizedMeasuresPerLine))
    const numLines = Math.ceil((measures.length || 1) / normalizedMeasuresPerLine)
    const height = Math.max(300, numLines * STAVE_LINE_HEIGHT + 100)

    const renderer = new Renderer(container, Renderer.Backends.SVG)
    renderer.resize(width, height)
    const context = renderer.getContext()

    const result = renderMeasures(
      context,
      measures,
      START_X,
      START_Y,
      staveWidth,
      HORIZONTAL_GAP,
      score,
      timeSignature,
      makam,
      normalizedMeasuresPerLine,
      currentMeasureIndex,
      currentNoteIndex
    )

    stavePositionsRef.current = result.stavePositions
  }, [measures, score, timeSignature, makam, measuresPerLine, currentMeasureIndex, currentNoteIndex])

  useEffect(() => {
    draw()
  }, [draw])

  return (
    <div
      className="relative staff-paper overflow-auto mx-auto"
      style={{ minHeight: '300px', maxWidth: `${PAGE_MAX_WIDTH}px`, width: '100%' }}
    >
      <div ref={svgRef} style={{ minHeight: '300px', width: '100%' }} />
      <InteractionLayer
        stavePositions={stavePositionsRef.current}
        staveWidth={Math.max(
          140,
          Math.floor(
            (Math.max(
              PAGE_MIN_WIDTH,
              Math.min(PAGE_MAX_WIDTH, svgRef.current?.clientWidth || PAGE_MAX_WIDTH)
            ) -
              START_X * 2 -
              HORIZONTAL_GAP * (Math.max(1, measuresPerLine) - 1)) /
              Math.max(1, measuresPerLine)
          )
        )}
        startY={START_Y}
      />
    </div>
  )
}
