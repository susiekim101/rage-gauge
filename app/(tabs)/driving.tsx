import React, { useCallback, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";
import { useFocusEffect } from "@react-navigation/native";

type DrivingState = "idle" | "driving" | "rage";

export default function DrivingScreen() {
  const [state, setState] = useState<DrivingState>("idle");

  useFocusEffect(
    useCallback(() => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      return () => {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>driving</Text>

      {state === "idle" && (
        <View style={styles.content}>
          <Text style={styles.greeting}>
            Have a safe drive, <Text style={styles.greetingName}>Fiona</Text>
          </Text>
          <Pressable
            style={styles.startBtn}
            onPress={() => setState("driving")}
          >
            <Text style={styles.startBtnText}>▶ Start</Text>
          </Pressable>
        </View>
      )}

      {state === "driving" && (
        <View style={styles.content}>
          <Text style={styles.greeting}>Breathe in 1...2...3</Text>
          <Pressable style={styles.startBtn} onPress={() => setState("rage")}>
            <Text style={styles.startBtnText}>▶ Start</Text>
          </Pressable>
        </View>
      )}

      {state === "rage" && (
        <View style={styles.rageContent}>
          <View style={styles.rageLeft}>
            <View style={styles.waveform}>
              {Array.from({ length: 20 }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.waveBar, { height: Math.random() * 60 + 10 }]}
                />
              ))}
            </View>
            <View style={styles.pfp}>
              <Text style={styles.pfpText}>R</Text>
            </View>
          </View>
          <View style={styles.rageRight}>
            <Text style={styles.arrivingLabel}>Arriving at</Text>
            <Text style={styles.arrivingTime}>9:41</Text>
            <Text style={styles.arrivingMins}>9 mins left</Text>
            <View style={styles.progressBar}>
              <View style={styles.progressFill} />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
  },
  containerLandscape: {
    flexDirection: "row",
  },
  label: {
    position: "absolute",
    top: 16,
    left: 16,
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.7,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  greeting: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  greetingName: {
    fontStyle: "italic",
    fontWeight: "400",
  },
  startBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 40,
    paddingVertical: 16,
    paddingHorizontal: 60,
  },
  startBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },

  // rage state
  rageContent: {
    flex: 1,
    flexDirection: "row",
    marginTop: 40,
  },
  rageLeft: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "flex-start",
    padding: 16,
    gap: 12,
  },
  waveform: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    height: 80,
  },
  waveBar: {
    width: 3,
    backgroundColor: "#fff",
    borderRadius: 2,
    opacity: 0.8,
  },
  pfp: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#555",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  pfpText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
  },
  rageRight: {
    width: 160,
    justifyContent: "flex-start",
    padding: 16,
    paddingTop: 40,
    gap: 4,
  },
  arrivingLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  arrivingTime: {
    color: "#fff",
    fontSize: 48,
    fontWeight: "800",
  },
  arrivingMins: {
    color: "#fff",
    fontSize: 13,
    opacity: 0.7,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#333",
    borderRadius: 2,
    marginTop: 8,
  },
  progressFill: {
    width: "35%",
    height: 4,
    backgroundColor: "#4FC3F7",
    borderRadius: 2,
  },
});
