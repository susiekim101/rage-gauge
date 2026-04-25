import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";

const ELEVENLABS_API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;
const VOICE_ID = process.env.EXPO_PUBLIC_ELEVENLABS_VOICE_ID;

export const playElevenLabsAudio = async (textToSay) => {
  try {
    if (!ELEVENLABS_API_KEY || !VOICE_ID) {
      throw new Error("Missing ElevenLabs env vars.");
    }

    // 1. Define the API endpoint
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`;

    // 2. Make the request to ElevenLabs
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: textToSay,
        model_id: "eleven_multilingual_v2", // Use v2 for the best quality and emotion
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    // 3. Convert the response to a Blob, then to Base64
    const blob = await response.blob();
    const reader = new FileReader();

    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      // Extract the base64 string from the data URL
      const base64data = reader.result.split(",")[1];

      // 4. Save the file locally to the device
      const fileUri = FileSystem.documentDirectory + "elevenlabs_output.mp3";
      await FileSystem.writeAsStringAsync(fileUri, base64data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // 5. Play the audio using Expo AV
      const { sound } = await Audio.Sound.createAsync({ uri: fileUri });
      await sound.playAsync();

      // Unload the sound from memory when it finishes
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    };
  } catch (error) {
    console.error("Error playing audio:", error);
  }
};
