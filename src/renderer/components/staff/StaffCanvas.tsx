import { useEffect, useRef, useCallback, useState } from 'react'
import { Renderer } from 'vexflow'
import { useScoreStore } from '../../store/score-store'
import { renderMeasures } from './NoteRenderer'
import { InteractionLayer } from './InteractionLayer'

const START_X = 10
const START_Y = 170
const STAVE_LINE_HEIGHT = 120
const HORIZONTAL_GAP = 0
const PAGE_MAX_WIDTH = 1280

export function StaffCanvas() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<HTMLDivElement>(null)
  const stavePositionsRef = useRef<
    Array<{
      x: number
      y: number
      width: number
      noteStartX: number
      topLineY: number
      lineSpacing: number
    }>
  >([])
  const [viewportWidth, setViewportWidth] = useState(PAGE_MAX_WIDTH)

  const measures = useScoreStore((s) => s.score.measures)
  const score = useScoreStore((s) => s.score)
  const timeSignature = useScoreStore((s) => s.score.timeSignature)
  const makam = useScoreStore((s) => s.score.makam)
  const measuresPerLine = useScoreStore((s) => s.score.measuresPerLine)
  const currentMeasureIndex = useScoreStore((s) => s.currentMeasureIndex)
  const currentNoteIndex = useScoreStore((s) => s.currentNoteIndex)
  const pageZoom = useScoreStore((s) => s.pageZoom)

  const normalizedMeasuresPerLine = Math.max(1, measuresPerLine)
  const pageWidth = PAGE_MAX_WIDTH
  const availableWidth = pageWidth - START_X * 2 - HORIZONTAL_GAP * (normalizedMeasuresPerLine - 1)
  const staveWidth = Math.max(140, Math.floor(availableWidth / normalizedMeasuresPerLine))
  const numLines = Math.ceil((measures.length || 1) / normalizedMeasuresPerLine)
  const pageHeight = Math.max(300, numLines * STAVE_LINE_HEIGHT + 100)
  const fitScale = Math.min(1, viewportWidth / pageWidth)
  const scale = Number((fitScale * pageZoom).toFixed(3))
  const scaledWidth = pageWidth * scale
  const scaledHeight = pageHeight * scale

  const draw = useCallback(() => {
    const container = svgRef.current
    if (!container) return

    container.innerHTML = ''

    const renderer = new Renderer(container, Renderer.Backends.SVG)
    renderer.resize(pageWidth, pageHeight)
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
  }, [
    currentMeasureIndex,
    currentNoteIndex,
    makam,
    measures,
    normalizedMeasuresPerLine,
    pageHeight,
    pageWidth,
    score,
    staveWidth,
    timeSignature
  ])

  useEffect(() => {
    draw()
  }, [draw])

  useEffect(() => {
    const updateViewport = () => {
      setViewportWidth(wrapperRef.current?.clientWidth || PAGE_MAX_WIDTH)
    }

    updateViewport()
    window.addEventListener('resize', updateViewport)

    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  return (
    <div
      ref={wrapperRef}
      className="overflow-auto"
      style={{ minHeight: '300px', width: '100%' }}
    >
      <div
        className="relative staff-paper mx-auto"
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
          minHeight: `${scaledHeight}px`
        }}
      >
        <div
          className="relative"
          style={{
            width: `${pageWidth}px`,
            height: `${pageHeight}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left'
          }}
        >
          <div ref={svgRef} style={{ width: `${pageWidth}px`, height: `${pageHeight}px` }} />
          <InteractionLayer
            stavePositions={stavePositionsRef.current}
            staveWidth={staveWidth}
            startY={START_Y}
            scale={scale}
          />
        </div>
      </div>
    </div>
  )
}
