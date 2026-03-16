import { Stave, StaveNote, Dot, Formatter, Voice, Accidental, KeySignature } from 'vexflow'
import { DikteNote, Measure, AccidentalType, Score, NaturalNote } from '../../types'
import { noteToVexFlowKey } from '../../core/note-names'
import { getMakamSignature } from '../../core/makam'
import { getRhythmLabel } from '../../core/rhythm'
import { getMeasureCapacity, getMeasureUnits } from '../../core/measure-duration'

const TURKISH_GLYPHS = {
  fazlaFlat: '\uE443',
  bakiyeSharp: '\uE445',
  kucukFlat: '\uE441'
} as const

class CustomKeySignature extends KeySignature {
  constructor(private readonly customAccidentals: Array<{ type: string; line: number }>) {
    super('C')
  }

  override format() {
    let stave = this.getStave()
    if (!stave) {
      stave = new Stave(0, 0, 100)
      this.setStave(stave)
    }

    this.width = 0
    this.children = []
    this.accList = this.customAccidentals.map((entry) => ({ ...entry }))

    for (let i = 0; i < this.accList.length; i++) {
      this.convertToGlyph(this.accList[i], this.accList[i + 1], stave)
    }

    this.calculateDimensions()
    this.formatted = true
  }
}

/**
 * Map Turkish accidental types to VexFlow accidental codes.
 * VexFlow supports: #, b, ##, bb, n
 * For microtonal accidentals, we use the closest Western equivalent
 * and add text annotations.
 */
function accidentalToVexFlow(type: AccidentalType): string | null {
  switch (type) {
    case 'none': return null
    case 'fazla_sharp': return '+'
    case 'bakiye_sharp': return TURKISH_GLYPHS.bakiyeSharp
    case 'kucuk_sharp': return '+'
    case 'buyuk_sharp': return '#'
    case 'tanini_sharp': return '##'
    case 'fazla_flat': return TURKISH_GLYPHS.fazlaFlat
    case 'bakiye_flat': return 'bs'
    case 'kucuk_flat': return TURKISH_GLYPHS.kucukFlat
    case 'buyuk_flat': return 'b'
    case 'tanini_flat': return 'bb'
    default: return null
  }
}

/**
 * Get a display label for microtonal accidentals (to show as text).
 */
function accidentalLabel(type: AccidentalType): string | null {
  switch (type) {
    case 'fazla_sharp': return '1↑'
    case 'bakiye_sharp': return '4↑'
    case 'kucuk_sharp': return '5↑'
    case 'buyuk_sharp': return '8↑'
    case 'tanini_sharp': return '9↑'
    case 'fazla_flat': return '1↓'
    case 'bakiye_flat': return '4↓'
    case 'kucuk_flat': return '5↓'
    case 'buyuk_flat': return '8↓'
    case 'tanini_flat': return '9↓'
    default: return null
  }
}

/**
 * Convert a DikteNote to a VexFlow StaveNote.
 */
export function dikteNoteToStaveNote(note: DikteNote): StaveNote {
  if (note.isRest) {
    const staveNote = new StaveNote({
      keys: ['b/4'],
      duration: `${note.duration}r`
    })
    if (note.dotted) {
      Dot.buildAndAttach([staveNote])
    }
    return staveNote
  }

  const key = noteToVexFlowKey(note.natural, note.octave)
  const staveNote = new StaveNote({
    keys: [key],
    duration: note.duration
  })

  const vfAcc = accidentalToVexFlow(note.accidental)
  if (vfAcc) {
    staveNote.addModifier(new Accidental(vfAcc))
  }

  if (note.dotted) {
    Dot.buildAndAttach([staveNote])
  }

  return staveNote
}

/**
 * Render measures onto staves within an SVG context.
 */
