import { Button, StyleSheet, Text, View } from "react-native";
import { playElevenLabsAudio } from "../config/elevenlabs";
import { auth } from "../config/firebase";

export default function ProfileScreen() {
  const email = auth.currentUser?.email ?? "No user email found";

  const handlePress = () => {
    playElevenLabsAudio("I am speaking to you live from React Native.");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Logged in as:</Text>
      <Text style={styles.email}>{email}</Text>
      <Button title="Speak" onPress={handlePress} />
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
