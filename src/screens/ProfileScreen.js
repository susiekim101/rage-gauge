import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "../config/firebase";

const FUNCTION_URL = "https://speak-crgbel3l7q-uc.a.run.app";

const GRADIENT = require("../../assets/images/profile/Rectangle 5.png");
const TRUCK = require("../../assets/images/profile/🛻.png");

export default function ProfileScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const displayName = user?.displayName ?? user?.email?.split("@")[0] ?? "User";
  const initial = displayName[0]?.toUpperCase();
  const [photoUri, setPhotoUri] = useState(null);

  useEffect(() => {
    playWelcome();
    loadPhoto();
  }, []);

  const loadPhoto = async () => {
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists() && snap.data().photoUrl) {
        setPhotoUri(snap.data().photoUrl);
      }
    } catch (e) {
      console.warn("Could not load photo:", e.message);
    }
  };

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
    if (result.canceled) return;

    const localUri = result.assets[0].uri;
    setPhotoUri(localUri); // show immediately

    try {
      const response = await fetch(localUri);
      const blob = await response.blob();
      const storageRef = ref(storage, `profile-photos/${user.uid}`);
      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);
      await updateDoc(doc(db, "users", user.uid), { photoUrl: downloadUrl });
      setPhotoUri(downloadUrl);
      console.log("Photo saved:", downloadUrl);
    } catch (e) {
      console.warn("Photo upload failed:", e.message);
    }
  };

  return (
    <View style={styles.container}>
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

      {/* Bottom navigation bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarPill}>
          <Pressable onPress={() => router.push("/friends")}>
            <Ionicons name="person-add-outline" size={24} color="#68695F" />
          </Pressable>

          <Pressable
            style={styles.startDriveBtn}
            onPress={() => router.push("/(tabs)/driving")}
          >
            <Ionicons name="car-outline" size={16} color="white" />
            <Text style={styles.startDriveText}>Start Drive</Text>
          </Pressable>

          <Pressable style={styles.avatarSmall} onPress={pickPhoto}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarPhoto} />
            ) : (
              <Text style={styles.avatarInitial}>{initial}</Text>
            )}
          </Pressable>
        </View>
      </View>
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
  bottomBar: {
    position: "absolute",
    left: 31,
    right: 31,
    bottom: 12,
    height: 85,
    justifyContent: "center",
  },
  bottomBarPill: {
    backgroundColor: "rgba(9, 9, 9, 0.85)",
    borderRadius: 44,
    height: 63,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 20,
  },
  startDriveBtn: {
    flex: 1,
    height: 41,
    backgroundColor: "#68695F",
    borderRadius: 1000,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  startDriveText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  avatarSmall: {
    width: 41,
    height: 41,
    borderRadius: 20.5,
    backgroundColor: "#D4D5CB",
    borderWidth: 3,
    borderColor: "white",
    transform: [{ rotate: "-4deg" }],
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarPhoto: {
    width: "100%",
    height: "100%",
  },
  avatarInitial: {
    fontSize: 15,
    fontWeight: "700",
    color: "#68695F",
  },
});
