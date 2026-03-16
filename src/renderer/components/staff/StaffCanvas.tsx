import { useEffect, useRef, useCallback } from 'react'
import { Renderer } from 'vexflow'
import { useScoreStore } from '../../store/score-store'
import { renderMeasures } from './NoteRenderer'
import { InteractionLayer } from './InteractionLayer'

const STAVE_WIDTH = 280
const START_X = 10
const START_Y = 40

export function StaffCanvas() {
  const svgRef = useRef<HTMLDivElement>(null)
  const stavePositionsRef = useRef<Array<{ x: number; y: number; width: number }>>([])

  const measures = useScoreStore((s) => s.score.measures)
  const timeSignature = useScoreStore((s) => s.score.timeSignature)
  const currentMeasureIndex = useScoreStore((s) => s.currentMeasureIndex)
  const currentNoteIndex = useScoreStore((s) => s.currentNoteIndex)

  const draw = useCallback(() => {
    const container = svgRef.current
    if (!container) return

    // Clear previous
    container.innerHTML = ''

    const numLines = Math.ceil(measures.length / 3) || 1
    const height = Math.max(300, numLines * 120 + 100)

    const renderer = new Renderer(container, Renderer.Backends.SVG)
    renderer.resize(960, height)
    const context = renderer.getContext()

    const result = renderMeasures(
      context,
      measures,
      START_X,
      START_Y,
      STAVE_WIDTH,
      timeSignature,
      currentMeasureIndex,
      currentNoteIndex
    )

    stavePositionsRef.current = result.stavePositions
  }, [measures, timeSignature, currentMeasureIndex, currentNoteIndex])

  useEffect(() => {
    draw()
  }, [draw])

  return (
    <div className="relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-auto">
      <div ref={svgRef} className="min-h-[300px]" />
      <InteractionLayer
        stavePositions={stavePositionsRef.current}
        staveWidth={STAVE_WIDTH}
        startY={START_Y}
      />
    </div>
  )
}
