// ─────────────────────────────────────────────────────────────────────────────
// GeminiAudioCapture.ts — Audio capture for Gemini Live API (React Native / Expo Go)
//
// Uses expo-audio for microphone access and expo-file-system for file I/O.
// Records in 300 ms chunks; on iOS the WAV header is stripped to produce raw
// PCM that Gemini expects.  Android note: MediaRecorder does not expose raw
// PCM, so Android audio will not be accepted by the Gemini Live API without a
// custom dev-build that includes react-native-audio-record or similar.
// ─────────────────────────────────────────────────────────────────────────────

import {
  AudioModule,
  AudioQuality,
  IOSOutputFormat,
  createAudioPlayer,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  type AudioRecorder,
  type RecordingOptions,
  type AudioStatus,
} from 'expo-audio'
import { File, Paths } from 'expo-file-system'
import { Platform } from 'react-native'

// ── Types ────────────────────────────────────────────────────────────────────

export type CaptureStatus = 'idle' | 'connecting' | 'capturing' | 'error' | 'stopped'

export interface GeminiAudioCaptureOptions {
  wsUrl: string
  onMessage: (data: GeminiServerMessage) => void
  onError?: (error: Error) => void
  onStatusChange?: (status: CaptureStatus) => void
  onToolCall?: (name: string, args: Record<string, unknown>) => void
  sampleRate?: number           // mic capture rate — default 16000
  outputSampleRate?: number     // Gemini playback rate — default 24000
  model?: string
}

// ── Gemini Live API message types ────────────────────────────────────────────

export interface GeminiInlineData {
  data: string        // base64 PCM audio
  mimeType: string    // "audio/pcm;rate=24000"
}

export interface GeminiPart {
  text?: string
  inlineData?: GeminiInlineData
}

export interface GeminiModelTurn {
  parts: GeminiPart[]
}

export interface GeminiServerContent {
  modelTurn?: GeminiModelTurn
  inputTranscription?: { text: string }
  turnComplete?: boolean
}

export interface RageAnalysis {
  emotions: string[]
  honks: number
  slams: number
  transcription: string
}

export interface GeminiFunctionCall {
  id: string
  name: string
  args: Record<string, unknown>
}

export interface GeminiToolCall {
  functionCalls: GeminiFunctionCall[]
}

export interface GeminiServerMessage {
  setupComplete?: Record<string, never>
  serverContent?: GeminiServerContent
  toolCall?: GeminiToolCall
  usageMetadata?: unknown
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CHUNK_MS = 300

// ── Main class ───────────────────────────────────────────────────────────────

export class GeminiAudioCapture {
  private readonly wsUrl: string
  private readonly onMessage: (data: GeminiServerMessage) => void
  private readonly onError: (error: Error) => void
  private readonly onStatusChange: (status: CaptureStatus) => void
  private readonly onToolCall: (name: string, args: Record<string, unknown>) => void
  private readonly sampleRate: number
  private readonly model: string

  private ws: WebSocket | null = null
  private recorder: AudioRecorder | null = null
  private recorderSubscription: { remove: () => void } | null = null
  private chunkLoopActive = false
  private _audioLevel = 0
  private setupResolved = false

  public isCapturing = false

  constructor(options: GeminiAudioCaptureOptions) {
    this.wsUrl = options.wsUrl
    this.onMessage = options.onMessage
    this.onError = options.onError ?? ((e) => console.error('[GeminiAudio]', e))
    this.onStatusChange = options.onStatusChange ?? (() => {})
    this.onToolCall = options.onToolCall ?? (() => {})
    this.sampleRate = options.sampleRate ?? 16_000
    this.model = options.model ?? 'models/gemini-live-2.5-flash-native-audio'
  }

  async start(): Promise<void> {
    this.onStatusChange('connecting')
    try {
      await this.openWebSocket()
      await this.sendSetupMessage()
      
      // Permissions and Mode are on the AudioModule
      const { granted } = await AudioModule.requestRecordingPermissionsAsync()
      if (!granted) throw new Error('Microphone permission denied')

      await AudioModule.setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      })

