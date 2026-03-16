import { Stave, StaveNote, Dot, Formatter, Voice, Accidental } from 'vexflow'
import { DikteNote, Measure, AccidentalType } from '../../types'
import { noteToVexFlowKey } from '../../core/note-names'

/**
 * Map Turkish accidental types to VexFlow accidental codes.
 * VexFlow supports: #, b, ##, bb, n
 * For microtonal accidentals, we use the closest Western equivalent
 * and add text annotations.
 */
function accidentalToVexFlow(type: AccidentalType): string | null {
  switch (type) {
    case 'none': return null
    case 'fazla_sharp': return '+' // quarter-tone-ish sharp
    case 'bakiye_sharp': return '+'
    case 'kucuk_sharp': return '+'
    case 'buyuk_sharp': return '#'
    case 'tanini_sharp': return '##'
    case 'fazla_flat': return 'db' // quarter-tone-ish flat
    case 'bakiye_flat': return 'db'
    case 'kucuk_flat': return 'db'
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
  timeSignature: [number, number],
  selectedMeasure: number,
  selectedNote: number
): { stavePositions: Array<{ x: number; y: number; width: number }> } {
  const stavePositions: Array<{ x: number; y: number; width: number }> = []
  const stavesPerLine = Math.max(1, Math.floor(900 / staveWidth))
  let x = startX
  let y = startY

  for (let mi = 0; mi < measures.length; mi++) {
    const measure = measures[mi]

    // Wrap to next line
    if (mi > 0 && mi % stavesPerLine === 0) {
      x = startX
      y += 120
    }

    const stave = new Stave(x, y, staveWidth)

    if (mi === 0) {
      stave.addClef('treble')
      stave.addTimeSignature(`${timeSignature[0]}/${timeSignature[1]}`)
    }

    stave.setContext(context).draw()
    stavePositions.push({ x, y, width: staveWidth })

    if (measure.notes.length > 0) {
      const staveNotes = measure.notes.map((note, ni) => {
        const sn = dikteNoteToStaveNote(note)
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

      new Formatter().joinVoices([voice]).format([voice], staveWidth - 50)
      voice.draw(context, stave)
    }

    x += staveWidth
  }

  return { stavePositions }
}
