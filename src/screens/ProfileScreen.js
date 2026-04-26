import { BottomNav } from "@/components/bottom-nav";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
    collection,
    doc,
    documentId,
    getDoc,
    getDocs,
    query,
    updateDoc,
    where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useEffect, useState } from "react";
import {
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth, db, storage } from "../config/firebase";

const FUNCTION_URL = "https://speak-crgbel3l7q-uc.a.run.app";

const GRADIENT = require("../../assets/images/profile/Rectangle 5.png");
const TRUCK = require("../../assets/images/profile/🛻.png");
const HEART = require("../../assets/images/friends/line-md_heart.png");

const CAR_IMAGES = [
  require("../../assets/images/friends/🏎️.png"),
  require("../../assets/images/friends/🚗.png"),
  require("../../assets/images/friends/🚙.png"),
  require("../../assets/images/friends/🚕.png"),
  require("../../assets/images/friends/🚓.png"),
  require("../../assets/images/friends/🛻.png"),
];

function progressFromUid(uid) {
  const sum = uid.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return ((sum % 80) + 10) / 100;
}

const BAR_WIDTH = 200;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = auth.currentUser;
  const [displayName, setDisplayName] = useState(
    user?.displayName ?? user?.email?.split("@")[0] ?? "User"
  );
const [photoUri, setPhotoUri] = useState(user?.photoURL ?? null);
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    playWelcome();
    loadPhoto();
    loadFriends();
  }, []);

  const loadPhoto = async () => {
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        if (snap.data().photoUrl) setPhotoUri(snap.data().photoUrl);
        if (snap.data().displayName) setDisplayName(snap.data().displayName);
      }
    } catch (e) {
      console.warn("Could not load photo:", e.message);
    }
  };

  const loadFriends = async () => {
    try {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      const friendIds = userSnap.data()?.friends ?? [];
      if (friendIds.length === 0) return;
      const q = query(
        collection(db, "users"),
        where(documentId(), "in", friendIds.slice(0, 10)),
      );
      const snap = await getDocs(q);
      setFriends(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.warn("Could not load friends:", e.message);
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
    setPhotoUri(localUri);

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
      {/* Fixed header: gradient, photo, truck, name */}
      <View style={[styles.header, { height: 370 + insets.top }]}>
        <Image
          source={GRADIENT}
          style={[styles.gradientOverlay, { top: -insets.top, height: 157 + insets.top }]}
          resizeMode="cover"
        />

        <Pressable style={styles.profileImageWrapper} onPress={pickPhoto}>
          <View style={styles.profileImage}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.profilePhoto} />
            ) : (
              <Image
                source={require("../../assets/images/profile.png")}
                style={styles.profilePhoto}
              />
            )}
          </View>
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={12} color="white" />
          </View>
        </Pressable>

        <Image source={TRUCK} style={styles.truck} />
        <Text style={styles.name}>{displayName}</Text>
      </View>

      {/* Scrollable friends list */}
      <FlatList
        style={styles.list}
        data={friends}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>Check in on your drivers</Text>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>Add friends to see them here</Text>
        }
        renderItem={({ item, index }) => {
          const progress = progressFromUid(item.id);
          const fillWidth = BAR_WIDTH * progress;
          const carImg = CAR_IMAGES[index % CAR_IMAGES.length];
          const showCar = progress > 0.15;

          return (
            <View style={styles.row}>
              {item.photoUrl ? (
                <Image
                  source={{ uri: item.photoUrl }}
                  style={styles.rowAvatar}
                />
              ) : (
                <View style={styles.rowAvatarPlaceholder}>
                  <Text style={styles.rowAvatarInitial}>
                    {item.displayName?.[0]?.toUpperCase() ?? "?"}
                  </Text>
                </View>
              )}
              <Text style={styles.rowName}>{item.displayName}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: fillWidth }]} />
                {showCar && (
                  <Image
                    source={carImg}
                    style={[styles.carOnBar, { left: fillWidth - 18 }]}
                  />
                )}
                <Image source={HEART} style={styles.heartOnBar} />
              </View>
            </View>
          );
        }}
      />

      {/* Home button */}
      <Pressable
        style={[styles.homeBtn, { top: insets.top + 8 }]}
        onPress={() => router.replace("/(tabs)")}
      >
        <Ionicons name="home" size={20} color="#68695F" />
      </Pressable>

      <BottomNav avatarUri={photoUri} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8F5",
  },
  header: {
    height: 370,
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
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 13,
    paddingTop: 4,
    paddingBottom: 110,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 10,
    marginLeft: 4,
  },
  emptyText: {
    textAlign: "center",
    color: "#A0A19A",
    fontSize: 15,
    marginTop: 20,
  },
  row: {
    height: 75,
    backgroundColor: "rgba(228, 228, 228, 0.75)",
    borderRadius: 15,
    position: "relative",
    overflow: "visible",
  },
  rowAvatar: {
    position: "absolute",
    left: 17,
    top: 12,
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: "white",
  },
  rowAvatarPlaceholder: {
    position: "absolute",
    left: 17,
    top: 12,
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: "white",
    backgroundColor: "#D4D5CB",
    alignItems: "center",
    justifyContent: "center",
  },
  rowAvatarInitial: {
    fontSize: 18,
    fontWeight: "700",
    color: "#68695F",
  },
  rowName: {
    position: "absolute",
    left: 81,
    top: 21,
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  barTrack: {
    position: "absolute",
    left: 75,
    bottom: 14,
    width: BAR_WIDTH,
    height: 9,
    backgroundColor: "#C8C8C8",
    borderRadius: 24,
    overflow: "visible",
  },
  barFill: {
    height: 9,
    backgroundColor: "#82A0B9",
    borderRadius: 24,
  },
  carOnBar: {
    position: "absolute",
    bottom: 3,
    width: 36,
    height: 36,
    resizeMode: "contain",
  },
  heartOnBar: {
    position: "absolute",
    right: -35,
    bottom: -10,
    width: 28,
    height: 28,
    resizeMode: "contain",
  },
  homeBtn: {
    position: "absolute",
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(104,105,95,0.15)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
});