      await this.startChunkLoop()
      this.isCapturing = true
      this.onStatusChange('capturing')
    } catch (err) {
      this.teardown()
      this.onStatusChange('error')
      throw err
    }
  }

  stop(): void {
    this.isCapturing = false
    this.teardown()
    this.onStatusChange('stopped')
  }

  /** Current audio level (0–1), updated every ~50 ms from recording metering. */
    getAudioLevel(): number {
    return this._audioLevel
  }

  // ── Private: WebSocket ─────────────────────────────────────────────────────

  private openWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl)

      this.ws.onopen = () => {
        console.log('[ws] connected')
        resolve()
      }

      this.ws.onerror = () => {
        const err = new Error(`WebSocket failed to connect to ${this.wsUrl}`)
        this.onError(err)
        reject(err)
      }

      this.ws.onmessage = (event: MessageEvent<string>) => {
        try {
          console.log('[ws] message received: ', event.data.slice(0, 200))
          const parsed = JSON.parse(event.data) as GeminiServerMessage

          if (parsed.setupComplete && !this.setupResolved) {
            this.setupResolved = true
          }

          if (parsed.toolCall) {
            for (const fc of parsed.toolCall.functionCalls) {
              this.onToolCall(fc.name, fc.args)
              this.sendToolResponse(fc.id)
            }
          }

          this.onMessage(parsed)
        } catch (e) {
          this.onError(new Error(`Failed to parse server message: ${String(e)}`))
        }
      }

      this.ws.onclose = () => {
        if (this.isCapturing) {
          this.onError(new Error('WebSocket closed unexpectedly'))
          this.onStatusChange('error')
        }
      }
    })
  }

  // ── Private: Gemini setup handshake ────────────────────────────────────────

  private sendSetupMessage(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return reject(new Error('WebSocket not open for setup'))
      }

      const setup = {
        setup: {
          model: this.model,
          systemInstruction: {
            parts: [{
              text: `You are an audio analysis assistant. For each audio turn:
1. Respond with a JSON object in this exact format (no other text):
{
  "emotions": ["emotion1", "emotion2"],
  "honks": 0,
  "slams": 0,
  "transcription": "verbatim transcription of the audio"
}
"emotions" is an array of emotions detected in the speaker's voice (e.g. "anger", "frustration", "calm").
"honks" is the count of car horn honks heard.
"slams" is the count of hard surface slams (e.g. steering wheel, dashboard) heard.
"transcription" is a verbatim transcription of all speech in the audio.
2. If the speaker says the word "HELLO", call the dummy() function.`
            }]
          },
          tools: [{
            functionDeclarations: [{
              name: 'dummy',
              description: 'Called when the word HELLO is detected in the audio.',
            }]
          }],
          generationConfig: {
            responseModalities: ['TEXT'],
            inputAudioTranscription: {},
          },
        },
      }

      this.ws.send(JSON.stringify(setup))

      const timeout = setTimeout(() => {
        if (!this.setupResolved) {
          reject(new Error('Gemini setup handshake timed out'))
        }
      }, 10_000)

      const check = setInterval(() => {
        if (this.setupResolved) {
          clearTimeout(timeout)
          clearInterval(check)
          resolve()
        }
      }, 50)
    })
  }

  // ── Private: microphone permission ─────────────────────────────────────────

  private async requestMicPermission(): Promise<void> {
    const { granted } = await requestRecordingPermissionsAsync()
    if (!granted) throw new Error('Microphone permission denied')

    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    })
  }

  // ── Private: chunk recording loop ──────────────────────────────────────────
  // Creates a single AudioRecorder, prepares it once, then cycles record→stop
  // every CHUNK_MS milliseconds and sends each chunk to Gemini.
  private async startChunkLoop(): Promise<void> {
    // Correct way to create the recorder imperatively
    this.recorder = createAudioRecorder(this.getRecordingOptions())
    
    // Set up native metering subscription
    this.recorderSubscription = this.recorder.addListener('recordingStatusUpdate', (status) => {
      if (status.metering != null) {
        // dBFS typically -160 to 0. We map -60..0 to 0..1.
        this._audioLevel = Math.max(0, Math.min(1, (status.metering + 60) / 60))
      }
    })

    await this.recorder.prepareAsync()
    this.chunkLoopActive = true
    void this.chunkLoop()
  }

  private async chunkLoop(): Promise<void> {
    const CHUNK_MS = 300
    while (this.chunkLoopActive && this.recorder) {
      try {
        this.recorder.record()
        await new Promise(r => setTimeout(r, CHUNK_MS))
        
        if (!this.chunkLoopActive) break

        await this.recorder.stop()
        
        // In the new API, the uri is available directly on the recorder object
        const uri = this.recorder.uri
        if (uri) void this.sendChunkFromUri(uri)
      } catch (e) {
        if (this.chunkLoopActive) {
          this.onError(new Error(`Recording chunk failed: ${String(e)}`))
        }
        break
      }
    }
  }

  private async sendChunkFromUri(uri: string): Promise<void> {
    try {
      const file = new File(uri)
      const base64 = await file.base64()
      await file.delete() // Cleanup temp file immediately

      if (Platform.OS === 'ios') {
        const pcmBase64 = this.wavBase64ToPcmBase64(base64)
        this.sendAudioChunk(pcmBase64, `audio/pcm;rate=${this.sampleRate}`)
      } else {
        this.sendAudioChunk(base64, 'audio/3gp')
      }
    } catch (e) {
      this.onError(new Error(`Upload failed: ${e}`))
    }
  }

  private getRecordingOptions(): RecordingOptions {
    return {
      isMeteringEnabled: true,
      extension: '.wav',
      sampleRate: this.sampleRate,
      numberOfChannels: 1,
      bitRate: this.sampleRate * 16,
      ios: {
        outputFormat: IOSOutputFormat.LINEARPCM,
        audioQuality: AudioQuality.HIGH,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      android: {
        extension: '.3gp',
        outputFormat: '3gp',
        audioEncoder: 'amr_nb',
      },
    }
  }

  // ── Private: WAV → raw PCM ─────────────────────────────────────────────────

  /**
   * Strip the WAV file header from a base64-encoded WAV and return the raw
   * PCM samples as base64. Parses RIFF chunks to locate the `data` offset
   * rather than blindly skipping 44 bytes.
   */
  private wavBase64ToPcmBase64(wavBase64: string): string {
    const binary = atob(wavBase64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

    // Walk RIFF chunks to find the 'data' chunk start
    let dataStart = 44 // safe default for standard WAV
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
      let off = 12
      while (off + 8 <= bytes.length) {
        const id = String.fromCharCode(bytes[off], bytes[off + 1], bytes[off + 2], bytes[off + 3])
        const size = bytes[off + 4] | (bytes[off + 5] << 8) | (bytes[off + 6] << 16) | (bytes[off + 7] << 24)
        if (id === 'data') { dataStart = off + 8; break }
        off += 8 + size + (size & 1) // RIFF chunks are word-aligned
      }
    }

    let out = ''
    for (let i = dataStart; i < bytes.length; i++) out += String.fromCharCode(bytes[i])
    return btoa(out)
  }

  // ── Private: send audio ────────────────────────────────────────────────────

  private sendAudioChunk(base64: string, mimeType: string): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return
    this.ws.send(JSON.stringify({
      realtimeInput: {
        mediaChunks: [{ data: base64, mimeType }],
      },
    }))
  }

  private sendToolResponse(id: string): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return
    this.ws.send(JSON.stringify({
      toolResponse: {
        functionResponses: [{ id, response: { output: 'ok' } }],
      },
    }))
  }

  // ── Private: cleanup ───────────────────────────────────────────────────────