export function renderMeasures(
  context: any,
  measures: Measure[],
  startX: number,
  startY: number,
  staveWidth: number,
  staveGap: number,
  score: Score,
  timeSignature: [number, number],
  makam: string,
  measuresPerLine: number,
  selectedMeasure: number,
  selectedNote: number,
  measureError: { measureIndex: number; message: string } | null
): {
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
} {
  const stavePositions: Array<{
    x: number
    y: number
    width: number
    noteStartX: number
    noteEndX: number
    noteLayouts: Array<{ absoluteX: number; beginX: number; endX: number }>
    topLineY: number
    lineSpacing: number
  }> = []
  let x = startX
  let y = startY
  const keySignature = buildMakamSignature(makam)
  const sheetWidth = measuresPerLine * staveWidth + (measuresPerLine - 1) * staveGap

  renderScoreHeader(context, score, startX, startY - 100, sheetWidth)

  for (let mi = 0; mi < measures.length; mi++) {
    const measure = measures[mi]
    const isLineStart = mi % measuresPerLine === 0
    const isOverCapacity = getMeasureUnits(measure) > getMeasureCapacity(timeSignature)
    const activeError = measureError?.measureIndex === mi ? measureError.message : null
    const hasError = isOverCapacity || Boolean(activeError)

    if (mi > 0 && isLineStart) {
      x = startX
      y += 120
    }

    const stave = new Stave(x, y, staveWidth)

    if (isLineStart) {
      stave.addClef('treble')
      if (keySignature) {
        stave.addModifier(keySignature())
      }
    }
    if (mi === 0) {
      stave.addTimeSignature(`${timeSignature[0]}/${timeSignature[1]}`)
    }

    if (hasError) {
      stave.setStyle({ strokeStyle: '#dc2626', fillStyle: '#dc2626' })
    }

    stave.setContext(context).draw()
    const noteStartX = stave.getNoteStartX()
    const noteEndX = x + staveWidth - 20
    const stavePosition = {
      x,
      y,
      width: staveWidth,
      noteStartX,
      noteEndX,
      noteLayouts: [] as Array<{ absoluteX: number; beginX: number; endX: number }>,
      topLineY: stave.getYForLine(0),
      lineSpacing: stave.getSpacingBetweenLines()
    }
    stavePositions.push(stavePosition)

    if (measure.notes.length > 0) {
      const staveNotes = measure.notes.map((note, ni) => {
        const sn = dikteNoteToStaveNote(note)
        if (hasError) {
          sn.setStyle({ fillStyle: '#dc2626', strokeStyle: '#dc2626' })
        }
        // Highlight selected note
        if (mi === selectedMeasure && ni === selectedNote) {
          sn.setStyle({ fillStyle: '#3b82f6', strokeStyle: '#3b82f6' })
        }
        return sn
      })

      const voice = new Voice({
        numBeats: timeSignature[0],
        beatValue: timeSignature[1]
      }).setMode(Voice.Mode.SOFT)

      voice.addTickables(staveNotes)

      const formatWidth = Math.max(40, staveWidth - (isLineStart ? 120 : 40))
      new Formatter().joinVoices([voice]).format([voice], formatWidth)
      stavePosition.noteLayouts = staveNotes.map((staveNote) => ({
        absoluteX: staveNote.getAbsoluteX(),
        beginX: staveNote.getNoteHeadBeginX(),
        endX: staveNote.getNoteHeadEndX()
      }))
      voice.draw(context, stave)
    }

    if (hasError) {
      context.save()
      context.setFont('Arial', 11, 'bold')
      context.setFillStyle('#dc2626')
      context.fillText(activeError ?? 'Olcu kapasitesi asildi', x + 4, y - 10)
      context.restore()
    }

    x += staveWidth + staveGap
  }

  return { stavePositions }
}

function renderScoreHeader(context: any, score: Score, x: number, y: number, width: number): void {
  const metaColor = '#374151'
  const titleColor = '#111827'
  const leftMeta = [
    score.rhythm ? `Usul: ${getRhythmLabel(score.rhythm)}` : ''
  ].filter(Boolean)
  const rightMeta = [
    score.composer ? `Beste: ${score.composer}` : '',
    score.writer ? `Gufte: ${score.writer}` : '',
    score.source ? `Kaynak: ${score.source}` : ''
  ].filter(Boolean)

  context.save()
  context.setFont('Arial', 13, 'italic')
  context.setFillStyle(metaColor)

  leftMeta.forEach((line, index) => {
    context.fillText(line, x, y + 40 + index * 18)
  })

  rightMeta.forEach((line, index) => {
    const textWidth = measureTextWidth(context, line)
    context.fillText(line, x + width - textWidth, y + 30 + index * 18)
  })

  const headerTitle = score.genre || score.makam

  if (headerTitle) {
    context.setFont('Arial', 18, 'bold italic')
    context.setFillStyle(titleColor)
    const genreWidth = measureTextWidth(context, headerTitle)
    context.fillText(headerTitle, x + (width - genreWidth) / 2, y + 18)
  }

  if (score.title) {
    context.setFont('Arial', 16, 'bold italic')
    context.setFillStyle(titleColor)
    const titleWidth = measureTextWidth(context, score.title)
    context.fillText(score.title, x + (width - titleWidth) / 2, y + 38)
  }

  if (score.subtitle) {
    context.setFont('Arial', 12, 'italic')
    context.setFillStyle(metaColor)
    const subtitleWidth = measureTextWidth(context, score.subtitle)
    context.fillText(score.subtitle, x + (width - subtitleWidth) / 2, y + 56)
  }

  context.restore()
}

function measureTextWidth(context: any, text: string): number {
  if (typeof context.measureText !== 'function') {
    return text.length * 8
  }

  const measured = context.measureText(text)
  if (typeof measured === 'number') return measured
  if (typeof measured?.width === 'function') return measured.width()
  if (typeof measured?.width === 'number') return measured.width
  if (typeof measured?.w === 'number') return measured.w
  return text.length * 8
}

function buildMakamSignature(makam: string): (() => CustomKeySignature) | null {
  const signature = getMakamSignature(makam)
  if (signature.length === 0) return null

  const entries = signature
    .map((entry) => {
      const type = accidentalToVexFlow(entry.accidental)
      const line = getSignatureLine(entry.natural, entry.accidental)
      if (!type || line === null) return null
      return { type, line }
    })
    .filter((entry): entry is { type: string; line: number } => entry !== null)

  if (entries.length === 0) return null
  return () => new CustomKeySignature(entries)
}

function getSignatureLine(natural: NaturalNote, accidental: AccidentalType): number | null {
  if (accidental.includes('flat')) {
    return {
      B: 2,
      E: 0.5,
      A: 2.5,
      D: 1,
      G: 3,
      C: 1.5,
      F: 3.5
    }[natural] ?? null
  }

  if (accidental.includes('sharp')) {
    return {
      F: 0,
      C: 1.5,
      G: -0.5,
      D: 1,
      A: 2.5,
      E: 0.5,
      B: 2
    }[natural] ?? null
  }

  return null
}
