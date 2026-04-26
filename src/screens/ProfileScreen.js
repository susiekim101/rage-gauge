import { Audio } from "expo-av";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { auth } from "../config/firebase";

const FUNCTION_URL = "https://speak-crgbel3l7q-uc.a.run.app";

export default function ProfileScreen() {
  const email = auth.currentUser?.email ?? "No user email found";

  useEffect(() => {
    handlePress();
  }, []);

  const handlePress = async () => {
    try {
      const text = "Welcome to Rage Gauge!";
      const streamUrl = `${FUNCTION_URL}?text=${encodeURIComponent(text)}`;
      console.log("1. Requesting URL:", streamUrl);

      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      console.log("2. Audio mode set");

      const { sound } = await Audio.Sound.createAsync(
        { uri: streamUrl },
        { shouldPlay: false },
        (status) => console.log("Load status:", JSON.stringify(status))
      );
      console.log("3. Sound created, starting playback");

      await sound.playAsync();
      console.log("4. playAsync called");

      sound.setOnPlaybackStatusUpdate((status) => {
        console.log("Playback status:", JSON.stringify(status));
        if (status.didJustFinish) sound.unloadAsync();
      });
    } catch (error) {
      console.error("Audio error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Logged in as:</Text>
      <Text style={styles.email}>{email}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  email: {
    fontSize: 18,
    color: "#111",
    fontWeight: "600",
    textAlign: "center",
  },
});