private teardown(): void {
    this.chunkLoopActive = false
    this.recorderSubscription?.remove()
    if (this.recorder) {
      this.recorder.stop()
      // In expo-audio, we should cleanup the recorder instance
      this.recorder = null
    }
    this.ws?.close()
    this.ws = null
    this._audioLevel = 0
  }

  // ── Static: play Gemini response audio ─────────────────────────────────────

  /**
   * Decode base64 PCM audio from a Gemini response and play it via expo-audio.
   * Wraps the raw PCM in a WAV container, writes it to the cache, then plays it.
   */
static async playResponseAudio(base64PCM: string, sampleRate = 24_000): Promise<void> {
    const wavBytes = GeminiAudioCapture.pcm16ToWavBytes(base64PCM, sampleRate)
    const outFile = new File(Paths.cache, `gemini_out_${Date.now()}.wav`)
    await outFile.write(wavBytes)

    const player = createAudioPlayer(outFile.uri)
    player.play()

    const sub = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        sub.remove()
        player.remove() // Important for expo-audio memory management
        outFile.delete().catch(() => {})
      }
    })
  }

  /** Wrap raw 16-bit little-endian PCM into a WAV container as a Uint8Array. */
  static pcm16ToWavBytes(pcmBase64: string, sampleRate: number): Uint8Array {
    const pcmBinary = atob(pcmBase64)
    const pcmLen = pcmBinary.length
    const buf = new ArrayBuffer(44 + pcmLen)
    const v = new DataView(buf)
    const u8 = new Uint8Array(buf)

    const write = (off: number, s: string) => {
      for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i))
    }

    write(0, 'RIFF')
    v.setUint32(4, 36 + pcmLen, true)
    write(8, 'WAVE')
    write(12, 'fmt ')
    v.setUint32(16, 16, true)             // fmt chunk size
    v.setUint16(20, 1, true)              // PCM format
    v.setUint16(22, 1, true)              // mono
    v.setUint32(24, sampleRate, true)
    v.setUint32(28, sampleRate * 2, true) // byte rate (16-bit mono)
    v.setUint16(32, 2, true)              // block align
    v.setUint16(34, 16, true)             // bits per sample
    write(36, 'data')
    v.setUint32(40, pcmLen, true)
    for (let i = 0; i < pcmLen; i++) u8[44 + i] = pcmBinary.charCodeAt(i)

    return u8
  }
}
