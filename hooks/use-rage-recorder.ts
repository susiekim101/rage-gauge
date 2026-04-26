import { useState, useRef } from 'react';
import { AudioModule } from 'expo-audio';
import { analyzeAudio, RageAnalysis } from '@/src/gemini';

export type RecorderStatus = 'idle' | 'recording' | 'analyzing' | 'done' | 'error';

export function useRageRecorder() {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [result, setResult] = useState<RageAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<InstanceType<typeof AudioModule.AudioRecorder> | null>(null);

  async function startRecording() {
    try {
      const { granted } = await AudioModule.requestRecordingPermissionsAsync();
      if (!granted) throw new Error('Microphone permission denied');

      await AudioModule.setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });

      const recorder = new AudioModule.AudioRecorder({
        extension: '.wav',
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 256000,
        ios: {
          outputFormat: 'lpcm' as any,
          audioQuality: 127,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {},
      });

      await recorder.prepareToRecordAsync();
      recorder.record();
      recorderRef.current = recorder;
      setStatus('recording');
      setResult(null);
      setError(null);
    } catch (e) {
      setError(String(e));
      setStatus('error');
    }
  }

  async function stopAndAnalyze() {
    const recorder = recorderRef.current;
    if (!recorder) return;

    try {
      setStatus('analyzing');
      await recorder.stop();
      const uri = recorder.uri;
      recorderRef.current = null;

      if (!uri) throw new Error('No recording URI');

      const analysis = await analyzeAudio(uri);
      setResult(analysis);
      setStatus('done');
    } catch (e) {
      setError(String(e));
      setStatus('error');
    }
  }

  return { startRecording, stopAndAnalyze, status, result, error };
}
