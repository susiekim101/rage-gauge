import { Audio } from "expo-av";
import { File, Paths } from "expo-file-system"; // Use the new modern import

const ELEVENLABS_API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;
const VOICE_ID = process.env.EXPO_PUBLIC_ELEVENLABS_VOICE_ID;

export const playElevenLabsAudio = async (textToSay) => {
  try {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`;

    // 1. Fetch the audio from ElevenLabs
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: textToSay,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    // 2. Get the raw binary audio data (No more blobs or Base64!)
    const buffer = await response.arrayBuffer();
    const audioData = new Uint8Array(buffer);

    // 3. Define the file using the new File and Paths classes
    const file = new File(Paths.document, "elevenlabs_output.mp3");

    // Create the file if it doesn't exist yet
    if (!file.exists) {
      file.create();
    }

    // 4. Write the binary data directly to the file synchronously
    file.write(audioData);

    // 5. Play the audio
    const { sound } = await Audio.Sound.createAsync({ uri: file.uri });
    await sound.playAsync();

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (error) {
    console.error("Error playing audio:", error);
  }
};
