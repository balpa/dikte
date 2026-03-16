/**
 * Note onset detection using spectral flux.
 * Detects when new notes begin in an audio signal.
 */

export interface OnsetSegment {
  startSample: number
  endSample: number
  startTime: number
  endTime: number
}

/**
 * Detect note onsets using spectral flux method.
 */
export function detectOnsets(
  audioData: Float32Array,
  sampleRate: number,
  hopSize = 512,
  fftSize = 2048,
  threshold = 0.3
): OnsetSegment[] {
  const numFrames = Math.floor((audioData.length - fftSize) / hopSize)
  if (numFrames < 2) return []

  // Compute spectral flux
  const flux: number[] = []
  let prevSpectrum: Float32Array | null = null

  for (let i = 0; i < numFrames; i++) {
    const start = i * hopSize
    const frame = audioData.slice(start, start + fftSize)

    // Apply Hann window
    for (let j = 0; j < fftSize; j++) {
      frame[j] *= 0.5 * (1 - Math.cos((2 * Math.PI * j) / (fftSize - 1)))
    }

    // Compute magnitude spectrum via simple DFT approximation
    // (Using real-valued energy in frequency bands)
    const spectrum = new Float32Array(fftSize / 2)
    for (let k = 0; k < fftSize / 2; k++) {
      let re = 0
      let im = 0
      for (let n = 0; n < fftSize; n++) {
        const angle = (2 * Math.PI * k * n) / fftSize
        re += frame[n] * Math.cos(angle)
        im -= frame[n] * Math.sin(angle)
      }
      spectrum[k] = Math.sqrt(re * re + im * im)
    }

    if (prevSpectrum) {
      let sf = 0
      for (let k = 0; k < spectrum.length; k++) {
        const diff = spectrum[k] - prevSpectrum[k]
        if (diff > 0) sf += diff
      }
      flux.push(sf)
    } else {
      flux.push(0)
    }

    prevSpectrum = spectrum
  }

  // Normalize flux
  const maxFlux = Math.max(...flux, 1e-10)
  const normalizedFlux = flux.map((f) => f / maxFlux)

  // Pick peaks above threshold
  const onsetFrames: number[] = []
  for (let i = 1; i < normalizedFlux.length - 1; i++) {
    if (
      normalizedFlux[i] > threshold &&
      normalizedFlux[i] > normalizedFlux[i - 1] &&
      normalizedFlux[i] >= normalizedFlux[i + 1]
    ) {
      onsetFrames.push(i)
    }
  }

  // Convert to segments
  const segments: OnsetSegment[] = []
  for (let i = 0; i < onsetFrames.length; i++) {
    const startFrame = onsetFrames[i]
    const endFrame = i + 1 < onsetFrames.length ? onsetFrames[i + 1] : numFrames
    const startSample = startFrame * hopSize
    const endSample = Math.min(endFrame * hopSize, audioData.length)

    segments.push({
      startSample,
      endSample,
      startTime: startSample / sampleRate,
      endTime: endSample / sampleRate
    })
  }

  // If no onsets detected, treat entire audio as one segment
  if (segments.length === 0 && audioData.length > 0) {
    segments.push({
      startSample: 0,
      endSample: audioData.length,
      startTime: 0,
      endTime: audioData.length / sampleRate
    })
  }

  return segments
}
