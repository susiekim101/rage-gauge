import { analyzeAudio, RageAnalysis } from "@/src/gemini";
import { AudioModule, RecordingPresets, useAudioRecorder } from "expo-audio";
import { useEffect, useState } from "react";

export type RecorderStatus =
  | "idle"
  | "recording"
  | "analyzing"
  | "done"
  | "error";

export function useRageRecorder() {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [result, setResult] = useState<RageAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  useEffect(() => {
    (async () => {
      const { granted } = await AudioModule.requestRecordingPermissionsAsync();
      if (!granted) return;
      await AudioModule.setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
    })();
  }, []);

  async function startRecording() {
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      setStatus("recording");
      setResult(null);
      setError(null);
    } catch (e) {
      setError(String(e));
      setStatus("error");
    }
  }

  async function stopAndAnalyze() {
    if (status !== "recording") return;
    try {
      setStatus("analyzing");
      await recorder.stop();
      const uri = recorder.uri;
      console.log("[recorder] uri:", uri);
      if (!uri) throw new Error("No recording URI");
      const analysis = await analyzeAudio(uri);
      setResult(analysis);
      setStatus("done");
    } catch (e) {
      setError(String(e));
      setStatus("error");
    }
  }

  return { startRecording, stopAndAnalyze, status, result, error };
}
