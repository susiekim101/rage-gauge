import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc, getDocs, collection, documentId, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import { auth, db } from "../config/firebase";

const GRADIENT = require("../../assets/images/friends/Rectangle 5.png");

const CAR_IMAGES = [
  require("../../assets/images/friends/🏎️.png"),
  require("../../assets/images/friends/🚗.png"),
  require("../../assets/images/friends/🚙.png"),
  require("../../assets/images/friends/🚕.png"),
  require("../../assets/images/friends/🚓.png"),
  require("../../assets/images/friends/🛻.png"),
];

// Pseudo-random but stable progress per uid
function progressFromUid(uid) {
  const sum = uid.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return (sum % 80 + 10) / 100; // 10–89%
}

function carImageFromIndex(index) {
  return CAR_IMAGES[index % CAR_IMAGES.length];
}

const BAR_WIDTH = 260; // width of the progress track in the card

export default function GroupScreen() {
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const userSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
      const friendIds = userSnap.data()?.friends ?? [];
      if (friendIds.length === 0) return;

      const q = query(
        collection(db, "users"),
        where(documentId(), "in", friendIds.slice(0, 10))
      );
      const snap = await getDocs(q);
      setFriends(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.warn("Could not load friends:", e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={GRADIENT} style={styles.gradient} resizeMode="cover" />

      <Text style={styles.title}>Rage Gauge</Text>

      <Text style={styles.subtitle}>Check-in on your drivers</Text>

      {/* Friend rows */}
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Add friends to see them here</Text>
        }
        renderItem={({ item, index }) => {
          const progress = progressFromUid(item.id);
          const fillWidth = BAR_WIDTH * progress;
          const carImg = carImageFromIndex(index);
          const showCar = progress > 0.15;

          return (
            <View style={styles.row}>
              {/* Avatar */}
              {item.photoUrl ? (
                <Image source={{ uri: item.photoUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {item.displayName?.[0]?.toUpperCase() ?? "?"}
                  </Text>
                </View>
              )}

              {/* Name */}
              <Text style={styles.rowName}>{item.displayName}</Text>

              {/* Share icon */}
              <Ionicons
                name="share-outline"
                size={18}
                color="black"
                style={styles.shareIcon}
              />

              {/* Progress bar + car */}
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: fillWidth }]} />
                {showCar && (
                  <Image
                    source={carImg}
                    style={[styles.carOnBar, { left: fillWidth - 18 }]}
                  />
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8F5",
  },
  gradient: {
    position: "absolute",
    left: -74,
    top: 0,
    width: 537,
    height: 157,
  },
  backBtn: {
    position: "absolute",
    top: 61,
    left: 17,
    zIndex: 10,
  },
  title: {
    position: "absolute",
    top: 60,
    left: 48,
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
  },
  carStack: {
    position: "absolute",
    right: -10,
    top: 130,
    transform: [{ rotate: "180deg" }],
    alignItems: "center",
  },
  decorCar: {
    width: 70,
    height: 70,
    resizeMode: "contain",
  },
  subtitle: {
    position: "absolute",
    top: 260,
    left: 31,
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  list: {
    marginTop: 290,
    paddingHorizontal: 13,
    gap: 8,
    paddingBottom: 32,
  },
  empty: {
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
  avatar: {
    position: "absolute",
    left: 17,
    top: 12,
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: "white",
  },
  avatarPlaceholder: {
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
  avatarInitial: {
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
  shareIcon: {
    position: "absolute",
    right: 14,
    top: 18,
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
});
