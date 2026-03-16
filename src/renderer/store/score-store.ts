import { create } from 'zustand'
import { DikteNote, Measure, Score, Duration, AccidentalType, DikteFile } from '../types'

interface HistoryEntry {
  measures: Measure[]
}

interface ScoreState {
  score: Score
  currentMeasureIndex: number
  currentNoteIndex: number
  selectedDuration: Duration
  selectedAccidental: AccidentalType
  pageZoom: number
  filePath: string | null
  isDirty: boolean

  // Undo/redo
  history: HistoryEntry[]
  historyIndex: number

  // Actions
  setScore: (score: Score) => void
  newScore: () => void
  addNote: (note: DikteNote, insertAt?: number) => void
  updateNote: (measureIndex: number, noteIndex: number, note: Partial<DikteNote>) => void
  deleteNote: (measureIndex: number, noteIndex: number) => void
  setCursor: (measureIndex: number, noteIndex: number) => void
  setSelectedDuration: (duration: Duration) => void
  setSelectedAccidental: (accidental: AccidentalType) => void
  setPageZoom: (zoom: number) => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  addMeasure: () => void
  setFilePath: (path: string | null) => void
  setDirty: (dirty: boolean) => void
  undo: () => void
  redo: () => void
  serialize: () => string
  deserialize: (json: string) => void
}

const DEFAULT_STAFF_LINES = 8

function createEmptyMeasure(): Measure {
  return {
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    notes: []
  }
}

function createDefaultMeasures(count: number): Measure[] {
  return Array.from({ length: count }, () => createEmptyMeasure())
}

function createDefaultScore(): Score {
  const measuresPerLine = 4

  return {
    genre: '',
    title: '',
    subtitle: '',
    composer: '',
    writer: '',
    source: '',
    makam: 'rast',
    rhythm: '',
    usul: '',
    measuresPerLine,
    measures: createDefaultMeasures(DEFAULT_STAFF_LINES * measuresPerLine),
    timeSignature: [4, 4],
    tempo: 80
  }
}

function pushHistory(state: ScoreState): Partial<ScoreState> {
  const entry: HistoryEntry = {
    measures: JSON.parse(JSON.stringify(state.score.measures))
  }
  const newHistory = state.history.slice(0, state.historyIndex + 1)
  newHistory.push(entry)
  // Limit history to 100 entries
  if (newHistory.length > 100) newHistory.shift()
  return {
    history: newHistory,
    historyIndex: newHistory.length - 1,
    isDirty: true
  }
}

