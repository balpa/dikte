import { PitchDetector } from 'pitchy'

export interface PitchResult {
  frequency: number
  clarity: number
}

const BUFFER_SIZE = 4096
const CLARITY_THRESHOLD = 0.90

export class MicPitchDetector {
  private audioContext: AudioContext | null = null
  private analyserNode: AnalyserNode | null = null
  private sourceNode: MediaStreamAudioSourceNode | null = null
  private stream: MediaStream | null = null
  private detector: PitchDetector<Float32Array> | null = null
  private inputBuffer: Float32Array<ArrayBuffer> | null = null
  private running = false
  private onPitch: ((result: PitchResult | null) => void) | null = null

  async start(onPitch: (result: PitchResult | null) => void): Promise<void> {
    this.onPitch = onPitch

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    })

    this.audioContext = new AudioContext()
    this.analyserNode = this.audioContext.createAnalyser()
    this.analyserNode.fftSize = BUFFER_SIZE * 2

    this.sourceNode = this.audioContext.createMediaStreamSource(this.stream)
    this.sourceNode.connect(this.analyserNode)

    this.detector = PitchDetector.forFloat32Array(BUFFER_SIZE)
    this.inputBuffer = new Float32Array(
      new ArrayBuffer(BUFFER_SIZE * Float32Array.BYTES_PER_ELEMENT)
    ) as Float32Array<ArrayBuffer>
    this.running = true

    this.loop()
  }

  private loop = (): void => {
    if (!this.running || !this.analyserNode || !this.inputBuffer || !this.detector || !this.audioContext) {
      return
    }

    this.analyserNode.getFloatTimeDomainData(this.inputBuffer)
    const [frequency, clarity] = this.detector.findPitch(
      this.inputBuffer,
      this.audioContext.sampleRate
    )

    if (clarity >= CLARITY_THRESHOLD && frequency > 50 && frequency < 2000) {
      this.onPitch?.({ frequency, clarity })
    } else {
      this.onPitch?.(null)
    }

    if (this.running) {
      requestAnimationFrame(this.loop)
    }
  }

  stop(): void {
    this.running = false
    this.sourceNode?.disconnect()
    this.stream?.getTracks().forEach((t) => t.stop())
    this.audioContext?.close()
    this.audioContext = null
    this.analyserNode = null
    this.sourceNode = null
    this.stream = null
    this.detector = null
    this.inputBuffer = null
    this.onPitch = null
  }

  isRunning(): boolean {
    return this.running
  }
}
