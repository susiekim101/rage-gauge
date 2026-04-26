import { BottomNav } from "@/components/bottom-nav";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth } from "../config/firebase";

const FUNCTION_URL = "https://speak-crgbel3l7q-uc.a.run.app";

const GRADIENT = require("../../assets/images/profile/Rectangle 5.png");
const TRUCK = require("../../assets/images/profile/🛻.png");

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = auth.currentUser;
  const displayName = user?.displayName ?? user?.email?.split("@")[0] ?? "User";
  const initial = displayName[0]?.toUpperCase();
  const [photoUri, setPhotoUri] = useState(null);

  useEffect(() => {
    playWelcome();
  }, []);

  const playWelcome = async () => {
    try {
      const text = "Welcome to Rage Gauge!";
      const streamUrl = `${FUNCTION_URL}?text=${encodeURIComponent(text)}`;
      console.log("1. Requesting URL:", streamUrl);
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      console.log("2. Audio mode set");
      const { sound } = await Audio.Sound.createAsync(
        { uri: streamUrl },
        { shouldPlay: false },
        (status) => console.log("Load status:", JSON.stringify(status)),
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

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Lime gradient from asset */}
      <Image
        source={GRADIENT}
        style={styles.gradientOverlay}
        resizeMode="cover"
      />

      {/* Profile photo circle — tap to upload */}
      <Pressable style={styles.profileImageWrapper} onPress={pickPhoto}>
        <View style={styles.profileImage}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.profilePhoto} />
          ) : (
            <Text style={styles.profileInitial}>{initial}</Text>
          )}
        </View>
        <View style={styles.cameraBadge}>
          <Ionicons name="camera" size={12} color="white" />
        </View>
      </Pressable>

      {/* Truck image from asset */}
      <Image source={TRUCK} style={styles.truck} />

      {/* Name */}
      <Text style={styles.name}>{displayName}</Text>

      <BottomNav avatarUri={photoUri} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8F5",
  },
  gradientOverlay: {
    position: "absolute",
    left: -74,
    top: 0,
    width: 537,
    height: 157,
  },
  profileImageWrapper: {
    position: "absolute",
    left: 116,
    top: 88,
  },
  profileImage: {
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: "#D4D5CB",
    borderWidth: 6,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 23.2,
    elevation: 8,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-4deg" }],
    overflow: "hidden",
  },
  profilePhoto: {
    width: "100%",
    height: "100%",
  },
  profileInitial: {
    fontSize: 52,
    fontWeight: "700",
    color: "#68695F",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 8,
    right: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#68695F",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  truck: {
    position: "absolute",
    left: 140,
    top: 188,
    width: 110,
    height: 110,
  },
  name: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 317,
    textAlign: "center",
    fontSize: 32,
    fontWeight: "700",
    color: "#000",
  },
});
