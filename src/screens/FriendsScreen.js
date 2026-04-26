import { Ionicons } from "@expo/vector-icons";
import { arrayUnion, collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { auth, db } from "../config/firebase";

const GRADIENT = require("../../assets/images/profile/Rectangle 5.png");

export default function FriendsScreen() {
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState([]);
  const [addedIds, setAddedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (snap.exists()) {
        setAddedIds(new Set(snap.data().friends ?? []));
      }
    } catch (e) {
      console.warn("Could not load friends:", e.message);
    }
  };

  const search = async (text) => {
    setSearchText(text);
    if (text.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const lower = text.toLowerCase();
      const snap = await getDocs(collection(db, "users"));
      const users = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => u.id !== auth.currentUser?.uid)
        .filter((u) =>
          u.displayName?.toLowerCase().includes(lower) ||
          u.email?.toLowerCase().includes(lower)
        );
      console.log("Search results:", users.map(u => ({ id: u.id, name: u.displayName, hasPhoto: !!u.photoUrl })));
      setResults(users);
    } catch (e) {
      console.error("Search error:", e);
    } finally {
      setLoading(false);
    }
  };

  const addFriend = async (userId) => {
    setAddedIds((prev) => new Set([...prev, userId]));
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        friends: arrayUnion(userId),
      });
    } catch (e) {
      console.warn("Could not save friend:", e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={GRADIENT} style={styles.gradientOverlay} resizeMode="cover" />

      <View style={styles.titleRow}>
        <Text style={styles.title}>Find Friends</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#68695F" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          placeholderTextColor="#68695F"
          value={searchText}
          onChangeText={search}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchText.length > 0 && (
          <Pressable onPress={() => { setSearchText(""); setResults([]); }}>
            <Ionicons name="close-circle" size={18} color="#A0A19A" />
          </Pressable>
        )}
      </View>

      {/* Results list */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          searchText.length >= 2 && !loading ? (
            <Text style={styles.emptyText}>No users found</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <View style={styles.avatar}>
              {item.photoUrl ? (
                <Image source={{ uri: item.photoUrl }} style={styles.avatarPhoto} />
              ) : (
                <Text style={styles.avatarInitial}>
                  {item.displayName?.[0]?.toUpperCase() ?? "?"}
                </Text>
              )}
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.displayName}</Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {item.email}
              </Text>
            </View>

            <Pressable
              style={[styles.addBtn, addedIds.has(item.id) && styles.addedBtn]}
              onPress={() => addFriend(item.id)}
              disabled={addedIds.has(item.id)}
            >
              <Text style={styles.addBtnText}>
                {addedIds.has(item.id) ? "Added ✓" : "Add"}
              </Text>
            </Pressable>
          </View>
        )}
      />
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 72,
    marginLeft: 28,
    marginRight: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#000",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(228, 228, 228, 0.85)",
    borderRadius: 44,
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: "#1a1a1a",
    fontSize: 16,
    padding: 0,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 12,
  },
  emptyText: {
    textAlign: "center",
    color: "#A0A19A",
    fontSize: 15,
    marginTop: 40,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 14,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#D4D5CB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
    overflow: "hidden",
  },
  avatarPhoto: {
    width: "100%",
    height: "100%",
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: "700",
    color: "#68695F",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  userEmail: {
    fontSize: 13,
    color: "#A0A19A",
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: "#D4D5CB",
    borderRadius: 1000,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  addedBtn: {
    backgroundColor: "#C0C1B8",
  },
  addBtnText: {
    color: "#3a3a35",
    fontSize: 14,
    fontWeight: "600",
  },
});