export const useScoreStore = create<ScoreState>((set, get) => ({
  score: createDefaultScore(),
  currentMeasureIndex: 0,
  currentNoteIndex: 0,
  selectedDuration: '4',
  selectedAccidental: 'none',
  pageZoom: 1,
  filePath: null,
  isDirty: false,
  history: [{ measures: createDefaultScore().measures }],
  historyIndex: 0,

  setScore: (score) => set({ score, isDirty: true }),

  newScore: () => {
    const score = createDefaultScore()
    set({
      score,
      currentMeasureIndex: 0,
      currentNoteIndex: 0,
      filePath: null,
      isDirty: false,
      history: [{ measures: JSON.parse(JSON.stringify(score.measures)) }],
      historyIndex: 0
    })
  },

  addNote: (note, insertAt) =>
    set((state) => {
      const histUpdate = pushHistory(state)
      const measures = JSON.parse(JSON.stringify(state.score.measures)) as Measure[]
      const mi = state.currentMeasureIndex

      // Ensure measure exists
      while (measures.length <= mi) {
        measures.push(createEmptyMeasure())
      }

      const noteIndex =
        typeof insertAt === 'number'
          ? Math.max(0, Math.min(insertAt, measures[mi].notes.length))
          : measures[mi].notes.length

      measures[mi].notes.splice(noteIndex, 0, note)

      return {
        ...histUpdate,
        score: { ...state.score, measures },
        currentNoteIndex: noteIndex
      }
    }),

  updateNote: (measureIndex, noteIndex, updates) =>
    set((state) => {
      const histUpdate = pushHistory(state)
      const measures = JSON.parse(JSON.stringify(state.score.measures)) as Measure[]
      if (measures[measureIndex]?.notes[noteIndex]) {
        Object.assign(measures[measureIndex].notes[noteIndex], updates)
      }
      return {
        ...histUpdate,
        score: { ...state.score, measures }
      }
    }),

  deleteNote: (measureIndex, noteIndex) =>
    set((state) => {
      const histUpdate = pushHistory(state)
      const measures = JSON.parse(JSON.stringify(state.score.measures)) as Measure[]
      if (measures[measureIndex]?.notes[noteIndex] !== undefined) {
        measures[measureIndex].notes.splice(noteIndex, 1)
      }
      return {
        ...histUpdate,
        score: { ...state.score, measures },
        currentNoteIndex: Math.max(0, noteIndex - 1)
      }
    }),

  setCursor: (measureIndex, noteIndex) =>
    set({ currentMeasureIndex: measureIndex, currentNoteIndex: noteIndex }),

  setSelectedDuration: (duration) => set({ selectedDuration: duration }),
  setSelectedAccidental: (accidental) => set({ selectedAccidental: accidental }),
  setPageZoom: (zoom) => set({ pageZoom: Math.max(0.5, Math.min(2, zoom)) }),
  zoomIn: () => set((state) => ({ pageZoom: Math.min(2, Number((state.pageZoom + 0.1).toFixed(2))) })),
  zoomOut: () => set((state) => ({ pageZoom: Math.max(0.5, Number((state.pageZoom - 0.1).toFixed(2))) })),
  resetZoom: () => set({ pageZoom: 1 }),

  addMeasure: () =>
    set((state) => {
      const histUpdate = pushHistory(state)
      const measures = [...state.score.measures, createEmptyMeasure()]
      return {
        ...histUpdate,
        score: { ...state.score, measures },
        currentMeasureIndex: measures.length - 1,
        currentNoteIndex: 0
      }
    }),

  setFilePath: (path) => set({ filePath: path }),
  setDirty: (dirty) => set({ isDirty: dirty }),

  undo: () =>
    set((state) => {
      if (state.historyIndex <= 0) return state
      const newIndex = state.historyIndex - 1
      const entry = state.history[newIndex]
      return {
        historyIndex: newIndex,
        score: {
          ...state.score,
          measures: JSON.parse(JSON.stringify(entry.measures))
        },
        isDirty: true
      }
    }),

  redo: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state
      const newIndex = state.historyIndex + 1
      const entry = state.history[newIndex]
      return {
        historyIndex: newIndex,
        score: {
          ...state.score,
          measures: JSON.parse(JSON.stringify(entry.measures))
        },
        isDirty: true
      }
    }),

  serialize: () => {
    const state = get()
    const dikteFile: DikteFile = {
      version: '0.1.0',
      score: state.score
    }
    return JSON.stringify(dikteFile, null, 2)
  },

  deserialize: (json) => {
    const file: DikteFile = JSON.parse(json)
    const score: Score = {
      ...file.score,
      genre: file.score.genre ?? '',
      subtitle: file.score.subtitle ?? '',
      writer: file.score.writer ?? '',
      source: file.score.source ?? '',
      rhythm: file.score.rhythm ?? file.score.usul ?? '',
      usul: file.score.usul ?? file.score.rhythm ?? '',
      measuresPerLine: Math.max(1, Math.min(8, file.score.measuresPerLine ?? 4)),
      measures: file.score.measures?.length
        ? file.score.measures
        : createDefaultMeasures(
            DEFAULT_STAFF_LINES * Math.max(1, Math.min(8, file.score.measuresPerLine ?? 4))
          )
    }
    set({
      score,
      currentMeasureIndex: 0,
      currentNoteIndex: 0,
      isDirty: false,
      history: [{ measures: JSON.parse(JSON.stringify(score.measures)) }],
      historyIndex: 0
    })
  }
}))
