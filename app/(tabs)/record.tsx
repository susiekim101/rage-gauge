import { useRageRecorder } from "@/hooks/use-rage-recorder";
import { RAGE_COLORS, RAGE_LABELS } from "@/types/rage";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function RecordScreen() {
  const { startRecording, stopAndAnalyze, status, result, error } =
    useRageRecorder();

  const isRecording = status === "recording";
  const isAnalyzing = status === "analyzing";
  const isBusy = isRecording || isAnalyzing;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rage Gauge</Text>
      <Text style={styles.subtitle}>
        {isRecording
          ? "Listening..."
          : isAnalyzing
            ? "Analyzing..."
            : "Hold to record your rage"}
      </Text>

      {/* Big record button */}
      <Pressable
        style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
        onPressIn={startRecording}
        onPressOut={stopAndAnalyze}
        disabled={isAnalyzing}
      >
        <Text style={styles.recordBtnIcon}>{isRecording ? "⏹" : "🎙️"}</Text>
      </Pressable>

      <Text style={styles.hint}>
        {isAnalyzing
          ? "Sending to Gemini..."
          : "Hold down, let it out, release"}
      </Text>

      {/* Results */}
      {result && (
        <View style={styles.results}>
          <Text
            style={[styles.rageLevel, { color: RAGE_COLORS[result.rageLevel] }]}
          >
            {RAGE_LABELS[result.rageLevel]}
          </Text>
          <Text style={styles.rageLevelNum}>Level {result.rageLevel}/5</Text>
          <Text style={styles.rageLevelNum}>{result.transcription}</Text>

          {result.transcription ? (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>You said</Text>
              <Text style={styles.cardText}>"{result.transcription}"</Text>
            </View>
          ) : null}

          <View style={styles.statsRow}>
            {result.honks > 0 && (
              <View style={styles.stat}>
                <Text style={styles.statNum}>{result.honks}</Text>
                <Text style={styles.statLabel}>honks</Text>
              </View>
            )}
            {result.slams > 0 && (
              <View style={styles.stat}>
                <Text style={styles.statNum}>{result.slams}</Text>
                <Text style={styles.statLabel}>slams</Text>
              </View>
            )}
            {result.emotions?.length > 0 && (
              <View style={styles.stat}>
                <Text style={styles.statNum}>{result.emotions[0]}</Text>
                <Text style={styles.statLabel}>vibe</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    color: "#666",
    fontSize: 14,
    marginBottom: 48,
  },
  recordBtn: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#1a1a1a",
    borderWidth: 3,
    borderColor: "#333",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  recordBtnActive: {
    borderColor: "#F44336",
    backgroundColor: "#2a0a0a",
  },
  recordBtnIcon: {
    fontSize: 48,
  },
  hint: {
    color: "#444",
    fontSize: 12,
    marginBottom: 40,
  },
  results: {
    width: "100%",
    alignItems: "center",
    gap: 12,
  },
  rageLevel: {
    fontSize: 26,
    fontWeight: "800",
  },
  rageLevelNum: {
    color: "#555",
    fontSize: 13,
  },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    marginTop: 8,
  },
  cardLabel: {
    color: "#555",
    fontSize: 11,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardText: {
    color: "#ccc",
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 24,
    marginTop: 8,
  },
  stat: {
    alignItems: "center",
  },
  statNum: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    color: "#555",
    fontSize: 11,
  },
  error: {
    color: "#F44336",
    fontSize: 12,
    marginTop: 16,
    textAlign: "center",
  },
});
