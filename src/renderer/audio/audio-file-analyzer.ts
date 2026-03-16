import { PitchDetector } from 'pitchy'
import { detectOnsets, OnsetSegment } from './note-onset'
import { hzToDikteNote } from '../core/pitch-to-note'
import { DikteNote, Duration } from '../types'

export interface AnalysisResult {
  notes: DikteNote[]
  segments: OnsetSegment[]
}

const ANALYSIS_BUFFER_SIZE = 4096
const CLARITY_THRESHOLD = 0.85

/**
 * Estimate duration from segment length in seconds.
 */
function estimateDuration(seconds: number, tempo: number): Duration {
  const beatDuration = 60 / tempo // seconds per beat
  const beats = seconds / beatDuration

  if (beats >= 3) return '1'
  if (beats >= 1.5) return '2'
  if (beats >= 0.75) return '4'
  if (beats >= 0.375) return '8'
  if (beats >= 0.1875) return '16'
  if (beats >= 0.09375) return '32'
  return '64'
}

/**
 * Analyze an audio buffer and extract notes.
 */
export async function analyzeAudioFile(
  arrayBuffer: ArrayBuffer,
  tempo = 80
): Promise<AnalysisResult> {
  const audioContext = new OfflineAudioContext(1, 1, 44100)
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

  const channelData = audioBuffer.getChannelData(0)
  const sampleRate = audioBuffer.sampleRate

  // Detect onsets
  const segments = detectOnsets(channelData, sampleRate)

  // Analyze pitch for each segment
  const detector = PitchDetector.forFloat32Array(ANALYSIS_BUFFER_SIZE)
  const notes: DikteNote[] = []

  for (const segment of segments) {
    const segmentData = channelData.slice(segment.startSample, segment.endSample)

    if (segmentData.length < ANALYSIS_BUFFER_SIZE) continue

    // Analyze middle portion of segment for more stable pitch
    const midStart = Math.floor(segmentData.length * 0.2)
    const midEnd = Math.min(midStart + ANALYSIS_BUFFER_SIZE, segmentData.length)
    const analysisChunk = segmentData.slice(midStart, midEnd)

    if (analysisChunk.length < ANALYSIS_BUFFER_SIZE) continue

    const buffer = new Float32Array(ANALYSIS_BUFFER_SIZE)
    buffer.set(analysisChunk.slice(0, ANALYSIS_BUFFER_SIZE))

    const [frequency, clarity] = detector.findPitch(buffer, sampleRate)

    if (clarity >= CLARITY_THRESHOLD && frequency > 50 && frequency < 2000) {
      const duration = estimateDuration(segment.endTime - segment.startTime, tempo)
      const note = hzToDikteNote(frequency, duration)
      if (note) {
        notes.push(note)
      }
    }
  }

  return { notes, segments }
}
