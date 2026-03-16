import { PitchDetector } from 'pitchy'
import { detectOnsets, OnsetSegment } from './note-onset'
import { komaToDikteNote } from '../core/pitch-to-note'
import { hzToKoma } from '../core/koma'
import { AccidentalType, DikteNote, Duration, NaturalNote } from '../types'

export interface AnalysisResult {
  notes: DikteNote[]
  segments: OnsetSegment[]
}

const ANALYSIS_BUFFER_SIZE = 4096
const ANALYSIS_HOP_SIZE = 1024
const CLARITY_THRESHOLD = 0.82
const MIN_RMS = 0.01
const LOCK_TOLERANCE_KOMA = 2
const SWITCH_TOLERANCE_KOMA = 4
const CHANGE_CONFIRM_WINDOWS = 2
const MIN_NOTE_SECONDS = 0.16
const MAX_GAP_SECONDS = 0.1
const MIN_SPLIT_NOTE_SECONDS = 0.18
const PERCUSSIVE_ATTACK_SECONDS = 0.04
const PERCUSSIVE_SUSTAIN_SECONDS = 0.14
const PERCUSSIVE_ATTACK_RATIO = 1.15
const PERCUSSIVE_MIN_SEGMENTS = 6
const PERCUSSIVE_DIRECT_SEGMENT_MAX = 24

const A4_HZ = 440

const EQUAL_TEMPERED_MAP: Array<{ natural: NaturalNote; accidental: AccidentalType }> = [
  { natural: 'C', accidental: 'none' },
  { natural: 'C', accidental: 'bakiye_sharp' },
  { natural: 'D', accidental: 'none' },
  { natural: 'D', accidental: 'bakiye_sharp' },
  { natural: 'E', accidental: 'none' },
  { natural: 'F', accidental: 'none' },
  { natural: 'F', accidental: 'kucuk_sharp' },
  { natural: 'G', accidental: 'none' },
  { natural: 'G', accidental: 'bakiye_sharp' },
  { natural: 'A', accidental: 'none' },
  { natural: 'A', accidental: 'bakiye_sharp' },
  { natural: 'B', accidental: 'none' }
]

interface PitchFrame {
  startSample: number
  endSample: number
  startTime: number
  endTime: number
  koma: number | null
  clarity: number
  rms: number
}

interface NoteCandidate {
  koma: number
  startTime: number
  endTime: number
  observedKomas?: number[]
}

interface SegmentPitch {
  frequency: number
  durationSeconds: number
}

function normalizeAudioBuffer(input: ArrayBuffer | ArrayBufferView): ArrayBuffer {
  if (input instanceof ArrayBuffer) {
    return input
  }

  const view = input as ArrayBufferView
  const bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
  const copy = new Uint8Array(view.byteLength)
  copy.set(bytes)
  return copy.buffer
}

function estimateDuration(seconds: number, tempo: number): Duration {
  const beatDuration = 60 / tempo
  const beats = seconds / beatDuration

  if (beats >= 3) return '1'
  if (beats >= 1.5) return '2'
  if (beats >= 0.75) return '4'
  if (beats >= 0.375) return '8'
  if (beats >= 0.1875) return '16'
  return '32'
}

function computeRms(buffer: Float32Array): number {
  let sumSquares = 0
  for (let i = 0; i < buffer.length; i++) {
    sumSquares += buffer[i] * buffer[i]
  }
  return Math.sqrt(sumSquares / buffer.length)
}

function sliceRms(
  data: Float32Array,
  sampleRate: number,
  startSeconds: number,
  durationSeconds: number
): number {
  const start = Math.floor(startSeconds * sampleRate)
  const end = Math.min(data.length, start + Math.floor(durationSeconds * sampleRate))
  if (end <= start) return 0
  return computeRms(data.slice(start, end))
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle]
}

function extractPitchFrames(
  audioData: Float32Array,
  sampleRate: number,
  detector: PitchDetector<Float32Array>
): PitchFrame[] {
  const frames: PitchFrame[] = []

  for (
    let startSample = 0;
    startSample + ANALYSIS_BUFFER_SIZE <= audioData.length;
    startSample += ANALYSIS_HOP_SIZE
  ) {
    const endSample = startSample + ANALYSIS_BUFFER_SIZE
    const slice = audioData.slice(startSample, endSample)
    const rms = computeRms(slice)

    let koma: number | null = null
    let clarity = 0

    if (rms >= MIN_RMS) {
      const [frequency, nextClarity] = detector.findPitch(slice, sampleRate)
      clarity = nextClarity

      if (clarity >= CLARITY_THRESHOLD && frequency > 50 && frequency < 1600) {
        koma = hzToKoma(frequency)
      }
    }

    frames.push({
      startSample,
      endSample,
      startTime: startSample / sampleRate,
      endTime: endSample / sampleRate,
      koma,
      clarity,
      rms
    })
  }

  return frames
}

