import { useState, useCallback, useRef, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Animated, Easing, Platform
} from 'react-native'
import { useGeminiAudio } from './UseGeminiAudio'
import type { GeminiServerMessage, CaptureStatus } from './GeminiAudioCapture'
import { GeminiAudioCapture } from './GeminiAudioCapture'

const WS_URL = 'ws://localhost:8081'

// ── Waveform bar — animates height based on audio level + position offset ──
interface WaveBarProps { audioLevel: number; index: number; total: number; isCapturing: boolean }
function WaveBar({ audioLevel, index, total, isCapturing }: WaveBarProps) {
  const anim = useRef(new Animated.Value(0.08)).current

  useEffect(() => {
    if (!isCapturing) {
      Animated.spring(anim, { toValue: 0.08, useNativeDriver: false }).start()
      return
    }
    const center = total / 2
    const distFromCenter = Math.abs(index - center) / center
    const envelope = 1 - distFromCenter * 0.6
    const target = Math.max(0.08, audioLevel * envelope * (0.6 + Math.random() * 0.4))
    Animated.spring(anim, {
      toValue: target,
      friction: 4,
      tension: 120,
      useNativeDriver: false,
    }).start()
  }, [audioLevel, isCapturing])

  const height = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['4%', '100%'],
  })

  const opacity = anim.interpolate({
    inputRange: [0.08, 1],
    outputRange: [0.25, 1],
  })

  return (
    <View style={styles.barWrapper}>
      <Animated.View style={[styles.bar, { height, opacity }]} />
    </View>
  )
}

// ── Pulsing ring behind the mic button ──
function PulseRing({ isCapturing }: { isCapturing: boolean }) {
  const scale = useRef(new Animated.Value(1)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!isCapturing) {
      scale.setValue(1)
      opacity.setValue(0)
      return
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.6, duration: 1200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 1200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.35, duration: 0, useNativeDriver: true }),
        ]),
      ])
    )
    opacity.setValue(0.35)
    loop.start()
    return () => loop.stop()
  }, [isCapturing])

  return (
    <Animated.View style={[
      styles.pulseRing,
      { transform: [{ scale }], opacity }
    ]} />
  )
}

// ── Message bubble ──
function MessageBubble({ text, index }: { text: string; index: number }) {
  const fadeIn = useRef(new Animated.Value(0)).current
  const slideUp = useRef(new Animated.Value(12)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start()
  }, [])

  return (
    <Animated.View style={[styles.bubble, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
      <Text style={styles.bubbleText}>{text}</Text>
    </Animated.View>
  )
}

// ── Status dot ──
function StatusDot({ status }: { status: CaptureStatus }) {
  const blink = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (status !== 'capturing') { blink.setValue(1); return }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0.2, duration: 600, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [status])

  const color = status === 'capturing' ? '#4ade80'
    : status === 'connecting' ? '#facc15'
    : status === 'error' ? '#f87171'
    : '#52525b'

  return (
    <Animated.View style={[styles.dot, { backgroundColor: color, opacity: blink }]} />
  )
}

