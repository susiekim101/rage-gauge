import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface BottomNavProps {
  avatarUri?: string | null;
}

export function BottomNav({ avatarUri }: BottomNavProps = {}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bottomBar, { bottom: 12 + insets.bottom }]}>
      <View style={styles.pill}>
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

        <Pressable
          style={styles.avatar}
          onPress={() => router.push("/profile")}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
          ) : (
            <Image
              source={require("@/assets/images/profile.png")}
              style={styles.avatarImg}
            />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    position: "absolute",
    left: 31,
    right: 31,
    height: 85,
    justifyContent: "center",
  },
  pill: {
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
  avatar: {
    width: 41,
    height: 41,
    borderRadius: 20.5,
    backgroundColor: "#D4D5CB",
    borderWidth: 3,
    borderColor: "white",
    transform: [{ rotate: "-4deg" }],
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
});