function hzToEqualTemperedNote(frequency: number, duration: Duration): DikteNote | null {
  if (frequency <= 0) return null

  const midi = Math.round(69 + 12 * Math.log2(frequency / A4_HZ))
  const normalized = ((midi % 12) + 12) % 12
  const octave = Math.floor(midi / 12) - 1
  const spelling = EQUAL_TEMPERED_MAP[normalized]

  return {
    id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    natural: spelling.natural,
    octave,
    accidental: spelling.accidental,
    komaFromC4: hzToKoma(frequency),
    duration,
    dotted: false,
    tied: false,
    isRest: false
  }
}

function analyzeSegmentFrequency(
  segmentData: Float32Array,
  sampleRate: number,
  detector: PitchDetector<Float32Array>
): number | null {
  if (segmentData.length < ANALYSIS_BUFFER_SIZE) return null

  const skipSamples = Math.floor(PERCUSSIVE_ATTACK_SECONDS * sampleRate)
  const usableStart = Math.min(Math.max(0, skipSamples), Math.max(0, segmentData.length - ANALYSIS_BUFFER_SIZE))
  const usableData = segmentData.slice(usableStart)
  if (usableData.length < ANALYSIS_BUFFER_SIZE) return null

  const frequencies: number[] = []
  for (
    let offset = 0;
    offset + ANALYSIS_BUFFER_SIZE <= usableData.length;
    offset += ANALYSIS_HOP_SIZE
  ) {
    const chunk = usableData.slice(offset, offset + ANALYSIS_BUFFER_SIZE)
    const [frequency, clarity] = detector.findPitch(chunk, sampleRate)
    if (clarity >= CLARITY_THRESHOLD && frequency > 50 && frequency < 1600) {
      frequencies.push(frequency)
    }
  }

  return median(frequencies)
}

function isPercussiveSource(
  channelData: Float32Array,
  sampleRate: number,
  segments: OnsetSegment[]
): boolean {
  if (segments.length < PERCUSSIVE_MIN_SEGMENTS) return false
  if (segments.length <= PERCUSSIVE_DIRECT_SEGMENT_MAX) return true

  let strongAttackCount = 0
  let measuredSegments = 0

  for (const segment of segments.slice(0, 24)) {
    const segmentData = channelData.slice(segment.startSample, segment.endSample)
    if (segmentData.length < Math.floor(sampleRate * 0.08)) continue

    const attackRms = sliceRms(segmentData, sampleRate, 0, PERCUSSIVE_ATTACK_SECONDS)
    const sustainRms = sliceRms(segmentData, sampleRate, PERCUSSIVE_ATTACK_SECONDS, PERCUSSIVE_SUSTAIN_SECONDS)

    if (sustainRms > 0) {
      measuredSegments += 1
      if (attackRms / sustainRms >= PERCUSSIVE_ATTACK_RATIO) {
        strongAttackCount += 1
      }
    }
  }

  return measuredSegments >= PERCUSSIVE_MIN_SEGMENTS && strongAttackCount / measuredSegments >= 0.45
}

function analyzePercussiveNotes(
  channelData: Float32Array,
  sampleRate: number,
  tempo: number,
  detector: PitchDetector<Float32Array>,
  segments: OnsetSegment[]
): DikteNote[] {
  const segmentPitches: SegmentPitch[] = []

  for (const segment of segments) {
    const durationSeconds = segment.endTime - segment.startTime
    if (durationSeconds < MIN_NOTE_SECONDS) continue

    const segmentData = channelData.slice(segment.startSample, segment.endSample)
    const frequency = analyzeSegmentFrequency(segmentData, sampleRate, detector)
    if (!frequency) continue

    segmentPitches.push({
      frequency,
      durationSeconds
    })
  }

  return segmentPitches
    .map((segment) => hzToEqualTemperedNote(segment.frequency, estimateDuration(segment.durationSeconds, tempo)))
    .filter((note): note is DikteNote => note !== null)
}

function smoothFrames(frames: PitchFrame[]): PitchFrame[] {
  return frames.map((frame, index) => {
    if (frame.koma === null) return frame

    const neighbors = frames
      .slice(Math.max(0, index - 1), Math.min(frames.length, index + 2))
      .map((candidate) => candidate.koma)
      .filter((candidate): candidate is number => candidate !== null)

    const smoothedKoma = median(neighbors)
    return {
      ...frame,
      koma: smoothedKoma === null ? frame.koma : Math.round(smoothedKoma)
    }
  })
}