// ── Main component ──
export function AudioCaptureUI() {
  const [messages, setMessages] = useState<string[]>([])
  const scrollRef = useRef<ScrollView>(null)
  const BAR_COUNT = 32

  const dummy = useCallback(() => {
    console.log('[dummy] HELLO detected — function called by Gemini')
  }, [])

const handleMessage = useCallback((data: GeminiServerMessage) => {
  // 1. Handle Text Content
  const parts = data?.serverContent?.modelTurn?.parts ?? []
  const text = parts.map(p => p.text).filter(Boolean).join('')
  if (text) {
    setMessages(prev => [...prev, text])
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80)
  }

  // 2. Handle Audio Content (The missing link for "Live" experience)
  const audioData = parts.find(p => p.inlineData)?.inlineData?.data
  if (audioData) {
    // Playback using our static expo-audio utility
    GeminiAudioCapture.playResponseAudio(audioData).catch(console.error)
  }
}, [])

  const { start, stop, status, error, audioLevel } =
    useGeminiAudio({ wsUrl: WS_URL, onMessage: handleMessage, onToolCall: dummy })

  const isCapturing = status === 'capturing'
  const isConnecting = status === 'connecting'

  const statusLabel = isCapturing ? 'Listening'
    : isConnecting ? 'Connecting'
    : status === 'error' ? 'Error'
    : 'Ready'

  return (
    <View style={styles.root}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.wordmark}>gemini<Text style={styles.wordmarkAccent}> live</Text></Text>
        <View style={styles.statusRow}>
          <StatusDot status={status} />
          <Text style={styles.statusLabel}>{statusLabel}</Text>
        </View>
      </View>

      {/* ── Message feed ── */}
      <ScrollView
        ref={scrollRef}
        style={styles.feed}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 && (
          <Text style={styles.emptyHint}>
            Tap the button below and start speaking.{'\n'}Gemini will respond here.
          </Text>
        )}
        {messages.map((m, i) => (
          <MessageBubble key={i} text={m} index={i} />
        ))}
      </ScrollView>

      {/* ── Waveform ── */}
      <View style={styles.waveform}>
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <WaveBar
            key={i}
            index={i}
            total={BAR_COUNT}
            audioLevel={audioLevel}
            isCapturing={isCapturing}
          />
        ))}
      </View>

      {/* ── Record button ── */}
      <View style={styles.btnArea}>
        <PulseRing isCapturing={isCapturing} />
        <TouchableOpacity
          style={[styles.micBtn, isCapturing && styles.micBtnActive]}
          onPress={isCapturing ? stop : start}
          activeOpacity={0.85}
          disabled={isConnecting}
        >
          <MicIcon active={isCapturing} />
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Text style={styles.hint}>
        {isCapturing ? 'Tap to stop' : 'Tap to speak'}
      </Text>
    </View>
  )
}

// ── Inline SVG-style mic icon using View shapes ──
function MicIcon({ active }: { active: boolean }) {
  const color = active ? '#09090b' : '#e4e4e7'
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 32, height: 40 }}>
      {/* mic capsule */}
      <View style={{
        width: 16, height: 24, borderRadius: 8,
        borderWidth: 2.5, borderColor: color,
        marginBottom: 2,
      }} />
      {/* stand arc — approximated with a bottom border */}
      <View style={{
        width: 26, height: 12,
        borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderRightWidth: 2.5,
        borderColor: color,
        borderBottomLeftRadius: 13, borderBottomRightRadius: 13,
        borderTopWidth: 0,
        marginBottom: 2,
      }} />
      {/* stand base */}
      <View style={{ width: 2.5, height: 6, backgroundColor: color }} />
      <View style={{ width: 14, height: 2.5, backgroundColor: color, borderRadius: 1 }} />
    </View>
  )
}

// ── Styles ──
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#09090b',
    paddingTop: Platform.OS === 'ios' ? 56 : 32,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },

  // header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  wordmark: {
    fontSize: 18,
    fontWeight: '300',
    color: '#e4e4e7',
    letterSpacing: 2,
    textTransform: 'lowercase',
  },
  wordmarkAccent: {
    color: '#4ade80',
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: '#71717a',
    letterSpacing: 0.5,
  },

  // feed
  feed: {
    flex: 1,
    marginBottom: 8,
  },
  feedContent: {
    paddingBottom: 16,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  emptyHint: {
    color: '#3f3f46',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 'auto',
    paddingVertical: 32,
  },

  // bubbles
  bubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#18181b',
    borderWidth: 0.5,
    borderColor: '#27272a',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 10,
    maxWidth: '88%',
  },
  bubbleText: {
    color: '#d4d4d8',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },

  // waveform
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    marginBottom: 32,
    gap: 3,
  },
  barWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    backgroundColor: '#4ade80',
    borderRadius: 2,
  },

  // button
  btnArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pulseRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#4ade80',
  },
  micBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: {
    backgroundColor: '#4ade80',
    borderColor: '#4ade80',
  },

  hint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#52525b',
    letterSpacing: 0.5,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#f87171',
    marginBottom: 8,
  },
})