function buildNoteCandidates(frames: PitchFrame[]): NoteCandidate[] {
  const notes: NoteCandidate[] = []
  let active: NoteCandidate | null = null
  let pendingKoma: number | null = null
  let pendingCount = 0
  let lastVoicedTime: number | null = null

  const commitActive = () => {
    if (!active) return
    const finalKoma = median(active.observedKomas ?? [active.koma])
    if (active.endTime - active.startTime >= MIN_NOTE_SECONDS) {
      notes.push({
        koma: finalKoma === null ? active.koma : Math.round(finalKoma),
        startTime: active.startTime,
        endTime: active.endTime
      })
    }
    active = null
  }

  for (const frame of frames) {
    if (frame.koma === null) {
      if (active && lastVoicedTime !== null && frame.startTime - lastVoicedTime > MAX_GAP_SECONDS) {
        commitActive()
      }
      pendingKoma = null
      pendingCount = 0
      continue
    }

    lastVoicedTime = frame.endTime

    if (!active) {
      active = {
        koma: frame.koma,
        startTime: frame.startTime,
        endTime: frame.endTime,
        observedKomas: [frame.koma]
      }
      continue
    }

    if (Math.abs(frame.koma - active.koma) <= LOCK_TOLERANCE_KOMA) {
      active.endTime = frame.endTime
      active.observedKomas?.push(frame.koma)
      pendingKoma = null
      pendingCount = 0
      continue
    }

    if (Math.abs(frame.koma - active.koma) <= SWITCH_TOLERANCE_KOMA) {
      active.endTime = frame.endTime
      active.observedKomas?.push(frame.koma)
      pendingKoma = null
      pendingCount = 0
      continue
    }

    if (pendingKoma !== null && Math.abs(frame.koma - pendingKoma) <= LOCK_TOLERANCE_KOMA) {
      pendingKoma = Math.round((pendingKoma + frame.koma) / 2)
      pendingCount += 1
    } else {
      pendingKoma = frame.koma
      pendingCount = 1
    }

    if (pendingKoma !== null && pendingCount >= CHANGE_CONFIRM_WINDOWS) {
      commitActive()
      active = {
        koma: pendingKoma,
        startTime: frame.startTime,
        endTime: frame.endTime,
        observedKomas: [pendingKoma]
      }
      pendingKoma = null
      pendingCount = 0
    }
  }

  commitActive()
  return notes
}

function mergeAdjacentCandidates(candidates: NoteCandidate[]): NoteCandidate[] {
  if (candidates.length === 0) return []

  const merged: NoteCandidate[] = [{ ...candidates[0] }]

  for (let i = 1; i < candidates.length; i++) {
    const previous = merged[merged.length - 1]
    const current = candidates[i]
    const gap = current.startTime - previous.endTime

    if (gap <= MAX_GAP_SECONDS && Math.abs(previous.koma - current.koma) <= LOCK_TOLERANCE_KOMA) {
      previous.koma = Math.round((previous.koma + current.koma) / 2)
      previous.endTime = current.endTime
      continue
    }

    merged.push({ ...current })
  }

  return merged
}

function splitCandidatesByOnsets(
  candidates: NoteCandidate[],
  segments: OnsetSegment[]
): NoteCandidate[] {
  if (candidates.length === 0 || segments.length === 0) return candidates

  const onsetTimes = segments.map((segment) => segment.startTime)
  const splitCandidates: NoteCandidate[] = []

  for (const candidate of candidates) {
    const splitPoints = onsetTimes.filter(
      (time) =>
        time > candidate.startTime + MIN_SPLIT_NOTE_SECONDS &&
        time < candidate.endTime - MIN_SPLIT_NOTE_SECONDS
    )

    if (splitPoints.length === 0) {
      splitCandidates.push(candidate)
      continue
    }

    let currentStart = candidate.startTime
    for (const splitTime of splitPoints) {
      splitCandidates.push({
        koma: candidate.koma,
        startTime: currentStart,
        endTime: splitTime
      })
      currentStart = splitTime
    }

    splitCandidates.push({
      koma: candidate.koma,
      startTime: currentStart,
      endTime: candidate.endTime
    })
  }

  return splitCandidates.filter((candidate) => candidate.endTime - candidate.startTime >= MIN_NOTE_SECONDS)
}

export async function analyzeAudioFile(
  audioInput: ArrayBuffer | ArrayBufferView,
  tempo = 80
): Promise<AnalysisResult> {
  const audioContext = new OfflineAudioContext(1, 1, 44100)
  const arrayBuffer = normalizeAudioBuffer(audioInput)
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

  const channelData = audioBuffer.getChannelData(0)
  const sampleRate = audioBuffer.sampleRate
  const detector = PitchDetector.forFloat32Array(ANALYSIS_BUFFER_SIZE)

  const segments = detectOnsets(channelData, sampleRate)
  if (isPercussiveSource(channelData, sampleRate, segments)) {
    return {
      notes: analyzePercussiveNotes(channelData, sampleRate, tempo, detector, segments),
      segments
    }
  }

  const frames = smoothFrames(extractPitchFrames(channelData, sampleRate, detector))
  const candidates = splitCandidatesByOnsets(
    mergeAdjacentCandidates(buildNoteCandidates(frames)),
    segments
  )

  const notes = candidates.map((candidate) =>
    komaToDikteNote(candidate.koma, estimateDuration(candidate.endTime - candidate.startTime, tempo))
  )

  return { notes, segments }
}
